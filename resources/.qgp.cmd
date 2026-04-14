@setlocal enabledelayedexpansion
@set "out=%~dp0git" && if not exist "!out!" call x md "!out!" || exit /b
@set "log=!out!\.log" && if not exist "!log!" call x md "!log!" || exit /b
@set "options=" && for %%a in (:skip:%*) do @if not "%%~a"==":skip:%~1" set options=!options! %%a
@inside "!out!" q-gemini --pro --local!options! ..\.prompt.md "..\git.rmx\%~1*.xml"
