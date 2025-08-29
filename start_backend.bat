@echo off
echo Starting ITAM Backend Server...
echo.

cd server

echo Setting environment variables...
set PORT=3000
set MONGODB_URI=mongodb://localhost:27017/itam
set JWT_SECRET=your-secret-key-change-in-production
set NODE_ENV=development
set API_BASE_URL=http://localhost:3000/api

echo Starting server on port %PORT%...
npm start

pause
