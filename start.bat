@echo off
cd /d "%~dp0"
echo ========================================================
echo               STARTING SEPSISSENSE LIVE SERVER
echo ========================================================
echo Root Directory: %CD%
npm run dev
