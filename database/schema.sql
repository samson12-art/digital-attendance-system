-- =============================================
-- DIGITAL ATTENDANCE SYSTEM - PostgreSQL Schema
-- =============================================

-- Create Database (Run this separately if needed)
-- CREATE DATABASE digital_attendance_db;

-- Connect to the database
-- \c digital_attendance_db;

-- =============================================
-- CLASSES TABLE (used by the running server)
-- teacher_id FK added after users table exists
-- =============================================
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    section VARCHAR(10) NOT NULL,
    year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    teacher_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    is_active BOOLEAN DEFAULT TRUE,
    class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
    entry_year VARCHAR(20),
    semester VARCHAR(20),
    department VARCHAR(100),
    profile_photo VARCHAR(500) DEFAULT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add FK constraints (classes -> users, users -> classes)
ALTER TABLE classes ADD CONSTRAINT fk_classes_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users ADD CONSTRAINT fk_users_class
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- =============================================
-- SECTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    section_code VARCHAR(20) UNIQUE NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- COURSES TABLE (UPDATED with section info)
-- =============================================
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
    semester VARCHAR(20),
    academic_year VARCHAR(20),
    credit_hours INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- COURSE SCHEDULE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS course_schedules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    is_lab BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ENROLLMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    UNIQUE(student_id, course_id)
);

-- =============================================
-- ATTENDANCE RECORDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    check_in_time TIME,
    check_out_time TIME,
    marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, date)
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_section_id ON courses(section_id);
CREATE INDEX idx_courses_semester ON courses(semester);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_course_schedules_course_id ON course_schedules(course_id);

-- =============================================
-- CREATE TRIGGER FUNCTION FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- CREATE TRIGGERS
-- =============================================
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INSERT SECTIONS
-- =============================================
INSERT INTO sections (section_code, section_name) VALUES
('A', 'Section A'),
('B', 'Section B');

