"""Pinned Marker CLI launcher with ownership of its Windows helper processes.

Marker 2.0.0 / Surya 0.22.1 start persistent helpers and use POSIX signal-0
probing in atexit cleanup. Windows signal 0 is a console event, not a PID probe.
Run the real CLI unchanged inside a non-inheritable kill-on-close Job Object.
After the CLI completes, flush output and exit with its status without invoking
upstream atexit handlers; the OS closes the job handle and terminates descendants.
This owns process lifetime, not filesystem/network access or resource quotas.
"""

import ctypes
from ctypes import wintypes
from importlib.metadata import version
import os
from pathlib import Path
import sys
import traceback


class BasicLimits(ctypes.Structure):
    _fields_ = [
        ("PerProcessUserTimeLimit", ctypes.c_int64),
        ("PerJobUserTimeLimit", ctypes.c_int64),
        ("LimitFlags", wintypes.DWORD),
        ("MinimumWorkingSetSize", ctypes.c_size_t),
        ("MaximumWorkingSetSize", ctypes.c_size_t),
        ("ActiveProcessLimit", wintypes.DWORD),
        ("Affinity", ctypes.c_size_t),
        ("PriorityClass", wintypes.DWORD),
        ("SchedulingClass", wintypes.DWORD),
    ]


class IoCounters(ctypes.Structure):
    _fields_ = [(name, ctypes.c_uint64) for name in (
        "ReadOperationCount", "WriteOperationCount", "OtherOperationCount",
        "ReadTransferCount", "WriteTransferCount", "OtherTransferCount",
    )]


class ExtendedLimits(ctypes.Structure):
    _fields_ = [
        ("BasicLimitInformation", BasicLimits),
        ("IoInfo", IoCounters),
        ("ProcessMemoryLimit", ctypes.c_size_t),
        ("JobMemoryLimit", ctypes.c_size_t),
        ("PeakProcessMemoryUsed", ctypes.c_size_t),
        ("PeakJobMemoryUsed", ctypes.c_size_t),
    ]


def own_windows_job():
    if os.name != "nt":
        raise RuntimeError("The Marker Windows launcher requires Windows")
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
    kernel.CreateJobObjectW.restype = wintypes.HANDLE
    kernel.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
    kernel.SetInformationJobObject.restype = wintypes.BOOL
    kernel.GetCurrentProcess.argtypes = []
    kernel.GetCurrentProcess.restype = wintypes.HANDLE
    kernel.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
    kernel.AssignProcessToJobObject.restype = wintypes.BOOL
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel.CloseHandle.restype = wintypes.BOOL
    # NULL security attributes make the sole ownership handle non-inheritable.
    job = kernel.CreateJobObjectW(None, None)
    if not job:
        raise ctypes.WinError(ctypes.get_last_error())
    limits = ExtendedLimits()
    limits.BasicLimitInformation.LimitFlags = 0x2000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    if not kernel.SetInformationJobObject(job, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
        error = ctypes.get_last_error()
        kernel.CloseHandle(job)
        raise ctypes.WinError(error)
    if not kernel.AssignProcessToJobObject(job, kernel.GetCurrentProcess()):
        error = ctypes.get_last_error()
        kernel.CloseHandle(job)
        raise ctypes.WinError(error)
    # Deliberately retain the sole handle until process exit. Closing it while
    # running would terminate this launcher before its output/status is flushed.
    return job


def finish(status):
    try:
        sys.stdout.flush()
        sys.stderr.flush()
    finally:
        os._exit(status)


def main():
    for package, required in (("marker-pdf", "2.0.0"), ("surya-ocr", "0.22.1")):
        if version(package) != required:
            raise RuntimeError("Marker Windows launcher requires its reviewed package versions")
    job = own_windows_job()
    if not job:
        raise RuntimeError("Windows helper process ownership was not established")
    # Each invocation gets its own sentinels. Models remain at explicitly
    # configured cache/checkpoint paths; no shared daemon can be attached.
    private_home = Path.cwd() / "marker-home"
    private_home.mkdir(mode=0o700)
    os.environ["USERPROFILE"] = str(private_home)
    os.environ["HOME"] = str(private_home)
    status = 0
    try:
        from marker.scripts.convert_single import convert_single_cli
        convert_single_cli()
    except SystemExit as error:
        status = error.code if isinstance(error.code, int) else (0 if error.code is None else 1)
    except BaseException:
        traceback.print_exc()
        status = 1
    finish(status)


if __name__ == "__main__":
    main()
