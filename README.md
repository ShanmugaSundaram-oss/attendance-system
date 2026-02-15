# SMART ATTENDANCE - Face Recognition System

A modern, AI-powered attendance management system using face recognition technology. Built with Node.js, Express, MongoDB, and face-api.js.

## 🎯 Features

- **Face Recognition**: AI-powered face detection and recognition using face-api.js
- **Student Portal**: Register faces, view personal attendance records, and track attendance percentage
- **Teacher Portal**: Scan faces for attendance, view class analytics, and manage student records
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Database Persistence**: MongoDB integration for storing users, students, and attendance records
- **Real-time Dashboard**: Live statistics and attendance tracking
- **Premium UI**: Modern glassmorphic design with smooth animations

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- npm or yarn package manager

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd attendance-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```
MONGODB_URI=mongodb://localhost:27017/attendance-system
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

4. **Start MongoDB** (if using local instance)
```bash
mongod
```

5. **Start the server**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔐 Default User Credentials

### Student Accounts
- Username: `student1` | Password: `pass1`
- Username: `student2` | Password: `pass2`

### Teacher Accounts
- Username: `teacher1` | Password: `pass1`
- Username: `admin` | Password: `admin123`

## 📱 Usage

### For Students
1. Click "Student Login"
2. Enter credentials
3. Capture your face using the webcam
4. Your face is now registered for attendance tracking
5. View your attendance records and statistics

### For Teachers
1. Click "Teacher Login"
2. Enter credentials
3. Use the attendance scanner to mark students present
4. View attendance summaries and analytics
5. Monitor class attendance rates

## 🏗️ Project Structure

```
attendance-system/
├── config/
│   └── database.js          # MongoDB connection configuration
├── middleware/
│   └── auth.js              # JWT authentication & authorization
├── models/
│   ├── User.js              # User schema with authentication
│   ├── Student.js           # Student profile with attendance tracking
│   ├── Teacher.js           # Teacher profile
│   ├── Attendance.js        # Attendance records
│   └── Class.js             # Class information
├── routes/
│   ├── auth.js              # Authentication endpoints
│   └── attendance.js        # Attendance management endpoints
├── public/
│   ├── index.html           # Main frontend application
│   ├── test-models.html     # Face-api.js model testing
│   └── models/              # Face recognition ML models
├── .env                     # Environment variables
├── server.js                # Main server file
└── package.json             # Dependencies
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Attendance
- `POST /api/attendance/save-face` - Register face descriptor
- `POST /api/attendance/mark-attendance` - Mark attendance
- `GET /api/attendance/records` - Get attendance records
- `GET /api/attendance/stats` - Get attendance statistics
- `GET /api/attendance/today-summary` - Get today's summary (teacher only)

## 🗄️ Database Schema

### User
- username (unique)
- email (unique)
- password (hashed)
- userType (student/teacher/admin)
- firstName, lastName
- createdAt, updatedAt

### Student
- userId (reference to User)
- studentId (unique)
- rollNumber, department, semester
- faceDescriptor (array of numbers)
- faceRegisteredAt
- totalClasses, attendedClasses
- attendancePercentage
- lastAttendanceAt

### Teacher
- userId (reference to User)
- employeeId (unique)
- department, qualification, specialization
- classesTaught (array of Class references)
- status (active/inactive/on-leave)

### Attendance
- studentId (reference to Student)
- classId (reference to Class)
- date
- timeIn, timeOut
- status (present/absent/late/leave)
- markedBy (teacher who marked)
- faceMatchConfidence
- remarks

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Token-based authentication for API endpoints
- **Role-Based Access Control**: Different permissions for students and teachers
- **Input Validation**: Basic validation on all endpoints
- **CORS**: Cross-origin request handling

## 🚨 Important Notes

1. **Change JWT Secret**: Update `JWT_SECRET` in `.env` for production
2. **MongoDB Connection**: Ensure MongoDB is running before starting the server
3. **Face Recognition Models**: Models are loaded from `/public/models` or CDN fallback
4. **Token Expiration**: JWT tokens expire after 7 days

## 🐛 Troubleshooting

**MongoDB Connection Failed**
- Ensure MongoDB is running: `mongod`
- Check MongoDB URI in `.env`

**Face Recognition Not Working**
- Check browser console for errors
- Ensure models are loading from `/public/models`
- Models will fallback to CDN if local loading fails

**Token Authentication Failed**
- Check Authorization header format: `Bearer <token>`
- Ensure token is valid and not expired

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **dotenv**: Environment variable management
- **cors**: Cross-origin request handling
- **face-api.js**: Face recognition (frontend CDN)
- **tailwindcss**: CSS framework (frontend CDN)

## 📝 License

ISC

## 👨‍💻 Author

Shan

---

For more information or issues, please check the repository or contact the development team.
