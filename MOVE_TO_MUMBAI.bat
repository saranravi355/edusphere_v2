@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo   EduSphere 360 - move the database from Tokyo to Mumbai
echo ============================================================
echo.
echo   WHY: your database is in Tokyo and Vercel runs the app in
echo   the United States. Every page makes 4 to 22 database round
echo   trips, and each one costs about 170ms across that distance.
echo   That is where the ~3.5 seconds per page is going. The code
echo   itself renders a page in 20-150ms.
echo.
echo   A new Supabase project already exists:
echo     name    edusphere-mumbai
echo     region  ap-south-1 (Mumbai)
echo     ref     khwhqxpfltgrmveiwjjb
echo     cost    free tier, 0 per month
echo.
echo   This script does NOT switch anything over. It creates the
echo   tables in Mumbai and copies your data there. Tokyo is left
echo   exactly as it is, still serving production, until you
echo   decide to switch.
echo.
echo ------------------------------------------------------------
echo   BEFORE YOU RUN THIS, add two lines to .env
echo ------------------------------------------------------------
echo.
echo   1. supabase.com/dashboard - open the edusphere-mumbai
echo      project - press Connect at the top of the page.
echo   2. Choose the ORM tab, then Prisma. NOT the Framework
echo      tab - that one is for the supabase-js client library,
echo      which this app does not use.
echo   3. If it asks you to set a database password, set one.
echo      Avoid @ : / ? # ^& in it - those need URL-escaping.
echo   4. It shows two lines, DATABASE_URL and DIRECT_URL. Copy
echo      both into .env with a TARGET_ prefix, so they do not
echo      clash with the live Tokyo ones already there:
echo.
echo        TARGET_DATABASE_URL="...:6543/postgres?pgbouncer=true"
echo        TARGET_DIRECT_URL="...:5432/postgres"
echo.
echo   5. Replace [YOUR-PASSWORD] in both with your password,
echo      and on the TARGET_DATABASE_URL line only, inside the
echo      quotes, append this to the end:
echo.
echo        ^&connection_limit=1
echo.
echo   Same shape as the two lines already in .env, with
echo   ap-south-1 in the host instead of ap-northeast-1.
echo.
echo   Ctrl+C to abort.
pause
echo.

findstr /C:"TARGET_DIRECT_URL" .env >nul 2>&1
if errorlevel 1 (
    echo   TARGET_DIRECT_URL is not in .env yet. Add it, then run this again.
    goto :failed
)

REM ---------------------------------------------- 1. create the tables
echo [1/3] Creating the tables in Mumbai ...
echo       Check the host it prints below says ap-south-1.
echo.
call node scripts\migrate-target.mjs
if errorlevel 1 (
    echo.
    echo   Could not create the tables. Check TARGET_DIRECT_URL in .env.
    goto :failed
)
echo.

REM ---------------------------------------------- 2. copy the rows
echo [2/3] Copying every row from Tokyo to Mumbai ...
echo       Nothing is written until the whole copy succeeds.
echo.
call node scripts\copy-db.mjs --truncate
if errorlevel 1 (
    echo.
    echo   The copy failed or the verification did not match.
    echo   Mumbai was rolled back. Tokyo is untouched and still live.
    goto :failed
)
echo.

REM ---------------------------------------------- 3. what is left
echo [3/3] Data is in Mumbai and verified against Tokyo.
echo.
echo ============================================================
echo   NOTHING IS SWITCHED OVER YET. Three steps left, all yours:
echo.
echo   1. Try it locally first.
echo      Swap DATABASE_URL and DIRECT_URL in .env for the two
echo      TARGET_ values, run start_dev_server.bat, and click
echo      around. Everything should look identical, and faster.
echo.
echo   2. Point Vercel at Mumbai.
echo      Vercel - your project - Settings - Environment Variables.
echo      Update DATABASE_URL and DIRECT_URL to the Mumbai values.
echo      Do this for Production, Preview and Development.
echo.
echo   3. Push, which also moves the app itself to Mumbai.
echo      vercel.json now pins the functions to bom1, the Vercel
echo      region in the same city as the new database. Without
echo      that they would still run in the United States and you
echo      would have moved the problem, not fixed it.
echo.
echo      If the build rejects the region, your Vercel plan pins
echo      functions to one fixed region. Delete vercel.json, push
echo      again, and tell me - the database should then go in
echo      whatever region Vercel is actually running you in.
echo.
echo        git add vercel.json scripts MOVE_TO_MUMBAI.bat
echo        git commit -m "Move the database and the functions to Mumbai"
echo        git push origin main
echo.
echo   Then load the site and check /api/health. latencyMs should
echo   drop from about 1500-2500 to under 50.
echo.
echo   KEEPING TOKYO: leave the old project alone for a few days.
echo   If anything is wrong, put the old DATABASE_URL back in
echo   Vercel and you are instantly back to where you started.
echo   Delete the old project yourself once you are happy.
echo.
echo   RE-CHECK THE COPY AT ANY TIME:
echo        node scripts\copy-db.mjs --verify
echo ============================================================
echo.
pause
exit /b 0

:failed
echo.
echo   Stopped. Tokyo is untouched and production is unaffected.
echo.
pause
exit /b 1
