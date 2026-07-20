@setlocal enabledelayedexpansion
@set "out=%~dp0git.rmx" && if not exist "!out!" call x md "!out!" || exit /b
@set "log=!out!\.log" && if not exist "!log!" call x md "!log!" || exit /b
@inside "!out!" rmxcs ai-agents ai-agents-mem ai-agents-proxy ai-agents-sandbox ai-agents-skills ai-agents-swarm ai-agents-tokens ai-gen ai-query ai-prompts ai-security ai-spec ai-eval
