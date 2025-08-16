# ITAM - IT Asset Management System

A comprehensive IT Asset Management system built with Next.js, Express.js, and MongoDB. This system provides role-based access control, automated hardware scanning, and detailed asset tracking capabilities.

## 🚀 Features

### For Users
- **Personal Dashboard**: View assigned IT assets with detailed hardware information
- **Hardware Details**: Comprehensive view of CPU, memory, storage, graphics, and network components
- **Profile Management**: Update personal information and view account details
- **Secure Access**: Role-based authentication ensuring users only see their assigned assets

### For Administrators
- **Admin Dashboard**: Complete overview of all organizational assets
- **User Management**: Create, manage, and assign assets to users
- **Asset Assignment**: Easily assign and reassign hardware to different users
- **System Statistics**: Real-time metrics on assets, assignments, and user activity
- **Comprehensive Reporting**: Detailed hardware specifications and usage tracking

### Automated Hardware Scanning
- **Cross-Platform Support**: Works on Windows, Linux, and macOS
- **Detailed Detection**: CPU, memory, storage, graphics, network, motherboard, and thermal information
- **Automatic Updates**: Hardware scanners automatically send data to the system
- **Unique Identification**: Uses MAC addresses for reliable device tracking

## 🏗️ Architecture

```
ITAM/
├── client/          # Next.js frontend application
├── server/          # Express.js backend API
├── scanners/        # Python hardware detection scripts
└── README.md
```

### Technology Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Express.js 5, Node.js (ES modules)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens with bcrypt password hashing
- **Hardware Detection**: Python with psutil, GPUtil libraries

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 18 or higher)
- **Python** (version 3.8 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn** package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ITAM
```

### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Create admin user (run this once)
npm run setup

# Start development server
npm run dev
```

The backend will run on `http://localhost:3000`

**Default Admin Credentials:**
- Email: `admin@itam.com`
- Password: `admin123`
- **⚠️ Change this password after first login!**

### 3. Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3001`

### 4. Hardware Scanner Setup
```bash
cd scanners

# Install Python dependencies
pip install psutil requests GPUtil

# Run hardware scanner (sends data to backend)
python hardware.py
```

## 🔧 Configuration

### Backend Configuration
Update the MongoDB connection string in `server/index.js`:
```javascript
const mongoUri = 'your-mongodb-connection-string';
```

### Frontend Configuration
Update the API base URL in `client/src/lib/api.js` if needed:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## 🚀 Usage

### First Time Setup
1. Start the backend server: `cd server && npm run dev`
2. Start the frontend: `cd client && npm run dev`
3. Create admin user: `cd server && npm run setup`
4. Visit `http://localhost:3001` in your browser
5. Login with admin credentials
6. Run hardware scanner: `cd scanners && python hardware.py`

### Daily Operations

#### For Users:
1. Login at `http://localhost:3001/login`
2. View your assigned assets on the dashboard
3. Click on any asset to see detailed hardware information
4. Update your profile information as needed

#### For Administrators:
1. Login with admin credentials
2. Access admin panel from the user menu
3. View all assets and system statistics
4. Manage users and assign assets
5. Monitor system-wide asset information

#### Hardware Scanning:
- Run `python hardware.py` on any device to scan and upload hardware information
- The script automatically detects and uploads comprehensive hardware details
- Each device is uniquely identified by its MAC address

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Admin Only
- `GET /api/auth/users` - Get all users
- `POST /api/auth/assign-asset` - Assign asset to user
- `POST /api/auth/remove-asset` - Remove asset from user

### Hardware
- `GET /api/hardware` - Get hardware (filtered by user role)
- `GET /api/hardware/:id` - Get specific hardware by MAC address
- `POST /api/hardware` - Create/update hardware data (used by scanners)

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access**: Users only see assigned assets, admins see everything
- **Protected Routes**: Frontend and backend route protection
- **CORS Configuration**: Properly configured cross-origin requests

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check MongoDB connection string
- Ensure MongoDB is running
- Verify all dependencies are installed: `npm install`

**Frontend won't connect to backend:**
- Ensure backend is running on port 3000
- Check CORS configuration in `server/index.js`
- Verify API base URL in `client/src/lib/api.js`

**Hardware scanner not working:**
- Install Python dependencies: `pip install psutil requests GPUtil`
- Check if backend is accessible from the scanning machine
- Verify the API endpoint in `scanners/hardware.py`

**Authentication issues:**
- Clear browser cookies and local storage
- Check JWT token expiration (7 days default)
- Verify user credentials in MongoDB

### Development Tips

**Running in Development:**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
cd client && npm run dev

# Terminal 3 - Hardware scanning (optional)
cd scanners && python hardware.py
```

**Database Management:**
- Use MongoDB Compass or similar tools to view/manage data
- Collections: `users`, `hardware_data`
- Indexes are automatically created for performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📝 License

This project is licensed under the ISC License - see the package.json files for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation

---

**Happy Asset Managing! 🎯**
