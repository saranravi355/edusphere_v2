@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo   EduSphere 360 - load the transport module
echo ============================================================
echo.
echo   The transport screens were built and tested in August but
echo   have never held a row, so /operations/transport and
echo   /parent/transport both show their empty state.
echo.
echo   This loads:
echo     8 routes   - vehicle number, driver, phone, seats
echo     41 stops   - in pickup order, with pickup and drop times
echo     108 riders - spread across the routes, each at a stop
echo.
echo   It also replaces the seeded "123 School Lane, City"
echo   address with a real Bengaluru address in the locality
echo   that child's bus stop serves. An address that is NOT the
echo   placeholder is treated as real and left alone.
echo.
echo   Writes to DATABASE_URL from .env, which points at Mumbai.
echo   Safe to re-run. A child the office has already put on a
echo   route stays exactly where the office put them.
echo.
echo   Ctrl+C to abort.
pause
echo.

echo [1/3] Refreshing the Prisma client ...
echo       Your generated client predates the transport tables,
echo       so this step is required, not optional.
call npx prisma generate
if errorlevel 1 goto :failed
echo.

echo [2/3] Dry run - showing what WOULD be written ...
echo ------------------------------------------------------------
call node scripts\seed-transport.mjs --dry-run
if errorlevel 1 goto :failed
echo ------------------------------------------------------------
echo.
echo   Nothing has been written yet. Read the numbers above.
echo   Ctrl+C now if they look wrong.
pause
echo.

echo [3/3] Writing ...
echo ------------------------------------------------------------
call node scripts\seed-transport.mjs
if errorlevel 1 goto :failed
echo ------------------------------------------------------------
echo.

echo ============================================================
echo   DONE. Restart your dev server, then check:
echo.
echo     /operations/transport   sign in as transport@edusphere.com
echo         Eight routes, each with its stops and rider count.
echo         Route 1 is 18 of 20 seats - assign two more and the
echo         next one should be refused as full.
echo.
echo     /parent/transport       sign in as any parent
echo         A rider's family sees the route, the vehicle, the
echo         driver, and their own stop with its pickup time.
echo.
echo   To change a driver or a pickup time later, edit
echo   scripts\transport-data.mjs and re-run with:
echo       node scripts\seed-transport.mjs --routes-only
echo   which updates the fleet and leaves every rider alone.
echo.
echo   NOTE: this writes to the database, not to the code, so
echo   there is nothing to deploy. PUSH_MAIN.bat only ships the
echo   two new script files.
echo ============================================================
echo.
pause
exit /b 0

:failed
echo.
echo   Stopped. See the error above. Nothing further was written.
echo.
pause
exit /b 1
