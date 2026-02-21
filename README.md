# SMART ATTENDANCE - Face Recognition System

## 🎓 Enterprise Edition v2.0.0

Advanced AI-powered attendance tracking system with face recognition, designed for educational institutions.

### ✨ Features

#### 🔐 **Authentication & Security**
- JWT-based authentication
- Password hashing with bcryptjs
- Account locking after 5 failed attempts
- Role-based access control (Student, Teacher, Admin)
- Password change functionality

#### 📸 **Face Recognition**
- AI-powered face detection and recognition
- Face descriptor storage
- Real-time attendance marking
- Confidence score tracking
- Multiple face registration support

#### 📊 **Attendance Management**
- **Multiple Status Types**: Present, Absent, Late, Leave, Excused
- **Automatic Marking**: Face recognition-based auto-attendance
- **Manual Marking**: Teachers can manually mark attendance
- **Bulk Operations**: Mark attendance for multiple students
- **Location Tracking**: GPS coordinates for verification

#### 📈 **Analytics & Reporting**
- Real-time attendance statistics
- Class-wise attendance reports
- Student-wise performance tracking
- Daily summary reports
- Historical data analysis
- Attendance percentage calculation

#### 👥 **User Management**
- Student profile management
- Teacher profile management
- Admin dashboard
- User activation/deactivation
- Department and batch management

#### 🏫 **Class Management**
- Create and manage classes
- Assign teachers to classes
- Add students to classes
- Schedule management
- Capacity tracking

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Modern web browser with webcam

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd attendance-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure environment variables**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/attendance-system
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
CORS_ORIGIN=*
```

5. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

6. **Run the server**
```bash
npm start
```

Server will start at `http://localhost:3000`

---

## 📚 API Documentation

Complete API documentation is available in `API_DOCUMENTATION.md`

### Quick API Examples

#### Register a Student
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "email": "student@example.com",
    "password": "password123",
    "role": "student",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "password123"
  }'
```

#### Mark Attendance
```bash
curl -X POST http://localhost:3000/api/attendance/mark-attendance \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "507f1f77bcf86cd799439011",
    "classId": "507f1f77bcf86cd799439012",
    "status": "present",
    "faceMatchConfidence": 0.92
  }'
```

---

## 🏗️ Project Structure

```
attendance-system/
├── config/
│   └── database.js              # MongoDB connection
├── models/
│   ├── User.js                  # User schema
│   ├── Student.js               # Student profile schema
│   ├── Teacher.js               # Teacher profile schema
│   ├── Class.js                 # Class schema
│   └── Attendance.js            # Attendance records schema
├── routes/
│   ├── auth.js                  # Authentication endpoints
│   ├── attendance.js            # Attendance endpoints
│   └── admin.js                 # Admin endpoints
├── middleware/
│   └── auth.js                  # Authentication middleware
├── public/
│   ├── index.html               # Frontend UI
│   └── models/                  # Face-api.js models
├── server.js                    # Express app setup
├── package.json                 # Dependencies
├── .env                         # Environment variables
├── README.md                    # This file
└── API_DOCUMENTATION.md         # API docs
```

---

## 🎯 User Roles & Permissions

### 👤 Student
- ✅ Register account
- ✅ Register face
- ✅ View own attendance records
- ✅ View own attendance statistics
- ✅ Change password

### 👨‍🏫 Teacher
- ✅ All student permissions
- ✅ Mark attendance for class
- ✅ View class attendance reports
- ✅ View student statistics
- ✅ Generate attendance reports

### 🔑 Admin
- ✅ All teacher permissions
- ✅ Create classes
- ✅ Manage users (activate/deactivate)
- ✅ Add students to classes
- ✅ View system-wide statistics
- ✅ Generate comprehensive reports

---

## 🔄 Workflow

### Student Attendance Flow
```
1. Student registers account
2. Student registers face via camera
3. Face descriptor saved to database
4. During class, student's face is scanned
5. System matches face and marks attendance
6. Student can view attendance record
```

### Teacher Workflow
```
1. Teacher logs in
2. Opens attendance marking interface
3. Option A: Auto-scan students' faces
4. Option B: Manually mark attendance
5. View class attendance statistics
6. Generate reports
```

### Admin Workflow
```
1. Admin logs in to dashboard
2. Create classes and assign teachers
3. Add students to classes
4. Monitor system-wide statistics
5. Generate comprehensive reports
6. Manage user accounts
```

---

## 📊 Database Schema

### User Collection
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  role: 'student' | 'teacher' | 'admin',
  firstName: String,
  lastName: String,
  isActive: Boolean,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date
}
```

