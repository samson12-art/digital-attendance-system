# Digital Attendance System

A full-stack web application for managing student attendance. Teachers can mark attendance manually or via GPS-validated QR codes, students can check in and view their records, and admins manage users, classes, and system-wide operations.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Auth:** bcryptjs (password hashing) + JWT (token-based sessions)
- **Security:** Helmet, express-rate-limit, role-based authorization
- **QR Codes:** `qrcode` library with time-based rotating SHA-256 hashes
- **Geolocation:** Haversine formula for GPS distance validation
- **File Uploads:** Multer (profile photos)
- **Export:** ExcelJS (XLSX), PDFKit (PDF)
- **Notifications:** Nodemailer (SMTP email alerts)
- **CSV Import:** csv-parse for bulk student enrollment
- **Logging:** File-based request logging to `logs/requests.log`

## Architecture (MVC Pattern)

```
backend/
├── server.js              # Entry point (starts the server)
├── src/
│   ├── app.js             # Express setup, middleware, route mounting
│   ├── config/
│   │   └── database.js    # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js        # JWT verification, role-based authorization
│   ├── models/            # Data access layer (SQL queries)
│   │   ├── userModel.js
│   │   ├── classModel.js
│   │   └── attendanceModel.js
│   ├── controllers/       # Business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── classController.js
│   │   ├── attendanceController.js
│   │   ├── adminController.js
│   │   ├── qrController.js
│   │   ├── notificationController.js
│   │   ├── exportController.js
│   │   └── bulkController.js
│   └── routes/
│       ├── authRoutes.js
│       ├── userRoutes.js
│       ├── classRoutes.js
│       ├── attendanceRoutes.js
│       ├── teacherRoutes.js
│       ├── adminRoutes.js
│       ├── qrRoutes.js
│       ├── notificationRoutes.js
│       ├── exportRoutes.js
│       └── bulkRoutes.js
frontend/
├── login.html
├── register.html
├── forgot-password.html
├── adminhome.html
├── teacherhome.html
├── studenthome.html
└── assets/css/
    └── styles.css
database/
├── schema.sql            # Full DDL + seed data
├── ERD.md                # Mermaid ER diagram
└── migration_add_photo.sql
```

## Database Schema

- **users** — admins, teachers, and students (role, class_id, profile_photo)
- **classes** — class/section assignments linked to teachers
- **attendance** — daily attendance records (student_id, class_id, date, status, check_in_time)
- **sections** — section codes (A, B)
- **courses** — course details (code, name, teacher, section, credit hours)
- **course_schedules** — weekly schedule (day, start/end time, room, is_lab)
- **enrollments** — many-to-many student-to-course mapping

DDL: `database/schema.sql` | ERD: `database/ERD.md`

## Quick Start

1. Create the database:

```bash
createdb -U postgres digital_attendance_db
psql -U postgres -d digital_attendance_db -f database/schema.sql
```

2. Install dependencies:

```bash
cd backend
npm install
```

3. Configure environment (`backend/.env`):

```
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=12345
DB_NAME=digital_attendance_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_password
SMTP_FROM=Digital Attendance <noreply@example.com>
```

4. Start the server:

```bash
node server.js
```

5. Open http://localhost:5001

## Demo Users

All seeded users use password `123`.

| Role | Username |
|------|----------|
| Admin | `admin` |
| Teacher | `yordanos`, `mikiyas`, `adis`, `solomon`, `getahun`, `natnael`, `betelhem`, `betlehem`, `martha` |
| Student | `abdi_misgana`, `yihune`, and 50+ more |

## API Endpoints

### Auth

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/auth/login` | Public | Login (returns JWT) |
| POST | `/api/auth/register` | Admin | Create user |
| POST | `/api/auth/forgot-password` | Public | Verify identity for reset |
| POST | `/api/auth/reset-password` | Public | Reset with token |
| PUT | `/api/auth/change-password` | Auth | Change password |

### Users & Classes

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/users/me` | Auth | Current user profile |
| GET | `/api/users/students` | Admin/Teacher | List students |
| GET | `/api/users/teachers` | Admin | List teachers |
| POST | `/api/users/upload-photo` | Auth | Upload profile photo |
| DELETE | `/api/users/:id` | Admin | Deactivate user |
| GET | `/api/users/:id/courses` | Student | Course summaries |
| GET | `/api/users/:id/eligibility` | Student | Exam eligibility check |
| GET | `/api/classes` | Admin/Teacher | List classes |
| POST | `/api/classes` | Admin | Create class |
| DELETE | `/api/classes/:id` | Admin | Delete class |

