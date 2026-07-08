@echo off
cd /d "%~dp0"
echo ============================================
echo  EduSphere 360 - Prisma setup
echo ============================================
echo.
echo [1/3] Running: npx prisma generate
call npx prisma generate
if errorlevel 1 goto :error
echo.
echo [2/3] Running: npx prisma db push
call npx prisma db push
if errorlevel 1 goto :error
echo.
echo [3/3] Running: npx prisma db seed
call npx prisma db seed
if errorlevel 1 goto :error
echo.
echo ============================================
echo  Done. You can close this window.
echo ============================================
pause
goto :eof

:error
echo.
echo ============================================
echo  Something failed above. Scroll up to see the error.
echo ============================================
pause
