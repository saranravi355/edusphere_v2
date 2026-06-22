$git = "C:\Program Files\Git\cmd\git.exe"

Write-Host "Initializing Git repository..."
& $git init

Write-Host "Adding remote origin..."
& $git remote add origin https://github.com/saranravi355/edusphere_v2

Write-Host "Setting branch to main..."
& $git branch -M main

Write-Host "Staging files..."
& $git add .

Write-Host "Committing changes..."
& $git commit -m "Initial commit - EduSphere 360 Phase 13 Release"

Write-Host "Pushing to GitHub..."
& $git push -u origin main

Write-Host "Git Push complete!"
