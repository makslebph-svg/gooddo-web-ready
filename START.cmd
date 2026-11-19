@echo off
cd /d "%~dp0"
set "PORT=3063"
node serve.mjs
pause
