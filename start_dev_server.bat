@echo off
cd /d "%~dp0"
echo ============================================
echo  EduSphere 360 - starting dev server
echo  Leave this window open. Press Ctrl+C to stop.
echo ============================================
echo.
call npm run dev
pause
