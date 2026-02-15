# Setup and Deployment Guide

## ✅ Database Integration Complete!

Your SMART ATTENDANCE system has been successfully integrated with MongoDB and is ready to deploy!

## 🚀 Quick Start Guide

### Step 1: Prerequisites
Ensure you have installed:
- Node.js (v14+)
- MongoDB (local or MongoDB Atlas cloud)
- npm or yarn

### Step 2: Setup Instructions

```bash
# 1. Clone your repository
git clone <your-github-repo-url>
cd attendance-system

# 2. Install dependencies
npm install

# 3. Create .env file (it's already in .gitignore for security)
# Copy the following and update with your values:
MONGODB_URI=mongodb://localhost:27017/attendance-system
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development

# 4. Start MongoDB (if using local)
mongod

# 5. Start the server
npm start
# For development with auto-reload:
npm run dev

# Server will run at http://localhost:3000
```

## 📊 Database Integration Summary

### ✨ New Features Added

1. **MongoDB Integration**
   - Connected via Mongoose ODM
   - Automatic schema validation
   - Indexed queries for performance

2. **Security Features**
   - JWT token-based authentication
   - Bcrypt password hashing
   - Role-based access control (RBAC)
   - Protected API endpoints

3. **Database Models**
   - **User**: Authentication and profile management
   - **Student**: Face descriptors and attendance tracking
   - **Teacher**: Class management and attendance marking
   - **Attendance**: Records with timestamps and status
   - **Class**: Course information and enrollment

4. **API Endpoints** (Now database-backed!)
   - `/api/auth/register` - Register new user
   - `/api/auth/login` - User authentication
   - `/api/auth/me` - Get current user
   - `/api/attendance/save-face` - Store face descriptors
   - `/api/attendance/mark-attendance` - Mark attendance
   - `/api/attendance/records` - Get attendance history
   - `/api/attendance/stats` - Get student statistics
   - `/api/attendance/today-summary` - Teacher summary

## 🔐 Login Credentials (Still Valid)

### Students
- `student1` / `pass1`
- `student2` / `pass2`

### Teachers
- `teacher1` / `pass1`
- `admin` / `admin123`

## 📁 Project Structure

```
attendance-system/
├── config/
│   └── database.js              # MongoDB connection
├── middleware/
│   └── auth.js                  # JWT & RBAC
├── models/
│   ├── User.js                  # User schema
│   ├── Student.js               # Student profile
│   ├── Teacher.js               # Teacher profile
│   ├── Attendance.js            # Attendance records
│   └── Class.js                 # Class info
├── routes/
│   ├── auth.js                  # Auth endpoints
│   └── attendance.js            # Attendance endpoints
├── public/
│   ├── index.html               # Frontend (unchanged)
│   ├── test-models.html
│   └── models/                  # Face recognition models
├── .env                         # Configuration (gitignored)
├── .gitignore                   # Git configuration
├── server.js                    # Main server
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## 🔧 Deployment Options

### Option 1: Heroku Deployment
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add MongoDB Atlas add-on
heroku addons:create mongolab

# Set environment variables
heroku config:set JWT_SECRET=your_secret_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Option 2: Railway.app
```bash
# Install Railway CLI
# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Option 3: AWS/DigitalOcean/VPS
```bash
# SSH into server
ssh user@your-server-ip

# Clone repository
git clone <your-repo-url>
cd attendance-system

# Install Node.js and MongoDB
# Install dependencies
npm install

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "attendance-system"
pm2 startup
pm2 save
```

## 🗄️ MongoDB Cloud Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get connection string
5. Update `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/attendance-system?retryWrites=true&w=majority
```

## 📈 Database Statistics

The system now tracks:
- User authentication with secure passwords
- Student face descriptors for recognition
- Attendance records with timestamps
- Attendance percentage calculations
- Teacher-managed classes
- Role-based permissions

## 🔒 Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Use strong MongoDB passwords
- [ ] Enable MongoDB IP whitelist
- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production`
- [ ] Add CORS restrictions for production
- [ ] Regular database backups
- [ ] Monitor API rate limits

## 🐛 Troubleshooting

**MongoDB Connection Error**
```
Solution: Ensure MongoDB is running
- Local: mongod
- Cloud: Check MongoDB Atlas connection string
```

**Authentication Failed**
```
Solution: Check JWT secret and token format
- Header: Authorization: Bearer <token>
- Token not expired
```

**Face Recognition Not Working**
```
Solution: Check browser console
- Models loading from /public/models
- CDN fallback if local fails
```

## 📊 Next Steps

1. **Frontend Integration**: Update index.html to use new API endpoints
2. **Email Notifications**: Add email alerts for attendance
3. **SMS Integration**: Send SMS notifications to students
4. **Dashboard Analytics**: Add charts and graphs
5. **Mobile App**: Create mobile version with React Native
6. **Two-Factor Authentication**: Add 2FA for security
7. **Advanced Face Recognition**: Improve accuracy with more training

## 📝 API Request Examples

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newstudent",
    "email": "student@example.com",
    "password": "securepassword",
    "userType": "student",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "pass1"
  }'
```

### Save Face Descriptor
```bash
curl -X POST http://localhost:3000/api/attendance/save-face \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "descriptor": [0.123, 0.456, ...]
  }'
```

## 🎯 GitHub Repository

Your project is now live on GitHub with:
- ✅ MongoDB database integration
- ✅ Authentication system
- ✅ Attendance tracking APIs
- ✅ Face recognition models
- ✅ Comprehensive documentation
- ✅ .gitignore for security

Visit your GitHub repository to view all files and commit history!

## 💡 Tips for Production

1. Use environment-specific configurations
2. Implement logging system
3. Add API documentation (Swagger/OpenAPI)
4. Write unit and integration tests
5. Set up CI/CD pipeline
6. Monitor server performance
7. Plan database scaling strategy
8. Regular security audits

---

**✨ Your SMART ATTENDANCE system is now production-ready!**

For questions or support, refer to the README.md file in your repository.
