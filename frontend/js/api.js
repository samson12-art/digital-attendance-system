// =============================================
// DIGITAL ATTENDANCE SYSTEM - API Client
// =============================================

const API_URL = 'http://localhost:5001/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Generic fetch function
const apiFetch = async (endpoint, options = {}) => {
    const token = getToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// =============================================
// AUTH API
// =============================================
export const auth = {
    login: (username, password) => 
        apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        }),
    
    register: (userData) => 
        apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
    
    getMe: () => 
        apiFetch('/auth/me'),
    
    getDashboardStats: () =>
        apiFetch('/auth/dashboard-stats')
};

// =============================================
// ATTENDANCE API
// =============================================
export const attendance = {
    mark: (data) => 
        apiFetch('/attendance/mark', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    getByStudent: (studentId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/attendance/student/${studentId}${query ? '?' + query : ''}`);
    },
    
    getStats: (studentId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/attendance/stats/${studentId}${query ? '?' + query : ''}`);
    },
    
    getByCourse: (courseId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/attendance/course/${courseId}${query ? '?' + query : ''}`);
    },
    
    update: (id, data) => 
        apiFetch(`/attendance/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    
    getSummary: (studentId) =>
        apiFetch(`/attendance/summary/${studentId}`),
    
    getCourseSummary: (courseId) =>
        apiFetch(`/attendance/course-summary/${courseId}`),
    
    getDailyReport: (date) => {
        const query = date ? `?date=${date}` : '';
        return apiFetch(`/attendance/daily-report${query}`);
    },
    
    getSchedule: (courseId) =>
        apiFetch(`/attendance/schedule/${courseId}`),
    
    getSections: () =>
        apiFetch('/attendance/sections')
};

// =============================================
// USER API
// =============================================
export const users = {
    getAll: () => 
        apiFetch('/users/all'),
    
    getStudents: () => 
        apiFetch('/users/students'),
    
    getTeachers: () => 
        apiFetch('/users/teachers'),
    
    get: (id) => 
        apiFetch(`/users/${id}`),
    
    update: (id, data) => 
        apiFetch(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    
    delete: (id) => 
        apiFetch(`/users/${id}`, {
            method: 'DELETE'
        }),
    
    // Section Management
    getSections: () =>
        apiFetch('/users/sections'),
    
    // Course Management
    getCourses: () => 
        apiFetch('/users/courses'),
    
    createCourse: (data) => 
        apiFetch('/users/courses', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    updateCourse: (id, data) =>
        apiFetch(`/users/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    
    deleteCourse: (id) =>
        apiFetch(`/users/courses/${id}`, {
            method: 'DELETE'
        }),
    
    getCourseSchedule: (courseId) =>
        apiFetch(`/users/courses/${courseId}/schedule`),
    
    // Enrollment
    enroll: (studentId, courseId) => 
        apiFetch('/users/enroll', {
            method: 'POST',
            body: JSON.stringify({ studentId, courseId })
        }),
    
    getStudentCourses: (studentId) => 
        apiFetch(`/users/${studentId}/courses`),
    
    getCourseStudents: (courseId) => 
        apiFetch(`/users/course/${courseId}/students`),
    
    getAvailableCourses: (studentId) =>
        apiFetch(`/users/${studentId}/available-courses`)
};

// =============================================
// HELPER FUNCTIONS
// =============================================

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

export const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || null;
};

export const getUser = () => {
    return JSON.parse(localStorage.getItem('user') || '{}');
};

export const getUserName = () => {
    const user = getUser();
    return user.full_name || user.username || 'User';
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/frontend/login.html';
};

export const login = async (username, password) => {
    try {
        const response = await auth.login(username, password);
        if (response.success) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            // Redirect based on role
            switch(response.user.role) {
                case 'admin':
                    window.location.href = '/frontend/Admin/admin-dashboard.html';
                    break;
                case 'teacher':
                    window.location.href = '/frontend/Teacher/teacher-dashboard.html';
                    break;
                case 'student':
                    window.location.href = '/frontend/Student/student-dashboard.html';
                    break;
                default:
                    window.location.href = '/frontend/login.html';
            }
            return { success: true };
        }
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Check auth on page load
export const checkAuth = () => {
    if (!isAuthenticated()) {
        window.location.href = '/frontend/login.html';
        return false;
    }
    return true;
};

// Check role access
export const requireRole = (roles) => {
    if (!isAuthenticated()) {
        window.location.href = '/frontend/login.html';
        return false;
    }
    
    const userRole = getUserRole();
    if (!roles.includes(userRole)) {
        window.location.href = '/frontend/unauthorized.html';
        return false;
    }
    return true;
};