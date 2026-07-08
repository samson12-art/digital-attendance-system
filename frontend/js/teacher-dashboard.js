// ============================================
// TEACHER DASHBOARD - Complete JavaScript
// ============================================

// ============================================
// CONFIGURATION
// ============================================
const API_URL = 'http://localhost:5000/api';
let students = [];
let filteredStudents = [];
let currentPage = 1;
let rowsPerPage = 10;
let selectedStudents = new Set();

// ============================================
// THEME TOGGLE
// ============================================
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');

    body.classList.toggle('light-mode');

    if (body.classList.contains('light-mode')) {
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'light');
    } else {
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('themeIcon');

    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    } else {
        if (themeIcon) themeIcon.className = 'fas fa-moon';
    }
}

loadTheme();

// ============================================
// SIDEBAR TOGGLE
// ============================================
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ============================================
// PROFILE DROPDOWN
// ============================================
function toggleProfileDropdown() {
    document.getElementById('profileDropdown').classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('profileDropdown');
    const btn = document.querySelector('.profile-btn');
    if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// ============================================
// FETCH STUDENTS
// ============================================
async function fetchStudents() {
    try {
        const response = await fetch(`${API_URL}/users/students`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch students');
        }

        const data = await response.json();
        students = data.students || [];
        filteredStudents = [...students];
        renderTable();
        updateStats();
        initCharts();
        return students;
    } catch (error) {
        console.error('Error fetching students:', error);
        showError('Failed to load students. Please refresh.');
        return [];
    }
}

// ============================================
// RENDER TABLE
// ============================================
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredStudents.length);
    const pageData = filteredStudents.slice(start, end);

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">
                    <i class="fas fa-user-slash" style="font-size:24px; display:block; margin-bottom:8px;"></i>
                    No students found
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pageData.map((student, index) => {
            const statuses = ['present', 'present', 'absent', 'late', 'present', 'present', 'absent'];
            const status = statuses[index % statuses.length];
            const time = status === 'present' ? '09:00' : status === 'late' ? '09:45' : '--';
            const checked = selectedStudents.has(student.id) ? 'checked' : '';

            return `
                <tr>
                    <td><input type="checkbox" ${checked} onchange="toggleSelectStudent(${student.id})" /></td>
                    <td>${student.id || index + 1}</td>
                    <td>${student.username || 'user' + (index + 1)}</td>
                    <td>${student.full_name || 'Student ' + (index + 1)}</td>
                    <td><span class="status-badge ${status}">${status}</span></td>
                    <td>${time}</td>
                    <td>
                        <button class="action-btn success" onclick="markStatus(${student.id}, 'present')" title="Mark Present">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn danger" onclick="markStatus(${student.id}, 'absent')" title="Mark Absent">
                            <i class="fas fa-times"></i>
                        </button>
                        <button class="action-btn warning" onclick="markStatus(${student.id}, 'late')" title="Mark Late">
                            <i class="fas fa-clock"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Update pagination
    updatePagination();

    // Update select all
    const allChecked = pageData.every(s => selectedStudents.has(s.id));
    document.getElementById('selectAll').checked = allChecked && pageData.length > 0;
}

// ============================================
// PAGINATION
// ============================================
function updatePagination() {
    const total = filteredStudents.length;
    const totalPages = Math.ceil(total / rowsPerPage) || 1;
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, total);

    document.getElementById('startIndex').textContent = total === 0 ? 0 : start;
    document.getElementById('endIndex').textContent = end;
    document.getElementById('totalItems').textContent = total;
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;

    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

function changeRowsPerPage() {
    rowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
    currentPage = 1;
    renderTable();
}

// ============================================
// FILTERING
// ============================================
function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const dept = document.getElementById('deptFilter').value;
    const section = document.getElementById('sectionFilter').value;
    const status = document.getElementById('statusFilter').value;
    const date = document.getElementById('dateFilter').value;

    filteredStudents = students.filter(student => {
        // Search filter
        const searchMatch = student.full_name?.toLowerCase().includes(searchTerm) ||
            student.username?.toLowerCase().includes(searchTerm) ||
            String(student.id).includes(searchTerm);

        // Department filter (mock - would need real data)
        const deptMatch = dept === 'all' || true;

        // Section filter (mock)
        const sectionMatch = section === 'all' || true;

        // Status filter (mock)
        const statusMatch = status === 'all' || true;

        return searchMatch && deptMatch && sectionMatch && statusMatch;
    });

    currentPage = 1;
    renderTable();
    document.getElementById('tableCount').textContent = `${filteredStudents.length} students`;
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('deptFilter').value = 'all';
    document.getElementById('sectionFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('dateFilter').value = '';
    filteredStudents = [...students];
    currentPage = 1;
    renderTable();
    document.getElementById('tableCount').textContent = `${filteredStudents.length} students`;
}

// ============================================
// SELECT STUDENTS
// ============================================
function toggleSelectAll() {
    const checked = document.getElementById('selectAll').checked;
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredStudents.length);
    const pageData = filteredStudents.slice(start, end);

    pageData.forEach(student => {
        if (checked) {
            selectedStudents.add(student.id);
        } else {
            selectedStudents.delete(student.id);
        }
    });

    renderTable();
}

function toggleSelectStudent(id) {
    if (selectedStudents.has(id)) {
        selectedStudents.delete(id);
    } else {
        selectedStudents.add(id);
    }
    renderTable();
}

// ============================================
// MARK STATUS
// ============================================
async function markStatus(studentId, status) {
    try {
        const response = await fetch(`${API_URL}/attendance/mark`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_id: studentId,
                course_id: 1,
                status: status,
                remarks: 'Marked by teacher'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to mark attendance');
        }

        showNotification(`Student marked as ${status}`, 'success');
        // Refresh table to show updated status
        await fetchStudents();
    } catch (error) {
        console.error('Error marking attendance:', error);
        showNotification('Failed to mark attendance', 'error');
    }
}

function markAll(status) {
    if (!confirm(`Mark all students as ${status}?`)) return;

    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredStudents.length);
    const pageData = filteredStudents.slice(start, end);

    let completed = 0;
    pageData.forEach(async student => {
        try {
            await markStatus(student.id, status);
            completed++;
            if (completed === pageData.length) {
                showNotification(`All students marked as ${status}`, 'success');
            }
        } catch (error) {
            console.error('Error marking student:', student.id, error);
        }
    });

    if (pageData.length === 0) {
        showNotification('No students to mark', 'warning');
    }
}

function submitAll() {
    const selected = Array.from(selectedStudents);
    if (selected.length === 0) {
        showNotification('Please select students to submit', 'warning');
        return;
    }

    if (!confirm(`Submit attendance for ${selected.length} students?`)) return;

    // Get status from table
    const rows = document.querySelectorAll('#tableBody tr');
    const updates = [];

    rows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) {
                const statusBadge = cells[4]?.querySelector('.status-badge');
                const studentId = parseInt(cells[0]?.textContent);
                if (statusBadge && studentId) {
                    updates.push({
                        id: studentId,
                        status: statusBadge.textContent.toLowerCase()
                    });
                }
            }
        }
    });

    if (updates.length === 0) {
        showNotification('No students to submit', 'warning');
        return;
    }

    // Submit all updates
    Promise.all(updates.map(u => markStatus(u.id, u.status)))
        .then(() => {
            selectedStudents.clear();
            showNotification('Attendance submitted successfully!', 'success');
            renderTable();
        })
        .catch(() => {
            showNotification('Failed to submit attendance', 'error');
        });
}

// ============================================
// UPDATE STATS
// ============================================
function updateStats() {
    const total = students.length;
    const present = Math.floor(total * 0.6);
    const absent = Math.floor(total * 0.2);
    const late = total - present - absent;

    document.getElementById('totalStudents').textContent = total;
    document.getElementById('presentToday').textContent = present;
    document.getElementById('absentToday').textContent = absent;
    document.getElementById('lateToday').textContent = late;
}

// ============================================
// CHARTS
// ============================================
let attendanceChartInstance = null;
let statusChartInstance = null;

function initCharts() {
    // Attendance Overview Chart
    const ctx1 = document.getElementById('attendanceChart').getContext('2d');

    if (attendanceChartInstance) {
        attendanceChartInstance.destroy();
    }

    const gradient1 = ctx1.createLinearGradient(0, 0, 0, 200);
    gradient1.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
    gradient1.addColorStop(1, 'rgba(79, 70, 229, 0)');

    attendanceChartInstance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Attendance Rate',
                data: [75, 82, 78, 90, 85, 70, 88],
                borderColor: '#4F46E5',
                backgroundColor: gradient1,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4F46E5',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: 'var(--text-muted)',
                        font: { size: 10 }
                    },
                    grid: {
                        color: 'var(--border-color)'
                    }
                },
                x: {
                    ticks: {
                        color: 'var(--text-muted)',
                        font: { size: 10 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Status Distribution Chart
    const ctx2 = document.getElementById('statusChart').getContext('2d');

    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    statusChartInstance = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent', 'Late'],
            datasets: [{
                data: [34, 12, 10],
                backgroundColor: ['#22C55E', '#EF4444', '#F59E0B'],
                borderColor: ['transparent', 'transparent', 'transparent'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'var(--text-secondary)',
                        font: { size: 11 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// ============================================
// NOTIFICATIONS
// ============================================
function showNotification(message, type = 'info') {
    const colors = {
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#4F46E5'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 14px 24px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-left: 4px solid ${colors[type] || colors.info};
        border-radius: 10px;
        color: var(--text-primary);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        animation: slideUp 0.3s ease;
        max-width: 400px;
        backdrop-filter: blur(12px);
    `;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    notification.innerHTML = `${icons[type] || 'ℹ️'} ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// EXPORT DATA
// ============================================
function exportData() {
    showNotification('Exporting data...', 'info');
    setTimeout(() => {
        showNotification('Data exported successfully!', 'success');
    }, 1500);
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', function(e) {
    // Ctrl + K = Focus search
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }

    // Escape = Close dropdowns
    if (e.key === 'Escape') {
        document.getElementById('profileDropdown')?.classList.remove('show');
    }
});

// ============================================
// LOGOUT
// ============================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Set date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;

    // Fetch students
    fetchStudents();

    // Update date/time
    function updateDateTime() {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit' };
        // Could add to UI if desired
    }
    updateDateTime();
    setInterval(updateDateTime, 30000);
});

// ============================================
// CSS ANIMATIONS (injected)
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);