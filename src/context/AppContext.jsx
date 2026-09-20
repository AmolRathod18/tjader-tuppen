import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  companies:   'wms_companies',
  projects:    'wms_projects',
  employees:   'wms_employees',
  workEntries: 'wms_work_entries',
  auth:        'wms_auth',
};

const DEMO_DATA = {
  companies: [
    { id: '1', name: 'XYZ Construction AB', contact: 'Erik Lindqvist', email: 'erik@xyzab.se', phone: '+46 70 123 4567', address: 'Stockholm, Sweden', createdAt: '2026-01-10' },
    { id: '2', name: 'Nordic Steel Works', contact: 'Anna Bergström', email: 'anna@nordicsteel.se', phone: '+46 72 987 6543', address: 'Gothenburg, Sweden', createdAt: '2026-02-15' },
    { id: '3', name: 'Malmö Fabrication Ltd', contact: 'Lars Johansson', email: 'lars@malmofab.se', phone: '+46 73 456 7890', address: 'Malmö, Sweden', createdAt: '2026-03-01' },
  ],
  projects: [
    { id: '1', companyId: '1', number: 'P-1015', name: 'Factory Welding Project', location: 'Stockholm, Sweden', startDate: '2026-08-25', endDate: '2026-08-30', status: 'Active', createdAt: '2026-08-01' },
    { id: '2', companyId: '1', number: 'P-1016', name: 'Bridge Repair Works', location: 'Uppsala, Sweden', startDate: '2026-07-01', endDate: '2026-09-30', status: 'Active', createdAt: '2026-06-20' },
    { id: '3', companyId: '2', number: 'P-2001', name: 'Steel Frame Installation', location: 'Gothenburg, Sweden', startDate: '2026-05-01', endDate: '2026-07-31', status: 'Completed', createdAt: '2026-04-15' },
    { id: '4', companyId: '3', number: 'P-3008', name: 'Pipeline Maintenance', location: 'Malmö, Sweden', startDate: '2026-09-01', endDate: '2026-12-31', status: 'On Hold', createdAt: '2026-08-10' },
  ],
  employees: [
    { id: '1', name: 'Johan Eriksson', empId: 'EMP-001', role: 'Senior Welder', phone: '+46 70 111 2222', email: 'johan@email.com', status: 'Active', createdAt: '2026-01-05' },
    { id: '2', name: 'Maria Svensson', empId: 'EMP-002', role: 'Welding Inspector', phone: '+46 72 333 4444', email: 'maria@email.com', status: 'Active', createdAt: '2026-01-20' },
    { id: '3', name: 'Björn Andersson', empId: 'EMP-003', role: 'Pipe Welder', phone: '+46 73 555 6666', email: 'bjorn@email.com', status: 'Active', createdAt: '2026-02-01' },
    { id: '4', name: 'Klara Nilsson', empId: 'EMP-004', role: 'MIG/MAG Welder', phone: '+46 70 777 8888', email: 'klara@email.com', status: 'Inactive', createdAt: '2026-03-10' },
    { id: '5', name: 'Erik Lundström', empId: 'EMP-005', role: 'Foreman', phone: '+46 70 999 0000', email: 'erik@email.com', status: 'Active', createdAt: '2026-04-01' },
  ],
  workEntries: [
    { id: '1', projectId: '1', companyId: '1', employeeId: '1', date: '2026-08-25', startTime: '08:00', endTime: '16:00', hours: 8, description: 'Welding steel beams section A', remarks: 'Completed 12 joints', createdAt: '2026-08-25' },
    { id: '2', projectId: '1', companyId: '1', employeeId: '2', date: '2026-08-25', startTime: '08:30', endTime: '16:00', hours: 7.5, description: 'Inspection and quality check', remarks: 'All joints passed', createdAt: '2026-08-25' },
    { id: '3', projectId: '2', companyId: '1', employeeId: '3', date: '2026-08-24', startTime: '07:00', endTime: '16:00', hours: 9, description: 'Bridge support weld repair', remarks: 'Used TIG process', createdAt: '2026-08-24' },
    { id: '4', projectId: '1', companyId: '1', employeeId: '1', date: '2026-08-24', startTime: '08:00', endTime: '16:00', hours: 8, description: 'Welding steel beams section B', remarks: '', createdAt: '2026-08-24' },
    { id: '5', projectId: '2', companyId: '1', employeeId: '2', date: '2026-08-23', startTime: '09:00', endTime: '15:00', hours: 6, description: 'NDT inspection of welds', remarks: 'Minor rework on joint 7', createdAt: '2026-08-23' },
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
  const [auth, setAuthState] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.auth, null);
    return s || { isAuthenticated: false, user: null };
  });

  const setAuth = (authData) => {
    setAuthState(authData);
    saveToStorage(STORAGE_KEYS.auth, authData);
  };

  const logout = () => {
    const loggedOutAuth = { isAuthenticated: false, user: null };
    setAuthState(loggedOutAuth);

    [window.localStorage, window.sessionStorage].forEach(storage => {
      try {
        storage.removeItem(STORAGE_KEYS.auth);
        if (storage.getItem(STORAGE_KEYS.auth) !== null) {
          storage.setItem(STORAGE_KEYS.auth, JSON.stringify(loggedOutAuth));
        }
      } catch {
        // Storage may be unavailable in privacy-restricted browsers.
      }
    });
  };

  const [companies, setCompanies] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.companies, null);
    if (!s) { saveToStorage(STORAGE_KEYS.companies, DEMO_DATA.companies); return DEMO_DATA.companies; }
    return s;
  });
  const [projects, setProjects] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.projects, null);
    if (!s) { saveToStorage(STORAGE_KEYS.projects, DEMO_DATA.projects); return DEMO_DATA.projects; }
    // Migrate: remove GPS fields that are no longer needed
    return s.map(p => {
      const { lat: _lat, lng: _lng, allowedRadius: _r, ...rest } = p;
      return rest;
    });
  });
  const [employees, setEmployees] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.employees, null);
    if (!s) { saveToStorage(STORAGE_KEYS.employees, DEMO_DATA.employees); return DEMO_DATA.employees; }
    return s;
  });
  const [workEntries, setWorkEntries] = useState(() => {
    const s = loadFromStorage(STORAGE_KEYS.workEntries, null);
    if (!s) { saveToStorage(STORAGE_KEYS.workEntries, DEMO_DATA.workEntries); return DEMO_DATA.workEntries; }
    // Migrate: ensure companyId and remarks fields exist
    return s.map(w => ({
      companyId: w.companyId || null,
      startTime: w.startTime || '',
      endTime: w.endTime || '',
      remarks: w.remarks ?? w.notes ?? '',
      ...w,
    }));
  });

  useEffect(() => { saveToStorage(STORAGE_KEYS.companies,   companies);   }, [companies]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.projects,    projects);    }, [projects]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.employees,   employees);   }, [employees]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.workEntries, workEntries); }, [workEntries]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2, 6);
  const todayStr   = () => new Date().toISOString().split('T')[0];

  // ── Companies ──
  const addCompany    = (d) => { const n = { ...d, id: generateId(), createdAt: todayStr() }; setCompanies(p => [...p, n]); return n; };
  const updateCompany = (id, d) => setCompanies(p => p.map(c => c.id === id ? { ...c, ...d } : c));
  const deleteCompany = (id) => {
    setCompanies(p => p.filter(c => c.id !== id));
    // Also delete linked projects and their work entries
    const projectIds = projects.filter(x => x.companyId === id).map(x => x.id);
    setProjects(p => p.filter(x => x.companyId !== id));
    setWorkEntries(p => p.filter(w => !projectIds.includes(w.projectId)));
  };

  // ── Projects ──
  const addProject    = (d) => { const n = { ...d, id: generateId(), createdAt: todayStr() }; setProjects(p => [...p, n]); return n; };
  const updateProject = (id, d) => setProjects(p => p.map(x => x.id === id ? { ...x, ...d } : x));
  const deleteProject = (id) => {
    setProjects(p => p.filter(x => x.id !== id));
    setWorkEntries(p => p.filter(w => w.projectId !== id));
  };

  // ── Employees ──
  const addEmployee    = (d) => { const n = { ...d, id: generateId(), createdAt: todayStr() }; setEmployees(p => [...p, n]); return n; };
  const updateEmployee = (id, d) => setEmployees(p => p.map(e => e.id === id ? { ...e, ...d } : e));
  const deleteEmployee = (id) => {
    setEmployees(p => p.filter(e => e.id !== id));
    setWorkEntries(p => p.filter(w => w.employeeId !== id));
  };

  // ── Work Entries ──
  const addWorkEntry    = (d) => { const n = { ...d, id: generateId(), createdAt: todayStr() }; setWorkEntries(p => [...p, n]); return n; };
  const updateWorkEntry = (id, d) => setWorkEntries(p => p.map(w => w.id === id ? { ...w, ...d } : w));
  const deleteWorkEntry = (id) => setWorkEntries(p => p.filter(w => w.id !== id));

  // ── Helpers ──
  const getCompanyById       = (id) => companies.find(c => c.id === id);
  const getProjectById       = (id) => projects.find(p => p.id === id);
  const getEmployeeById      = (id) => employees.find(e => e.id === id);
  const getProjectsByCompany = (cid) => projects.filter(p => p.companyId === cid);
  const getWorkEntriesByProject = (pid) => workEntries.filter(w => w.projectId === pid);
  const getTotalHours        = (entries) => entries.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);

  return (
    <AppContext.Provider value={{
      // auth
      auth, setAuth, logout,
      // companies
      companies, addCompany, updateCompany, deleteCompany,
      // projects
      projects, addProject, updateProject, deleteProject,
      // employees
      employees, addEmployee, updateEmployee, deleteEmployee,
      // work entries
      workEntries, addWorkEntry, updateWorkEntry, deleteWorkEntry,
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
