$git = "C:\Program Files\Git\cmd\git.exe"

& $git remote remove origin
& $git remote add origin https://github.com/saranravi355/edusphere_v2.git
& $git branch -M main
& $git push -u origin main
