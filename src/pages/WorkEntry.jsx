import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import { ClipboardList, Plus, Search, Pencil, Trash2, Clock, Filter } from 'lucide-react';
import { calculateShiftHours, getWorkEntryHours } from '../utils/workHours';

const today = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  date: '',
  employeeId: '',
  companyId: '',
  projectId: '',
  description: '',
  startTime: '',
  endTime: '',
  hours: '',
  remarks: '',
};


export default function WorkEntry() {
  const {
    workEntries, projects, employees, companies,
    addWorkEntry, updateWorkEntry, deleteWorkEntry,
    getProjectById, getEmployeeById, getCompanyById,
  } = useApp();
  const { t } = useLanguage();

  const [search,         setSearch]         = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterClient,   setFilterClient]   = useState('');
  const [filterProject,  setFilterProject]  = useState('');
  const [filterDate,     setFilterDate]     = useState('');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editItem,       setEditItem]       = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [errors,         setErrors]         = useState({});
  const [submitError,    setSubmitError]   = useState('');

  // Projects filtered by selected client (when selecting in form)
  const formProjects = form.companyId
    ? projects.filter(p => p.companyId === form.companyId)
    : projects;

  // Projects filtered by selected client (in list filter)
  const filterProjects = filterClient
    ? projects.filter(p => p.companyId === filterClient && p.name?.trim())
    : projects.filter(p => p.name?.trim());

  const filterEmployees = employees.filter(e => e.name?.trim());
  const filterCompanies = companies.filter(c => c.name?.trim());

  const employeeEntries = filterEmployee
    ? workEntries.filter(w => w.employeeId === filterEmployee)
    : workEntries;
  const employeeProjectIds = new Set(employeeEntries.map(w => w.projectId));
  const employeeClientIds = new Set(employeeEntries.map(w => {
    const project = getProjectById(w.projectId);
    return w.companyId || project?.companyId;
  }).filter(Boolean));
  const availableCompanies = filterEmployee
    ? companies.filter(c => employeeClientIds.has(c.id))
    : companies;
  const availableProjects = filterProjects.filter(p => employeeProjectIds.has(p.id));

  const activeEmployees = employees.filter(e => e.status === 'Active');

  const filtered = workEntries
    .filter(w => {
      const emp  = getEmployeeById(w.employeeId);
      const proj = getProjectById(w.projectId);
      const co   = getCompanyById(w.companyId || proj?.companyId);
      const q    = search.toLowerCase();
      const matchSearch   = !q || emp?.name?.toLowerCase().includes(q) || proj?.name?.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q) || co?.name?.toLowerCase().includes(q);
      const matchEmployee = !filterEmployee || w.employeeId === filterEmployee;
      const matchClient   = !filterClient   || (w.companyId || proj?.companyId) === filterClient;
      const matchProject  = !filterProject  || w.projectId === filterProject;
      const matchDate     = !filterDate     || w.date === filterDate;
      return matchSearch && matchEmployee && matchClient && matchProject && matchDate;
    })
    .sort((a, b) => {
      const dd = b.date.localeCompare(a.date);
      return dd !== 0 ? dd : b.createdAt?.localeCompare(a.createdAt || '') || 0;
    });

  const totalHours = filtered.reduce((s, w) => s + getWorkEntryHours(w), 0);
  const selectedEmployee = filterEmployee ? getEmployeeById(filterEmployee) : null;

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, date: today() });
    setErrors({});
    setSubmitError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const proj = getProjectById(item.projectId);
    setForm({
      date:        item.date        || '',
      employeeId:  item.employeeId  || '',
      companyId:   item.companyId   || proj?.companyId || '',
      projectId:   item.projectId   || '',
      description: item.description || '',
      startTime:   item.startTime   || '',
      endTime:     item.endTime     || '',
      hours:       getWorkEntryHours(item) || '',
      remarks:     item.remarks     ?? item.notes ?? '',
    });
    setErrors({});
    setSubmitError('');
    setModalOpen(true);
  };

  const setField = (field, value) => {
    setForm(f => {
      const next = { ...f, [field]: value };
      // Auto-calculate hours when start/end change
      if (field === 'startTime' || field === 'endTime') {
        const st = field === 'startTime' ? value : f.startTime;
        const et = field === 'endTime'   ? value : f.endTime;
        const h = calculateShiftHours(st, et);
          next.hours = h === null ? '' : h;
      }
      // Reset project when client changes
      if (field === 'companyId') next.projectId = '';
      return next;
    });
  };

  const validate = () => {
    const e = {};
    if (!form.date)        e.date        = 'Date is required';
    if (!form.employeeId)  e.employeeId  = 'Employee is required';
    if (!form.projectId)   e.projectId   = 'Project is required';
    if (!form.description?.trim()) e.description = 'Work description is required';
    const calculatedHours = calculateShiftHours(form.startTime, form.endTime);
    if (calculatedHours === null || calculatedHours <= 0) e.hours = 'Start and end time are required';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const proj = getProjectById(form.projectId);
    const calculatedHours = calculateShiftHours(form.startTime, form.endTime);
    const data = {
      ...form,
      hours:     calculatedHours,
      companyId: form.companyId || proj?.companyId || '',
    };
    try {
      if (editItem) updateWorkEntry(editItem.id, data);
      else          addWorkEntry(data);
      setModalOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = () => { deleteWorkEntry(deleteTarget.id); setDeleteTarget(null); };

  const Err = ({ field }) => errors[field]
    ? <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors[field]}</p>
    : null;

  const clearFilters = () => {
    setSearch(''); setFilterEmployee(''); setFilterClient('');
    setFilterProject(''); setFilterDate('');
  };

  const hasFilters = search || filterEmployee || filterClient || filterProject || filterDate;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('we_title')}</h2>
          <p>
            {selectedEmployee ? `${selectedEmployee.name} · ` : 'All Employees · '}
            {filtered.length} {t('lbl_entries')} · {totalHours.toFixed(1)}h total
          </p>
        </div>
        <button id="add-work-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> {t('we_btn_log')}
        </button>
      </div>

      {/* Summary row */}
      <div className="summary-row" style={{ marginBottom: 20 }}>
        <div className="summary-item">
          <p>Filtered Entries</p>
          <h4>{filtered.length}</h4>
        </div>
        <div className="summary-item">
          <p>Filtered Hours</p>
          <h4>{totalHours.toFixed(1)}h</h4>
        </div>
        <div className="summary-item">
          <p>Avg Hours/Entry</p>
          <h4>{filtered.length > 0 ? (totalHours / filtered.length).toFixed(1) : '0'}h</h4>
        </div>
        <div className="summary-item">
          <p>Active Projects</p>
          <h4>{availableProjects.filter(p => p.status === 'Active').length}</h4>
        </div>
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: 180 }}>
              <Search size={16} className="search-icon" />
              <input id="search-entries" placeholder="Search employee, project, description..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="work-entry-date-filter">
              <label htmlFor="work-entry-date-filter">Date</label>
              <input
                id="work-entry-date-filter"
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                title="Filter by date"
                aria-label="Filter by date"
              />
            </div>
            <select value={filterEmployee} onChange={e => {
              setFilterEmployee(e.target.value);
              setFilterClient('');
              setFilterProject('');
            }} style={{ maxWidth: 180 }}>
              <option value="">All Employees</option>
              {filterEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={filterClient} onChange={e => { setFilterClient(e.target.value); setFilterProject(''); }} style={{ maxWidth: 200 }}>
              <option value="">All Clients</option>
              {availableCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="">All Projects</option>
              {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <Filter size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="table-wrapper table-work-entries">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Client</th>
                <th>Project</th>
                <th>Hours</th>
                <th>Time</th>
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
                      <div style={{ fontWeight: 600 }}>{employee?.name || '-'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{employee?.role}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{co?.name || '-'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{project?.name || '-'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{project?.number}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="var(--color-primary)" />
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{getWorkEntryHours(w)}h</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {w.startTime && w.endTime ? `${w.startTime}-${w.endTime}` : '-'}
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.description || '-'}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', maxWidth: 130 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.remarks || '-'}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(w)}><Pencil size={15} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => setDeleteTarget(w)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
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
                    <p>{hasFilters ? 'No entries match the current filters.' : 'Start by logging the first work entry.'}</p>
                    {!hasFilters && <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> {t('we_btn_log')}</button>}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* -- Add / Edit Modal -- */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Work Entry' : 'Log Daily Work Entry'}
        subtitle={editItem ? 'Update the work entry details.' : 'Manually enter the work details for a day.'}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button id="save-work-btn" className="btn btn-primary" onClick={handleSubmit}>{editItem ? 'Save Changes' : t('we_btn_log')}</button>
        </>}
      >
        {submitError && <div className="form-submit-error" role="alert">{submitError}</div>}
        {/* Date */}
        <div className="form-group">
          <label>Date *</label>
          <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} style={errors.date ? { borderColor: 'var(--color-danger)' } : {}} />
          <Err field="date" />
        </div>

        {/* Employee */}
        <div className="form-group">
          <label>Employee *</label>
          <select value={form.employeeId} onChange={e => setField('employeeId', e.target.value)} style={errors.employeeId ? { borderColor: 'var(--color-danger)' } : {}}>
            <option value="">Select employee...</option>
            {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name} - {e.role}</option>)}
          </select>
          <Err field="employeeId" />
        </div>

        {/* Client â†’ then Project */}
        <div className="form-row">
          <div className="form-group">
            <label>Client Company</label>
            <select value={form.companyId} onChange={e => setField('companyId', e.target.value)}>
              <option value="">All clients...</option>
              {filterCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Project *</label>
            <select value={form.projectId} onChange={e => setField('projectId', e.target.value)} style={errors.projectId ? { borderColor: 'var(--color-danger)' } : {}}>
              <option value="">Select project...</option>
              {formProjects.map(p => {
                const co = getCompanyById(p.companyId);
                return <option key={p.id} value={p.id}>{p.name}{co ? ` (${co.name})` : ''}</option>;
              })}
            </select>
            <Err field="projectId" />
          </div>
        </div>

        {/* Start / End Time */}
        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <input type="time" value={form.startTime} onChange={e => setField('startTime', e.target.value)} />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input type="time" value={form.endTime} onChange={e => setField('endTime', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Total Hours *</label>
            <input
                type="text"
                value={calculateShiftHours(form.startTime, form.endTime) === null ? 'Select start and end time' : `${calculateShiftHours(form.startTime, form.endTime)} hours`}
                readOnly
                aria-readonly="true"
                style={{ background: 'var(--color-bg)', cursor: 'default', ...(errors.hours ? { borderColor: 'var(--color-danger)' } : {}) }}
              />
            <Err field="hours" />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Work Description *</label>
          <textarea
            placeholder="Describe the work performed..."
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            style={errors.description ? { borderColor: 'var(--color-danger)' } : {}}
          />
          <Err field="description" />
        </div>

        {/* Remarks */}
        <div className="form-group">
          <label>Remarks</label>
          <textarea
            placeholder="Any additional notes or remarks..."
            value={form.remarks}
            onChange={e => setField('remarks', e.target.value)}
            style={{ minHeight: 60 }}
          />
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={`work entry on ${deleteTarget?.date}`}
      />
    </div>
  );
}
