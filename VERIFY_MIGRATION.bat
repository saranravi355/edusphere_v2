@echo off
cd /d "%~dp0"
echo Verifying the PostgreSQL migration - writing migration-verify.log ...
echo. > migration-verify.log
echo ===== node scripts/port-to-postgres.mjs --verify ===== >> migration-verify.log
call node scripts\port-to-postgres.mjs --verify >> migration-verify.log 2>&1
echo. >> migration-verify.log
echo ===== npx prisma migrate status ===== >> migration-verify.log
call npx prisma migrate status >> migration-verify.log 2>&1
echo.
type migration-verify.log
echo.
echo ------------------------------------------------------------
echo Written to migration-verify.log
echo ------------------------------------------------------------
pause
