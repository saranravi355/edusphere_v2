$git = "C:\Program Files\Git\cmd\git.exe"

Write-Host "Configuring Git identity..."
& $git config user.email "saran@edusphere.com"
& $git config user.name "Saran"

Write-Host "Committing changes..."
& $git commit -m "Initial commit - EduSphere 360 Phase 13 Release"

Write-Host "Pushing to GitHub..."
& $git push -u origin main

Write-Host "Git Push complete!"
