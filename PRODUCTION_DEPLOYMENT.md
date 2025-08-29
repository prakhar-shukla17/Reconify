# ITAM Production Deployment Guide

## Overview

This guide explains how to deploy the ITAM (IT Asset Management) system to production so that scanner downloads work properly for all users.

## Current Architecture

- **Frontend**: Next.js application (React)
- **Backend**: Express.js API server
- **Database**: MongoDB
- **Scanner Downloads**: Generated ZIP files with tenant-specific configuration

## Production Deployment Options

### Option 1: Same Domain Setup (Recommended)

Deploy both frontend and backend on the same domain to avoid CORS issues.

#### Frontend Deployment (Next.js)

1. **Build the application**:
   ```bash
   cd ITAM/client
   npm run build
   ```

2. **Deploy to Vercel/Netlify**:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `.next`
   - Set environment variables:
     ```
     BACKEND_URL=https://your-backend-domain.com
     ```

#### Backend Deployment (Express.js)

1. **Deploy to Railway/Render/Heroku**:
   ```bash
   cd ITAM/server
   ```

2. **Set environment variables**:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   PORT=3000
   NODE_ENV=production
   ```

3. **Update CORS settings** in `ITAM/server/index.js`:
   ```javascript
   app.use(
     cors({
       origin: ["https://your-frontend-domain.com", "http://localhost:3001"],
       credentials: true,
     })
   );
   ```

### Option 2: Separate Domains Setup

If frontend and backend are on different domains:

1. **Update CORS** in backend:
   ```javascript
   app.use(
     cors({
       origin: ["https://your-frontend-domain.com"],
       credentials: true,
       methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
       allowedHeaders: ['Content-Type', 'Authorization'],
     })
   );
   ```

2. **Update frontend API base URL**:
   ```javascript
   // In ITAM/client/src/lib/api.js
   const API_BASE_URL = process.env.NODE_ENV === 'production' 
     ? "https://your-backend-domain.com/api"
     : "/api";
   ```

## Scanner Download Configuration

### Environment Variables

Set these in your backend deployment:

```bash
# Required
MONGODB_URI=mongodb://your-mongodb-uri
JWT_SECRET=your-secure-jwt-secret
NODE_ENV=production

# Optional
API_BASE_URL=https://your-backend-domain.com/api
PORT=3000
```

### File Storage

The scanner download system creates temporary files. Ensure your deployment platform supports:

- **File system access** for creating temporary directories
- **File streaming** for ZIP downloads
- **Cleanup** of temporary files

### Platform-Specific Considerations

#### Vercel (Frontend)
- ✅ Supports Next.js rewrites
- ✅ Environment variables
- ❌ No file system access (backend must be separate)

#### Railway/Render (Backend)
- ✅ Node.js support
- ✅ File system access
- ✅ Environment variables
- ✅ Auto-scaling

#### Heroku (Backend)
- ✅ Node.js support
- ✅ File system access (ephemeral)
- ✅ Environment variables

## Local Development Setup

### Starting the Backend Server

1. **Using the provided scripts**:
   ```bash
   # Windows
   ./start_backend.bat
   
   # Linux/Mac
   chmod +x start_backend.sh
   ./start_backend.sh
   ```

2. **Manual startup**:
   ```bash
   cd ITAM/server
   PORT=3000 MONGODB_URI=mongodb://localhost:27017/itam JWT_SECRET=your-secret-key-change-in-production npm start
   ```

3. **Verify server is running**:
   ```bash
   curl http://localhost:3000/api/scanner/test
   ```

### Starting the Frontend

```bash
cd ITAM/client
npm run dev
```

## Testing Production Deployment

1. **Test API endpoints**:
   ```bash
   curl https://your-backend-domain.com/api/scanner/test
   ```

2. **Test authentication**:
   - Login through the frontend
   - Check if token is stored properly

3. **Test scanner download**:
   - Go to admin dashboard
   - Click "Scanner Download"
   - Select platform and download

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check CORS configuration in backend
   - Verify frontend domain is in allowed origins

2. **Download Fails**:
   - Check if backend is accessible
   - Verify file system permissions
   - Check server logs for errors

3. **Authentication Issues**:
   - Verify JWT_SECRET is set
   - Check token expiration
   - Verify cookie settings

### Debug Steps

1. **Check server logs**:
   ```bash
   # View deployment logs
   heroku logs --tail
   # or
   railway logs
   ```

2. **Test API directly**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-backend-domain.com/api/scanner/download?platform=windows
   ```

3. **Check browser console**:
   - Open developer tools
   - Look for network errors
   - Check for CORS issues

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Restrict origins to your domains only
4. **Rate Limiting**: Implement rate limiting for downloads
5. **File Cleanup**: Ensure temporary files are cleaned up

## Monitoring

1. **Set up logging**:
   - Application logs
   - Error tracking (Sentry)
   - Performance monitoring

2. **Monitor downloads**:
   - Track download success/failure rates
   - Monitor file generation times
   - Alert on errors

## Example Deployment Commands

### Vercel (Frontend)
```bash
cd ITAM/client
vercel --prod
```

### Railway (Backend)
```bash
cd ITAM/server
railway login
railway init
railway up
```

### Environment Variables Setup
```bash
# Backend
railway variables set MONGODB_URI="your-mongodb-uri"
railway variables set JWT_SECRET="your-secure-secret"
railway variables set NODE_ENV="production"

# Frontend
vercel env add BACKEND_URL
```

## Support

For issues with production deployment:
1. Check server logs
2. Verify environment variables
3. Test API endpoints directly
4. Check CORS configuration
5. Verify file system permissions
