@echo off
echo Deploying from monorepo root...
cd /d "%~dp0"
railway up
