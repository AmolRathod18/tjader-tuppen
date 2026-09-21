import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/layout/Layout';

import Dashboard  from './pages/Dashboard';
import Companies  from './pages/Companies';
import Projects   from './pages/Projects';
import Employees  from './pages/Employees';
import WorkEntry  from './pages/WorkEntry';
import Reports    from './pages/Reports';
import SystemOverview from './pages/SystemOverview';
import Expenditure from './pages/Expenditure';
import Login      from './pages/Login';
import Settings   from './pages/Settings';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { auth } = useApp();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard"  element={<Dashboard />} />
                    <Route path="/companies"  element={<Companies />} />
                    <Route path="/projects"   element={<Projects />} />
                    <Route path="/employees"  element={<Employees />} />
                    <Route path="/work-entry" element={<WorkEntry />} />
                    <Route path="/reports"    element={<Reports />} />
                    <Route path="/system-overview" element={<SystemOverview />} />
                    <Route path="/expenditure" element={<Expenditure />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*"           element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
}
