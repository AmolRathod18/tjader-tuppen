import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Modal, ConfirmDeleteModal } from '../../components/ui/Modal';
import {
  Link2, Plus, Search, Pencil, Trash2, FolderKanban,
  Users, Calendar, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

const EMPTY_FORM = {
  employeeId: '', projectId: '', startDate: '', endDate: '',
  status: 'Active', notes: '',
};
const STATUS_OPTIONS = ['Active', 'Inactive', 'Completed'];

const STATUS_CFG = {
  Active:    { cls: 'badge-success', label: 'Active'    },
  Inactive:  { cls: 'badge-neutral', label: 'Inactive'  },
  Completed: { cls: 'badge-info',    label: 'Completed' },
};

export default function Assignments() {
  const {
    assignments, addAssignment, updateAssignment, deleteAssignment,
    employees, projects, companies,
    getEmployeeById, getProjectById, getCompanyById, hasAssignment,
  } = useApp();
  const { t } = useLanguage();

  const [search,       setSearch]       = useState('');
  const [filterEmp,    setFilterEmp]    = useState('');
  const [filterProj,   setFilterProj]   = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [errors,       setErrors]       = useState({});

  // Pre-fill from URL-like context (employee or project pre-select)
  const [preEmployee, setPreEmployee]   = useState('');
  const [preProject,  setPreProject]    = useState('');

  const activeEmps  = employees.filter(e => e.status === 'Active');
  const allProjects = projects;

  // ── Filtered list ──
  const filtered = assignments
    .filter(a => {
      const emp  = getEmployeeById(a.employeeId);
      const proj = getProjectById(a.projectId);
      const q    = search.toLowerCase();
      const matchSearch  = !search ||
        emp?.name?.toLowerCase().includes(q) ||
        emp?.empId?.toLowerCase().includes(q) ||
        proj?.name?.toLowerCase().includes(q) ||
        proj?.number?.toLowerCase().includes(q);
      const matchEmp     = !filterEmp    || a.employeeId === filterEmp;
      const matchProj    = !filterProj   || a.projectId  === filterProj;
      const matchStatus  = !filterStatus || a.status     === filterStatus;
      return matchSearch && matchEmp && matchProj && matchStatus;
    })
    .sort((a, b) => b.createdAt?.localeCompare(a.createdAt) || 0);

  // ── Stats ──
  const totalActive    = assignments.filter(a => a.status === 'Active').length;
  const totalInactive  = assignments.filter(a => a.status === 'Inactive').length;
  const totalCompleted = assignments.filter(a => a.status === 'Completed').length;

  // ── Modal helpers ──
  const openAdd = (empId = '', projId = '') => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, employeeId: empId, projectId: projId });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      employeeId: item.employeeId,
      projectId:  item.projectId,
      startDate:  item.startDate,
      endDate:    item.endDate,
      status:     item.status,
      notes:      item.notes || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.employeeId) e.employeeId = t('asgn_err_employee');
    if (!form.projectId)  e.projectId  = t('asgn_err_project');
    if (!form.startDate)  e.startDate  = t('asgn_err_start');
    if (!form.endDate)    e.endDate    = t('asgn_err_end');
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = t('asgn_err_dates');
    if (hasAssignment(form.employeeId, form.projectId, editItem?.id))
      e.projectId = t('asgn_err_duplicate');
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (editItem) updateAssignment(editItem.id, form);
    else addAssignment(form);
    setModalOpen(false);
  };

  const handleDelete = () => { deleteAssignment(deleteTarget.id); setDeleteTarget(null); };

  const avatarColors = ['#1D4ED8', '#16A34A', '#7C3AED', '#D97706', '#0891B2', '#DC2626'];
  const getInitials  = (name = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const empIndex     = (id) => employees.findIndex(e => e.id === id);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('asgn_title')}</h2>
          <p>{assignments.length} {t('lbl_total')} · {totalActive} {t('lbl_active').toLowerCase()}</p>
        </div>
        <button id="add-assignment-btn" className="btn btn-primary" onClick={() => openAdd()}>
          <Plus size={16} /> {t('btn_assign_project')}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card green">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <p>{t('asgn_stat_active')}</p>
            <h3>{totalActive}</h3>
            <small>{t('asgn_stat_active_sub')}</small>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <p>{t('asgn_stat_employees')}</p>
            <h3>{[...new Set(assignments.filter(a => a.status === 'Active').map(a => a.employeeId))].length}</h3>
            <small>{t('asgn_stat_employees_sub')}</small>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><FolderKanban size={24} /></div>
          <div className="stat-info">
            <p>{t('asgn_stat_projects')}</p>
            <h3>{[...new Set(assignments.filter(a => a.status === 'Active').map(a => a.projectId))].length}</h3>
            <small>{t('asgn_stat_projects_sub')}</small>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><Clock size={24} /></div>
          <div className="stat-info">
            <p>{t('asgn_stat_completed')}</p>
            <h3>{totalCompleted}</h3>
            <small>{t('asgn_stat_completed_sub')}</small>
          </div>
        </div>
      </div>

      {/* ── Quick-assign per project ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div><h3>{t('asgn_quick_title')}</h3><p>{t('asgn_quick_sub')}</p></div>
          <FolderKanban size={20} color="var(--color-text-muted)" />
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {projects.filter(p => p.status === 'Active').map(p => {
            const assigned = assignments.filter(a => a.projectId === p.id && a.status === 'Active').length;
            const company  = getCompanyById(p.companyId);
            return (
              <div key={p.id} style={{
                padding: '12px 16px', background: 'var(--color-bg)', borderRadius: 12,
                border: '1.5px solid var(--color-border-light)', minWidth: 200, flex: '1 1 200px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.number} · {company?.name}</div>
                  </div>
                  <span className="badge badge-success">{assigned} {t('asgn_assigned')}</span>
                </div>
                {/* Assigned avatars */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {assignments.filter(a => a.projectId === p.id && a.status === 'Active').map(a => {
                    const emp = getEmployeeById(a.employeeId);
                    const idx = empIndex(a.employeeId);
                    return emp ? (
                      <div key={a.id} title={emp.name} style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: avatarColors[idx % 6],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 9,
                      }}>
                        {getInitials(emp.name)}
                      </div>
                    ) : null;
                  })}
                  <button
                    onClick={() => openAdd('', p.id)}
                    title="Add employee to this project"
                    style={{
                      width: 26, height: 26, borderRadius: '50%',
                      border: '2px dashed var(--color-border-light)',
                      background: 'transparent', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1,
                    }}
                  >+</button>
                </div>
              </div>
            );
          })}
          {projects.filter(p => p.status === 'Active').length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{t('asgn_no_active_projects')}</p>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 24px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input placeholder={t('asgn_search_ph')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{t('asgn_filter_employee')}</label>
            <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="">{t('asgn_all_employees')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.empId})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{t('asgn_filter_project')}</label>
            <select value={filterProj} onChange={e => setFilterProj(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="">{t('asgn_all_projects')}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{t('asgn_filter_status')}</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 150 }}>
              <option value="">{t('asgn_all_statuses')}</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {(search || filterEmp || filterProj || filterStatus) && (
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 0 }}
              onClick={() => { setSearch(''); setFilterEmp(''); setFilterProj(''); setFilterStatus(''); }}>
              {t('btn_clear')}
            </button>
          )}
        </div>
      </div>

      {/* ── Assignments Table ── */}
      <div className="card">
        <div className="card-header">
          <div><h3>{t('asgn_table_title')}</h3><p>{filtered.length} {t('asgn_records')}</p></div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('asgn_col_num')}</th>
                <th>{t('asgn_col_employee')}</th>
                <th>{t('asgn_col_project')}</th>
                <th>{t('asgn_col_company')}</th>
                <th>{t('asgn_col_start')}</th>
                <th>{t('asgn_col_end')}</th>
                <th>{t('asgn_col_status')}</th>
                <th>{t('asgn_col_notes')}</th>
                <th>{t('asgn_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const emp  = getEmployeeById(a.employeeId);
                const proj = getProjectById(a.projectId);
                const co   = getCompanyById(proj?.companyId);
                const idx  = empIndex(a.employeeId);
                const cfg  = STATUS_CFG[a.status] || STATUS_CFG.Inactive;
                return (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarColors[idx % 6], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {getInitials(emp?.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{emp?.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp?.empId} · {emp?.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FolderKanban size={13} color="var(--color-text-muted)" />
                        {proj?.name || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{proj?.number}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{co?.name || '—'}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} color="var(--color-text-muted)" />
                        {a.startDate}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{a.endDate}</td>
                    <td><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                    <td style={{ maxWidth: 180 }}>
                      {a.notes
                        ? <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }} title={a.notes}>{a.notes.slice(0, 40)}{a.notes.length > 40 ? '…' : ''}</span>
                        : '—'}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(a)}><Pencil size={15} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Remove" onClick={() => setDeleteTarget(a)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Link2 size={32} /></div>
                    <h3>{t('asgn_empty_title')}</h3>
                    <p>{search || filterEmp || filterProj ? t('asgn_empty_search') : t('asgn_empty_start')}</p>
                    {!search && !filterEmp && !filterProj && (
                      <button className="btn btn-primary" onClick={() => openAdd()}><Plus size={16} /> {t('btn_assign_project')}</button>
                    )}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? t('asgn_modal_edit_title') : t('asgn_modal_add_title')}
        subtitle={editItem ? t('asgn_modal_edit_sub') : t('asgn_modal_add_sub')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button>
          <button id="save-assignment-btn" className="btn btn-primary" onClick={handleSubmit}>
            {editItem ? t('btn_save') : t('btn_create_assignment')}
          </button>
        </>}
      >
        {/* Employee */}
        <div className="form-group">
          <label>{t('asgn_form_employee')}</label>
          <select
            value={form.employeeId}
            onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
            style={errors.employeeId ? { borderColor: 'var(--color-danger)' } : {}}
            disabled={!!editItem}
          >
            <option value="">{t('asgn_form_employee_ph')}</option>
            {employees.filter(e => e.status === 'Active').map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.empId}) · {e.role}</option>
            ))}
          </select>
          {errors.employeeId && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.employeeId}</p>}
        </div>

        {/* Project */}
        <div className="form-group">
          <label>{t('asgn_form_project')}</label>
          <select
            value={form.projectId}
            onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
            style={errors.projectId ? { borderColor: 'var(--color-danger)' } : {}}
            disabled={!!editItem}
          >
            <option value="">{t('asgn_form_project_ph')}</option>
            {projects.map(p => {
              const co = getCompanyById(p.companyId);
              return (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.number}) — {co?.name} [{p.status}]
                </option>
              );
            })}
          </select>
          {errors.projectId && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.projectId}</p>}
          {editItem && (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {t('asgn_form_edit_note')}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="form-row">
          <div className="form-group">
            <label>{t('asgn_form_start')}</label>
            <input type="date" value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              style={errors.startDate ? { borderColor: 'var(--color-danger)' } : {}} />
            {errors.startDate && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.startDate}</p>}
          </div>
          <div className="form-group">
            <label>{t('asgn_form_end')}</label>
            <input type="date" value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              style={errors.endDate ? { borderColor: 'var(--color-danger)' } : {}} />
            {errors.endDate && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.endDate}</p>}
          </div>
        </div>

        {/* Status */}
        <div className="form-group">
          <label>{t('asgn_form_status')}</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label>{t('asgn_form_notes')}</label>
          <textarea
            placeholder={t('asgn_form_notes_ph')}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            style={{ minHeight: 70 }}
          />
        </div>

        <div className="note-box" style={{ marginTop: 4 }}>
          {t('asgn_note')}
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={`${getEmployeeById(deleteTarget?.employeeId)?.name} ↔ ${getProjectById(deleteTarget?.projectId)?.name}`}
      />
    </div>
  );
}
