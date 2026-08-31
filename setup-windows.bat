@echo off
chcp 65001 >nul
setlocal EnableExtensions
title mc-agent - One-click setup

REM ============================================================
REM  mc-agent Windows one-click installer
REM  Double-click this from a FRESH clone. It will:
REM    1. check Node.js
REM    2. install dependencies (downloads the Electron binary + writes path.txt)
REM    3. self-heal Electron if the binary/path.txt is missing (auto-extracts a
REM       dropped electron-*.zip, or uses ELECTRON_OVERRIDE_DIST_PATH)
REM    4. create a desktop shortcut
REM    5. launch the Skin Studio
REM ============================================================
set "ROOT=%~dp0"
set "APP=%ROOT%packages\app"
set "ELECTRON_DIR=%ROOT%node_modules\electron"

echo.
echo [1/5] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was NOT found. mc-agent needs Node.js 24+.
  echo   Install it from https://nodejs.org  (LTS), then re-run this file.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set "NODEVER=%%v"
echo   found Node %NODEVER%

echo.
echo [2/5] Installing dependencies (first time may take a few minutes)...
pushd "%ROOT%"
call npm install
if errorlevel 1 (
  echo.
  echo   npm install failed. Check your internet connection and try again.
  echo.
  pause
  exit /b 1
)
popd

echo.
echo [3/5] Verifying Electron binary + path.txt...
set "HEAL=0"
if not exist "%ELECTRON_DIR%\dist\electron.exe" set "HEAL=1"
if not exist "%ELECTRON_DIR%\path.txt" set "HEAL=1"

if "%HEAL%"=="1" (
  echo   Electron binary setup is incomplete. Attempting to self-heal...

  REM Prefer the override env var pointing at a manually-extracted dist folder.
  if exist "%ELECTRON_DIR%\dist\electron.exe" (
    goto :have_dist
  )

  REM Or auto-extract a dropped electron-*.zip (e.g. electron-v33.4.11-win32-x64.zip).
  for %%Z in ("%ROOT%electron-*.zip") do (
    if exist "%%Z" (
      echo   Found %%Z - extracting...
      powershell -NoProfile -Command "Expand-Archive -LiteralPath '%%Z' -DestinationPath '%ELECTRON_DIR%' -Force"
      if exist "%ELECTRON_DIR%\dist\electron.exe" goto :have_dist
    )
  )

  echo.
  echo   Could NOT get the Electron binary automatically.
  echo   On a normal internet connection, 'npm install' downloads it itself.
  echo   If that failed here, download:
  echo     https://github.com/electron/electron/releases
  echo   the file  electron-v33.4.11-win32-x64.zip  and drop it next to this
  echo   installer (in the mc-agent folder), then re-run this file.
  echo.
  pause
  exit /b 1
)

:have_dist
REM electron wrapper requires path.txt to contain the binary name (no BOM/newline).
if not exist "%ELECTRON_DIR%\path.txt" (
  <nul set /p "=electron.exe" > "%ELECTRON_DIR%\path.txt"
  if errorlevel 1 (
    powershell -NoProfile -Command "Set-Content -LiteralPath '%ELECTRON_DIR%\path.txt' -NoNewline -Value 'electron.exe' -Encoding Ascii"
  )
  echo   wrote path.txt
) else (
  if not exist "%ELECTRON_DIR%\path.txt" echo   path.txt missing (will fix on next launch)
)
echo   Electron OK (bin=%ELECTRON_DIR%).

echo.
echo [4/5] Creating a desktop shortcut...
set "DESKTOP="
for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"`) do set "DESKTOP=%%D"
if defined DESKTOP (
  set "SHORTCUT=%DESKTOP%\mc-agent Skin Studio.lnk"
  powershell -NoProfile -Command "$ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath='%ROOT%launch-skin-studio.bat'; $s.WorkingDirectory='%ROOT%'; $s.Save()" >nul 2>nul
  if exist "%SHORTCUT%" (echo   shortcut created on your Desktop) else (echo   could not create shortcut - you can launch via launch-skin-studio.bat)
) else (
  echo   could not locate Desktop folder - skipping shortcut
)

echo.
echo [5/5] Launching mc-agent Skin Studio...
call "%ROOT%launch-skin-studio.bat"
endlocal
