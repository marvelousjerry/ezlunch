@echo off
echo Deploying to GitHub...

echo.
echo 1. Pulling latest changes (rebase)...
git pull origin main --rebase
if %errorlevel% neq 0 (
    echo [WARNING] Pull failed or nothing to pull. Continuing...
)

echo.
echo 2. Adding changes...
git add .

echo.
echo 3. Committing...
set /p commit_msg="Enter commit message (default: 'update'): "
if "%commit_msg%"=="" set commit_msg=update
git commit -m "%commit_msg%"

echo.
echo 4. Pushing to GitHub (Force Push enabled for initial override)...
git push origin main --force

echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] Deployed successfully! Vercel should start building now.
) else (
    echo [ERROR] Push failed. Please check your internet connection or GitHub credentials.
)
pause
