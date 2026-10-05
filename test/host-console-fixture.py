"""Send real console control events only to a test-owned hidden Windows console."""

import ctypes
from ctypes import wintypes
import json
from pathlib import Path
import subprocess
import sys
import time


def main():
    specification = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.SetConsoleCtrlHandler.argtypes = [ctypes.c_void_p, wintypes.BOOL]
    kernel.SetConsoleCtrlHandler.restype = wintypes.BOOL
    # Launcher process groups can leave their descendants ignoring Ctrl+C.
    # Normalize this fixture's inheritable state before creating its console,
    # without changing the test runner or replacing an actual control event.
    # https://learn.microsoft.com/windows/console/setconsolectrlhandler
    if not kernel.SetConsoleCtrlHandler(None, False):
        raise ctypes.WinError(ctypes.get_last_error())
    startup = subprocess.STARTUPINFO()
    startup.dwFlags = subprocess.STARTF_USESHOWWINDOW
    startup.wShowWindow = 0  # SW_HIDE: this fixture never opens an interactive window.
    process = subprocess.Popen(
        specification["command"],
        cwd=specification["cwd"],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_CONSOLE,
        startupinfo=startup,
    )
    Path(specification["hostPid"]).write_text(json.dumps(process.pid), encoding="utf-8")
    kernel.FreeConsole.argtypes = []
    kernel.FreeConsole.restype = wintypes.BOOL
    kernel.AttachConsole.argtypes = [wintypes.DWORD]
    kernel.AttachConsole.restype = wintypes.BOOL
    handler_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.DWORD)
    kernel.GenerateConsoleCtrlEvent.argtypes = [wintypes.DWORD, wintypes.DWORD]
    kernel.GenerateConsoleCtrlEvent.restype = wintypes.BOOL
    handler = handler_type(lambda event: True)
    attached = False
    try:
        deadline = time.monotonic() + 20
        ready = Path(specification["ready"])
        while not ready.exists():
            if process.poll() is not None:
                raise RuntimeError("CLI exited before its extractor was ready")
            if time.monotonic() >= deadline:
                raise TimeoutError("CLI extractor did not become ready")
            time.sleep(0.02)
        kernel.FreeConsole()
        if not kernel.AttachConsole(process.pid):
            raise ctypes.WinError(ctypes.get_last_error())
        attached = True
        if not kernel.SetConsoleCtrlHandler(handler, True):
            raise ctypes.WinError(ctypes.get_last_error())
        event = specification["event"]
        if event not in (0, 1):
            raise ValueError("Only CTRL_C_EVENT and CTRL_BREAK_EVENT are supported")
        # Group zero broadcasts only to this newly created, isolated console.
        # Extractors run detached, so their death proves application cleanup.
        if not kernel.GenerateConsoleCtrlEvent(event, 0):
            raise ctypes.WinError(ctypes.get_last_error())
        stdout, stderr = process.communicate(timeout=20)
        print(json.dumps({
            "status": process.returncode,
            "stdout": stdout.decode("utf-8"),
            "stderr": stderr.decode("utf-8"),
        }))
    finally:
        if attached:
            kernel.FreeConsole()
        if process.poll() is None:
            process.kill()
            process.communicate(timeout=10)


if __name__ == "__main__":
    main()
