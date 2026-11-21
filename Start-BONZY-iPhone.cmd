@echo off
setlocal
cd /d "%~dp0"
set "BONZY_RUNTIME=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies"
if exist "%BONZY_RUNTIME%\node\bin\node.exe" set "PATH=%BONZY_RUNTIME%\node\bin;%BONZY_RUNTIME%\bin\fallback;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 LTS is required. Install Node.js and pnpm first.
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
echo BONZY for iPhone - Expo Go
echo Install Expo Go from the App Store and sign in to your free Expo account.
echo Connect the iPhone to the same local network as this computer.
echo.
node -e "const {spawnSync}=require('node:child_process');const r=spawnSync(process.execPath,['node_modules/expo/bin/cli','whoami'],{encoding:'utf8'});process.exit(r.status!==0 || /Not logged in/i.test(r.stdout)?1:0)"
if errorlevel 1 (
  echo Sign in below with the SAME Expo account as on your iPhone.
  echo Your password is entered only into the official Expo CLI.
  node node_modules/expo/bin/cli login
  if errorlevel 1 (
    echo Login was not completed. Run this file again after creating an Expo account.
    pause
    exit /b 1
  )
)
echo.
echo Scan the QR code with the iPhone Camera and choose Open in Expo Go.
echo Keep this window open while testing BONZY.
node node_modules/expo/bin/cli start --go --lan --port 8082
pause
