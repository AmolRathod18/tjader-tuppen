import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  companies:   'wms_companies',
  projects:    'wms_projects',
  employees:   'wms_employees',
  workEntries: 'wms_work_entries',
  attendance:  'wms_attendance',
  assignments: 'wms_assignments',
  auth:        'wms_auth',
};

// workStatus values: 'offline' | 'logged_in' | 'working' | 'on_break' | 'work_completed'
// activityLog: [{ action, time, note }]

const DEMO_DATA = {
  companies: [
    { id: '1', name: 'XYZ Construction AB', contact: 'Erik Lindqvist', email: 'erik@xyzab.se', phone: '+46 70 123 4567', address: 'Stockholm, Sweden', createdAt: '2026-01-10' },
    { id: '2', name: 'Nordic Steel Works', contact: 'Anna Bergström', email: 'anna@nordicsteel.se', phone: '+46 72 987 6543', address: 'Gothenburg, Sweden', createdAt: '2026-02-15' },
    { id: '3', name: 'Malmö Fabrication Ltd', contact: 'Lars Johansson', email: 'lars@malmofab.se', phone: '+46 73 456 7890', address: 'Malmö, Sweden', createdAt: '2026-03-01' },
  ],
  projects: [
    { id: '1', companyId: '1', number: 'P-1015', name: 'Factory Welding Project', location: 'Stockholm, Sweden', lat: 59.3293, lng: 18.0686, startDate: '2026-08-25', endDate: '2026-08-30', status: 'Active', allowedRadius: 200, createdAt: '2026-08-01' },
    { id: '2', companyId: '1', number: 'P-1016', name: 'Bridge Repair Works', location: 'Uppsala, Sweden', lat: 59.8586, lng: 17.6389, startDate: '2026-07-01', endDate: '2026-09-30', status: 'Active', allowedRadius: 200, createdAt: '2026-06-20' },
    { id: '3', companyId: '2', number: 'P-2001', name: 'Steel Frame Installation', location: 'Gothenburg, Sweden', lat: 57.7089, lng: 11.9746, startDate: '2026-05-01', endDate: '2026-07-31', status: 'Completed', allowedRadius: 150, createdAt: '2026-04-15' },
    { id: '4', companyId: '3', number: 'P-3008', name: 'Pipeline Maintenance', location: 'Malmö, Sweden', lat: 55.6050, lng: 13.0038, startDate: '2026-09-01', endDate: '2026-12-31', status: 'On Hold', allowedRadius: 200, createdAt: '2026-08-10' },
  ],
  employees: [
    { id: '1', name: 'Johan Eriksson', empId: 'EMP-001', role: 'Senior Welder', phone: '+46 70 111 2222', email: 'johan@email.com', status: 'Active', assignedProjectId: '1', createdAt: '2026-01-05' },
    { id: '2', name: 'Maria Svensson', empId: 'EMP-002', role: 'Welding Inspector', phone: '+46 72 333 4444', email: 'maria@email.com', status: 'Active', assignedProjectId: '1', createdAt: '2026-01-20' },
    { id: '3', name: 'Björn Andersson', empId: 'EMP-003', role: 'Pipe Welder', phone: '+46 73 555 6666', email: 'bjorn@email.com', status: 'Active', assignedProjectId: '2', createdAt: '2026-02-01' },
    { id: '4', name: 'Klara Nilsson', empId: 'EMP-004', role: 'MIG/MAG Welder', phone: '+46 70 777 8888', email: 'klara@email.com', status: 'Inactive', assignedProjectId: null, createdAt: '2026-03-10' },
  ],
  assignments: [
    { id: 'asgn1', employeeId: '1', projectId: '1', startDate: '2026-08-25', endDate: '2026-08-30', status: 'Active',   notes: 'Primary welder for section A', createdAt: '2026-08-01' },
    { id: 'asgn2', employeeId: '2', projectId: '1', startDate: '2026-08-25', endDate: '2026-08-30', status: 'Active',   notes: 'Quality inspection role',     createdAt: '2026-08-01' },
    { id: 'asgn3', employeeId: '3', projectId: '2', startDate: '2026-07-01', endDate: '2026-09-30', status: 'Active',   notes: 'Bridge repair lead',           createdAt: '2026-06-20' },
    { id: 'asgn4', employeeId: '1', projectId: '2', startDate: '2026-07-15', endDate: '2026-09-30', status: 'Active',   notes: 'Weekend support welder',       createdAt: '2026-07-10' },
  ],
  workEntries: [
    { id: '1', projectId: '1', employeeId: '1', date: '2026-08-25', hours: 8, description: 'Welding steel beams section A', notes: 'Completed 12 joints', createdAt: '2026-08-25' },
    { id: '2', projectId: '1', employeeId: '2', date: '2026-08-25', hours: 7.5, description: 'Inspection and quality check', notes: 'All joints passed', createdAt: '2026-08-25' },
    { id: '3', projectId: '2', employeeId: '3', date: '2026-08-24', hours: 9, description: 'Bridge support weld repair', notes: 'Used TIG process', createdAt: '2026-08-24' },
    { id: '4', projectId: '1', employeeId: '1', date: '2026-08-24', hours: 8, description: 'Welding steel beams section B', notes: '', createdAt: '2026-08-24' },
    { id: '5', projectId: '2', employeeId: '2', date: '2026-08-23', hours: 6, description: 'NDT inspection of welds', notes: 'Minor rework on joint 7', createdAt: '2026-08-23' },
  ],
  attendance: [
    {
      id: 'a1', employeeId: '1', projectId: '1', date: '2026-08-25',
      loginTime: '2026-08-25T07:55:00',
      checkInTime: '2026-08-25T08:02:00', checkOutTime: '2026-08-25T16:30:00',
      checkInLat: 59.3295, checkInLng: 18.0687, checkInDistance: 120,
      checkInStatus: 'verified', checkOutStatus: 'verified',
      workStatus: 'work_completed',
      workStartTime: '2026-08-25T08:05:00', breakStartTime: '2026-08-25T12:00:00',
      breakEndTime: '2026-08-25T12:30:00', workEndTime: '2026-08-25T16:28:00',
      workDescription: 'Welding steel beams section A, completed 12 joints',
      normalHours: 8, extraHours: 0,
      activityLog: [
        { action: 'login', time: '2026-08-25T07:55:00', note: 'Employee logged in' },
        { action: 'check_in', time: '2026-08-25T08:02:00', note: 'GPS check-in — verified (120m)' },
        { action: 'start_work', time: '2026-08-25T08:05:00', note: 'Work started' },
        { action: 'start_break', time: '2026-08-25T12:00:00', note: 'Break started' },
        { action: 'end_break', time: '2026-08-25T12:30:00', note: 'Break ended' },
        { action: 'end_work', time: '2026-08-25T16:28:00', note: 'Work completed' },
        { action: 'check_out', time: '2026-08-25T16:30:00', note: 'GPS check-out — verified' },
      ],
      createdAt: '2026-08-25',
    },
    {
      id: 'a2', employeeId: '2', projectId: '1', date: '2026-08-25',
      loginTime: '2026-08-25T08:10:00',
      checkInTime: null, checkOutTime: null,
      checkInLat: null, checkInLng: null, checkInDistance: null,
      checkInStatus: 'not_checked_in', checkOutStatus: null,
      workStatus: 'logged_in',
      workStartTime: null, breakStartTime: null, breakEndTime: null, workEndTime: null,
      workDescription: '', normalHours: 0, extraHours: 0,
      activityLog: [
        { action: 'login', time: '2026-08-25T08:10:00', note: 'Employee logged in' },
      ],
      createdAt: '2026-08-25',
    },
    {
      id: 'a3', employeeId: '3', projectId: '2', date: '2026-08-25',
      loginTime: null, checkInTime: null, checkOutTime: null,
      checkInLat: null, checkInLng: null, checkInDistance: null,
      checkInStatus: 'no_activity', checkOutStatus: null,
      workStatus: 'offline',
      workStartTime: null, breakStartTime: null, breakEndTime: null, workEndTime: null,
      workDescription: '', normalHours: 0, extraHours: 0,
      activityLog: [],
      createdAt: '2026-08-25',
    },
  ],
};

