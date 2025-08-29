#!/bin/bash

echo "Starting ITAM Backend Server..."
echo

cd server

echo "Setting environment variables..."
export PORT=3000
export MONGODB_URI=mongodb://localhost:27017/itam
export JWT_SECRET=your-secret-key-change-in-production
export NODE_ENV=development
export API_BASE_URL=http://localhost:3000/api

echo "Starting server on port $PORT..."
npm start
