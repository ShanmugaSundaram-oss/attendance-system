/* ===================================
   SMART ATTENDANCE IMS — Shared Utilities
   =================================== */

// ---- API Configuration ----
const API_BASE = '/api';

// ---- API Wrapper ----
const API = {
    async request(endpoint, options = {}) {
        const token = Auth.getToken();
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            ...options
        };

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, config);
            const data = await res.json();
            if (!res.ok) throw { status: res.status, ...data };
            return data;
        } catch (err) {
            if (err.status === 401) {
                console.warn('Auth expired — falling back to localStorage');
            }
            throw err;
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
    },

    put(endpoint, body) {
        return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// ---- Auth State ----
const Auth = {
    getToken() { return localStorage.getItem('auth_token'); },
    getUser() {
        const u = localStorage.getItem('auth_user');
        return u ? JSON.parse(u) : null;
    },
    getUserType() { return localStorage.getItem('auth_user_type'); },

    login(token, user, userType) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_user_type', userType);
    },

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_user_type');
        window.location.href = '/';
    },

    isLoggedIn() {
        return !!this.getToken() || !!this.getUser();
    },

    requireAuth(allowedRoles) {
        const user = this.getUser();
        const type = this.getUserType();
        if (!user && !type) { window.location.href = '/'; return false; }
        if (allowedRoles && !allowedRoles.includes(type)) { window.location.href = '/'; return false; }
        return true;
    },

    // Try real API login first, fallback to mock
    async attemptLogin(username, password, role) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success && data.token) {
                this.login(data.token, data.user, data.user?.role || role);
                return { success: true, message: 'Login successful', source: 'api' };
            }
            // API returned an error — try mock
            return this.mockLogin(username, password, role);
        } catch (err) {
            // API unreachable — try mock
            return this.mockLogin(username, password, role);
        }
    },

    mockLogin(username, password, role) {
        const roleMap = { student: 'students', teacher: 'teachers', admin: 'teachers', transport: 'transport' };
        const mockDB = MockUsers[roleMap[role]];
        if (mockDB && mockDB[username] === password) {
            this.login('mock-token', { username, firstName: username }, role);
            return { success: true, message: 'Welcome (offline mode)', source: 'mock' };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    // Try real API register
    async attemptRegister(data) {
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            return result;
        } catch (err) {
            return { success: false, message: 'Server unavailable. Please try again later.' };
        }
    },

    // Firebase Auth login
    async firebaseLogin(idToken, userType) {
        try {
            const res = await fetch(`${API_BASE}/auth/firebase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, userType })
            });
            const data = await res.json();
            if (data.success && data.token) {
                this.login(data.token, data.user, data.user?.role || userType);
                return { success: true, user: data.user };
            }
            return { success: false, message: data.message || 'Firebase login failed' };
        } catch (err) {
            return { success: false, message: 'Server unavailable for Firebase login' };
        }
    }
};

// ---- Local Attendance Data (localStorage fallback) ----
const LocalData = {
    _key: 'attendanceData',

    get() {
        const saved = localStorage.getItem(this._key);
        return saved ? JSON.parse(saved) : {
            students: {},
            attendanceRecords: [],
            announcements: [],
            timetables: {},
            grades: {},
            currentUser: null,
            currentUserType: null
        };
    },

    save(data) {
        localStorage.setItem(this._key, JSON.stringify(data));
    },

    addStudent(username, descriptor) {
        const data = this.get();
        data.students[username] = {
            descriptor: descriptor,
            registeredAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        this.save(data);
    },

    markAttendance(username) {
        const data = this.get();
        const now = new Date();
        const today = now.toDateString();

        const alreadyMarked = data.attendanceRecords.some(r =>
            r.username === username && new Date(r.timestamp).toDateString() === today
        );

        if (alreadyMarked) return { success: false, message: `${username} already marked today` };

        data.attendanceRecords.push({
            username,
            timestamp: now.toISOString(),
            date: today,
            time: now.toLocaleTimeString()
        });
        this.save(data);
        return { success: true, message: `Attendance marked for ${username}` };
    },

    getStudentRecords(username) {
        const data = this.get();
        return data.attendanceRecords.filter(r => r.username === username);
    },

    getAllRecords() {
        return this.get().attendanceRecords;
    },

    getRegisteredStudents() {
        return this.get().students;
    },

    getTodayRecords() {
        const today = new Date().toDateString();
        return this.get().attendanceRecords.filter(r =>
            new Date(r.timestamp).toDateString() === today
        );
    },

    // ---- Announcements (localStorage) ----
    addAnnouncement(ann) {
        const data = this.get();
        data.announcements = data.announcements || [];
        ann.id = Date.now().toString();
        ann.createdAt = new Date().toISOString();
        data.announcements.unshift(ann);
        this.save(data);
        return ann;
    },

    getAnnouncements() {
        const data = this.get();
        return data.announcements || [];
    },

    deleteAnnouncement(id) {
        const data = this.get();
        data.announcements = (data.announcements || []).filter(a => a.id !== id);
        this.save(data);
    },

    // ---- Timetable (localStorage) ----
    saveTimetable(className, schedule) {
        const data = this.get();
        data.timetables = data.timetables || {};
        data.timetables[className] = {
            schedule,
            updatedAt: new Date().toISOString()
        };
        this.save(data);
    },

    getTimetable(className) {
        const data = this.get();
        return data.timetables?.[className] || null;
    },

    getAllTimetables() {
        const data = this.get();
        return data.timetables || {};
    },

    // ---- Grades (localStorage) ----
    addGrade(gradeEntry) {
        const data = this.get();
        data.grades = data.grades || {};
        const key = `${gradeEntry.studentName}_${gradeEntry.subject}_${gradeEntry.semester}`;
        gradeEntry.id = key;
        gradeEntry.createdAt = new Date().toISOString();

        // Auto calculate grade
        const pct = (gradeEntry.marks.total / gradeEntry.marks.maxMarks) * 100;
        if (pct >= 90) gradeEntry.grade = 'O';
        else if (pct >= 80) gradeEntry.grade = 'A+';
        else if (pct >= 70) gradeEntry.grade = 'A';
        else if (pct >= 60) gradeEntry.grade = 'B+';
        else if (pct >= 50) gradeEntry.grade = 'B';
        else if (pct >= 40) gradeEntry.grade = 'C';
        else if (pct >= 33) gradeEntry.grade = 'D';
        else gradeEntry.grade = 'F';

        data.grades[key] = gradeEntry;
        this.save(data);
        return gradeEntry;
    },

    getGradesByStudent(studentName) {
        const data = this.get();
        return Object.values(data.grades || {}).filter(g => g.studentName === studentName);
    },

    getAllGrades() {
        const data = this.get();
        return Object.values(data.grades || {});
    },

    deleteGrade(id) {
        const data = this.get();
        delete data.grades[id];
        this.save(data);
    },

    // ---- Bus Routes (API-backed with localStorage fallback) ----
    _busKey: 'ims_bus_routes',
    _busNoticeKey: 'ims_bus_notices',

    getBusRoutes() {
        return JSON.parse(localStorage.getItem(this._busKey) || '[]');
    },
    saveBusRoutes(routes) {
        localStorage.setItem(this._busKey, JSON.stringify(routes));
    },
    async addBusRoute(route) {
        // Try API first
        try {
            const token = Auth.getToken();
            const res = await fetch(`${API_BASE}/transport/routes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(route)
            });
            const data = await res.json();
            if (data.success) {
                const saved = data.route;
                saved.id = saved._id || saved.id;
                const routes = this.getBusRoutes();
                routes.push(saved);
                this.saveBusRoutes(routes);
                return saved;
            }
        } catch (e) { console.log('API unavailable, using localStorage'); }
        // Fallback to localStorage
        const routes = this.getBusRoutes();
        route.id = Date.now().toString();
        route.createdAt = new Date().toISOString();
        routes.push(route);
        this.saveBusRoutes(routes);
        return route;
    },
    async updateBusRoute(id, updates) {
        try {
            const token = Auth.getToken();
            await fetch(`${API_BASE}/transport/routes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updates)
            });
        } catch (e) { /* fallback */ }
        const routes = this.getBusRoutes();
        const idx = routes.findIndex(r => (r.id || r._id) === id);
        if (idx !== -1) { Object.assign(routes[idx], updates); this.saveBusRoutes(routes); }
    },
    async deleteBusRoute(id) {
        try {
            const token = Auth.getToken();
            await fetch(`${API_BASE}/transport/routes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) { /* fallback */ }
        this.saveBusRoutes(this.getBusRoutes().filter(r => (r.id || r._id) !== id));
    },

    // ---- Bus Notices (API-backed with localStorage fallback) ----
    getBusNotices() {
        return JSON.parse(localStorage.getItem(this._busNoticeKey) || '[]');
    },
    async addBusNotice(notice) {
        try {
            const token = Auth.getToken();
            const res = await fetch(`${API_BASE}/transport/notices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(notice)
            });
            const data = await res.json();
            if (data.success) {
                const saved = data.notice;
                saved.id = saved._id || saved.id;
                const notices = this.getBusNotices();
                notices.unshift(saved);
                localStorage.setItem(this._busNoticeKey, JSON.stringify(notices));
                return saved;
            }
        } catch (e) { console.log('API unavailable, using localStorage'); }
        const notices = this.getBusNotices();
        notice.id = Date.now().toString();
        notice.createdAt = new Date().toISOString();
        notices.unshift(notice);
        localStorage.setItem(this._busNoticeKey, JSON.stringify(notices));
        return notice;
    },
    async deleteBusNotice(id) {
        try {
            const token = Auth.getToken();
            await fetch(`${API_BASE}/transport/notices/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) { /* fallback */ }
        const notices = this.getBusNotices().filter(n => (n.id || n._id) !== id);
        localStorage.setItem(this._busNoticeKey, JSON.stringify(notices));
    }
};

// ---- Database Sync (pull from API on page load) ----
const DbSync = {
    async syncBusRoutes() {
        try {
            const res = await fetch(`${API_BASE}/transport/routes`);
            const data = await res.json();
            if (data.success && data.routes) {
                const routes = data.routes.map(r => ({ ...r, id: r._id || r.id }));
                localStorage.setItem(LocalData._busKey, JSON.stringify(routes));
                return routes;
            }
        } catch (e) { /* offline — use cached localStorage */ }
        return null;
    },
    async syncBusNotices() {
        try {
            const res = await fetch(`${API_BASE}/transport/notices`);
            const data = await res.json();
            if (data.success && data.notices) {
                const notices = data.notices.map(n => ({ ...n, id: n._id || n.id }));
                localStorage.setItem(LocalData._busNoticeKey, JSON.stringify(notices));
                return notices;
            }
        } catch (e) { /* offline */ }
        return null;
    },
    async syncAll() {
        await Promise.all([this.syncBusRoutes(), this.syncBusNotices()]);
    }
};

// Auto-sync on page load
document.addEventListener('DOMContentLoaded', () => DbSync.syncAll());

// ---- Mock Users (fallback when backend is down) ----
const MockUsers = {
    students: { 'student1': 'student1', 'student2': 'student2', 'student3': 'student3' },
    teachers: { 'teacher1': 'teacher1', 'admin': 'admin123' },
    transport: { 'transport1': 'transport1' }
};

// ---- Toast Notifications ----
const Toast = {
    _container: null,

    _getContainer() {
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.className = 'toast-container';
            document.body.appendChild(this._container);
        }
        return this._container;
    },

    show(message, type = 'info') {
        const container = this._getContainer();
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
};

// ---- Clock ----
function startClock(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const update = () => {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    update();
    setInterval(update, 1000);
}

// ---- Sidebar Toggle (mobile) ----
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.mobile-toggle');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// ---- Section Navigation (sidebar tabs) ----
function initSectionNav() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.dataset.section;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
            const target = document.getElementById(sectionId);
            if (target) target.classList.add('active');
        });
    });
}

// ---- Populate User Info in Sidebar ----
function populateSidebarUser() {
    const user = Auth.getUser();
    const type = Auth.getUserType();
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-avatar');

    if (user && nameEl) {
        const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.username || type);
        nameEl.textContent = displayName;
    }
    if (roleEl) roleEl.textContent = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'User';
    if (avatarEl) {
        const initial = (user?.firstName?.[0] || user?.username?.[0] || type?.[0] || 'U').toUpperCase();
        avatarEl.textContent = initial;
    }
}

// ---- Face API Model Loader ----
const FaceModels = {
    loaded: false,
    loading: false,

    async load() {
        if (this.loaded) return true;
        this.loading = true;

        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            this.loaded = true;
            this.loading = false;
            return true;
        } catch (err) {
            console.warn('Local models failed, trying CDN...', err);
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
                ]);
                this.loaded = true;
                this.loading = false;
                return true;
            } catch (cdnErr) {
                console.error('All model loading failed:', cdnErr);
                this.loading = false;
                return false;
            }
        }
    }
};

// ---- Utility: Format Date ----
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr) {
    return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ---- Init Common ----
function initCommon() {
    startClock('topbar-time');
    initSidebar();
    initSectionNav();
    populateSidebarUser();
}
