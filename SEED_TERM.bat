@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo   EduSphere 360 - fill the current term
echo ============================================================
echo.
echo   The modules are on different calendars and nothing has
echo   reconciled them:
echo.
echo     Term 1 runs 3 Aug - 18 Dec 2026, per the school's own
echo     academic calendar.
echo.
echo     Attendance stops on 10 July - three weeks BEFORE that
echo     term started - plus two stray rows on 18 August. The
echo     Live dashboard has been computing its headline
echo     attendance from those two rows and reporting 100%%.
echo.
echo     Every fee invoice belongs to AY 2025-26. Finance
echo     describes last year while the academic side describes
echo     this one, which is why Analytics shows zero revenue.
echo.
echo   This fills the current term: attendance for every school
echo   day since Term 1 began, and the AY 2026-27 fee cycle.
echo   AY 2025-26 is left alone so year-on-year still works.
echo.
echo   Writes to DATABASE_URL from .env, which points at Mumbai.
echo   Safe to re-run - it adds only what is missing.
echo.
echo   Ctrl+C to abort.
pause
echo.

echo [1/3] Refreshing the Prisma client ...
del /q "node_modules\.prisma\client\*.tmp*" 2>nul
call npx prisma generate
if errorlevel 1 goto :genfailed
echo.

echo [2/3] Dry run - showing what WOULD be written ...
echo ------------------------------------------------------------
call node scripts\seed-current-term.mjs --dry-run
if errorlevel 1 goto :failed
echo ------------------------------------------------------------
echo.
echo   Nothing written yet. Read the numbers above.
echo   Ctrl+C now if they look wrong.
pause
echo.

echo [3/3] Writing ...
echo ------------------------------------------------------------
call node scripts\seed-current-term.mjs
if errorlevel 1 goto :failed
echo ------------------------------------------------------------
echo.

echo ============================================================
echo   DONE. Restart your dev server, then check:
echo.
echo     /admin/live       attendance should be today's, not a
echo                       two-row 100%% from 18 August.
echo     /admin/analytics  revenue and the collection curve
echo                       should no longer be empty.
echo.
echo   This writes to the database, not the code, so there is
echo   nothing to deploy.
echo ============================================================
echo.
pause
exit /b 0

:genfailed
echo.
echo   Prisma generate failed - almost always another dev server
echo   holding query_engine-windows.dll.node. Close it and retry.
echo.
pause
exit /b 1

:failed
echo.
echo   Stopped. See the error above. Re-running is safe; it adds
echo   only what is missing.
echo.
pause
exit /b 1
