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
import Login      from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings   from './pages/Settings';
import Home       from './pages/Home';
import PublicSiteLayout from './components/layout/PublicSiteLayout';
import { AboutPage, ContactPage, ProjectsPage, PublicDetailPage, ServicesPage } from './pages/PublicPages';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { auth } = useApp();
  const location = useLocation();

  if (auth.loading) return null;
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
            <Route path="/" element={<Home />} />
            <Route element={<PublicSiteLayout />}>
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:slug" element={<PublicDetailPage type="service" />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:slug" element={<PublicDetailPage type="project" />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard"  element={<Dashboard />} />
                    <Route path="/companies"  element={<Companies />} />
                    <Route path="/admin/projects" element={<Projects />} />
                    <Route path="/employees"  element={<Employees />} />
                    <Route path="/work-entry" element={<WorkEntry />} />
                    <Route path="/reports"    element={<Reports />} />
                    <Route path="/expenditure" element={<Navigate to="/work-entry" replace />} />
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
