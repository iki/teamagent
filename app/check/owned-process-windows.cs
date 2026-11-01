// Windows process ownership. The child cannot execute before joining its job.
// Build with the in-box .NET Framework compiler; no downloaded runtime or shell.
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

internal static class OwnedProcess {
    [StructLayout(LayoutKind.Sequential)] struct BasicLimits {
        public long ProcessTime, JobTime;
        public uint Flags;
        public UIntPtr MinimumWorkingSet, MaximumWorkingSet;
        public uint ActiveProcessLimit;
        public UIntPtr Affinity;
        public uint PriorityClass, SchedulingClass;
    }
    [StructLayout(LayoutKind.Sequential)] struct IoCounters {
        public ulong ReadOperations, WriteOperations, OtherOperations, ReadBytes, WriteBytes, OtherBytes;
    }
    [StructLayout(LayoutKind.Sequential)] struct ExtendedLimits {
        public BasicLimits Basic;
        public IoCounters Io;
        public UIntPtr ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory;
    }
    [StructLayout(LayoutKind.Sequential)] struct Accounting {
        public long UserTime, KernelTime, PeriodUserTime, PeriodKernelTime;
        public uint PageFaults, TotalProcesses, ActiveProcesses, TerminatedProcesses;
    }
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] struct StartupInfo {
        public uint Size;
        public string Reserved, Desktop, Title;
        public uint X, Y, XSize, YSize, XChars, YChars, FillAttribute, Flags;
        public ushort ShowWindow, ReservedSize;
        public IntPtr ReservedPointer, Input, Output, Error;
    }
    [StructLayout(LayoutKind.Sequential)] struct ProcessInfo {
        public IntPtr Process, Thread;
        public uint ProcessId, ThreadId;
    }
    [StructLayout(LayoutKind.Sequential)] struct ExtendedStartupInfo {
        public StartupInfo Startup;
        public IntPtr Attributes;
    }
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)] static extern IntPtr CreateJobObjectW(IntPtr attributes, string name);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool SetInformationJobObject(IntPtr job, int kind, ref ExtendedLimits limits, int size);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool QueryInformationJobObject(IntPtr job, int kind, out Accounting info, int size, IntPtr returned);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool InitializeProcThreadAttributeList(IntPtr attributes, int count, int flags, ref IntPtr size);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool UpdateProcThreadAttribute(IntPtr attributes, uint flags, IntPtr attribute, IntPtr value, IntPtr size, IntPtr previous, IntPtr returned);
    [DllImport("kernel32.dll")] static extern void DeleteProcThreadAttributeList(IntPtr attributes);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool TerminateJobObject(IntPtr job, uint code);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool TerminateProcess(IntPtr process, uint code);
    [DllImport("kernel32.dll", SetLastError = true)] static extern uint ResumeThread(IntPtr thread);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr OpenProcess(uint access, bool inherit, uint id);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool GetProcessTimes(IntPtr process, out long creation, out long exit, out long kernel, out long user);
    [DllImport("kernel32.dll")] static extern IntPtr GetCurrentProcess();
    [DllImport("kernel32.dll", SetLastError = true)] static extern uint WaitForMultipleObjects(uint count, IntPtr[] handles, bool all, uint milliseconds);
    [DllImport("kernel32.dll", SetLastError = true)] static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool GetExitCodeProcess(IntPtr process, out uint code);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)] static extern IntPtr CreateEventW(IntPtr attributes, bool manualReset, bool initialState, string name);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)] static extern IntPtr OpenEventW(uint access, bool inherit, string name);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool SetEvent(IntPtr handle);
    [DllImport("kernel32.dll", SetLastError = true)] static extern IntPtr GetStdHandle(int kind);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool SetHandleInformation(IntPtr handle, uint mask, uint flags);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)] static extern bool CreateProcessW(string application, StringBuilder command, IntPtr processAttributes, IntPtr threadAttributes, bool inheritHandles, uint flags, IntPtr environment, string directory, ref ExtendedStartupInfo startup, out ProcessInfo process);

    static void Check(bool success, string operation) {
        if (!success) throw new Win32Exception(Marshal.GetLastWin32Error(), operation);
    }
    static string Quote(string value) {
        var result = new StringBuilder("\"");
        int slashes = 0;
        foreach (char character in value) {
            if (character == '\\') { slashes++; continue; }
            if (character == '"') { result.Append('\\', slashes * 2 + 1).Append('"'); slashes = 0; continue; }
            result.Append('\\', slashes).Append(character); slashes = 0;
        }
        return result.Append('\\', slashes * 2).Append('"').ToString();
    }
    static IntPtr Standard(int kind) {
        IntPtr handle = GetStdHandle(kind);
        if (handle == IntPtr.Zero || handle == new IntPtr(-1)) throw new Exception("Missing standard process handle");
        Check(SetHandleInformation(handle, 1, 1), "Set standard handle inheritance");
        return handle;
    }
    static void DrainJob(IntPtr job) {
        Check(TerminateJobObject(job, 255), "Terminate owned job");
        var deadline = Stopwatch.StartNew();
        while (true) {
            Accounting accounting;
            Check(QueryInformationJobObject(job, 1, out accounting, Marshal.SizeOf(typeof(Accounting)), IntPtr.Zero), "Read owned job accounting");
            if (accounting.ActiveProcesses == 0) return;
            if (deadline.ElapsedMilliseconds >= 5000) throw new Exception("Owned processes did not exit within cleanup deadline");
            Thread.Sleep(10);
        }
    }
    static int Main(string[] arguments) {
        IntPtr job = IntPtr.Zero, parent = IntPtr.Zero, cancellation = IntPtr.Zero, attributes = IntPtr.Zero, jobList = IntPtr.Zero;
        var process = new ProcessInfo();
        bool assigned = false, attributesInitialized = false;
        int result = 254;
        try {
            uint parentId;
            if (arguments.Length == 2 && arguments[0] == "--stop") {
                cancellation = OpenEventW(2, false, arguments[1]);
                Check(cancellation != IntPtr.Zero, "Open owned cancellation event");
                Check(SetEvent(cancellation), "Cancel owned process");
                return 0;
            }
            if (arguments.Length < 3 || !uint.TryParse(arguments[0], out parentId) || !System.IO.Path.IsPathRooted(arguments[2]))
                throw new Exception("Expected owner process ID and absolute executable");
            cancellation = CreateEventW(IntPtr.Zero, true, false, arguments[1]);
            Check(cancellation != IntPtr.Zero, "Create owned cancellation event");
            if (Marshal.GetLastWin32Error() == 183) throw new Exception("Owned cancellation identity collision");
            parent = OpenProcess(0x100000 | 0x1000, false, parentId);
            Check(parent != IntPtr.Zero, "Open owner process");
            long parentCreated, selfCreated, exited, kernel, user;
            Check(GetProcessTimes(parent, out parentCreated, out exited, out kernel, out user), "Read owner identity");
            Check(GetProcessTimes(GetCurrentProcess(), out selfCreated, out exited, out kernel, out user), "Read supervisor identity");
            if (parentCreated > selfCreated || WaitForSingleObject(parent, 0) != 258) throw new Exception("Owner process already exited or changed identity");
            job = CreateJobObjectW(IntPtr.Zero, null);
            Check(job != IntPtr.Zero, "Create owned job");
            var limits = new ExtendedLimits();
            limits.Basic.Flags = 0x2000; // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE; no breakaway.
            Check(SetInformationJobObject(job, 9, ref limits, Marshal.SizeOf(typeof(ExtendedLimits))), "Set owned job limits");
            // Assign the job atomically at creation. Even killing this supervisor
            // between CreateProcess and ResumeThread cannot orphan a suspended child.
            IntPtr attributeBytes = IntPtr.Zero;
            InitializeProcThreadAttributeList(IntPtr.Zero, 1, 0, ref attributeBytes);
            if (attributeBytes == IntPtr.Zero) throw new Exception("Missing process attribute storage size");
            attributes = Marshal.AllocHGlobal(attributeBytes);
            Check(InitializeProcThreadAttributeList(attributes, 1, 0, ref attributeBytes), "Initialize process attributes");
            attributesInitialized = true;
            jobList = Marshal.AllocHGlobal(IntPtr.Size);
            Marshal.WriteIntPtr(jobList, job);
            Check(UpdateProcThreadAttribute(attributes, 0, new IntPtr(0x2000D), jobList, new IntPtr(IntPtr.Size), IntPtr.Zero, IntPtr.Zero), "Set process job ownership");
            var startup = new ExtendedStartupInfo();
            startup.Attributes = attributes;
            startup.Startup.Size = (uint)Marshal.SizeOf(typeof(ExtendedStartupInfo));
            startup.Startup.Flags = 0x100 | 1; // STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW.
            startup.Startup.ShowWindow = 0;
            startup.Startup.Input = Standard(-10); startup.Startup.Output = Standard(-11); startup.Startup.Error = Standard(-12);
            var command = new StringBuilder();
            for (int i = 2; i < arguments.Length; i++) { if (i > 2) command.Append(' '); command.Append(Quote(arguments[i])); }
            Check(CreateProcessW(arguments[2], command, IntPtr.Zero, IntPtr.Zero, true, 0x08000000 | 0x80000 | 4, IntPtr.Zero, null, ref startup, out process), "Create suspended owned process");
            assigned = true;
            if (ResumeThread(process.Thread) == uint.MaxValue) throw new Win32Exception(Marshal.GetLastWin32Error(), "Resume owned process");
            uint completed = WaitForMultipleObjects(3, new IntPtr[] { parent, cancellation, process.Process }, false, uint.MaxValue);
            if (completed == 0 || completed == 1) result = 255;
            else if (completed == 2) { uint code; Check(GetExitCodeProcess(process.Process, out code), "Read child exit status"); result = unchecked((int)code); }
            else throw new Win32Exception(Marshal.GetLastWin32Error(), "Wait for owned process");
        } catch (Exception error) {
            Console.Error.WriteLine("Owned process failure: " + error.Message);
        } finally {
            try {
                if (job != IntPtr.Zero && assigned) DrainJob(job);
                else if (process.Process != IntPtr.Zero) Check(TerminateProcess(process.Process, 254), "Stop suspended unassigned child");
            } catch (Exception error) { Console.Error.WriteLine("Owned process cleanup failed: " + error.Message); result = 253; }
            if (process.Thread != IntPtr.Zero) CloseHandle(process.Thread);
            if (process.Process != IntPtr.Zero) CloseHandle(process.Process);
            if (job != IntPtr.Zero) CloseHandle(job);
            if (parent != IntPtr.Zero) CloseHandle(parent);
            if (cancellation != IntPtr.Zero) CloseHandle(cancellation);
            if (attributesInitialized) DeleteProcThreadAttributeList(attributes);
            if (attributes != IntPtr.Zero) Marshal.FreeHGlobal(attributes);
            if (jobList != IntPtr.Zero) Marshal.FreeHGlobal(jobList);
        }
        return result;
    }
}
