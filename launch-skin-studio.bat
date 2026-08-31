@echo off
chcp 65001 >nul
setlocal
REM Launch mc-agent Skin Studio. Self-heals the Electron path.txt so a fresh
REM clone works even if the Electron postinstall was skipped or path.txt is lost.
set "ROOT=%~dp0"
set "ELECTRON_DIR=%ROOT%node_modules\electron"

if exist "%ELECTRON_DIR%\dist\electron.exe" (
  if not exist "%ELECTRON_DIR%\path.txt" (
    <nul set /p "=electron.exe" > "%ELECTRON_DIR%\path.txt" 2>nul
    if not exist "%ELECTRON_DIR%\path.txt" (
      powershell -NoProfile -Command "Set-Content -LiteralPath '%ELECTRON_DIR%\path.txt' -NoNewline -Value 'electron.exe' -Encoding Ascii" >nul 2>nul
    )
  )
)

cd /d "%ROOT%packages\app"
npm start
endlocal
