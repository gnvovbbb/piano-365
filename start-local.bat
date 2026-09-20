@echo off
setlocal
cd /d "%~dp0"

set PORT=8000
echo.
echo Piano 365 local server
echo ----------------------
echo Opening http://localhost:%PORT%/
echo Press Ctrl+C in this window to stop the server.
echo.

where py >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  python -m http.server %PORT%
  goto :eof
)

where npx >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  npx --yes http-server . -p %PORT% -c-1
  goto :eof
)

echo Could not find Python or Node.js.
echo Install Python 3 or Node.js, then run this file again.
pause
