import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/layout/Layout';

import Dashboard  from './pages/Dashboard';
import Companies  from './pages/Companies';
import Projects   from './pages/Projects';
import Employees  from './pages/Employees';
import WorkEntry  from './pages/WorkEntry';
import Reports    from './pages/Reports';

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/dashboard"  element={<Dashboard />} />
                  <Route path="/companies"  element={<Companies />} />
                  <Route path="/projects"   element={<Projects />} />
                  <Route path="/employees"  element={<Employees />} />
                  <Route path="/work-entry" element={<WorkEntry />} />
                  <Route path="/reports"    element={<Reports />} />
                  <Route path="*"           element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
}