function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch { return defaultValue; }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function AppProvider({ children }) {
  const [authState, setAuthState] = useState(() =>
    loadFromStorage(STORAGE_KEYS.auth, { isAuthenticated: false, role: null, employeeId: null })
  );

  const [companies, setCompanies] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.companies, null);
    if (!s) { saveToStorage(STORAGE_KEYS.companies, DEMO_DATA.companies); return DEMO_DATA.companies; }
    return s;
  });
  const [projects, setProjects] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.projects, null);
    if (!s) { saveToStorage(STORAGE_KEYS.projects, DEMO_DATA.projects); return DEMO_DATA.projects; }
    return s;
  });
  const [employees, setEmployees] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.employees, null);
    if (!s) { saveToStorage(STORAGE_KEYS.employees, DEMO_DATA.employees); return DEMO_DATA.employees; }
    return s;
  });
  const [workEntries, setWorkEntries] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.workEntries, null);
    if (!s) { saveToStorage(STORAGE_KEYS.workEntries, DEMO_DATA.workEntries); return DEMO_DATA.workEntries; }
    return s;
  });
  const [attendance, setAttendance] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.attendance, null);
    if (!s) { saveToStorage(STORAGE_KEYS.attendance, DEMO_DATA.attendance); return DEMO_DATA.attendance; }
    // Migrate old records that may lack new fields
    return s.map(a => ({
      workStatus: 'offline',
      workStartTime: null,
      breakStartTime: null,
      breakEndTime: null,
      workEndTime: null,
      activityLog: [],
      ...a,
      breaks: a.breaks ?? (a.breakStartTime && a.breakEndTime
        ? [{ startTime: a.breakStartTime, endTime: a.breakEndTime }]
        : []),
    }));
  });
  const [assignments, setAssignments] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.assignments, null);
    if (!s) { saveToStorage(STORAGE_KEYS.assignments, DEMO_DATA.assignments); return DEMO_DATA.assignments; }
    return s;
  });

  useEffect(() => { saveToStorage(STORAGE_KEYS.companies,   companies);   }, [companies]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.projects,    projects);    }, [projects]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.employees,   employees);   }, [employees]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.workEntries, workEntries); }, [workEntries]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.attendance,  attendance);  }, [attendance]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.assignments, assignments); }, [assignments]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.auth,        authState);   }, [authState]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2, 6);
  const todayStr   = () => new Date().toISOString().split('T')[0];

  // ── Auth ──
  const login = (username, password, role) => {
    if (role === 'admin') {
      if ((username === 'admin' && password === 'admin123') ||
          (username === 'demo'  && password === 'demo')) {
        setAuthState({ isAuthenticated: true, role: 'admin', employeeId: null });
        return { success: true, role: 'admin' };
      }
      return { success: false };
    }
    if (role === 'employee') {
      const emp = employees.find(e =>
        (e.empId?.toLowerCase() === username.toLowerCase() ||
         e.name?.toLowerCase()  === username.toLowerCase()) &&
        e.status === 'Active'
      );
      if (emp && password === 'emp123') {
        const loginTime = new Date().toISOString();
        const today = todayStr();

        // Create or update today's attendance record with login info
        setAttendance(prev => {
          const existing = prev.find(a => a.employeeId === emp.id && a.date === today);
          if (existing) {
            // Already has a record — just update login time if missing
            if (!existing.loginTime) {
              return prev.map(a => a.id === existing.id ? {
                ...a,
                loginTime,
                workStatus: a.workStatus === 'offline' ? 'logged_in' : a.workStatus,
                activityLog: [...(a.activityLog || []), { action: 'login', time: loginTime, note: 'Employee logged in' }],
              } : a);
            }
            return prev;
          }
          // Create new record
          const projectId = getPrimaryProjectForEmployee(emp.id)?.id || null;
          const newRecord = {
            id: generateId(), employeeId: emp.id, projectId, date: today,
            loginTime, checkInTime: null, checkOutTime: null,
            checkInLat: null, checkInLng: null, checkInDistance: null,
            checkInStatus: 'not_checked_in', checkOutStatus: null,
            workStatus: 'logged_in',
            workStartTime: null, breakStartTime: null, breakEndTime: null, workEndTime: null,
            workDescription: '', normalHours: 0, extraHours: 0,
            activityLog: [{ action: 'login', time: loginTime, note: 'Employee logged in' }],
            createdAt: today,
          };
          return [...prev, newRecord];
        });

        setAuthState({ isAuthenticated: true, role: 'employee', employeeId: emp.id });
        return { success: true, role: 'employee', employee: emp };
      }
      return { success: false };
    }
    return { success: false };
  };

  const logout = () => setAuthState({ isAuthenticated: false, role: null, employeeId: null });

  // ── Companies ──
  const addCompany    = (d) => { const n = { ...d, id: generateId(), createdAt: todayStr() }; setCompanies(p => [...p, n]); return n; };
  const updateCompany = (id, d) => setCompanies(p => p.map(c => c.id === id ? { ...c, ...d } : c));
  const deleteCompany = (id) => { setCompanies(p => p.filter(c => c.id !== id)); setProjects(p => p.filter(x => x.companyId !== id)); };

  // ── Projects ──
  const addProject    = (d) => { const n = { ...d, id: generateId(), allowedRadius: d.allowedRadius || 200, createdAt: todayStr() }; setProjects(p => [...p, n]); return n; };
  const updateProject = (id, d) => setProjects(p => p.map(x => x.id === id ? { ...x, ...d } : x));
  const deleteProject = (id) => { setProjects(p => p.filter(x => x.id !== id)); setWorkEntries(p => p.filter(w => w.projectId !== id)); };

  // ── Employees ──
  const addEmployee    = (d) => { const { assignedProjectId: _legacyProjectId, ...employee } = d; const n = { ...employee, id: generateId(), createdAt: todayStr() }; setEmployees(p => [...p, n]); return n; };
  const updateEmployee = (id, d) => {
    const { assignedProjectId: _legacyProjectId, ...employee } = d;
    setEmployees(p => p.map(e => e.id === id ? { ...e, ...employee } : e));
  };
  const deleteEmployee = (id) => {
    setEmployees(p => p.filter(e => e.id !== id));
    setWorkEntries(p => p.filter(w => w.employeeId !== id));
    setAssignments(p => p.filter(a => a.employeeId !== id));
  };

  // ── Assignments ──
  const addAssignment    = (d) => { const n = { ...d, id: generateId(), createdAt: todayStr() }; setAssignments(p => [...p, n]); return n; };
  const updateAssignment = (id, d) => setAssignments(p => p.map(a => a.id === id ? { ...a, ...d } : a));
  const deleteAssignment = (id) => setAssignments(p => p.filter(a => a.id !== id));
  const getAssignmentsByEmployee = (empId) => assignments.filter(a => a.employeeId === empId);
  const getAssignmentsByProject  = (projId) => assignments.filter(a => a.projectId === projId);
  /** Check if a duplicate assignment (same employee+project) already exists, optionally excluding an id */
  const hasAssignment = (empId, projId, excludeId = null) =>
    assignments.some(a => a.employeeId === empId && a.projectId === projId && a.id !== excludeId);

  // ── Work Entries ──
  const addWorkEntry    = (d) => { const n = { ...d, id: generateId(), createdAt: todayStr() }; setWorkEntries(p => [...p, n]); return n; };
  const updateWorkEntry = (id, d) => setWorkEntries(p => p.map(w => w.id === id ? { ...w, ...d } : w));
  const deleteWorkEntry = (id) => setWorkEntries(p => p.filter(w => w.id !== id));

  // ── Attendance ──
  const getTodayAttendance = (employeeId, date) =>
    attendance.find(a => a.employeeId === employeeId && a.date === date) || null;

  const createAttendanceRecord = (employeeId, projectId, date, loginTime) => {
    const existing = getTodayAttendance(employeeId, date);
    if (existing) return existing;
    const n = {
      id: generateId(), employeeId, projectId, date,
      loginTime, checkInTime: null, checkOutTime: null,
      checkInLat: null, checkInLng: null, checkInDistance: null,
      checkInStatus: 'not_checked_in', checkOutStatus: null,
      workStatus: loginTime ? 'logged_in' : 'offline',
      workStartTime: null, breakStartTime: null, breakEndTime: null, workEndTime: null,
      breaks: [],
      workDescription: '', normalHours: 0, extraHours: 0,
      activityLog: loginTime ? [{ action: 'login', time: loginTime, note: 'Employee logged in' }] : [],
      createdAt: todayStr(),
    };
    setAttendance(p => [...p, n]);
    return n;
  };

  const checkIn = (attendanceId, { lat, lng, distance, status }) => {
    const time = new Date().toISOString();
    const record = attendance.find(a => a.id === attendanceId);
    if (!record || record.checkInTime || record.workStatus !== 'logged_in') {
      return { success: false, error: 'Check-in is not available for this work session.' };
    }
    setAttendance(p => p.map(a => a.id === attendanceId ? {
      ...a,
      checkInTime: time,
      checkInLat: lat, checkInLng: lng,
      checkInDistance: distance,
      checkInStatus: status,
      activityLog: [...(a.activityLog || []), {
        action: 'check_in',
        time,
        note: `GPS check-in — ${status === 'verified' ? `verified (${distance}m)` : `flagged (${distance}m from site)`}`,
      }],
    } : a));
    return { success: true };
  };

  const checkOut = (attendanceId, { lat, lng, distance, status }) => {
    const time = new Date().toISOString();
    const record = attendance.find(a => a.id === attendanceId);
    if (!record?.checkInTime || record.checkOutTime || record.workStatus !== 'work_completed') {
      return { success: false, error: 'End work before checking out.' };
    }
    setAttendance(p => p.map(a => a.id === attendanceId ? {
      ...a,
      checkOutTime: time,
      checkOutLat: lat, checkOutLng: lng,
      checkOutDistance: distance,
      checkOutStatus: status,
      activityLog: [...(a.activityLog || []), {
        action: 'check_out',
        time,
        note: `GPS check-out — ${status === 'verified' ? 'verified' : 'flagged'}`,
      }],
    } : a));
    return { success: true };
  };

  const saveWorkDetails = (attendanceId, { workDescription }) => {
    setAttendance(p => p.map(a => a.id === attendanceId ? {
      ...a, workDescription,
    } : a));
  };

  // ── Work Lifecycle Actions ──

  const startWork = (attendanceId) => {
    const time = new Date().toISOString();
    const record = attendance.find(a => a.id === attendanceId);
    if (!record?.checkInTime || record.workStatus !== 'logged_in') {
      return { success: false, error: 'GPS check-in is required before starting work.' };
    }
    setAttendance(p => p.map(a => a.id === attendanceId ? {
      ...a,
      workStartTime: a.workStartTime || time,  // don't overwrite if already set
      workStatus: 'working',
      activityLog: [...(a.activityLog || []), { action: 'start_work', time, note: 'Work started' }],
    } : a));
    return { success: true };
  };

  const startBreak = (attendanceId) => {
    const time = new Date().toISOString();
    const record = attendance.find(a => a.id === attendanceId);
    if (record?.workStatus !== 'working') return { success: false, error: 'Start work before starting a break.' };
    setAttendance(p => p.map(a => a.id === attendanceId ? {
      ...a,
      breakStartTime: time,
      breakEndTime: null,  // reset if multiple breaks (track last)
      breaks: [...(a.breaks || []), { startTime: time, endTime: null }],
      workStatus: 'on_break',
      activityLog: [...(a.activityLog || []), { action: 'start_break', time, note: 'Break started' }],
    } : a));
    return { success: true };
  };

  const endBreak = (attendanceId) => {
    const time = new Date().toISOString();
    const record = attendance.find(a => a.id === attendanceId);
    if (record?.workStatus !== 'on_break') return { success: false, error: 'There is no active break to end.' };
    setAttendance(p => p.map(a => a.id === attendanceId ? {
      ...a,
      breakEndTime: time,
      breaks: (a.breaks || []).map((b, index, all) => index === all.length - 1 && !b.endTime ? { ...b, endTime: time } : b),
      workStatus: 'working',
      activityLog: [...(a.activityLog || []), { action: 'end_break', time, note: 'Break ended, resumed work' }],
    } : a));
    return { success: true };
  };

  const endWork = (attendanceId, { workDescription }) => {
    const time = new Date().toISOString();
    const record = attendance.find(a => a.id === attendanceId);
    if (record?.workStatus !== 'working' || !record.workStartTime) {
      return { success: false, error: 'Resume work before ending the session.' };
    }
    const breakMinutes = (record.breaks || []).reduce((total, b) => {
      if (!b.startTime || !b.endTime) return total;
      return total + Math.max(0, Math.round((new Date(b.endTime) - new Date(b.startTime)) / 60000));
    }, 0);
    const workedMinutes = Math.max(0, Math.round((new Date(time) - new Date(record.workStartTime)) / 60000) - breakMinutes);
    const normalHours = Math.min(workedMinutes, 8 * 60) / 60;
    const extraHours = Math.max(0, workedMinutes - 8 * 60) / 60;
    setAttendance(p => p.map(a => a.id === attendanceId ? {
      ...a,
      workEndTime: time,
      workStatus: 'work_completed',
      workDescription: workDescription || a.workDescription,
      normalHours,
      extraHours,
      activityLog: [...(a.activityLog || []), { action: 'end_work', time, note: 'Work ended — session completed' }],
    } : a));
    return { success: true, workedMinutes, normalHours, extraHours };
  };

  // ── Status helpers ──

  /**
   * Returns the current workStatus for an employee today.
   * Returns 'offline' if no record for today.
   */
  const getEmployeeCurrentStatus = (employeeId) => {
    const today = todayStr();
    const rec = attendance.find(a => a.employeeId === employeeId && a.date === today);
    return rec?.workStatus || 'offline';
  };

  /**
   * Returns today's attendance record for an employee or null.
   */
  const getEmployeeTodayRecord = (employeeId) => {
    const today = todayStr();
    return attendance.find(a => a.employeeId === employeeId && a.date === today) || null;
  };

  const updateAttendance = (id, d) => setAttendance(p => p.map(a => a.id === id ? { ...a, ...d } : a));
  const deleteAttendance = (id) => setAttendance(p => p.filter(a => a.id !== id));

  // ── Helpers ──
  const getCompanyById  = (id) => companies.find(c => c.id === id);
  const getProjectById  = (id) => projects.find(p => p.id === id);
  const getEmployeeById = (id) => employees.find(e => e.id === id);
  const getProjectsByCompany = (cid) => projects.filter(p => p.companyId === cid);
  const getWorkEntriesByProject = (pid) => workEntries.filter(w => w.projectId === pid);
  const getTotalHours   = (entries) => entries.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);
  const getAttendanceByDate = (date) => attendance.filter(a => a.date === date);
  const getAttendanceByEmployee = (empId) => attendance.filter(a => a.employeeId === empId);
  /** Active assignments on a date are the source of truth for employee projects. */
  const getEmployeeActiveAssignments = (empId, date = todayStr()) =>
    assignments
      .filter(a => a.employeeId === empId && a.status === 'Active' && a.startDate <= date && a.endDate >= date)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const getEmployeeActiveProjectIds = (empId, date) =>
    getEmployeeActiveAssignments(empId, date).map(a => a.projectId);
  const getPrimaryProjectForEmployee = (empId, date) => {
    const projectId = getEmployeeActiveProjectIds(empId, date)[0];
    return projectId ? projects.find(p => p.id === projectId) : null;
  };

  return (
    <AppContext.Provider value={{
      // auth
      isAuthenticated: authState.isAuthenticated,
      userRole: authState.role,
      loggedInEmployeeId: authState.employeeId,
      login, logout,
      // companies
      companies, addCompany, updateCompany, deleteCompany,
      // projects
      projects, addProject, updateProject, deleteProject,
      // employees
      employees, addEmployee, updateEmployee, deleteEmployee,
      // work entries
      workEntries, addWorkEntry, updateWorkEntry, deleteWorkEntry,
      // attendance
      attendance, getTodayAttendance, createAttendanceRecord,
      checkIn, checkOut, saveWorkDetails,
      startWork, startBreak, endBreak, endWork,
      getEmployeeCurrentStatus, getEmployeeTodayRecord,
      updateAttendance, deleteAttendance,
      getAttendanceByDate, getAttendanceByEmployee,
      // assignments
      assignments, addAssignment, updateAssignment, deleteAssignment,
      getAssignmentsByEmployee, getAssignmentsByProject, hasAssignment,
      getEmployeeActiveAssignments, getEmployeeActiveProjectIds, getPrimaryProjectForEmployee,
      // helpers
      getCompanyById, getProjectById, getEmployeeById,
      getProjectsByCompany, getWorkEntriesByProject, getTotalHours,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
