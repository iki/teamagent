@setlocal enabledelayedexpansion
@set "rmx=%~dp0git.rmx" && if not exist "!rmx!" call x md "!rmx!" || exit /b
@set "log=!rmx!\.log" && if not exist "!log!" call x md "!log!" || exit /b
@inside "!rmx!" rmxcs src=ai-agents ai-agents-mem ai-agents-proxy ai-agents-swarm ai-query ai-spec
