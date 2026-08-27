@echo off
cd /d "%~dp0"
echo ============================================
echo  EduSphere 360 - starting dev server
echo  Leave this window open. Press Ctrl+C to stop.
echo ============================================
echo.

echo [1/3] Regenerating Prisma client (picks up new database models)...
echo       Clearing engine files left behind by an interrupted generate ...
del /q "node_modules\.prisma\client\*.tmp*" 2>nul
call npx prisma generate
if errorlevel 1 goto :genfailed
echo.

echo [2/3] Clearing stale Next.js cache...
if exist .next\dev rmdir /s /q .next\dev
echo.

echo [3/3] Starting dev server...
call npm run dev
pause
exit /b 0

:genfailed
echo.
echo ============================================================
echo   STOPPED - the Prisma client was NOT regenerated.
echo.
echo   This used to be ignored, and that was the bug: the server
echo   would start anyway on a client that did not know about
echo   your newer tables, so pages using them threw
echo   "Cannot read properties of undefined".
echo.
echo   Almost always this is a file lock: another dev server is
echo   still running and holding
echo       node_modules\.prisma\client\query_engine-windows.dll.node
echo   so Prisma cannot replace it.
echo.
echo   Fix it:
echo     1. Close every other "EduSphere 360 - dev server" window.
echo     2. If none are open, end any stray node.exe in Task
echo        Manager (Details tab).
echo     3. Run this file again.
echo.
echo   The error Prisma printed is above this box.
echo ============================================================
echo.
pause
exit /b 1
