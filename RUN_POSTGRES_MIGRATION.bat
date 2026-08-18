@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================================
echo   EduSphere 360 - SQLite to PostgreSQL cutover
echo ============================================================
echo.

REM ---------------------------------------------------------------
REM 0. Make sure we are on the migration branch
REM ---------------------------------------------------------------
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set BRANCH=%%b
echo Current git branch: !BRANCH!
if /i not "!BRANCH!"=="feat/postgres-migration" (
    echo.
    echo   WARNING: expected branch feat/postgres-migration
    echo   Run:  git checkout feat/postgres-migration
    echo.
    pause
    exit /b 1
)

REM ---------------------------------------------------------------
REM 1. Check .env points at Postgres
REM ---------------------------------------------------------------
if not exist ".env" (
    echo   ERROR: no .env file found.
    goto :needenv
)
findstr /c:"postgresql://" .env >nul 2>&1
if errorlevel 1 goto :needenv
findstr /c:"DIRECT_URL" .env >nul 2>&1
if errorlevel 1 (
    echo   ERROR: .env has no DIRECT_URL. Prisma Migrate cannot run through
    echo          the pgbouncer pooler, so both URLs are required.
    goto :needenv
)
findstr /c:"<PROJECT-REF>" .env >nul 2>&1
if not errorlevel 1 (
    echo   ERROR: .env still contains the placeholder ^<PROJECT-REF^>.
    goto :needenv
)
echo [1/5] .env looks like a PostgreSQL configuration.  OK
echo.

REM ---------------------------------------------------------------
REM 2. Dependencies (adds pg, regenerates the Prisma client)
REM ---------------------------------------------------------------
echo [2/5] Installing dependencies ...
call npm install
if errorlevel 1 goto :failed
echo.

REM ---------------------------------------------------------------
REM 3. Create the schema
REM ---------------------------------------------------------------
echo [3/5] Creating the schema in PostgreSQL ...
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
echo [4/5] Loading 10,660 rows from prisma\sqlite-export.json ...
if not exist "prisma\sqlite-export.json" (
    echo       export file missing - regenerating from prisma\dev.db
    python scripts\export-sqlite-data.py
    if errorlevel 1 goto :failed
)
call node scripts\port-to-postgres.mjs --truncate
if errorlevel 1 goto :failed
echo.

REM ---------------------------------------------------------------
REM 5. Verify the build still type-checks
REM ---------------------------------------------------------------
echo [5/5] Type-checking ...
call .\node_modules\.bin\tsc --noEmit
if errorlevel 1 (
    echo       tsc reported problems - see above. The data migration itself
    echo       succeeded; this is a code issue to fix separately.
) else (
    echo       clean.
)
echo.

echo ============================================================
echo   DONE. The database is now PostgreSQL.
echo.
echo   Start the app with:  npm run dev
echo   Log in as aarav.p@edusphere.com / password123
echo.
echo   Then in Vercel - Settings - Environment Variables, add
echo   DATABASE_URL and DIRECT_URL and redeploy.
echo ============================================================
echo.
pause
exit /b 0

:needenv
echo.
echo ------------------------------------------------------------
echo   .env is not ready yet.
echo.
echo   1. Create a project at https://supabase.com/dashboard
echo      Region: ap-south-1 (Mumbai)
echo   2. Project Settings -^> Database -^> Connection string
echo   3. Put BOTH of these in .env in this folder:
echo.
echo   DATABASE_URL="postgresql://postgres.REF:PW@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
echo   DIRECT_URL="postgresql://postgres.REF:PW@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
echo.
echo   See MIGRATION_POSTGRES.md for the full walkthrough.
echo ------------------------------------------------------------
echo.
pause
exit /b 1

:failed
echo.
echo ------------------------------------------------------------
echo   A step failed - see the error above.
echo   Nothing is half-migrated: the data load runs in a single
echo   transaction and rolls back completely on failure.
echo   Fix the issue and just run this file again.
echo ------------------------------------------------------------
echo.
pause
exit /b 1
