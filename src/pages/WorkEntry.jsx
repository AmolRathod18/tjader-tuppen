import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ConfirmDeleteModal, Modal } from '../components/ui/Modal';
import DatePicker from '../components/ui/DatePicker';
import {
  ClipboardList, Plus, Search, Pencil, Trash2,
  Filter, ArrowLeft, CheckCircle,
  AlarmClock, FileText, Calendar, Eye,
} from 'lucide-react';
import { calculateShiftHours, getWorkEntryBreakdown, getWorkEntryHours } from '../utils/workHours';

const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';

const todayDate = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: STOCKHOLM_TIME_ZONE,
}).format(new Date());

function TimeSelect({ value, onChange, defaultMeridiem = 'AM' }) {
  const [rawHours, rawMinutes] = (value || '').split(':');
  const numericHours = Number(rawHours);
  const hasValue = Number.isInteger(numericHours) && numericHours >= 0 && numericHours <= 23;
  const [selection, setSelection] = useState({
    hour: hasValue ? String(numericHours % 12 || 12) : '',
    minute: hasValue ? rawMinutes : '',
    meridiem: hasValue && numericHours >= 12 ? 'PM' : defaultMeridiem,
  });

  const updateTime = (part, nextValue) => {
    const nextSelection = { ...selection, [part]: nextValue };
    setSelection(nextSelection);
    const { hour: nextHour, minute: nextMinute, meridiem: nextMeridiem } = nextSelection;
    if (!nextHour || !nextMinute) {
      onChange('');
      return;
    }

    const hour24 = nextMeridiem === 'PM'
      ? (Number(nextHour) === 12 ? 12 : Number(nextHour) + 12)
      : (Number(nextHour) === 12 ? 0 : Number(nextHour));
    onChange(`${String(hour24).padStart(2, '0')}:${nextMinute}`);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
      <select value={selection.hour} aria-label="Hour" onChange={event => updateTime('hour', event.target.value)}>
        <option value="">Hour</option>
        {Array.from({ length: 12 }, (_, index) => {
          const option = String(index + 1);
          return <option key={option} value={option}>{option}</option>;
        })}
      </select>
      <select value={selection.minute} aria-label="Minute" onChange={event => updateTime('minute', event.target.value)}>
        <option value="">Min</option>
        {Array.from({ length: 60 }, (_, index) => {
          const option = String(index).padStart(2, '0');
          return <option key={option} value={option}>{option}</option>;
        })}
      </select>
      <select value={selection.meridiem} aria-label="AM or PM" onChange={event => updateTime('meridiem', event.target.value)}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

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
  companies, formProjects, activeEmployees, getCompanyById, t }) {

  const shiftHours = calculateShiftHours(form.startTime, form.endTime);
  const automaticNormalHours = shiftHours !== null ? shiftHours : 0;
  const [isNormalHoursEditing, setIsNormalHoursEditing] = useState(false);
  const displayedNormalHours = isNormalHoursEditing
    ? (form.normalHours === '' ? automaticNormalHours.toFixed(2) : form.normalHours)
    : (shiftHours === null ? '' : automaticNormalHours.toFixed(2));

  const setTimeField = (field, value) => {
    setField(field, value);
    if (!isNormalHoursEditing) setField('normalHours', '');
  };

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
              <TimeSelect value={form.startTime}
                onChange={value => setTimeField('startTime', value)} />
            </div>

            <div className="form-group">
              <label>{t('we_end_time')}</label>
              <TimeSelect value={form.endTime} defaultMeridiem="PM"
                onChange={value => setTimeField('endTime', value)} />
            </div>

            <div className="form-group">
              <div className="work-hours-label-row">
                <label>{t('we_normal_hours')}</label>
                <button
                  type="button"
                  className="work-hours-edit-button"
                  onClick={() => {
                    if (isNormalHoursEditing) setField('normalHours', '');
                    else if (form.normalHours === '') setField('normalHours', automaticNormalHours.toFixed(2));
                    setIsNormalHoursEditing(editing => !editing);
                  }}
                >
                  <Pencil size={12} />
                  {isNormalHoursEditing ? t('we_use_calculated_hours') : t('we_edit_normal_hours')}
                </button>
              </div>
              <input
                type={isNormalHoursEditing ? 'number' : 'text'}
                min="0"
                max="24"
                step="0.01"
                value={displayedNormalHours}
                readOnly={!isNormalHoursEditing}
                onChange={event => setField('normalHours', event.target.value)}
                aria-readonly={!isNormalHoursEditing}
                style={{ background: 'var(--color-bg)', cursor: isNormalHoursEditing ? 'text' : 'default', ...fs('normalHours') }}
              />
              <FieldError message={errors.normalHours} />
              {shiftHours > 8 && (
                <small className="work-hours-warning" role="alert">{t('we_hours_exceed_warning')}</small>
              )}
            </div>

            <div className="form-group">
              <label>{t('we_normal_overtime')}</label>
              <input type="number" min="0" max="24" step="0.25" value={form.normalOvertime}
                onChange={e => setField('normalOvertime', e.target.value)} />
              <FieldError message={errors.normalOvertime} />
            </div>

            <div className="form-group">
              <label>{t('we_weekend_overtime')}</label>
              <input type="number" min="0" max="24" step="0.25" value={form.weekendOvertime}
                onChange={e => setField('weekendOvertime', e.target.value)}
                style={fs('weekendOvertime')} />
              <small style={{ color: 'var(--color-text-muted)' }}>{t('we_weekend_overtime_hint')}</small>
              <FieldError message={errors.weekendOvertime} />
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
function ListView({ filtered, employeeGroups, totalHours, projects, employees, companies,
  filterProjects, search, setSearch, filterEmployee, setFilterEmployee,
  filterClient, setFilterClient, filterProject, setFilterProject,
  filterDate, setFilterDate, clearFilters, hasFilters,
  onAdd, onEmployeeSelect, t, workEntries }) {

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
                <th>{t('lbl_employee')}</th>
                <th>{t('lbl_entries')}</th>
                <th>{t('lbl_total')}</th>
                <th>{t('we_normal_hours')}</th>
                <th>{t('we_normal_ot_short')}</th>
                <th>{t('we_weekend_ot_short')}</th>
                <th>{t('lbl_date')}</th>
                <th>{t('lbl_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {employeeGroups.map((group, i) => {
                const employee = group.employee;
                return (
                  <tr key={group.employeeId}>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <button className="employee-entry-link" onClick={() => onEmployeeSelect(group.employeeId)}>
                        <span style={{ fontWeight: 600 }}>{employee?.name || t('ui_unknown')}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{employee?.role || '—'}</span>
                      </button>
                    </td>
                    <td>{group.entries.length}</td>
                    <td style={{ fontWeight: 700 }}>{group.totalHours.toFixed(1)}h</td>
                    <td>{group.normalHours.toFixed(1)}h</td>
                    <td>{group.normalOvertime.toFixed(1)}h</td>
                    <td>{group.weekendOvertime.toFixed(1)}h</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{group.latestDate}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{employee?.role}</div>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => onEmployeeSelect(group.employeeId)}>
                        <Eye size={14} /> {t('btn_view_all')}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {employeeGroups.length === 0 && (
                <tr><td colSpan={9}>
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

function EmployeeDetailsModal({ group, getProjectById, getCompanyById, onClose, onEdit, onDelete, t }) {
  if (!group) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      side
      size="lg"
      className="employee-detail-panel"
      title={group.employee?.name || t('ui_unknown')}
      subtitle={`${group.employee?.role || t('ui_not_provided')} · ${group.entries.length} ${t('lbl_entries')}`}
    >
      <div className="employee-detail-summary">
        <div><span>{t('lbl_total')}</span><strong>{group.totalHours.toFixed(1)}h</strong></div>
        <div><span>{t('we_normal_hours')}</span><strong>{group.normalHours.toFixed(1)}h</strong></div>
        <div><span>{t('we_normal_ot_short')}</span><strong>{group.normalOvertime.toFixed(1)}h</strong></div>
        <div><span>{t('we_weekend_ot_short')}</span><strong>{group.weekendOvertime.toFixed(1)}h</strong></div>
      </div>
      <div className="table-wrapper employee-detail-table">
        <table>
          <thead>
            <tr>
              <th>{t('lbl_date')}</th>
              <th>{t('lbl_project')}</th>
              <th>{t('dash_time')}</th>
              <th>{t('lbl_total')}</th>
              <th>{t('we_normal_hours')}</th>
              <th>{t('we_normal_ot_short')}</th>
              <th>{t('we_weekend_ot_short')}</th>
              <th>{t('lbl_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {group.entries.map(entry => {
              const project = getProjectById(entry.projectId);
              const company = getCompanyById(entry.companyId || project?.companyId);
              const breakdown = getWorkEntryBreakdown(entry);
              return (
                <tr key={entry.id}>
                  <td data-label={t('lbl_date')}>{entry.date}</td>
                  <td data-label={t('lbl_project')}>
                    <strong>{project?.name || '—'}</strong>
                    <small>{company?.name || '—'}</small>
                  </td>
                  <td data-label={t('dash_time')} style={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    {entry.startTime && entry.endTime ? `${entry.startTime}–${entry.endTime}` : '—'}
                  </td>
                  <td data-label={t('lbl_total')}><strong>{getWorkEntryHours(entry).toFixed(1)}h</strong></td>
                  <td data-label={t('we_normal_hours')}>{breakdown.normalHours.toFixed(1)}h</td>
                  <td data-label={t('we_normal_ot_short')}>{breakdown.normalOvertime.toFixed(1)}h</td>
                  <td data-label={t('we_weekend_ot_short')}>{breakdown.weekendOvertime.toFixed(1)}h</td>
                  <td data-label={t('lbl_actions')}>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_edit')}
                        onClick={() => onEdit(entry)}>
                        <Pencil size={15} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_delete')}
                        onClick={() => onDelete(entry)} style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {group.entries.length === 0 && <tr><td colSpan={7}>{t('we_no_entries')}</td></tr>}
            </tbody>
          </table>
      </div>
    </Modal>
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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [form,           setForm]          = useState(EMPTY);
  const [errors,         setErrors]        = useState({});
  const [submitError,    setSubmitError]   = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
  const employeeGroups = Object.values(filtered.reduce((groups, entry) => {
    const employeeId = entry.employeeId || 'unknown';
    const group = groups[employeeId] || {
      employeeId,
      employee: getEmployeeById(entry.employeeId),
      entries: [],
      totalHours: 0,
      normalHours: 0,
      normalOvertime: 0,
      weekendOvertime: 0,
      latestDate: entry.date,
    };
    const breakdown = getWorkEntryBreakdown(entry);
    group.entries.push(entry);
    group.totalHours += getWorkEntryHours(entry);
    group.normalHours += breakdown.normalHours;
    group.normalOvertime += breakdown.normalOvertime;
    group.weekendOvertime += breakdown.weekendOvertime;
    if (entry.date > group.latestDate) group.latestDate = entry.date;
    groups[employeeId] = group;
    return groups;
  }, {})).sort((a, b) => {
    const dateDiff = b.latestDate.localeCompare(a.latestDate);
    return dateDiff || (a.employee?.name || '').localeCompare(b.employee?.name || '');
  });
  const selectedEmployeeGroup = employeeGroups.find(group => group.employeeId === selectedEmployeeId);

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
    setSuccessMessage('');
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
    setSuccessMessage('');
    setView('form');
  };

  const handleSave = async () => {
    const e = {};
    const normalHours = form.normalHours === '' ? null : Number(form.normalHours);
    const normalOvertime = Number(form.normalOvertime || 0);
    const weekendOvertime = Number(form.weekendOvertime || 0);
    if (!form.date)                                                         e.date        = t('we_err_date');
    if (!form.employeeId)                                                   e.employeeId  = t('we_err_employee');
    if (!form.projectId)                                                    e.projectId   = t('we_err_project_required');
    if (!form.description?.trim())                                          e.description = t('we_err_description_required');
    if (!form.startTime || !form.endTime)                                    e.hours = t('we_err_time');
    if (form.description?.trim().length > 1000)                              e.description = t('we_err_description_length');
    if (normalHours !== null && (!Number.isFinite(normalHours) || normalHours < 0 || normalHours > 24)) e.normalHours = t('we_err_normal_hours');
    if (!Number.isFinite(normalOvertime) || normalOvertime < 0 || normalOvertime > 24) e.normalOvertime = t('we_err_overtime');
    if (!Number.isFinite(weekendOvertime) || weekendOvertime < 0 || weekendOvertime > 24) e.weekendOvertime = t('we_err_overtime');
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const proj = getProjectById(form.projectId);
    const calculatedNormalHours = calculateShiftHours(form.startTime, form.endTime);
    const data = {
      ...form,
      normalHours: form.normalHours === '' ? calculatedNormalHours : normalHours,
      normalOvertime,
      weekendOvertime,
      companyId: form.companyId || proj?.companyId || '',
    };
    try {
      if (editItem) await updateWorkEntry(editItem.id, data);
      else await addWorkEntry(data);
      setSubmitError('');
      setSuccessMessage(t(editItem ? 'we_update_success' : 'we_insert_success'));
      setView('list');
      setEditItem(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCancel = () => { setView('list'); setEditItem(null); setErrors({}); setSuccessMessage(''); };
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
  const successDialog = (
    <Modal
      isOpen={!!successMessage}
      onClose={() => setSuccessMessage('')}
      title={t('we_success_title')}
      size="sm"
      footer={<button className="btn btn-primary" onClick={() => setSuccessMessage('')}>{t('btn_ok')}</button>}
    >
      <div className="success-dialog">
        <CheckCircle size={28} />
        <p>{successMessage}</p>
      </div>
    </Modal>
  );

  if (view === 'form') {
    return (
      <>
        <FormView
          form={form} errors={errors} submitError={submitError} setField={setField}
          onSave={handleSave} onCancel={handleCancel} editItem={editItem}
          companies={companies} formProjects={formProjects}
          activeEmployees={activeEmployees} getCompanyById={getCompanyById} t={t}
        />
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          itemName={t('we_delete_item', [deleteTarget?.date])}
        />
        {successDialog}
      </>
    );
  }

  return (
    <>
      <ListView
        filtered={filtered} employeeGroups={employeeGroups} totalHours={totalHours}
        projects={projects} employees={employees} companies={companies}
        filterProjects={filterProjects}
        search={search} setSearch={setSearch}
        filterEmployee={filterEmployee} setFilterEmployee={setFilterEmployee}
        filterClient={filterClient} setFilterClient={setFilterClient}
        filterProject={filterProject} setFilterProject={setFilterProject}
        filterDate={filterDate} setFilterDate={setFilterDate}
        clearFilters={clearFilters} hasFilters={hasFilters}
        onAdd={openAdd}
        onEmployeeSelect={setSelectedEmployeeId}
        t={t} workEntries={workEntries}
      />
      <EmployeeDetailsModal
        group={selectedEmployeeGroup}
        getProjectById={getProjectById}
        getCompanyById={getCompanyById}
        onClose={() => setSelectedEmployeeId(null)}
        onEdit={item => { setSelectedEmployeeId(null); openEdit(item); }}
        onDelete={item => { setSelectedEmployeeId(null); setDeleteTarget(item); }}
        t={t}
      />
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
          itemName={t('we_delete_item', [deleteTarget?.date])}
      />
          {successDialog}
    </>
  );
}
