@echo off
echo ==========================================
echo   HEART: Homecare ^& Emergency AI Routing
echo ==========================================
echo.
echo [1] Starting AI Backend Server...
start cmd /k "npm run server:dev"
echo [2] Starting Frontend Website...
start cmd /k "npm run dev"
echo.
echo Websites will be available at:
echo - Frontend: http://localhost:5175
echo - Backend:  http://localhost:3000
echo.
echo Happy coding!
pause
