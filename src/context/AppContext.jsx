import React, { createContext, useContext, useMemo, useState } from 'react';
import { calculateShiftHours, getWorkEntryHours } from '../utils/workHours';

const AppContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const AUTH_KEY = 'wms_auth';

const camelToSnake = (key) => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const snakeToCamel = (key) => key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
const mapRow = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
  const frontendKey = snakeToCamel(key);
  const frontendValue = (frontendKey === 'startTime' || frontendKey === 'endTime') && typeof value === 'string'
    ? value.slice(0, 5)
    : value;
  return [frontendKey, frontendValue];
}));
const mapPayload = (data) => Object.fromEntries(
  Object.entries(data).filter(([, value]) => value !== undefined).map(([key, value]) => [camelToSnake(key), value]),
);

async function request(path, options = {}, token) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export function AppProvider({ children }) {
  const [auth, setAuthState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || { isAuthenticated: false, user: null }; }
    catch { return { isAuthenticated: false, user: null }; }
  });
  const token = auth.token;
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workEntries, setWorkEntries] = useState([]);
  const [expenditures, setExpenditures] = useState([]);

  const setAuth = (authData) => {
    const next = { ...authData };
    setAuthState(next);
    localStorage.setItem(AUTH_KEY, JSON.stringify(next));
  };
  const logout = () => {
    setAuthState({ isAuthenticated: false, user: null });
    localStorage.removeItem(AUTH_KEY);
  };

  const loadCompanies = async () => {
    if (!token) return;
    const response = await request('/api/companies', {}, token);
    setCompanies(response.map(mapRow));
  };
  const loadProjects = async () => {
    if (!token) return;
    const response = await request('/api/projects', {}, token);
    setProjects(response.map(mapRow));
  };
  const loadEmployees = async () => {
    if (!token) return;
    const response = await request('/api/employees', {}, token);
    setEmployees(response.map(mapRow));
  };
  const loadWorkEntries = async () => {
    if (!token) return;
    const response = await request('/api/work-entries', {}, token);
    setWorkEntries(response.map(mapRow));
  };
  const loadExpenditures = async () => {
    if (!token) return;
    const response = await request('/api/expenditures', {}, token);
    setExpenditures(response.map(mapRow));
  };
  const loadAll = async () => {
    await Promise.all([loadCompanies(), loadProjects(), loadEmployees(), loadWorkEntries()]);
  };

  const mutate = async (path, method, data, setter, id) => {
    const result = await request(path, { method, body: data ? JSON.stringify(mapPayload(data)) : undefined }, token);
    if (method === 'DELETE') {
      setter(items => items.filter(item => item.id !== id));
    } else if (method === 'POST') {
      setter(items => [...items, mapRow(result)]);
    } else {
      setter(items => items.map(item => item.id === id ? mapRow(result) : item));
    }
    return result ? mapRow(result) : null;
  };

  const addCompany = (data) => mutate('/api/companies', 'POST', data, setCompanies);
  const updateCompany = (id, data) => mutate(`/api/companies/${id}`, 'PATCH', data, setCompanies, id);
  const deleteCompany = (id) => mutate(`/api/companies/${id}`, 'DELETE', null, setCompanies, id);
  const addProject = (data) => mutate('/api/projects', 'POST', data, setProjects);
  const updateProject = (id, data) => mutate(`/api/projects/${id}`, 'PATCH', data, setProjects, id);
  const deleteProject = (id) => mutate(`/api/projects/${id}`, 'DELETE', null, setProjects, id);
  const addEmployee = (data) => mutate('/api/employees', 'POST', data, setEmployees);
  const updateEmployee = (id, data) => mutate(`/api/employees/${id}`, 'PATCH', data, setEmployees, id);
  const deleteEmployee = (id) => mutate(`/api/employees/${id}`, 'DELETE', null, setEmployees, id);
  const addWorkEntry = (data) => mutate('/api/work-entries', 'POST', {
    ...data, hours: calculateShiftHours(data.startTime, data.endTime),
  }, setWorkEntries);
  const updateWorkEntry = (id, data) => mutate(`/api/work-entries/${id}`, 'PATCH', {
    ...data, hours: calculateShiftHours(data.startTime, data.endTime),
  }, setWorkEntries, id);
  const deleteWorkEntry = (id) => mutate(`/api/work-entries/${id}`, 'DELETE', null, setWorkEntries, id);
  const addExpenditure = (data) => mutate('/api/expenditures', 'POST', data, setExpenditures);
  const updateExpenditure = (id, data) => mutate(`/api/expenditures/${id}`, 'PATCH', data, setExpenditures, id);
  const deleteExpenditure = (id) => mutate(`/api/expenditures/${id}`, 'DELETE', null, setExpenditures, id);

  const value = useMemo(() => ({
    auth, setAuth, logout, loadCompanies, loadProjects, loadEmployees, loadWorkEntries, loadExpenditures, loadAll,
    companies, addCompany, updateCompany, deleteCompany,
    projects, addProject, updateProject, deleteProject,
    employees, addEmployee, updateEmployee, deleteEmployee,
    workEntries, addWorkEntry, updateWorkEntry, deleteWorkEntry,
    expenditures, addExpenditure, updateExpenditure, deleteExpenditure,
    getCompanyById: id => companies.find(item => item.id === id),
    getProjectById: id => projects.find(item => item.id === id),
    getEmployeeById: id => employees.find(item => item.id === id),
    getProjectsByCompany: id => projects.filter(item => item.companyId === id),
    getWorkEntriesByProject: id => workEntries.filter(item => item.projectId === id),
    getTotalHours: entries => entries.reduce((sum, entry) => sum + getWorkEntryHours(entry), 0),
    getWorkEntryHours,
  }), [auth, companies, projects, employees, workEntries]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export { request };
