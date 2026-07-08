# Digital Attendance System

Digital Attendance System is a database-backed web application for managing students, teachers, classes, and daily attendance.

## Project Status

The core requirement is fulfilled: teachers can load students from PostgreSQL, mark attendance, and students can see their saved attendance from the database.

| Requirement | Status |
| --- | --- |
| Login for admin, teacher, and student | Done |
| Register page works on the correct backend port | Done |
| JWT token-based sessions | Done |
| Password hashing with bcrypt | Done |
| Role-based authorization | Done |
| Request logging | Done |
| Basic security middleware and rate limiting | Done |
| Teacher dashboard loads assigned classes from DB | Done |
| Teacher dashboard loads students from DB | Done |
| Teacher can mark present, late, or absent | Done |
| Attendance is stored in PostgreSQL | Done |
| Student dashboard loads courses/classes from DB | Done |
| Student dashboard shows saved attendance | Done |
| No hardcoded student list in dashboards | Done |
| Fake student schedule removed | Done |
| README setup and usage instructions | Done |
| Database DDL included | Done |
| ER diagram included | Done |
| At least 10 meaningful Git commits | Needs work |

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL
- Auth/passwords: bcryptjs
- Sessions: JSON Web Token
- Security: Helmet, rate limiting, role-based authorization
- Main server file: `backend/server.js`

## Folder Structure

```text
DIGITAL ATTENDANCE SYSTEM/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       └── routes/
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── students.sql
├── frontend/
│   ├── login.html
│   ├── register.html
│   ├── adminhome.html
│   ├── teacherhome.html
│   └── studenthome.html
└── README.md
```

## Database Tables Used By The Running App

- `users` stores admins, teachers, and students.
- `classes` stores class/section data assigned to teachers.
- `attendance` stores daily attendance using `student_id`, `class_id`, `date`, and `status`.

The repo also contains modular `courses` and `enrollments` files/tables. The current running dashboard flow uses the existing `classes` and `users.class_id` data because that is where the live student dashboard data is stored.

Schema files:

- DDL: `database/schema.sql`
- ER diagram: `database/ERD.md`

## Quick Start

1. Open a terminal in the backend folder:

```bash
cd "C:\Users\YIHUNE\OneDrive\Desktop\DIGITAL ATTENDANCE SYSTEM\backend"
```

2. Install dependencies if needed:

```bash
npm install
```

3. Make sure PostgreSQL is running and the database exists:

```bash
psql -U postgres -d digital_attendance_db
```

4. Start the backend:

```bash
node server.js
```

5. Open the app:

- Login: http://localhost:5001/login.html
- Register: http://localhost:5001/register.html
- Admin dashboard: http://localhost:5001/adminhome.html
- Teacher dashboard: http://localhost:5001/teacherhome.html
- Student dashboard: http://localhost:5001/studenthome.html

## Demo Users

Password for seeded users is usually `123`.

- Admin: `admin`
- Teacher examples: `teacher1`, `yordanos`, `mikiyas`
- Student examples: `student1`, `abdi_misgana`, `yihune`

Use the users that exist in your PostgreSQL database. The dashboard lists are loaded from the database, not from the README.

## Attendance Flow

1. Login as a teacher.
2. The teacher dashboard requests:

```text
GET /api/teacher/classes?teacher_id=TEACHER_ID
GET /api/teacher/students?teacher_id=TEACHER_ID
```

3. Click present, late, or absent for a student.
4. The frontend sends:

```text
POST /api/attendance/mark
```

5. The backend stores or updates the row in `attendance`.
6. Login as that student.
7. The student dashboard requests:

```text
GET /api/attendance/student/STUDENT_ID
GET /api/users/STUDENT_ID/courses
```

8. The student sees the saved attendance history and attendance percentage.

## Main API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check server status |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register user |
| GET | `/api/users/students` | Admin student list |
| GET | `/api/users/teachers` | Admin teacher list |
| GET | `/api/classes` | Admin class list |
| GET | `/api/teacher/classes?teacher_id=ID` | Teacher assigned classes |
| GET | `/api/teacher/students?teacher_id=ID` | Teacher student list |
| POST | `/api/attendance/mark` | Mark attendance |
| GET | `/api/attendance/student/:id` | Student attendance history |
| GET | `/api/users/:id/courses` | Student class/course summary |

Protected dashboard endpoints require:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## Security Features

- Passwords are hashed with `bcryptjs`.
- Login returns a signed JWT.
- Protected routes verify JWT before accessing data.
- Admin, teacher, and student routes enforce role-based authorization.
- Request activity is written to `logs/requests.log`.
- API routes use rate limiting.
- Helmet is enabled for HTTP security headers.

## Troubleshooting

### Port 5001 Already In Use

If you see this:

```text
Error: listen EADDRINUSE: address already in use :::5001
```

It means another backend server is already running.

Find the process:

```powershell
netstat -ano | Select-String ':5001'
```

Stop it:

```powershell
Stop-Process -Id PROCESS_ID -Force
```

Or run on a different port:

```powershell
$env:PORT=5002
node server.js
```

Then open:

```text
http://localhost:5002/login.html
```

### Database Connection Problems

Check the database settings in `backend/server.js`:

```js
host: 'localhost'
port: 5432
user: 'postgres'
password: '12345'
database: 'digital_attendance_db'
```

Make sure PostgreSQL is running and the database name/password match your computer.

## Verification Checklist

Run these after starting the server:

```powershell
Invoke-RestMethod http://localhost:5001/api/health
Invoke-RestMethod "http://localhost:5001/api/teacher/students?teacher_id=2"
Invoke-RestMethod "http://localhost:5001/api/users/11/courses"
```

Expected result:

- Health returns `success: true`.
- Teacher students returns a database list.
- Student courses returns the student class/course summary.

## Remaining Submission Risk

The course requirement asks for at least 10 meaningful GitHub commits. This repository currently has fewer than 10 commits, so you should continue committing real, incremental work with descriptive messages before submission.
