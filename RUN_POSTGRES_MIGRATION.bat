@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================================
echo   EduSphere 360 - SQLite to PostgreSQL cutover
echo   Target: Supabase project "edusphere" (org Rapdfly)
echo ============================================================
echo.

REM ---------------------------------------------------------------
REM 0. Make sure we are on the migration branch
REM ---------------------------------------------------------------
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set BRANCH=%%b
if /i not "!BRANCH!"=="feat/postgres-migration" (
    echo   WARNING: you are on branch "!BRANCH!"
    echo   Run:  git checkout feat/postgres-migration
    echo.
    pause
    exit /b 1
)
echo [1/6] On branch feat/postgres-migration.  OK
echo.

REM ---------------------------------------------------------------
REM 1. Make sure .env points at Postgres; offer to write it if not
REM ---------------------------------------------------------------
set ENVOK=1
if not exist ".env" set ENVOK=0
if "!ENVOK!"=="1" (
    findstr /c:"postgresql://" .env >nul 2>&1 || set ENVOK=0
)
if "!ENVOK!"=="1" (
    findstr /c:"DIRECT_URL" .env >nul 2>&1 || set ENVOK=0
)
if "!ENVOK!"=="1" (
    findstr /c:"YOUR-PASSWORD" .env >nul 2>&1 && set ENVOK=0
)

if "!ENVOK!"=="0" (
    echo [2/6] .env is not configured for PostgreSQL yet.
    echo       Launching the setup prompt ...
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\setup-env.ps1"
    if errorlevel 1 (
        echo.
        echo   .env was not written. Nothing else has changed.
        pause
        exit /b 1
    )
) else (
    echo [2/6] .env already points at PostgreSQL.  OK
)
echo.

REM ---------------------------------------------------------------
REM 2. Dependencies (adds pg, regenerates the Prisma client)
REM ---------------------------------------------------------------
echo [3/6] Installing dependencies ...
call npm install
if errorlevel 1 goto :failed
echo.

REM ---------------------------------------------------------------
REM 3. Create the schema
REM ---------------------------------------------------------------
echo [4/6] Creating the schema in PostgreSQL ...
if exist "prisma\migrations" (
    echo       existing migrations found - applying them
    call npx prisma migrate deploy
) else (
    echo       no migration history yet - creating the initial migration
    call npx prisma migrate dev --name init --skip-seed
)
if errorlevel 1 goto :failed
echo.

REM ---------------------------------------------------------------
REM 4. Load the data
REM ---------------------------------------------------------------
echo [5/6] Loading 10,660 rows from prisma\sqlite-export.json ...
if not exist "prisma\sqlite-export.json" (
    echo       export file missing - regenerating from prisma\dev.db
    python scripts\export-sqlite-data.py
    if errorlevel 1 goto :failed
)
call node scripts\port-to-postgres.mjs --truncate
if errorlevel 1 goto :failed
echo.

REM ---------------------------------------------------------------
REM 5. Verify the app still type-checks
REM ---------------------------------------------------------------
echo [6/6] Type-checking ...
call .\node_modules\.bin\tsc --noEmit
if errorlevel 1 (
    echo       tsc reported problems - see above. The data migration itself
    echo       succeeded; this is a separate code issue.
) else (
    echo       clean.
)
echo.

echo ============================================================
echo   DONE. The database is now PostgreSQL on Supabase.
echo.
echo   Start the app:  npm run dev
echo   Log in as aarav.p@edusphere.com / password123
echo.
echo   Then in Vercel - Settings - Environment Variables, add
echo   DATABASE_URL and DIRECT_URL and redeploy.
echo ============================================================
echo.
pause
exit /b 0

:failed
echo.
echo ------------------------------------------------------------
echo   A step failed - see the error above.
echo.
echo   Nothing is half-migrated: the data load runs inside a single
echo   transaction and rolls back completely on failure.
echo.
echo   If it says password authentication failed, reset the database
echo   password in the Supabase dashboard (Database - Settings -
echo   Reset database password), then delete .env and run this again.
echo ------------------------------------------------------------
echo.
pause
exit /b 1
