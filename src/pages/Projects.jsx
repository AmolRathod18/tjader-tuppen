import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Components';
import { FolderKanban, Plus, Search, Pencil, Trash2, MapPin, Calendar, Link2, Users } from 'lucide-react';

const EMPTY_FORM = { companyId: '', number: '', name: '', location: '', startDate: '', endDate: '', status: 'Active' };

const STATUS_OPTIONS = ['Active', 'Completed', 'On Hold'];

export default function Projects() {
  const { projects, companies, addProject, updateProject, deleteProject, getCompanyById, workEntries, getAssignmentsByProject } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.number?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q);
    const matchCompany = !filterCompany || p.companyId === filterCompany;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchCompany && matchStatus;
  });

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ companyId: item.companyId, number: item.number, name: item.name, location: item.location, startDate: item.startDate, endDate: item.endDate, status: item.status });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.companyId) e.companyId = 'Please select a client company';
    if (!form.number.trim()) e.number = 'Project number is required';
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    if (!form.endDate) e.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = 'End date must be after start date';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (editItem) updateProject(editItem.id, form);
    else addProject(form);
    setModalOpen(false);
  };

  const handleDelete = () => { deleteProject(deleteTarget.id); setDeleteTarget(null); };

  const getEntryCount = (projectId) => workEntries.filter(w => w.projectId === projectId).length;
  const getTotalHrs = (projectId) => {
    const hrs = workEntries.filter(w => w.projectId === projectId).reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);
    return hrs.toFixed(1);
  };

  const FInput = ({ field, label, type = 'text', placeholder, required }) => (
    <div className="form-group">
      <label>{label}{required ? ' *' : ''}</label>
      <input type={type} placeholder={placeholder} value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={errors[field] ? { borderColor: 'var(--color-danger)' } : {}} />
      {errors[field] && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors[field]}</p>}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h2>Projects</h2>
          <p>{projects.length} total projects · {projects.filter(p => p.status === 'Active').length} active</p>
        </div>
        <button id="add-project-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Project
        </button>
      </div>

      <div className="card">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input id="search-projects" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Project</th>
                <th>Client Company</th>
                <th>Location</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Assigned</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const company = getCompanyById(p.companyId);
                return (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EDFAF1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', flexShrink: 0 }}>
                          <FolderKanban size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.number}</div>
                        </div>
                      </div>
                    </td>
                    <td>{company?.name || <span className="text-muted">—</span>}</td>
                    <td>
                      {p.location ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} color="var(--color-text-muted)" />{p.location}</span> : '—'}
                    </td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} color="var(--color-text-muted)" />{p.startDate}</td>
                    <td>{p.endDate}</td>
                    <td>
                      {(() => { const count = getAssignmentsByProject(p.id).filter(a => a.status === 'Active').length; return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700 }}>{count}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>employee{count !== 1 ? 's' : ''}</span>
                        </div>
                      ); })()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{getTotalHrs(p.id)}h</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{getEntryCount(p.id)} entries</div>
                    </td>
                    <td><Badge status={p.status} /></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Assign Employee" onClick={() => navigate('/assignments')} style={{ color: 'var(--color-primary)' }}><Link2 size={15} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(p)}><Pencil size={15} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => setDeleteTarget(p)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><FolderKanban size={32} /></div>
                    <h3>No projects found</h3>
                    <p>{search ? 'Try a different search term.' : 'Create your first project to get started.'}</p>
                    {!search && <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Project</button>}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Project' : 'Create New Project'}
        subtitle={editItem ? 'Update project details' : 'Fill in all required fields'}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button id="save-project-btn" className="btn btn-primary" onClick={handleSubmit}>{editItem ? 'Save Changes' : 'Create Project'}</button>
        </>}
      >
        <div className="form-group">
          <label>Client Company *</label>
          <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
            style={errors.companyId ? { borderColor: 'var(--color-danger)' } : {}}>
            <option value="">-- Select Company --</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.companyId && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.companyId}</p>}
        </div>
        <div className="form-row">
          <FInput field="number" label="Project Number" placeholder="e.g. P-1015" required />
          <FInput field="name" label="Project Name" placeholder="e.g. Factory Welding" required />
        </div>
        <FInput field="location" label="Project Location" placeholder="e.g. Stockholm, Sweden" />
        <div className="form-row">
          <FInput field="startDate" label="Start Date" type="date" required />
          <FInput field="endDate" label="End Date" type="date" required />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="note-box" style={{ marginTop: 4 }}>
          💡 One Client Company can have multiple Projects.
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name} />
    </div>
  );
}
