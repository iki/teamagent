@setlocal enabledelayedexpansion
@set "out=%~dp0" && if not exist "!out!" call x md "!out!" || exit /b
@set "log=!out!\.log" && if not exist "!log!" call x md "!log!" || exit /b
@inside "!out!" q-gemini --local ./.prompt.md "git.rmx\%~1*.xml"