### Attendance

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/attendance/mark` | Admin/Teacher | Mark attendance |
| GET | `/api/attendance/student/:id` | Auth | Attendance history |
| GET | `/api/teacher/students` | Admin/Teacher | Teacher's students |
| GET | `/api/teacher/classes` | Admin/Teacher | Teacher's classes |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |

### QR Code Attendance (GPS-Validated)

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/qr/generate` | Admin/Teacher | Generate QR code with classroom GPS |
| GET | `/api/qr/current/:class_id` | Auth | Get active QR code info |
| POST | `/api/qr/checkin` | Student | Check in with code + GPS location |
| POST | `/api/qr/verify` | Auth | Verify if a code is valid |

### Notifications

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/notifications/send-alert` | Admin/Teacher | Send attendance email |
| POST | `/api/notifications/low-attendance` | Admin/Teacher | Low attendance warning |
| POST | `/api/notifications/bulk-low-attendance` | Admin/Teacher | Bulk low attendance alerts |
| GET | `/api/notifications/low-attendance-students` | Admin/Teacher | List low attendance students |

### Export & Bulk

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/export/attendance/excel` | Admin/Teacher | Export attendance Excel |
| GET | `/api/export/attendance/pdf` | Admin/Teacher | Export attendance PDF |
| GET | `/api/export/students/excel` | Admin/Teacher | Export students Excel |
| GET | `/api/export/students/pdf` | Admin/Teacher | Export students PDF |
| GET | `/api/export/report/pdf` | Admin | Full system report PDF |
| POST | `/api/bulk/import-students` | Admin | CSV student import |
| POST | `/api/bulk/mark-attendance` | Admin/Teacher | Bulk mark attendance |
| POST | `/api/bulk/mark-all-present` | Admin/Teacher | Mark all present |
| POST | `/api/bulk/batch-classes` | Admin | Batch create classes |
| GET | `/api/bulk/csv-template` | Admin | Download CSV template |

All protected endpoints require `Authorization: Bearer <jwt_token>` header.

## QR Code Attendance (Anti-Cheating)

The QR code system uses three security layers to prevent students from checking in outside the classroom:

### Layer 1: GPS Geolocation Validation
- Teacher sets classroom GPS coordinates when generating a QR code (manual input or "Use My Location" button)
- Student's browser captures GPS coordinates on check-in via `navigator.geolocation`
- Server calculates distance using the **Haversine formula** and rejects if > 100 meters from the classroom
- Error message shows exact distance: *"You are 350m away from the classroom. You must be within 100m to check in."*

### Layer 2: Short Validity Window
- QR codes expire after **20 seconds** (configurable 10-300s)
- Time-based rotating SHA-256 hash automatically invalidates old codes
- Limits the window for code sharing or forwarding

### Layer 3: Single-Use QR Codes
- Each QR code can only be used once per student
- After successful check-in, the student ID is recorded and subsequent attempts are rejected
- Prevents screenshot sharing within the validity window

### Check-in Validation Order
1. QR code exists for the class
2. QR code has not expired
3. Code hash matches (SHA-256 with time bucket)
4. Student has not already used this QR instance
5. GPS distance is within 100m of classroom (if GPS set)
6. Student belongs to the correct section
7. No duplicate attendance record for today
8. Attendance marked as present

## Security Features

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with configurable expiration
- Role-based access control (admin, teacher, student)
- Rate limiting (300 requests per 15 min window)
- Helmet HTTP security headers
- GPS-validated QR code attendance
- Single-use QR codes
- Time-expiring QR codes (20s default)
- Input validation on registration
- File-based request logging

## Attendance Flow

### Manual Marking
1. Teacher logs in and selects a class
2. Student list loads from the database
3. Teacher clicks Present/Late/Absent for each student
4. Attendance is saved to PostgreSQL with upsert logic

### QR Code Check-in
1. Teacher goes to QR Code page, selects class
2. Teacher sets classroom GPS coordinates (auto-detect or manual)
3. Teacher generates QR code (valid for 20 seconds)
4. QR image + text code displayed on teacher's screen
5. Student goes to "Scan QR" page, selects class, enters code
6. Browser requests GPS permission and sends location with code
7. Server validates: code + expiry + single-use + GPS range + section
8. Student sees success/failure message with distance info

## Extra Features

- Dark/light theme toggle on all dashboards
- Responsive design for mobile and desktop
- Profile photo uploads
- Bulk CSV student import
- Excel and PDF export (attendance, students, full report)
- Email notifications (attendance alerts, low attendance warnings)
- Password reset flow via email
- Exam eligibility tracking (blocked if 60%+ late or 23%+ absent)
- Weekly class schedule view
- Dashboard statistics for admin
- Student search filtering on teacher dashboard
