# SMART ATTENDANCE API Documentation

## Version 2.0.0 - Enterprise Edition

### Base URL
```
http://localhost:3000/api
```

---

## 🔐 Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Register a new student or teacher account.

**Request Body:**
```json
{
  "username": "student1",
  "email": "student@example.com",
  "password": "securePassword123",
  "role": "student",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "student1",
    "email": "student@example.com",
    "role": "student",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### 2. Login User
**POST** `/auth/login`

Authenticate and get JWT token.

**Request Body:**
```json
{
  "username": "student1",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "student1",
    "email": "student@example.com",
    "role": "student",
    "lastLogin": "2026-02-16T11:00:00Z"
  }
}
```

---

### 3. Get Current User
**GET** `/auth/me`

Get current authenticated user details.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "student1",
    "email": "student@example.com",
    "role": "student",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

### 4. Verify Token
**GET** `/auth/verify`

Verify JWT token validity.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "valid": true,
  "decoded": {
    "userId": "507f1f77bcf86cd799439011",
    "role": "student"
  }
}
```

---

### 5. Change Password
**POST** `/auth/change-password`

Change user password.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "oldPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 📸 Attendance Endpoints

### 1. Save Face Descriptor
**POST** `/attendance/save-face`

Register face for automatic attendance recognition.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "descriptor": [0.123, 0.456, 0.789, ...],
  "confidence": 0.95
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Face registered successfully"
}
```

---

### 2. Mark Attendance
**POST** `/attendance/mark-attendance`

Mark attendance for a student.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "classId": "507f1f77bcf86cd799439012",
  "status": "present",
  "faceMatchConfidence": 0.92,
  "location": {
    "latitude": 28.5355,
    "longitude": 77.3910,
    "accuracy": 10
  },
  "remarks": "On time"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "attendance": {
    "_id": "507f1f77bcf86cd799439013",
    "studentId": "507f1f77bcf86cd799439011",
    "classId": "507f1f77bcf86cd799439012",
    "date": "2026-02-16",
    "timeIn": "2026-02-16T10:30:00Z",
    "status": "present",
    "faceMatchConfidence": 0.92
  }
}
```

---

### 3. Get Attendance Records
**GET** `/attendance/records`

Get attendance records (filtered by student if student role).

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `classId` (optional): Filter by class
- `fromDate` (optional): Start date (YYYY-MM-DD)
- `toDate` (optional): End date (YYYY-MM-DD)
- `status` (optional): Filter by status (present, absent, late, leave, excused)

**Example:**
```
GET /attendance/records?classId=507f1f77bcf86cd799439012&status=present
```

**Response (200):**
```json
{
  "success": true,
  "records": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "studentId": {
        "_id": "507f1f77bcf86cd799439011",
        "rollNumber": "STU001"
      },
      "classId": {
        "_id": "507f1f77bcf86cd799439012",
        "className": "Data Structures",
        "classCode": "CS201"
      },
      "date": "2026-02-16",
      "status": "present",
      "timeIn": "2026-02-16T10:30:00Z"
    }
  ]
}
```

---

### 4. Get Attendance Statistics
**GET** `/attendance/stats/:classId`

Get attendance statistics for a class.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `fromDate` (optional): Start date
- `toDate` (optional): End date

**Response (200):**
```json
{
  "success": true,
  "stats": [
    {
      "student": {
        "_id": "507f1f77bcf86cd799439011",
        "rollNumber": "STU001"
      },
      "total": 20,
      "present": 18,
      "absent": 1,
      "late": 1,
      "leave": 0,
      "excused": 0,
      "percentage": 90
    }
  ],
  "summary": {
    "totalRecords": 200,
    "present": 180,
    "absent": 10,
    "late": 10,
    "leave": 0,
    "excused": 0
  }
}
```

---

### 5. Get Today's Summary
**GET** `/attendance/today-summary`

Get today's attendance summary.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "summary": {
    "totalPresent": 45,
    "totalLate": 3,
    "totalAbsent": 2,
    "totalLeave": 1,
    "totalExcused": 0,
    "records": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "studentId": {
          "rollNumber": "STU001"
        },
        "classId": {
          "className": "Data Structures"
        },
        "status": "present",
        "timeIn": "2026-02-16T10:30:00Z"
      }
    ]
  }
}
```

---

### 6. Get Student Statistics
**GET** `/attendance/student-stats/:studentId`

Get attendance statistics for a specific student.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalClasses": 25,
    "present": 23,
    "absent": 1,
    "late": 1,
    "leave": 0,
    "excused": 0,
    "percentage": 88
  }
}
```

---

### 7. Bulk Mark Attendance
**POST** `/attendance/bulk-mark`

