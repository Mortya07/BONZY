@echo off
setlocal
cd /d "%~dp0"
set "BONZY_RUNTIME=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies"
if exist "%BONZY_RUNTIME%\node\bin\node.exe" set "PATH=%BONZY_RUNTIME%\node\bin;%BONZY_RUNTIME%\bin\fallback;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 LTS is required. Install Node.js and pnpm, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules\expo\bin\cli (
  call pnpm.cmd install --frozen-lockfile
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
if not exist dist\index.html (
  node node_modules/expo/bin/cli export --platform web
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
node scripts/serve-web.mjs
pause
