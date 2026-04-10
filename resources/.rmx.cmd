@setlocal enabledelayedexpansion
@set "out=%~dp0git.rmx" && if not exist "!out!" call x md "!out!" || exit /b
@set "log=!out!\.log" && if not exist "!log!" call x md "!log!" || exit /b
@inside "!out!" rmxcs src=ai-agents ai-agents-mem ai-agents-proxy ai-agents-swarm ai-query ai-spec