Mark attendance for multiple students at once.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "records": [
    {
      "studentId": "507f1f77bcf86cd799439011",
      "classId": "507f1f77bcf86cd799439012",
      "date": "2026-02-16",
      "status": "present"
    },
    {
      "studentId": "507f1f77bcf86cd799439014",
      "classId": "507f1f77bcf86cd799439012",
      "date": "2026-02-16",
      "status": "absent"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "2 records saved",
  "count": 2
}
```

---

### 8. Export Attendance Report
**GET** `/attendance/export/:classId`

Export attendance report for a class.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `fromDate` (optional): Start date
- `toDate` (optional): End date

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-02-16",
      "time": "10:30:00",
      "student": "student1",
      "rollNumber": "STU001",
      "status": "present",
      "confidence": 0.92
    }
  ]
}
```

---

## 🛠️ Admin Endpoints

### 1. Get All Users
**GET** `/admin/users`

Get all users in the system (admin only).

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `role` (optional): Filter by role (student, teacher, admin)
- `isActive` (optional): Filter by status (true/false)

**Response (200):**
```json
{
  "success": true,
  "count": 50,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "student1",
      "email": "student@example.com",
      "role": "student",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true
    }
  ]
}
```

---

### 2. Get Dashboard Statistics
**GET** `/admin/dashboard-stats`

Get system-wide statistics.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalStudents": 100,
    "totalTeachers": 50,
    "totalClasses": 10,
    "totalAttendance": 5000,
    "todayAttendance": 200,
    "presentToday": 180
  }
}
```

---

### 3. Create Class
**POST** `/admin/classes`

Create a new class.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "className": "Data Structures",
  "classCode": "CS201",
  "teacherId": "507f1f77bcf86cd799439050",
  "semester": 3,
  "department": "Computer Science",
  "academicYear": "2025-2026"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Class created successfully",
  "class": {
    "_id": "507f1f77bcf86cd799439012",
    "className": "Data Structures",
    "classCode": "CS201",
    "teacher": {
      "_id": "507f1f77bcf86cd799439050",
      "firstName": "Dr.",
      "lastName": "Smith"
    }
  }
}
```

---

### 4. Get All Classes
**GET** `/admin/classes`

Get all classes in the system.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `isActive` (optional): Filter by status
- `academicYear` (optional): Filter by year

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "classes": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "className": "Data Structures",
      "classCode": "CS201",
      "teacher": {
        "_id": "507f1f77bcf86cd799439050",
        "firstName": "Dr.",
        "lastName": "Smith"
      },
      "students": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "rollNumber": "STU001"
        }
      ]
    }
  ]
}
```

---

### 5. Add Student to Class
**POST** `/admin/classes/:classId/add-student`

Add a student to a class.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "studentId": "507f1f77bcf86cd799439011"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Student added to class"
}
```

---

### 6. Generate Attendance Report
**GET** `/admin/reports/attendance`

Generate comprehensive attendance report.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `fromDate` (optional): Start date
- `toDate` (optional): End date
- `classId` (optional): Filter by class
- `status` (optional): Filter by status

**Response (200):**
```json
{
  "success": true,
  "summary": {
    "total": 500,
    "present": 450,
    "absent": 30,
    "late": 15,
    "leave": 5,
    "excused": 0
  },
  "records": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "studentId": {
        "rollNumber": "STU001"
      },
      "classId": {
        "className": "Data Structures"
      },
      "date": "2026-02-16",
      "status": "present"
    }
  ]
}
```

---

### 7. Get Student Summary
**GET** `/admin/students/summary`

Get summary of all students with attendance.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response (200):**
```json
{
  "success": true,
  "count": 100,
  "summary": [
    {
      "studentId": "STU-507f1f77bcf86cd799439011",
      "rollNumber": "STU001",
      "name": "John Doe",
      "email": "john@example.com",
      "totalClasses": 25,
      "attendedClasses": 23,
      "attendancePercentage": 92
    }
  ]
}
```

---

### 8. Deactivate User
**PUT** `/admin/users/:userId/deactivate`

Deactivate a user account.

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deactivated"
}
```

---

## 🔍 Error Responses

All endpoints return error responses in the following format:

**400 - Bad Request:**
```json
{
  "success": false,
  "errors": [
    {
      "param": "email",
      "msg": "Please provide valid email"
    }
  ]
}
```

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**403 - Forbidden:**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

**404 - Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**500 - Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📝 Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## �� Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens are valid for 7 days.

---

## 📊 Attendance Status Values

- `present` - Student is present
- `absent` - Student is absent
- `late` - Student is late
- `leave` - Student on authorized leave
- `excused` - Student absence is excused

---

## 🔐 Role-Based Access

- **Student**: Can mark own attendance, view own records
- **Teacher**: Can mark attendance, view class reports
- **Admin**: Full system access

---

## 📞 Support

For issues or questions, please contact the development team.

Version: 2.0.0
Last Updated: February 16, 2026
