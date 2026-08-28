@echo off
REM Compiles src/lib/password.ts on its own and runs the password rule checks
REM against the real module. Nothing here touches a database.
cd /d "%~dp0"

if exist ".verify" rmdir /s /q ".verify"

echo Compiling src\lib\password.ts ...
call npx tsc src/lib/password.ts --outDir .verify --module esnext --target es2022 --moduleResolution bundler --skipLibCheck
if errorlevel 1 (
  echo.
  echo Compile failed. Nothing was checked.
  pause
  exit /b 1
)

echo.
call node scripts/verify-password-rules.mjs
set RESULT=%errorlevel%

rmdir /s /q ".verify" 2>nul

if %RESULT% neq 0 (
  echo.
  echo One or more checks failed.
  pause
  exit /b %RESULT%
)

echo.
pause
