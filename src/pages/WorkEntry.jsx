import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import { ClipboardList, Plus, Search, Pencil, Trash2, Clock } from 'lucide-react';

const EMPTY_FORM = { projectId: '', employeeId: '', date: '', hours: '', description: '', notes: '' };

export default function WorkEntry() {
  const { workEntries, projects, employees, addWorkEntry, updateWorkEntry, deleteWorkEntry, getProjectById, getEmployeeById, getCompanyById } = useApp();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const today = new Date().toISOString().split('T')[0];
  const activeProjects = projects.filter(p => p.status === 'Active');
  const activeEmployees = employees.filter(e => e.status === 'Active');

  const filtered = workEntries
    .filter(w => {
      const emp = getEmployeeById(w.employeeId);
      const proj = getProjectById(w.projectId);
      const q = search.toLowerCase();
      const matchSearch = emp?.name?.toLowerCase().includes(q) || proj?.name?.toLowerCase().includes(q) || w.description?.toLowerCase().includes(q);
      const matchProject = !filterProject || w.projectId === filterProject;
      const matchDate = !filterDate || w.date === filterDate;
      return matchSearch && matchProject && matchDate;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalHours = filtered.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, date: today });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ projectId: item.projectId, employeeId: item.employeeId, date: item.date, hours: item.hours, description: item.description, notes: item.notes });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.projectId) e.projectId = t('we_err_project');
    if (!form.employeeId) e.employeeId = t('we_err_employee');
    if (!form.date) e.date = t('we_err_date');
    if (!form.hours || isNaN(form.hours) || parseFloat(form.hours) <= 0) e.hours = t('we_err_hours');
    if (parseFloat(form.hours) > 24) e.hours = t('we_err_hours');
    if (!form.description.trim()) e.description = t('we_err_description');
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const data = { ...form, hours: parseFloat(form.hours) };
    if (editItem) updateWorkEntry(editItem.id, data);
    else addWorkEntry(data);
    setModalOpen(false);
  };

  const handleDelete = () => { deleteWorkEntry(deleteTarget.id); setDeleteTarget(null); };

  const Err = ({ field }) => errors[field] ? <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors[field]}</p> : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('we_title')}</h2>
          <p>{workEntries.length} {t('lbl_entries')} · {totalHours.toFixed(1)}h</p>
        </div>
        <button id="add-work-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> {t('we_btn_log')}
        </button>
      </div>

      {/* Summary row */}
      <div className="summary-row" style={{ marginBottom: 20 }}>
        <div className="summary-item">
          <p>{t('we_total_entries')}</p>
          <h4>{filtered.length}</h4>
        </div>
        <div className="summary-item">
          <p>{t('we_total_hours')}</p>
          <h4>{totalHours.toFixed(1)}h</h4>
        </div>
        <div className="summary-item">
          <p>{t('we_avg_hours')}</p>
          <h4>{filtered.length > 0 ? (totalHours / filtered.length).toFixed(1) : '0'}h</h4>
        </div>
        <div className="summary-item">
          <p>{t('lbl_active')}</p>
          <h4>{activeProjects.length}</h4>
        </div>
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input id="search-entries" placeholder={t('emp_search_ph')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">{t('we_all_projects')}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ maxWidth: 180 }} title={t('lbl_date')} />
          {filterDate && <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate('')}>{t('btn_clear')}</button>}
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('we_col_date')}</th>
                <th>{t('we_col_project')}</th>
                <th>{t('we_col_employee')}</th>
                <th>{t('we_col_hours')}</th>
                <th>{t('we_col_description')}</th>
                <th>{t('we_col_notes')}</th>
                <th>{t('we_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, i) => {
                const project = getProjectById(w.projectId);
                const employee = getEmployeeById(w.employeeId);
                return (
                  <tr key={w.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{w.date}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {new Date(w.date).toLocaleDateString('en-SE', { weekday: 'short' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{project?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{project?.number}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{employee?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{employee?.role}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} color="var(--color-primary)" />
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{w.hours}h</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.description}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', maxWidth: 150 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.notes || '—'}
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
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><ClipboardList size={32} /></div>
                    <h3>{t('we_empty_title')}</h3>
                    <p>{search || filterProject || filterDate ? t('we_empty_search') : t('we_empty_start')}</p>
                    {!search && !filterProject && !filterDate && <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> {t('we_btn_log')}</button>}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? t('we_modal_edit_title') : t('we_modal_add_title')}
        subtitle={editItem ? t('we_modal_edit_sub') : t('we_modal_add_sub')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button>
          <button id="save-work-btn" className="btn btn-primary" onClick={handleSubmit}>{editItem ? t('btn_save') : t('we_btn_log')}</button>
        </>}
      >
        <div className="form-group">
          <label>{t('we_form_project')}</label>
          <select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} style={errors.projectId ? { borderColor: 'var(--color-danger)' } : {}}>
            <option value="">{t('we_form_project_ph')}</option>
            {activeProjects.map(p => {
              const co = getCompanyById(p.companyId);
              return <option key={p.id} value={p.id}>{p.name} ({co?.name || 'Unknown'})</option>;
            })}
          </select>
          <Err field="projectId" />
        </div>
        <div className="form-group">
          <label>{t('we_form_employee')}</label>
          <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} style={errors.employeeId ? { borderColor: 'var(--color-danger)' } : {}}>
            <option value="">{t('we_form_employee_ph')}</option>
            {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
          </select>
          <Err field="employeeId" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>{t('we_form_date')}</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={errors.date ? { borderColor: 'var(--color-danger)' } : {}} />
            <Err field="date" />
          </div>
          <div className="form-group">
            <label>{t('we_form_hours')}</label>
            <input type="number" step="0.5" min="0.5" max="24" placeholder={t('we_form_hours_ph')} value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} style={errors.hours ? { borderColor: 'var(--color-danger)' } : {}} />
            <Err field="hours" />
          </div>
        </div>
        <div className="form-group">
          <label>{t('we_form_description')}</label>
          <textarea placeholder={t('we_form_description_ph')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={errors.description ? { borderColor: 'var(--color-danger)' } : {}} />
          <Err field="description" />
        </div>
        <div className="form-group">
          <label>{t('we_form_notes')}</label>
          <textarea placeholder={t('we_form_notes_ph')} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ minHeight: 60 }} />
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={`work entry on ${deleteTarget?.date}`} />
    </div>
  );
}