### Student Collection
```javascript
{
  userId: ObjectId,
  studentId: String,
  rollNumber: String,
  department: String,
  faceDescriptors: Array,
  isFaceRegistered: Boolean,
  classes: [ObjectId],
  totalClasses: Number,
  attendedClasses: Number,
  attendancePercentage: Number
}
```

### Attendance Collection
```javascript
{
  studentId: ObjectId,
  classId: ObjectId,
  date: Date,
  timeIn: Date,
  timeOut: Date,
  status: 'present' | 'absent' | 'late' | 'leave' | 'excused',
  faceMatchConfidence: Number,
  location: {
    latitude: Number,
    longitude: Number
  },
  isAutomated: Boolean
}
```

---

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/attendance-system

# JWT
JWT_SECRET=your-super-secret-key

# CORS
CORS_ORIGIN=*

# Face API Models
FACE_API_MODEL_URL=/models
```

---

## 🛠️ Development

### Run in Development Mode
```bash
npm run dev
```

Automatically restarts on file changes using nodemon.

### Project Standards
- **Code Style**: ES6+
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT
- **Security**: Helmet, bcryptjs, express-validator
- **Rate Limiting**: Express Rate Limit

---

## 📱 Frontend Features

- Clean, modern UI with glassmorphism design
- Real-time face recognition
- Responsive design for mobile and desktop
- Real-time clock display
- System status monitoring
- Student and teacher dashboards

---

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ Account locking (5 failed attempts)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection

---

## 📈 Performance

- MongoDB indexes for fast queries
- Efficient face descriptor storage
- Pagination for large datasets
- Connection pooling
- Async/await for non-blocking operations

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/attendance-system
```

### Face Recognition Not Working
- Ensure webcam permissions are granted
- Check browser console for errors
- Verify Face-API models are loaded
- Test with adequate lighting

### Port Already in Use
```bash
# Change PORT in .env or run on different port
PORT=3001 npm start
```

---

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **moment** - Date/time handling
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **cors** - Cross-origin requests

---

## 🚢 Deployment

### Deploy to Heroku
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-secret-key

# Deploy
git push heroku main
```

### Deploy to AWS/GCP
- Use EC2/App Engine instances
- Configure MongoDB Atlas
- Set up environment variables
- Use PM2 for process management

---

## 📝 Sample Credentials

For testing purposes:

**Student Account**
- Username: `student1`
- Password: `pass1`

**Teacher Account**
- Username: `teacher1`
- Password: `pass1`

**Admin Account**
- Username: `admin`
- Password: `admin123`

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Team

- **Developer**: AI Assistant
- **Last Updated**: February 16, 2026

---

## 📞 Support & Feedback

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team
- Review API documentation

---

## 🎉 Features Coming Soon

- 📧 Email notifications
- 📱 Mobile app (React Native)
- 🎥 Biometric authentication
- 📊 Advanced analytics dashboard
- 🗣️ Multi-language support
- 🔔 Push notifications
- 📲 SMS alerts

---

## ⭐ Version History

### v2.0.0 (Enterprise Edition)
- Enhanced security with account locking
- Advanced attendance statistics
- Bulk operations
- Admin dashboard
- Comprehensive API
- Improved UI/UX

### v1.0.0 (Initial Release)
- Basic attendance marking
- Face recognition
- Student/Teacher portals

---

**Thank you for using SMART ATTENDANCE!** 🎓✨
