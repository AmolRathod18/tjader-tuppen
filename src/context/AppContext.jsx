import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getWorkEntryHours } from '../utils/workHours';
import { supabase } from '../lib/supabase';
import {
  deleteRow,
  insertRow,
  mapPayload,
  mapRow,
  normalizeSupabaseError,
  selectRows,
  updateRow,
} from '../utils/supabaseData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const initRef = useRef(false);
  const [auth, setAuthState] = useState({ isAuthenticated: false, loading: true, user: null, session: null });
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workEntries, setWorkEntries] = useState([]);
  const [expenditures, setExpenditures] = useState([]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;
    const applySession = async (session) => {
      if (!session?.user) {
        if (mounted) setAuthState({ isAuthenticated: false, loading: false, user: null, session: null });
        return;
      }

      let profile = null;
      let profileError = null;

      try {
        const { data, error } = await supabase
          .from('admin_profiles')
          .select('id, username, email, role, created_at, updated_at')
          .eq('id', session.user.id)
          .maybeSingle();

        profile = data;
        profileError = error;
      } catch (error) {
        profileError = error;
      }

      if (!mounted) return;

      const hasValidAdminProfile = Boolean(profile && profile.role === 'admin');

      if (profile && !hasValidAdminProfile) {
        await supabase.auth.signOut();
        setAuthState({ isAuthenticated: false, loading: false, user: null, session: null });
        return;
      }

      if (profileError && !profile) {
        setAuthState({
          isAuthenticated: true,
          loading: false,
          user: { ...session.user },
          session,
        });
        return;
      }

      setAuthState({
        isAuthenticated: true,
        loading: false,
        user: { ...session.user, ...(profile ? mapRow(profile) : {}) },
        session,
      });
    };
    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw normalizeSupabaseError(error);
  };

  const updateAdmin = async (data) => {
    const emailChanged = Boolean(data.email && data.email.toLowerCase() !== (auth.user?.email || '').toLowerCase());
    const passwordChanged = Boolean(data.password);
    const needsCurrentPassword = emailChanged || passwordChanged;

    if (needsCurrentPassword && !data.current_password) {
      throw new Error('Current password is required to update your account details.');
    }

    if (needsCurrentPassword && data.current_password) {
      const { error } = await supabase.auth.signInWithPassword({ email: auth.user.email, password: data.current_password });
      if (error) throw normalizeSupabaseError(error);
    }

    const { error: authError } = await supabase.auth.updateUser({
      ...(emailChanged ? { email: data.email } : {}),
      ...(passwordChanged ? { password: data.password } : {}),
    });
    if (authError) throw normalizeSupabaseError(authError);

    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .update({ username: data.username, ...(emailChanged ? { email: data.email } : {}) })
      .eq('id', auth.user.id)
      .select('id, username, email, role, created_at, updated_at')
      .single();
    if (profileError) throw normalizeSupabaseError(profileError);

    const nextUser = { ...auth.user, ...mapRow(profile) };
    setAuthState(current => ({ ...current, user: nextUser }));
    return nextUser;
  };

  const loadCompanies = async () => {
    setCompanies(await selectRows('companies'));
  };
  const loadProjects = async () => {
    setProjects(await selectRows('projects'));
  };
  const loadEmployees = async () => {
    setEmployees(await selectRows('employees'));
  };
  const loadWorkEntries = async () => {
    setWorkEntries(await selectRows('work_entries'));
  };
  const loadExpenditures = async () => {
    setExpenditures(await selectRows('expenditures'));
  };
  const loadAll = async () => {
    await Promise.all([loadCompanies(), loadProjects(), loadEmployees(), loadWorkEntries()]);
  };

  const mutate = async (table, method, data, setter, id) => {
    const result = method === 'DELETE'
      ? await deleteRow(table, id)
      : method === 'POST'
        ? await insertRow(table, data)
        : await updateRow(table, id, data);
    if (method === 'DELETE') setter(items => items.filter(item => item.id !== id));
    else if (method === 'POST') setter(items => [...items, result]);
    else setter(items => items.map(item => item.id === id ? result : item));
    return result;
  };

  const addCompany = data => mutate('companies', 'POST', data, setCompanies);
  const updateCompany = (id, data) => mutate('companies', 'PATCH', data, setCompanies, id);
  const deleteCompany = id => mutate('companies', 'DELETE', null, setCompanies, id);
  const addProject = data => mutate('projects', 'POST', data, setProjects);
  const updateProject = (id, data) => mutate('projects', 'PATCH', data, setProjects, id);
  const deleteProject = id => mutate('projects', 'DELETE', null, setProjects, id);
  const addEmployee = data => mutate('employees', 'POST', data, setEmployees);
  const updateEmployee = (id, data) => mutate('employees', 'PATCH', data, setEmployees, id);
  const deleteEmployee = id => mutate('employees', 'DELETE', null, setEmployees, id);
  const callWorkEntry = async (name, args, setter, id) => {
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw normalizeSupabaseError(error);
    const result = mapRow(Array.isArray(data) ? data[0] : data);
    if (id) setter(items => items.map(item => item.id === id ? result : item));
    else setter(items => [...items, result]);
    return result;
  };
  const addWorkEntry = data => callWorkEntry('create_work_entry', { entry_payload: mapPayload(data) }, setWorkEntries);
  const updateWorkEntry = (id, data) => callWorkEntry('update_work_entry', { entry_id: id, entry_payload: mapPayload(data) }, setWorkEntries, id);
  const deleteWorkEntry = async id => {
    const { error } = await supabase.from('work_entries').delete().eq('id', id);
    if (error) throw normalizeSupabaseError(error);
    setWorkEntries(items => items.filter(item => item.id !== id));
  };
  const addExpenditure = data => mutate('expenditures', 'POST', data, setExpenditures);
  const updateExpenditure = (id, data) => mutate('expenditures', 'PATCH', data, setExpenditures, id);
  const deleteExpenditure = id => mutate('expenditures', 'DELETE', null, setExpenditures, id);

  const value = useMemo(() => ({
    auth, logout, updateAdmin, loadCompanies, loadProjects, loadEmployees, loadWorkEntries, loadExpenditures, loadAll,
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
  }), [auth, companies, projects, employees, workEntries, expenditures]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

