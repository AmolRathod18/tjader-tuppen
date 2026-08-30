import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';

// Admin pages
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import Companies      from './pages/Companies';
import Projects       from './pages/Projects';
import Employees      from './pages/Employees';
import WorkEntry      from './pages/WorkEntry';
import Reports        from './pages/Reports';
import Attendance     from './pages/admin/Attendance';
import Assignments    from './pages/admin/Assignments';

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyAttendance      from './pages/employee/MyAttendance';

// ── Guard: must be authenticated ──
function AuthGuard({ children }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ── Guard: must be admin ──
function AdminGuard({ children }) {
  const { isAuthenticated, userRole } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (userRole !== 'admin') return <Navigate to="/employee/dashboard" replace />;
  return children;
}

// ── Guard: must be employee ──
function EmployeeGuard({ children }) {
  const { isAuthenticated, userRole } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (userRole !== 'employee') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, userRole } = useApp();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        isAuthenticated
          ? <Navigate to={userRole === 'employee' ? '/employee/dashboard' : '/dashboard'} replace />
          : <Login />
      } />

      {/* Root redirect */}
      <Route path="/" element={
        <Navigate to={
          !isAuthenticated ? '/login' :
          userRole === 'employee' ? '/employee/dashboard' : '/dashboard'
        } replace />
      } />

      {/* Admin routes */}
      <Route path="/*" element={
        <AdminGuard>
          <Layout>
            <Routes>
              <Route path="/dashboard"  element={<Dashboard />} />
              <Route path="/companies"  element={<Companies />} />
              <Route path="/projects"   element={<Projects />} />
              <Route path="/employees"  element={<Employees />} />
              <Route path="/work-entry" element={<WorkEntry />} />
              <Route path="/attendance"    element={<Attendance />} />
              <Route path="/assignments"   element={<Assignments />} />
              <Route path="/reports"       element={<Reports />} />
              <Route path="*"              element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        </AdminGuard>
      } />

      {/* Employee routes */}
      <Route path="/employee/*" element={
        <EmployeeGuard>
          <Layout>
            <Routes>
              <Route path="/dashboard"  element={<EmployeeDashboard />} />
              <Route path="/attendance" element={<MyAttendance />} />
              <Route path="*"           element={<Navigate to="/employee/dashboard" replace />} />
            </Routes>
          </Layout>
        </EmployeeGuard>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
