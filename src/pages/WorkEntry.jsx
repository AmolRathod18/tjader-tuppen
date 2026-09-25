import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ConfirmDeleteModal } from '../components/ui/Modal';
import DatePicker from '../components/ui/DatePicker';
import {
  ClipboardList, Plus, Search, Pencil, Trash2,
  Filter, ArrowLeft, CheckCircle,
  AlarmClock, FileText, Calendar,
} from 'lucide-react';
import { calculateShiftHours, getWorkEntryBreakdown, getWorkEntryHours, getWeeklyHours } from '../utils/workHours';

const todayDate = () => new Date().toISOString().split('T')[0];

const EMPTY = {
  date: '', employeeId: '', companyId: '', projectId: '',
  startTime: '', endTime: '', hours: '',
  normalHours: '', normalOvertime: '', weekendOvertime: '',
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
  companies, formProjects, activeEmployees, getCompanyById, workEntries, t }) {

  const isWeekend = form.date && [0, 6].includes(new Date(`${form.date}T00:00:00`).getDay());
  const shiftHours = calculateShiftHours(form.startTime, form.endTime);
  const automaticNormalHours = !isWeekend && shiftHours !== null ? Math.min(shiftHours, 8) : 0;
  const enteredNormalOvertime = !isWeekend ? Number(form.normalOvertime || 0) : 0;
  const enteredWeekendOvertime = Number(form.weekendOvertime || 0);
  const weeklyEntries = [
    ...workEntries.filter(entry => entry.id !== editItem?.id),
    {
      employeeId: form.employeeId,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      normalHours: automaticNormalHours,
      normalOvertime: enteredNormalOvertime,
      weekendOvertime: enteredWeekendOvertime,
    },
  ];
  const weeklyHours = getWeeklyHours(weeklyEntries, form.employeeId, form.date);

  const fs = (f) => errors[f] ? { borderColor: 'var(--color-danger)' } : {};

  return (
    <div className="work-entry-page">
      {/* Page-level back header */}
      <div className="page-header">
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onCancel}
              title={t('we_back_to_list')}
              style={{ marginRight: 4 }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2>{editItem ? t('we_edit_title') : t('we_new_title')}</h2>
              <p>{editItem ? t('we_edit_subtitle') : t('we_new_subtitle')}</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onCancel}>{t('btn_cancel')}</button>
          <button id="save-work-btn" className="btn btn-primary" onClick={onSave}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CheckCircle size={15} />
            {editItem ? t('btn_save') : t('we_btn_log')}
          </button>
        </div>
      </div>

      {/* Form card */}
      <div className="card">
        {submitError && <div className="form-submit-error" role="alert">{submitError}</div>}
        <div style={{ padding: '4px 24px 24px' }}>

          {/* ── Section 1: Work Details ── */}
          <SectionLabel icon={Calendar} label={t('we_work_details')} />
          <div className="work-entry-form-grid work-entry-form-grid--two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>

            <div className="form-group">
              <label>{t('lbl_date')} *</label>
              <DatePicker value={form.date}
                onChange={e => setField('date', e.target.value)}
                style={fs('date')} />
              <FieldError message={errors.date} />
            </div>

            <div className="form-group">
              <label>{t('lbl_employee')} *</label>
              <select value={form.employeeId}
                onChange={e => setField('employeeId', e.target.value)}
                style={fs('employeeId')}>
                <option value="">{t('we_select_employee')}</option>
                {activeEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
                ))}
              </select>
              <FieldError message={errors.employeeId} />
            </div>

            <div className="form-group">
              <label>{t('we_client_company')}</label>
              <select value={form.companyId}
                onChange={e => setField('companyId', e.target.value)}>
                <option value="">{t('we_select_company')}</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t('lbl_project')} *</label>
              <select value={form.projectId}
                onChange={e => setField('projectId', e.target.value)}
                style={fs('projectId')}>
                <option value="">{t('we_select_project')}</option>
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
          <SectionLabel icon={AlarmClock} label={t('we_working_hours')} />
          <div className="work-entry-form-grid work-entry-form-grid--three" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>

            <div className="form-group">
              <label>{t('we_start_time')}</label>
              <input type="time" value={form.startTime}
                onChange={e => setField('startTime', e.target.value)} />
            </div>

            <div className="form-group">
              <label>{t('we_end_time')}</label>
              <input type="time" value={form.endTime}
                onChange={e => setField('endTime', e.target.value)} />
            </div>

            <div className="form-group">
              <label>{t('we_normal_hours')}</label>
              <input type="text" value={shiftHours === null ? '' : automaticNormalHours.toFixed(2)} readOnly
                aria-readonly="true" style={{ background: 'var(--color-bg)', cursor: 'default', ...fs('normalHours') }} />
            </div>

            <div className="form-group">
              <label>{t('we_normal_overtime')}</label>
              <input type="number" min="0" max="24" step="0.25" value={isWeekend ? 0 : form.normalOvertime}
                onChange={e => setField('normalOvertime', e.target.value)} disabled={isWeekend} />
            </div>

            <div className="form-group">
              <label>{t('we_weekend_overtime')}</label>
              <input type="number" min="0" max="24" step="0.25" value={form.weekendOvertime}
                onChange={e => setField('weekendOvertime', e.target.value)}
                style={fs('weekendOvertime')} />
              <small style={{ color: 'var(--color-text-muted)' }}>{t('we_weekend_overtime_hint')}</small>
            </div>

            <div className="form-group">
              <label>{t('we_weekly_hours')}</label>
              <input type="text" value={`${weeklyHours.toFixed(2)} ${t('lbl_hours').toLowerCase()}`} readOnly
                aria-readonly="true" style={{ background: 'var(--color-bg)', cursor: 'default' }} />
            </div>
          </div>

          {/* ── Section 3: Work Information ── */}
          <SectionLabel icon={FileText} label={t('we_work_information')} />
          <div className="work-entry-form-grid work-entry-form-grid--two" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>

            <div className="form-group">
              <label>{t('we_description')} *</label>
              <textarea
                placeholder={t('we_desc_ph')}
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                style={{ minHeight: 90, ...fs('description') }}
              />
              <FieldError message={errors.description} />
            </div>

            <div className="form-group">
              <label>
                {t('we_remarks')}
                <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 4 }}>
                  ({t('ui_optional')})
                </span>
              </label>
              <textarea
                placeholder={t('we_remarks_ph')}
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
          <button className="btn btn-ghost" onClick={onCancel}>{t('btn_cancel')}</button>
          <button className="btn btn-primary" onClick={onSave}
            style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CheckCircle size={15} />
            {editItem ? t('btn_save') : t('we_btn_log')}
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
    <div className="work-entry-page">
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('we_title')}</h2>
          <p>
            {workEntries.length} {t('lbl_entries')} ·{' '}
            {workEntries.reduce((s, w) => s + getWorkEntryHours(w), 0).toFixed(1)}h {t('lbl_total').toLowerCase()}
          </p>
        </div>
        <button id="add-work-btn" className="btn btn-primary" onClick={onAdd}>
          <Plus size={16} /> {t('we_btn_log')}
        </button>
      </div>

      {/* Summary strip */}
      <div className="summary-row" style={{ marginBottom: 20 }}>
        <div className="summary-item"><p>{t('we_filtered_entries')}</p><h4>{filtered.length}</h4></div>
        <div className="summary-item"><p>{t('we_filtered_hours')}</p><h4>{totalHours.toFixed(1)}h</h4></div>
        <div className="summary-item">
          <p>{t('we_avg_entry')}</p>
          <h4>{filtered.length > 0 ? (totalHours / filtered.length).toFixed(1) : '0'}h</h4>
        </div>
        <div className="summary-item">
          <p>{t('we_active_projects')}</p>
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
                placeholder={t('we_search_ph')}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <DatePicker value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ maxWidth: 155 }} title={t('ui_filter_by_date')} />

            <select value={filterEmployee}
              onChange={e => setFilterEmployee(e.target.value)} style={{ maxWidth: 175 }}>
              <option value="">{t('we_all_employees')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>

            <select value={filterClient}
              onChange={e => { setFilterClient(e.target.value); setFilterProject(''); }}
              style={{ maxWidth: 190 }}>
              <option value="">{t('we_all_clients')}</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select value={filterProject}
              onChange={e => setFilterProject(e.target.value)} style={{ maxWidth: 190 }}>
              <option value="">{t('we_all_projects')}</option>
              {filterProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <Filter size={13} /> {t('we_clear')}
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
                <th>{t('lbl_date')}</th>
                <th>{t('lbl_employee')}</th>
                <th>{t('we_client')}</th>
                <th>{t('lbl_project')}</th>
                <th>{t('dash_time')}</th>
                <th>{t('we_normal_hours')}</th>
                <th>{t('we_normal_ot_short')}</th>
                <th>{t('we_weekend_ot_short')}</th>
                <th>{t('we_weekly_hours')}</th>
                <th>{t('we_description')}</th>
                <th>{t('we_remarks')}</th>
                <th>{t('lbl_actions')}</th>
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
                        {new Date(w.date + 'T00:00:00').toLocaleDateString(t('ui_locale'), { weekday: 'short' })}
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
                    <td>{getWorkEntryBreakdown(w).normalHours.toFixed(1)}h</td>
                    <td>{getWorkEntryBreakdown(w).normalOvertime.toFixed(1)}h</td>
                    <td>{getWorkEntryBreakdown(w).weekendOvertime.toFixed(1)}h</td>
                    <td>{getWeeklyHours(workEntries, w.employeeId, w.date).toFixed(1)}h</td>
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
                        <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_edit')}
                          onClick={() => onEdit(w)}>
                          <Pencil size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_delete')}
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
                    <h3>{t('we_no_entries')}</h3>
                    <p>{hasFilters
                      ? t('we_no_match')
                      : t('we_start_first')}</p>
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
    loadCompanies, loadProjects, loadEmployees, loadWorkEntries,
    getProjectById, getEmployeeById, getCompanyById,
  } = useApp();
  const { t } = useLanguage();

  const [view,           setView]          = useState('list'); // 'list' | 'form'
  const [editItem,       setEditItem]      = useState(null);
  const [deleteTarget,   setDeleteTarget]  = useState(null);
  const [form,           setForm]          = useState(EMPTY);
  const [errors,         setErrors]        = useState({});
  const [submitError,    setSubmitError]   = useState('');
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    Promise.all([loadCompanies(), loadProjects(), loadEmployees(), loadWorkEntries()])
      .catch(error => setSubmitError(error.message));
  }, []);

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
      normalHours: item.normalHours ?? (getWorkEntryBreakdown(item).normalHours || ''),
      normalOvertime: item.normalOvertime ?? '',
      weekendOvertime: item.weekendOvertime ?? (getWorkEntryBreakdown(item).weekendOvertime || ''),
      description: item.description || '',
      remarks:     item.remarks     ?? item.notes ?? '',
    });
    setErrors({});
    setSubmitError('');
    setView('form');
  };

  const handleSave = async () => {
    const e = {};
    if (!form.date)                                                         e.date        = t('we_err_date');
    if (!form.employeeId)                                                   e.employeeId  = t('we_err_employee');
    if (!form.projectId)                                                    e.projectId   = t('we_err_project_required');
    if (!form.description?.trim())                                          e.description = t('we_err_description_required');
    if (!form.startTime || !form.endTime)                                    e.hours = t('we_err_time');
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const isWeekend = [0, 6].includes(new Date(`${form.date}T00:00:00`).getDay());
    const proj = getProjectById(form.projectId);
    const data = {
      ...form,
      normalHours: undefined,
      normalOvertime: isWeekend ? 0 : Number(form.normalOvertime || 0),
      weekendOvertime: Number(form.weekendOvertime || 0),
      companyId: form.companyId || proj?.companyId || '',
    };
    try {
      if (editItem) await updateWorkEntry(editItem.id, data);
      else await addWorkEntry(data);
      setView('list');
      setEditItem(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCancel = () => { setView('list'); setEditItem(null); setErrors({}); };
  const handleDelete = async () => {
    try {
      await deleteWorkEntry(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

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
          activeEmployees={activeEmployees} getCompanyById={getCompanyById} workEntries={workEntries} t={t}
        />
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          itemName={t('we_delete_item', [deleteTarget?.date])}
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
          itemName={t('we_delete_item', [deleteTarget?.date])}
      />
    </>
  );
}