-- =============================================
-- INSERT DEFAULT USERS (Password: "123" hashed with bcrypt)
-- class_id will be assigned after classes are seeded
-- =============================================
INSERT INTO users (username, password, email, full_name, role) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'admin@digitalsystem.com', 'System Administrator', 'admin'),
('yordanos', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yordanos@digitalsystem.com', 'Ms. Yordanos', 'teacher'),
('mikiyas', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'mikiyas@digitalsystem.com', 'Mr. Mikiyas', 'teacher'),
('adis', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'adis@digitalsystem.com', 'Mr. Adis', 'teacher'),
('solomon', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'solomon@digitalsystem.com', 'Dr. Solomon', 'teacher'),
('getahun', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'getahun@digitalsystem.com', 'Mr. Getahun', 'teacher'),
('natnael', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'natnael@digitalsystem.com', 'Mr. Natnael', 'teacher'),
('betelhem', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'betelhem@digitalsystem.com', 'Mrs. Betelhem', 'teacher'),
('betlehem', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'betlehem@digitalsystem.com', 'Mrs. Betlehem', 'teacher'),
('martha', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'martha@digitalsystem.com', 'Mrs. Martha', 'teacher');

-- =============================================
-- INSERT COURSES (Section A - from the image)
-- =============================================
INSERT INTO courses (course_code, course_name, description, teacher_id, section_id, semester, academic_year, credit_hours) VALUES
('CoSc3023', 'Operating Systems', 'Operating Systems course covering OS concepts, processes, memory management, and file systems', 
    (SELECT id FROM users WHERE username = 'yordanos'), 
    (SELECT id FROM sections WHERE section_code = 'A'), 
    'Fall 2024', '2024-2025', 3),
    
('CoSc3081', 'Web Programming I', 'Web programming fundamentals including HTML, CSS, JavaScript, and server-side development',
    (SELECT id FROM users WHERE username = 'mikiyas'),
    (SELECT id FROM sections WHERE section_code = 'A'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc3056', 'Java Programming', 'Java programming language covering OOP concepts, collections, and GUI development',
    (SELECT id FROM users WHERE username = 'solomon'),
    (SELECT id FROM sections WHERE section_code = 'A'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc2095', 'Data Structures and Algorithms', 'Data structures, algorithms, and complexity analysis',
    (SELECT id FROM users WHERE username = 'getahun'),
    (SELECT id FROM sections WHERE section_code = 'A'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc3101', 'Automata and Complexity Theory', 'Automata theory, formal languages, and computational complexity',
    (SELECT id FROM users WHERE username = 'natnael'),
    (SELECT id FROM sections WHERE section_code = 'A'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc3025', 'Microprocessor and Assembly Language Programming', 'Microprocessor architecture and assembly language programming',
    (SELECT id FROM users WHERE username = 'betelhem'),
    (SELECT id FROM sections WHERE section_code = 'A'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc3061', 'Software Engineering', 'Software engineering principles, methodologies, and project management',
    (SELECT id FROM users WHERE username = 'martha'),
    (SELECT id FROM sections WHERE section_code = 'A'),
    'Fall 2024', '2024-2025', 3);

-- =============================================
-- INSERT COURSES (Section B - from the image)
-- =============================================
INSERT INTO courses (course_code, course_name, description, teacher_id, section_id, semester, academic_year, credit_hours) VALUES
('CoSc3023-B', 'Operating Systems', 'Operating Systems course covering OS concepts, processes, memory management, and file systems',
    (SELECT id FROM users WHERE username = 'yordanos'),
    (SELECT id FROM sections WHERE section_code = 'B'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc3081-B', 'Web Programming I', 'Web programming fundamentals including HTML, CSS, JavaScript, and server-side development',
    (SELECT id FROM users WHERE username = 'adis'),
    (SELECT id FROM sections WHERE section_code = 'B'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc3056-B', 'Java Programming', 'Java programming language covering OOP concepts, collections, and GUI development',
    (SELECT id FROM users WHERE username = 'solomon'),
    (SELECT id FROM sections WHERE section_code = 'B'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc2095-B', 'Data Structures and Algorithms', 'Data structures, algorithms, and complexity analysis',
    (SELECT id FROM users WHERE username = 'getahun'),
    (SELECT id FROM sections WHERE section_code = 'B'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc3101-B', 'Automata and Complexity Theory', 'Automata theory, formal languages, and computational complexity',
    (SELECT id FROM users WHERE username = 'natnael'),
    (SELECT id FROM sections WHERE section_code = 'B'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc3025-B', 'Microprocessor and Assembly Language Programming', 'Microprocessor architecture and assembly language programming',
    (SELECT id FROM users WHERE username = 'betlehem'),
    (SELECT id FROM sections WHERE section_code = 'B'),
    'Fall 2024', '2024-2025', 3),
    
('CoSc3061-B', 'Software Engineering', 'Software engineering principles, methodologies, and project management',
    (SELECT id FROM users WHERE username = 'martha'),
    (SELECT id FROM sections WHERE section_code = 'B'),
    'Fall 2024', '2024-2025', 3);

-- =============================================
-- INSERT COURSE SCHEDULES (Section A)
-- =============================================
-- Operating Systems (CoSc3023) - Section A
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3023'), 'Monday', '16:30', '18:30', 'ROOM 201', FALSE),
((SELECT id FROM courses WHERE course_code = 'CoSc3023'), 'Tuesday', '19:00', '21:00', 'ROOM 201', TRUE);

-- Web Programming I (CoSc3081) - Section A
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3081'), 'Friday', '19:30', '21:30', 'ROOM 501', FALSE),
((SELECT id FROM courses WHERE course_code = 'CoSc3081'), 'Saturday', '14:30', '17:30', 'ROOM 801', TRUE);

-- Java Programming (CoSc3056) - Section A
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3056'), 'Wednesday', '19:30', '22:30', 'ROOM 501', TRUE),
((SELECT id FROM courses WHERE course_code = 'CoSc3056'), 'Thursday', '16:30', '18:30', 'ROOM 302', FALSE);

-- Data Structures and Algorithms (CoSc2095) - Section A
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc2095'), 'Monday', '19:30', '22:30', 'ROOM 301', TRUE),
((SELECT id FROM courses WHERE course_code = 'CoSc2095'), 'Monday', '14:30', '16:30', 'ROOM 203', FALSE);

-- Automata and Complexity Theory (CoSc3101) - Section A
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3101'), 'Thursday', '19:30', '22:30', 'ROOM 203', FALSE);

-- Microprocessor and Assembly Language (CoSc3025) - Section A
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3025'), 'Wednesday', '16:30', '18:30', 'ROOM 203', TRUE),
((SELECT id FROM courses WHERE course_code = 'CoSc3025'), 'Friday', '14:30', '16:30', 'ROOM 501', FALSE);

-- Software Engineering (CoSc3061) - Section A
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3061'), 'Tuesday', '14:30', '17:30', 'ROOM 303', FALSE);

-- =============================================
-- INSERT COURSE SCHEDULES (Section B)
-- =============================================
-- Operating Systems (CoSc3023-B) - Section B
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3023-B'), 'Monday', '14:30', '16:30', 'ROOM 501', FALSE),
((SELECT id FROM courses WHERE course_code = 'CoSc3023-B'), 'Tuesday', '16:30', '18:30', 'ROOM 301', TRUE);

-- Web Programming I (CoSc3081-B) - Section B
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3081-B'), 'Monday', '19:30', '22:30', 'ROOM 501', TRUE),
((SELECT id FROM courses WHERE course_code = 'CoSc3081-B'), 'Tuesday', '19:30', '21:30', 'ROOM 501', FALSE);

-- Java Programming (CoSc3056-B) - Section B
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3056-B'), 'Wednesday', '16:30', '18:30', 'ROOM 801', FALSE),
((SELECT id FROM courses WHERE course_code = 'CoSc3056-B'), 'Thursday', '19:30', '22:30', 'ROOM 302', TRUE);

-- Data Structures and Algorithms (CoSc2095-B) - Section B
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc2095-B'), 'Monday', '16:30', '18:30', 'ROOM 501', FALSE),
((SELECT id FROM courses WHERE course_code = 'CoSc2095-B'), 'Friday', '19:30', '22:30', 'ROOM 301', TRUE);

-- Automata and Complexity Theory (CoSc3101-B) - Section B
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3101-B'), 'Saturday', '14:30', '17:30', 'ROOM 201', FALSE);

-- Microprocessor and Assembly Language (CoSc3025-B) - Section B
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3025-B'), 'Wednesday', '14:30', '16:30', 'ROOM 801', TRUE),
((SELECT id FROM courses WHERE course_code = 'CoSc3025-B'), 'Friday', '17:00', '19:00', 'ROOM 201', FALSE);

-- Software Engineering (CoSc3061-B) - Section B
INSERT INTO course_schedules (course_id, day, start_time, end_time, room, is_lab) VALUES
((SELECT id FROM courses WHERE course_code = 'CoSc3061-B'), 'Thursday', '15:00', '18:00', 'ROOM 401', FALSE);

-- =============================================
-- INSERT STUDENTS (From the image - Section A)
-- =============================================
INSERT INTO users (username, password, email, full_name, role) VALUES
('abdi_misgana', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'abdi.misgana@student.com', 'Abdi Misgana Terefe', 'student'),
('abdulmenan', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'abdulmenan@student.com', 'Abdulmenan Jemal Mohammednur', 'student'),
('abel_birhanu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'abel.birhanu@student.com', 'Abel Birhanu Sereke', 'student'),
('abel_hagos', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'abel.hagos@student.com', 'Abel Hagos Teklay', 'student'),
('abemelek', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'abemelek@student.com', 'Abemelek Asmamaw Gebreyes', 'student'),
('abubeker', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'abubeker@student.com', 'Abubeker Adem Seid', 'student'),
('adem_bilal', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'adem.bilal@student.com', 'Adem Bilal Adem', 'student'),
('adoniyas', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'adoniyas@student.com', 'Adoniyas Shimelis Mulugeta', 'student'),
('alemseged', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'alemseged@student.com', 'Alemseged Sileshi Teferedegn', 'student'),
('amanuel', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'amanuel@student.com', 'Amanuel Habtegebriel Tsegaye', 'student'),
('amin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'amin@student.com', 'Amin Abdulhakim Ahmed', 'student'),
('arselma', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'arselma@student.com', 'Arselma Getahun Demissie', 'student'),
('athrons', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'athrons@student.com', 'Athrons Abiy Tessema', 'student'),
('axumawit', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'axumawit@student.com', 'Axumawit Hailay Gebremedhin', 'student'),
('aymen', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'aymen@student.com', 'Aymen Amin Hussen', 'student'),
('baslael', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'baslael@student.com', 'Baslael Mesazgi Habte', 'student'),
('beidemariam', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'beidemariam@student.com', 'Beidemariam Shumet Kebede', 'student'),
('beka_abera', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'beka.abera@student.com', 'Beka Abera Beyene', 'student'),
('bemnet', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'bemnet@student.com', 'Bemnet Gizachew Wedajo', 'student'),
('betelhem_tesfaye', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'betelhem.tesfaye@student.com', 'Betelhem Tesfaye Alemu', 'student'),
('bezawit', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'bezawit@student.com', 'Bezawit Bushe Lemu', 'student'),
('biruk_haile', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'biruk.haile@student.com', 'Biruk Haile Gebeyehu', 'student'),
('biruk_zeradawit', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'biruk.zeradawit@student.com', 'Biruk Zeradawit Adhana', 'student'),
('blen', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'blen@student.com', 'Blen Tesfaye Eshetu', 'student'),
('bonsa', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'bonsa@student.com', 'Bonsa Dereje Dirbaba', 'student'),
('dagem', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'dagem@student.com', 'Dagem Akilbu Bekele', 'student'),
('dagim', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'dagim@student.com', 'Dagim Alemzewd Birga', 'student'),
('dagmawi', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'dagmawi@student.com', 'Dagmawi Tarekegn Ayalew', 'student'),
('dagmawit', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'dagmawit@student.com', 'Dagmawit Yikber Gebru', 'student'),
('dawit', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'dawit@student.com', 'Dawit Tilahun', 'student'),
('dayan', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'dayan@student.com', 'Dayan Berhe Woldemariam', 'student'),
('eldana', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'eldana@student.com', 'Eldana Eskedar Melaku', 'student'),
('eleni', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'eleni@student.com', 'Eleni Melaku Shinbir', 'student'),
('endekalu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'endekalu@student.com', 'Endekalu Zergaw Kidanemariyam', 'student'),
('ephrem', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'ephrem@student.com', 'Ephrem Sahle Leka', 'student'),
('ermiyas', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'ermiyas@student.com', 'Ermiyas Ketema Zegeye', 'student'),
('eyoel_kassa', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'eyoel.kassa@student.com', 'Eyoel Kassa Seboka', 'student'),
('eyoel_agegnehu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'eyoel.agegnehu@student.com', 'Eyoel Agegnehu Aynalem', 'student'),
('ezana', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'ezana@student.com', 'Ezana Abebe Gebrehiwot', 'student'),
('fares', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'fares@student.com', 'Fares Asnakew Waja', 'student'),
('fedhasa', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'fedhasa@student.com', 'Fedhasa Dawit Tufa', 'student'),
('fenet', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'fenet@student.com', 'Fenet Asrat Gebreselassie', 'student'),
('helen', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'helen@student.com', 'Helen Dereje Moges', 'student'),
('hermela_bezabih', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'hermela.bezabih@student.com', 'Hermela Bezabih Lemma', 'student'),
('hermela_mulugeta', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'hermela.mulugeta@student.com', 'Hermela Mulugeta Tesema', 'student'),
('hildana', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'hildana@student.com', 'Hildana Hailemariam Gebissa', 'student'),
('kaleab', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'kaleab@student.com', 'Kaleab Teklemaryam Birhane', 'student'),
('kaleb_mitiku', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'kaleb.mitiku@student.com', 'Kaleb Mitiku Mekonnen', 'student'),
('kaleb_tibebe', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'kaleb.tibebe@student.com', 'Kaleb Tibebe Hailu', 'student'),
('kalkidan_awoke', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'kalkidan.awoke@student.com', 'Kalkidan Awoke Ayana', 'student'),
('kalkidan_samuel', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'kalkidan.samuel@student.com', 'Kalkidan Samuel Bejera', 'student');

-- =============================================
-- INSERT STUDENTS (From the image - Section B)
-- =============================================
INSERT INTO users (username, password, email, full_name, role) VALUES
('kibruyisfa', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'kibruyisfa@student.com', 'Kibruyisfa Misganaw Mebrahu', 'student'),
('kirubel', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'kirubel@student.com', 'Kirubel Metaferia Negash', 'student'),
('lidia', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'lidia@student.com', 'Lidia Addisu Belete', 'student'),
('mahider', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'mahider@student.com', 'Mahider Aemero Mekonen', 'student'),
('mariyamawit', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'mariyamawit@student.com', 'Mariyamawit Alemseged Gssilassie', 'student'),
('mathiyas', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'mathiyas@student.com', 'Mathiyas Gezahegn Shiferaw', 'student'),
('megdelawit', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'megdelawit@student.com', 'Megdelawit Abraham Digafe', 'student'),
('melat', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'melat@student.com', 'Melat Samson Ggeziabher', 'student'),
('michael', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'michael@student.com', 'Michael Zinabu Tikuye', 'student'),
('mihreteab', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'mihreteab@student.com', 'Mihreteab Desta Sewore', 'student'),
('mikiyas_tsegaye', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'mikiyas.tsegaye@student.com', 'Mikiyas Tsegaye Mandeffro', 'student'),
('mohammed_abduljelil', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'mohammed.abduljelil@student.com', 'Mohammed Abduljelil Abas', 'student'),
('mohammed_abdullah', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'mohammed.abdullah@student.com', 'Mohammed Abdullah Abdo', 'student'),
('munira_tebarek', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'munira.tebarek@student.com', 'Munira Tebarek Redilu', 'student'),
('munira_yesuf', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'munira.yesuf@student.com', 'Munira Yesuf Mohammed', 'student'),
('nahom_fekadu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'nahom.fekadu@student.com', 'Nahom Fekadu Abate', 'student'),
('nahom_hailu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'nahom.hailu@student.com', 'Nahom Hailu Admasu', 'student'),
('nahom_mulugeta', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'nahom.mulugeta@student.com', 'Nahom Mulugeta Gebeyehu', 'student'),
('nahom_tadesse', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'nahom.tadesse@student.com', 'Nahom Tadesse Haileevesus', 'student'),
('naomi', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'naomi@student.com', 'Naomi Zenebe Hailemariam', 'student'),
('natan', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'natan@student.com', 'Natan Feyisa Kebede', 'student'),
('natnael_asnake', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'natnael.asnake@student.com', 'Natnael Asnake Hailemariam', 'student'),
('nebiyat', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'nebiyat@student.com', 'Nebiyat Mesfin Tsegaye', 'student'),
('nebyu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'nebyu@student.com', 'Nebyu Samuel Lakew', 'student'),
('newal', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'newal@student.com', 'Newal Elias Mohammed', 'student'),
('nobel', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'nobel@student.com', 'Nobel Alemayehu Mengesha', 'student'),
('noha', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'noha@student.com', 'Noha Dengia Etea', 'student'),
('reda', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'reda@student.com', 'Reda Mohammed Ahmed', 'student'),
('roba', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'roba@student.com', 'Roba Molla Welkeba', 'student'),
('ruth', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'ruth@student.com', 'Ruth Getahun Melka', 'student'),
('samuel_girma', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'samuel.girma@student.com', 'Samuel Girma Kebenessa', 'student'),
('samuel_wondimagegnehu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'samuel.wondimagegnehu@student.com', 'Samuel Wondimagegnehu Gebrehiwot', 'student'),
('semhal', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'semhal@student.com', 'Semhal Abebe Sebhat', 'student'),
('semiha', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'semiha@student.com', 'Semiha Kedir Jemal', 'student'),
('sofoniyas', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'sofoniyas@student.com', 'Sofoniyas Tewodros G/wold', 'student'),
('tewobesta', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'tewobesta@student.com', 'Tewobesta Alemayehu Gelagay', 'student'),
('wengelawit', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'wengelawit@student.com', 'Wengelawit Asres Alemnew', 'student'),
('yabetis_gessese', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yabetis.gessese@student.com', 'Yabetis Gessese Kurabachew', 'student'),
('yabetse_tesfaye', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yabetse.tesfaye@student.com', 'Yabetse Tesfaye Alemu', 'student'),
('yabetsega', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yabetsega@student.com', 'Yabetsega Shimelis Kassa', 'student'),
('yanet', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yanet@student.com', 'Yanet Belay Wodaje', 'student'),
('yared_habtamu', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yared.habtamu@student.com', 'Yared Habtamu Agonafer', 'student'),
('yared_tilahun', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yared.tilahun@student.com', 'Yared Tilahun Kidane', 'student'),
('yasir', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yasir@student.com', 'Yasir Hamid Ali', 'student'),
('yeabkal', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yeabkal@student.com', 'Yeabkal Wondwossen Girma', 'student'),
('yeabsira', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yeabsira@student.com', 'Yeabsira Daniel Fikre', 'student'),
('yeabtsega_samuel', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yeabtsega.samuel@student.com', 'Yeabtsega Samuel', 'student'),
('yeshake', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yeshake@student.com', 'Yeshake Assefa Wolde', 'student'),
('yihune', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yihune@student.com', 'Yihune Yeshaneh Sewnet', 'student'),
('yohannes_gebru', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yohannes.gebru@student.com', 'Yohannes Gebru G/Hiwot', 'student'),
('yohannes_habte', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yohannes.habte@student.com', 'Yohannes Habte Neda', 'student'),
('yoseph', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.c4xr7Xq5Jf5xL8qZrVY4XbVr8v2', 'yoseph@student.com', 'Yoseph Fetene Lemma', 'student');

-- =============================================
-- INSERT CLASSES (for the running server)
-- Must come after all users exist for FKs
-- =============================================
INSERT INTO classes (name, section, year, semester, teacher_id) VALUES
('Operating Systems', 'A', '2024', 'Fall', (SELECT id FROM users WHERE username = 'yordanos')),
('Web Programming I', 'A', '2024', 'Fall', (SELECT id FROM users WHERE username = 'mikiyas')),
('Java Programming', 'A', '2024', 'Fall', (SELECT id FROM users WHERE username = 'solomon')),
('Data Structures and Algorithms', 'A', '2024', 'Fall', (SELECT id FROM users WHERE username = 'getahun')),
('Automata and Complexity Theory', 'A', '2024', 'Fall', (SELECT id FROM users WHERE username = 'natnael')),
('Microprocessor and Assembly Language', 'A', '2024', 'Fall', (SELECT id FROM users WHERE username = 'betelhem')),
('Software Engineering', 'A', '2024', 'Fall', (SELECT id FROM users WHERE username = 'martha')),
('Operating Systems', 'B', '2024', 'Fall', (SELECT id FROM users WHERE username = 'yordanos')),
('Web Programming I', 'B', '2024', 'Fall', (SELECT id FROM users WHERE username = 'adis')),
('Java Programming', 'B', '2024', 'Fall', (SELECT id FROM users WHERE username = 'solomon')),
('Data Structures and Algorithms', 'B', '2024', 'Fall', (SELECT id FROM users WHERE username = 'getahun')),
('Automata and Complexity Theory', 'B', '2024', 'Fall', (SELECT id FROM users WHERE username = 'natnael')),
('Microprocessor and Assembly Language', 'B', '2024', 'Fall', (SELECT id FROM users WHERE username = 'betlehem')),
('Software Engineering', 'B', '2024', 'Fall', (SELECT id FROM users WHERE username = 'martha'));

-- Assign students to their section's class using a DO block
DO $$
DECLARE
    student_ids INTEGER[];
    total_students INTEGER;
    section_a_count INTEGER;
BEGIN
    -- Get all student IDs in insertion order
    SELECT ARRAY_AGG(id ORDER BY id) INTO student_ids FROM users WHERE role = 'student' ORDER BY id;
    total_students := COALESCE(array_length(student_ids, 1), 0);
    section_a_count := total_students / 2;

    -- First half of students -> Section A (class_id = 1)
    UPDATE users SET class_id = 1 WHERE id = ANY(student_ids[1:section_a_count]);

    -- Second half of students -> Section B (class_id = 8)
    UPDATE users SET class_id = 8 WHERE id = ANY(student_ids[section_a_count+1:total_students]);
END $$;

-- =============================================
-- ENROLL ALL STUDENTS IN THEIR SECTION COURSES
-- =============================================
DO $$
DECLARE
    student_record RECORD;
    course_record RECORD;
BEGIN
    -- Enroll Section A students in Section A courses
    FOR student_record IN SELECT id FROM users WHERE role = 'student' AND id BETWEEN 11 AND 100
    LOOP
        FOR course_record IN SELECT id FROM courses WHERE section_id = (SELECT id FROM sections WHERE section_code = 'A')
        LOOP
            INSERT INTO enrollments (student_id, course_id)
            VALUES (student_record.id, course_record.id)
            ON CONFLICT (student_id, course_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    -- Enroll Section B students in Section B courses
    FOR student_record IN SELECT id FROM users WHERE role = 'student' AND id > 55
    LOOP
        FOR course_record IN SELECT id FROM courses WHERE section_id = (SELECT id FROM sections WHERE section_code = 'B')
        LOOP
            INSERT INTO enrollments (student_id, course_id)
            VALUES (student_record.id, course_record.id)
            ON CONFLICT (student_id, course_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =============================================
-- INSERT SAMPLE ATTENDANCE RECORDS
-- =============================================
INSERT INTO attendance (student_id, class_id, date, status, check_in_time, marked_by)
SELECT 
    s.id,
    c.id,
    CURRENT_DATE - (random() * 5)::int,
    (ARRAY['present', 'present', 'present', 'absent', 'late'])[floor(random() * 5 + 1)],
    (TIME '08:00' + (random() * 120)::int * INTERVAL '1 minute')::TIME,
    (SELECT id FROM users WHERE role = 'teacher' LIMIT 1)
FROM users s, classes c
WHERE s.role = 'student' AND c.id = 1
LIMIT 20;

-- =============================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =============================================

-- View: Student Attendance Summary with Class Details
CREATE OR REPLACE VIEW v_student_attendance_summary AS
SELECT 
    u.id as student_id,
    u.full_name as student_name,
    c.id as class_id,
    c.name as class_name,
    c.section,
    COUNT(a.id) as total_classes,
    COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
    COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_count,
    COUNT(a.id) FILTER (WHERE a.status = 'late') as late_count,
    COUNT(a.id) FILTER (WHERE a.status = 'excused') as excused_count,
    ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2) as attendance_percentage
FROM users u
JOIN classes c ON u.class_id = c.id
LEFT JOIN attendance a ON u.id = a.student_id AND c.id = a.class_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, c.id, c.name, c.section;

-- View: Class Attendance Report
CREATE OR REPLACE VIEW v_daily_attendance_report AS
SELECT 
    a.date,
    c.name as class_name,
    c.section,
    COUNT(DISTINCT a.student_id) as total_students,
    COUNT(DISTINCT a.student_id) FILTER (WHERE a.status = 'present') as present,
    COUNT(DISTINCT a.student_id) FILTER (WHERE a.status = 'absent') as absent,
    COUNT(DISTINCT a.student_id) FILTER (WHERE a.status = 'late') as late,
    ROUND(CAST(COUNT(DISTINCT a.student_id) FILTER (WHERE a.status = 'present') AS DECIMAL) / NULLIF(COUNT(DISTINCT a.student_id), 0) * 100, 2) as attendance_rate
FROM attendance a
JOIN classes c ON a.class_id = c.id
GROUP BY a.date, c.name, c.section
ORDER BY a.date DESC, c.name;

-- =============================================
-- CREATE FUNCTIONS FOR COMMON OPERATIONS
-- =============================================

-- Function: Get attendance percentage for a student by class
CREATE OR REPLACE FUNCTION get_student_attendance_percentage(p_student_id INTEGER)
RETURNS TABLE(
    class_id INTEGER,
    class_name VARCHAR,
    section VARCHAR,
    attendance_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.section,
        ROUND(CAST(COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late')) AS DECIMAL) / NULLIF(COUNT(a.id), 0) * 100, 2)
    FROM classes c
    JOIN users u ON u.class_id = c.id
    LEFT JOIN attendance a ON c.id = a.class_id AND a.student_id = p_student_id
    WHERE u.id = p_student_id AND u.role = 'student'
    GROUP BY c.id, c.name, c.section;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark attendance for a student
CREATE OR REPLACE FUNCTION mark_attendance(
    p_student_id INTEGER,
    p_class_id INTEGER,
    p_status VARCHAR,
    p_marked_by INTEGER,
    p_remarks TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_attendance_id INTEGER;
BEGIN
    INSERT INTO attendance (student_id, class_id, date, status, check_in_time, marked_by, remarks)
    VALUES (p_student_id, p_class_id, CURRENT_DATE, p_status, CURRENT_TIME, p_marked_by, p_remarks)
    ON CONFLICT (student_id, class_id, date) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        check_in_time = EXCLUDED.check_in_time,
        marked_by = EXCLUDED.marked_by,
        remarks = EXCLUDED.remarks
    RETURNING id INTO v_attendance_id;
    
    RETURN v_attendance_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- GRANT PERMISSIONS (Adjust as needed)
-- =============================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_user;