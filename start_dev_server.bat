@echo off
cd /d "%~dp0"
echo ============================================
echo  EduSphere 360 - starting dev server
echo  Leave this window open. Press Ctrl+C to stop.
echo ============================================
echo.
echo [1/3] Regenerating Prisma client (picks up new database models)...
call npx prisma generate
echo.
echo [2/3] Clearing stale Next.js cache...
if exist .next\dev rmdir /s /q .next\dev
echo.
echo [3/3] Starting dev server...
call npm run dev
pause
