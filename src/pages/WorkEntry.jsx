import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ConfirmDeleteModal } from '../components/ui/Modal';
import {
  ClipboardList, Plus, Search, Pencil, Trash2,
  Clock, Filter, ArrowLeft, CheckCircle,
  AlarmClock, FileText, Calendar,
} from 'lucide-react';
import { calculateShiftHours, getWorkEntryHours } from '../utils/workHours';

const todayDate = () => new Date().toISOString().split('T')[0];

const EMPTY = {
  date: '', employeeId: '', companyId: '', projectId: '',
  startTime: '', endTime: '', hours: '',
  description: '', remarks: '',
};

function FieldError({ message }) {
  return message
    ? <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 3 }}>{message}</p>
    : null;
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 0 8px',
      borderBottom: '1px solid var(--color-border-light)',
      marginBottom: 16,
    }}>
      <Icon size={14} color="var(--color-primary)" />
      <span style={{
        fontSize: 10.5, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--color-text-muted)',
      }}>
        {label}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FORM VIEW  (full-page, standalone)
───────────────────────────────────────────── */
function FormView({ form, errors, submitError, setField, onSave, onCancel, editItem,
  companies, formProjects, activeEmployees, getCompanyById }) {

  const autoHours = (form.startTime && form.endTime)
    ? calculateShiftHours(form.startTime, form.endTime)
    : null;

  const fs = (f) => errors[f] ? { borderColor: 'var(--color-danger)' } : {};

  return (
    <div>
      {/* Page-level back header */}
      <div className="page-header">
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onCancel}
              title="Back to list"
              style={{ marginRight: 4 }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2>{editItem ? 'Edit Work Entry' : 'Log Daily Work Entry'}</h2>
              <p>{editItem ? 'Update the details for this entry.' : 'Fill in the details for the work performed.'}</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button id="save-work-btn" className="btn btn-primary" onClick={onSave}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CheckCircle size={15} />
            {editItem ? 'Save Changes' : 'Log Work Entry'}
          </button>
        </div>
      </div>

      {/* Form card */}
      <div className="card">
        {submitError && <div className="form-submit-error" role="alert">{submitError}</div>}
        <div style={{ padding: '4px 24px 24px' }}>

          {/* ── Section 1: Work Details ── */}
          <SectionLabel icon={Calendar} label="Work Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>

            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={form.date}
                onChange={e => setField('date', e.target.value)}
                style={fs('date')} />
              <FieldError message={errors.date} />
            </div>

            <div className="form-group">
              <label>Employee *</label>
              <select value={form.employeeId}
                onChange={e => setField('employeeId', e.target.value)}
                style={fs('employeeId')}>
                <option value="">Select employee…</option>
                {activeEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                ))}
              </select>
              <FieldError message={errors.employeeId} />
            </div>

            <div className="form-group">
              <label>Client Company</label>
              <select value={form.companyId}
                onChange={e => setField('companyId', e.target.value)}>
                <option value="">Select client company…</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Project *</label>
              <select value={form.projectId}
                onChange={e => setField('projectId', e.target.value)}
                style={fs('projectId')}>
                <option value="">Select project…</option>
                {formProjects.map(p => {
                  const co = getCompanyById(p.companyId);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name}{co && !form.companyId ? ` (${co.name})` : ''}
                    </option>
                  );
                })}
              </select>
              <FieldError message={errors.projectId} />
            </div>
          </div>

          {/* ── Section 2: Working Hours ── */}
          <SectionLabel icon={AlarmClock} label="Working Hours" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>

            <div className="form-group">
              <label>Start Time</label>
              <input type="time" value={form.startTime}
                onChange={e => setField('startTime', e.target.value)} />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input type="time" value={form.endTime}
                onChange={e => setField('endTime', e.target.value)} />
            </div>

            <div className="form-group">
              <label>
                Total Hours *
                {autoHours && (
                  <span style={{
                    marginLeft: 6, fontSize: 10,
                    color: 'var(--color-primary)', fontWeight: 600,
                  }}>
                    (auto-calculated: {autoHours}h)
                  </span>
                )}
              </label>
              <input type="text"
                value={autoHours === null ? 'Select start and end time' : `${autoHours} hours`}
                readOnly
                aria-readonly="true"
                style={{ background: 'var(--color-bg)', cursor: 'default', ...fs('hours') }} />
              <FieldError message={errors.hours} />
            </div>
          </div>

          {/* ── Section 3: Work Information ── */}
          <SectionLabel icon={FileText} label="Work Information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>

            <div className="form-group">
              <label>Work Description *</label>
              <textarea
                placeholder="Describe the work performed…"
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                style={{ minHeight: 90, ...fs('description') }}
              />
              <FieldError message={errors.description} />
            </div>

            <div className="form-group">
              <label>
                Remarks
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 4 }}>
                  (optional)
                </span>
              </label>
              <textarea
                placeholder="Additional notes or remarks…"
                value={form.remarks}
                onChange={e => setField('remarks', e.target.value)}
                style={{ minHeight: 90 }}
              />
            </div>
          </div>

        </div>

        {/* Sticky bottom action bar */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '14px 24px',
          borderTop: '1px solid var(--color-border-light)',
          background: 'var(--color-bg)',
          borderRadius: '0 0 12px 12px',
        }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CheckCircle size={15} />
            {editItem ? 'Save Changes' : 'Log Work Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LIST VIEW  (table + filters)
───────────────────────────────────────────── */
function ListView({ filtered, totalHours, projects, employees, companies,
  filterProjects, search, setSearch, filterEmployee, setFilterEmployee,
  filterClient, setFilterClient, filterProject, setFilterProject,
  filterDate, setFilterDate, clearFilters, hasFilters,
  getProjectById, getEmployeeById, getCompanyById,
  onAdd, onEdit, onDelete, t, workEntries }) {

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('we_title')}</h2>
          <p>
            {workEntries.length} {t('lbl_entries')} ·{' '}
            {workEntries.reduce((s, w) => s + getWorkEntryHours(w), 0).toFixed(1)}h total
          </p>
        </div>
        <button id="add-work-btn" className="btn btn-primary" onClick={onAdd}>
          <Plus size={16} /> {t('we_btn_log')}
        </button>
      </div>

      {/* Summary strip */}
      <div className="summary-row" style={{ marginBottom: 20 }}>
        <div className="summary-item"><p>Filtered Entries</p><h4>{filtered.length}</h4></div>
        <div className="summary-item"><p>Filtered Hours</p><h4>{totalHours.toFixed(1)}h</h4></div>
        <div className="summary-item">
          <p>Avg Hours / Entry</p>
          <h4>{filtered.length > 0 ? (totalHours / filtered.length).toFixed(1) : '0'}h</h4>
        </div>
        <div className="summary-item">
          <p>Active Projects</p>
          <h4>{projects.filter(p => p.status === 'Active').length}</h4>
        </div>
      </div>

      {/* Table card */}
      <div className="card">
        {/* Filters */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: 180 }}>
              <Search size={16} className="search-icon" />
              <input id="search-entries"
                placeholder="Search employee, project, description…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <input type="date" value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ maxWidth: 155 }} title="Filter by date" />

            <select value={filterEmployee}
              onChange={e => setFilterEmployee(e.target.value)} style={{ maxWidth: 175 }}>
              <option value="">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>

            <select value={filterClient}
              onChange={e => { setFilterClient(e.target.value); setFilterProject(''); }}
              style={{ maxWidth: 190 }}>
              <option value="">All Clients</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select value={filterProject}
              onChange={e => setFilterProject(e.target.value)} style={{ maxWidth: 190 }}>
              <option value="">All Projects</option>
              {filterProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <Filter size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper table-work-entries">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Client</th>
                <th>Project</th>
                <th>Time</th>
                <th>Hours</th>
                <th>Description</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, i) => {
                const project  = getProjectById(w.projectId);
                const employee = getEmployeeById(w.employeeId);
                const co       = getCompanyById(w.companyId || project?.companyId);
                return (
                  <tr key={w.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{w.date}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {new Date(w.date + 'T00:00:00').toLocaleDateString('en-SE', { weekday: 'short' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{employee?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{employee?.role}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{co?.name || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{project?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{project?.number}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12,
                      color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {w.startTime && w.endTime ? `${w.startTime}–${w.endTime}` : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} color="var(--color-primary)" />
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{getWorkEntryHours(w)}h</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.description || '—'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', maxWidth: 130 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.remarks || '—'}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit"
                          onClick={() => onEdit(w)}>
                          <Pencil size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete"
                          onClick={() => onDelete(w)}
                          style={{ color: 'var(--color-danger)' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr><td colSpan={10}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><ClipboardList size={32} /></div>
                    <h3>No work entries found</h3>
                    <p>{hasFilters
                      ? 'No entries match the current filters.'
                      : 'Start by logging the first work entry.'}</p>
                    {!hasFilters && (
                      <button className="btn btn-primary" onClick={onAdd}>
                        <Plus size={16} /> {t('we_btn_log')}
                      </button>
                    )}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────── */
export default function WorkEntry() {
  const {
    workEntries, projects, employees, companies,
    addWorkEntry, updateWorkEntry, deleteWorkEntry,
    getProjectById, getEmployeeById, getCompanyById,
  } = useApp();
  const { t } = useLanguage();

  const [view,           setView]          = useState('list'); // 'list' | 'form'
  const [editItem,       setEditItem]      = useState(null);
  const [deleteTarget,   setDeleteTarget]  = useState(null);
  const [form,           setForm]          = useState(EMPTY);
  const [errors,         setErrors]        = useState({});
  const [submitError,    setSubmitError]   = useState('');

  // List filters
  const [search,         setSearch]        = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterClient,   setFilterClient]  = useState('');
  const [filterProject,  setFilterProject] = useState('');
  const [filterDate,     setFilterDate]    = useState('');

  const formProjects = form.companyId
    ? projects.filter(p => p.companyId === form.companyId)
    : projects;

  const filterProjects = filterClient
    ? projects.filter(p => p.companyId === filterClient)
    : projects;

  const activeEmployees = employees.filter(e => e.status === 'Active');

  const filtered = workEntries
    .filter(w => {
      const emp  = getEmployeeById(w.employeeId);
      const proj = getProjectById(w.projectId);
      const co   = getCompanyById(w.companyId || proj?.companyId);
      const q    = search.toLowerCase();
      const matchSearch   = !q ||
        emp?.name?.toLowerCase().includes(q) ||
        proj?.name?.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        co?.name?.toLowerCase().includes(q);
      const matchEmployee = !filterEmployee || w.employeeId === filterEmployee;
      const matchClient   = !filterClient   || (w.companyId || proj?.companyId) === filterClient;
      const matchProject  = !filterProject  || w.projectId === filterProject;
      const matchDate     = !filterDate     || w.date === filterDate;
      return matchSearch && matchEmployee && matchClient && matchProject && matchDate;
    })
    .sort((a, b) => {
      const dd = b.date.localeCompare(a.date);
      return dd !== 0 ? dd : (b.createdAt?.localeCompare(a.createdAt || '') || 0);
    });

  const totalHours = filtered.reduce((s, w) => s + getWorkEntryHours(w), 0);
  const hasFilters = !!(search || filterEmployee || filterClient || filterProject || filterDate);

  const setField = (field, value) => {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'startTime' || field === 'endTime') {
        const st = field === 'startTime' ? value : f.startTime;
        const et = field === 'endTime'   ? value : f.endTime;
        const h = calculateShiftHours(st, et);
        next.hours = h === null ? '' : h;
      }
      if (field === 'companyId') next.projectId = '';
      return next;
    });
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY, date: todayDate() });
    setErrors({});
    setSubmitError('');
    setView('form');
  };

  const openEdit = (item) => {
    const proj = getProjectById(item.projectId);
    setEditItem(item);
    setForm({
      date:        item.date        || '',
      employeeId:  item.employeeId  || '',
      companyId:   item.companyId   || proj?.companyId || '',
      projectId:   item.projectId   || '',
      startTime:   item.startTime   || '',
      endTime:     item.endTime     || '',
      hours:       getWorkEntryHours(item) || '',
      description: item.description || '',
      remarks:     item.remarks     ?? item.notes ?? '',
    });
    setErrors({});
    setSubmitError('');
    setView('form');
  };

  const handleSave = () => {
    const e = {};
    if (!form.date)                                                         e.date        = 'Date is required';
    if (!form.employeeId)                                                   e.employeeId  = 'Employee is required';
    if (!form.projectId)                                                    e.projectId   = 'Project is required';
    if (!form.description?.trim())                                          e.description = 'Work description is required';
    const calculatedHours = calculateShiftHours(form.startTime, form.endTime);
    if (calculatedHours === null || calculatedHours <= 0)                   e.hours       = 'Start and end time are required';
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const proj = getProjectById(form.projectId);
    const data = {
      ...form,
      hours:     calculatedHours,
      companyId: form.companyId || proj?.companyId || '',
    };
    try {
      if (editItem) updateWorkEntry(editItem.id, data);
      else addWorkEntry(data);
      setView('list');
      setEditItem(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCancel = () => { setView('list'); setEditItem(null); setErrors({}); };
  const handleDelete = () => { deleteWorkEntry(deleteTarget.id); setDeleteTarget(null); };

  const clearFilters = () => {
    setSearch(''); setFilterEmployee(''); setFilterClient('');
    setFilterProject(''); setFilterDate('');
  };

  /* ── Render ── */
  if (view === 'form') {
    return (
      <>
        <FormView
          form={form} errors={errors} submitError={submitError} setField={setField}
          onSave={handleSave} onCancel={handleCancel} editItem={editItem}
          companies={companies} formProjects={formProjects}
          activeEmployees={activeEmployees} getCompanyById={getCompanyById}
        />
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          itemName={`work entry on ${deleteTarget?.date}`}
        />
      </>
    );
  }

  return (
    <>
      <ListView
        filtered={filtered} totalHours={totalHours}
        projects={projects} employees={employees} companies={companies}
        filterProjects={filterProjects}
        search={search} setSearch={setSearch}
        filterEmployee={filterEmployee} setFilterEmployee={setFilterEmployee}
        filterClient={filterClient} setFilterClient={setFilterClient}
        filterProject={filterProject} setFilterProject={setFilterProject}
        filterDate={filterDate} setFilterDate={setFilterDate}
        clearFilters={clearFilters} hasFilters={hasFilters}
        getProjectById={getProjectById}
        getEmployeeById={getEmployeeById}
        getCompanyById={getCompanyById}
        onAdd={openAdd} onEdit={openEdit} onDelete={setDeleteTarget}
        t={t} workEntries={workEntries}
      />
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={`work entry on ${deleteTarget?.date}`}
      />
    </>
  );
}
