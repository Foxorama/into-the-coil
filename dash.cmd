@echo off
REM The sound dashboard — docs/decisions/0126-the-dashboard-is-the-instrument.md.
REM
REM Gitignored via .git/info/exclude, because the path below is true of THIS machine and of no
REM clone — the same reason docs/machine.md exists. `npm run dash` is the portable form; this is
REM the one that works here, where node is deliberately not on PATH.
REM
REM Double-click it, or run `dash` from the repo root. Ctrl-C stops it.

setlocal
set "PATH=C:\Users\foxor\AppData\Local\gf-node\node-v24.17.0-win-x64;%PATH%"
cd /d "%~dp0"
echo.
echo   Into the Coil - sound dashboard
echo   -------------------------------
echo   Opening http://localhost:5173/rig/
echo   One click on the page unlocks the audio; no browser makes a sound before a gesture.
echo.
npm run dash
endlocal
