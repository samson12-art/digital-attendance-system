# Digital Attendance System

A full-stack web application for managing student attendance. Teachers can mark attendance (present, late, absent) for their classes, students can view their attendance records, and admins manage users and classes.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Auth:** bcryptjs (password hashing) + JWT (token-based sessions)
- **Security:** Helmet, express-rate-limit, role-based authorization
- **Logging:** File-based request logging to `logs/requests.log`

## Architecture (MVC Pattern)

The application follows the MVC architectural pattern with clear separation:

```
backend/
├── server.js              # Entry point (thin, starts the server)
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
│   ├── controllers/       # Business logic (request/response handling)
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── classController.js
│   │   ├── attendanceController.js
│   │   └── adminController.js
│   └── routes/            # Route definitions
│       ├── authRoutes.js
│       ├── userRoutes.js
│       ├── classRoutes.js
│       ├── attendanceRoutes.js
│       ├── teacherRoutes.js
│       └── adminRoutes.js
frontend/                  # Views (HTML + CSS + JS)
├── login.html
├── register.html
├── adminhome.html
├── teacherhome.html
└── studenthome.html
```

- **Models** — encapsulate all database queries (SQL)
- **Views** — HTML/CSS/JS frontend files
- **Controllers** — handle HTTP requests, call models, return responses
- **Routes** — map URLs to controllers with middleware

## Database Schema

The database uses three primary tables:

- **users** — stores admins, teachers, and students (with `role` and `class_id`)
- **classes** — stores class/section data assigned to teachers
- **attendance** — stores daily attendance records (student_id, class_id, date, status)

DDL script: `database/schema.sql`
ER diagram: `database/ERD.md`

## Quick Start

1. Ensure PostgreSQL is running and create the database:

```bash
createdb -U postgres digital_attendance_db
psql -U postgres -d digital_attendance_db -f database/schema.sql
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Configure environment (edit `backend/.env` if needed):

```
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=12345
DB_NAME=digital_attendance_db
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

4. Start the server:

```bash
node server.js
```

5. Open the app at http://localhost:5001

## Demo Users

All seeded users use password `123`.

| Role | Username |
|------|----------|
| Admin | `admin` |
| Teacher | `yordanos`, `mikiyas`, `adis`, `solomon`, `getahun`, `natnael`, `betelhem`, `betlehem`, `martha` |
| Student | `abdi_misgana`, `yihune`, and 50+ more |

## API Endpoints

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/health` | Public | Server health check |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/register` | Public | Register user |
| GET | `/api/users/students` | Admin/Teacher | List students |
| GET | `/api/users/teachers` | Admin | List teachers |
| DELETE | `/api/users/:id` | Admin | Deactivate user |
| GET | `/api/classes` | Admin/Teacher | List classes |
| POST | `/api/classes` | Admin | Create class |
| DELETE | `/api/classes/:id` | Admin | Delete class |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/teacher/students?teacher_id=ID` | Teacher | Teacher's students |
| GET | `/api/teacher/classes?teacher_id=ID` | Teacher | Teacher's classes |
| POST | `/api/attendance/mark` | Teacher/Admin | Mark attendance |
| GET | `/api/attendance/student/:id` | Student/Teacher | Attendance history |
| GET | `/api/users/:id/courses` | Student | Course summaries |

Protected endpoints require `Authorization: Bearer <jwt_token>` header.

## Security Features

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens with configurable expiration
- Role-based access control (admin, teacher, student)
- Rate limiting on API routes (300 requests per 15 min window)
- Helmet HTTP security headers
- Input validation on registration (email format, required fields)
- File-based request logging

## Attendance Flow

1. Teacher logs in and selects a class
2. Student list loads from the database
3. Teacher clicks Present/Late/Absent for each student
4. Attendance is saved to PostgreSQL with upsert logic
5. Student logs in and views attendance history with percentage

## Extra Features (Beyond Course Scope)

- Dark/light theme toggle on all dashboards
- Responsive design for mobile and desktop
- Bulk attendance upsert (ON CONFLICT UPDATE)
- Dashboard statistics for admin (student/teacher/course counts)
- Student search filtering on teacher dashboard
- Real-time student class assignment verification
