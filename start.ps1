Set-Location $PSScriptRoot
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "            STARTING SEPSISSENSE LIVE SERVER            " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Root Directory: $PWD" -ForegroundColor Yellow
npm run dev
