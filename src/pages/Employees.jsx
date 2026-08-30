import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Components';
import { Users, Plus, Search, Pencil, Trash2, Phone, Mail, FolderKanban, Activity, Link2 } from 'lucide-react';

const EMPTY_FORM = { name: '', empId: '', role: '', phone: '', email: '', status: 'Active', assignedProjectId: '' };
const ROLES = ['Senior Welder', 'Pipe Welder', 'MIG/MAG Welder', 'TIG Welder', 'Welding Inspector', 'Foreman', 'Helper', 'Other'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

const WORK_STATUS_LABELS = {
  offline:        { label: 'Offline',        cls: 'badge-neutral'  },
  logged_in:      { label: 'Logged In',      cls: 'badge-warning'  },
  working:        { label: 'Working',        cls: 'badge-success'  },
  on_break:       { label: 'On Break',       cls: 'badge-info'     },
  work_completed: { label: 'Work Completed', cls: 'badge-info'     },
};

export default function Employees() {
  const {
    employees, addEmployee, updateEmployee, deleteEmployee,
    workEntries, projects, getProjectById, getEmployeeCurrentStatus,
    getAssignmentsByEmployee,
  } = useApp();
  const navigate = useNavigate();

  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [errors, setErrors]           = useState({});

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.name.toLowerCase().includes(q) || e.empId?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, empId: item.empId, role: item.role || '',
      phone: item.phone || '', email: item.email || '',
      status: item.status, assignedProjectId: item.assignedProjectId || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Employee name is required';
    if (!form.empId.trim()) e.empId = 'Employee ID is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const data = { ...form, assignedProjectId: form.assignedProjectId || null };
    if (editItem) updateEmployee(editItem.id, data);
    else addEmployee(data);
    setModalOpen(false);
  };

  const handleDelete = () => { deleteEmployee(deleteTarget.id); setDeleteTarget(null); };

  const getWorkCount = (empId) => workEntries.filter(w => w.employeeId === empId).length;
  const getTotalHrs  = (empId) => workEntries.filter(w => w.employeeId === empId).reduce((s, w) => s + (parseFloat(w.hours) || 0), 0).toFixed(1);

  const getInitials    = (name) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const avatarColors   = ['#1D4ED8', '#16A34A', '#7C3AED', '#D97706', '#0891B2', '#DC2626'];

  // Active projects for dropdown
  const activeProjects = projects.filter(p => p.status === 'Active');

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
          <h2>Employees</h2>
          <p>{employees.length} total · {employees.filter(e => e.status === 'Active').length} active</p>
        </div>
        <button id="add-employee-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="card">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input id="search-employees" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
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
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Role / Trade</th>
                <th>Assigned Project</th>
                <th>Live Status</th>
                <th>Work Log</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const assignedProject = e.assignedProjectId ? getProjectById(e.assignedProjectId) : null;
                const liveStatus      = getEmployeeCurrentStatus(e.id);
                const lsCfg           = WORK_STATUS_LABELS[liveStatus] || WORK_STATUS_LABELS.offline;
                return (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColors[i % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {getInitials(e.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{e.name}</div>
                          {e.phone && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={10} />{e.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{e.empId}</span></td>
                    <td>{e.role || '—'}</td>
                    <td>
                      {assignedProject ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FolderKanban size={13} color="var(--color-text-muted)" />
                            {assignedProject.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{assignedProject.number}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>— Not assigned —</span>
                      )}
                    </td>
                    <td>
                      {e.status === 'Active' ? (
                        <span className={`badge ${lsCfg.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                          <Activity size={10} />
                          {lsCfg.label}
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{getTotalHrs(e.id)}h</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{getWorkCount(e.id)} entries</div>
                    </td>
                    <td><Badge status={e.status} /></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Assign Project" onClick={() => navigate('/assignments')} style={{ color: 'var(--color-primary)' }}><Link2 size={15} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(e)}><Pencil size={15} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => setDeleteTarget(e)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Users size={32} /></div>
                    <h3>No employees found</h3>
                    <p>{search ? 'Try a different search.' : 'Add your first employee to get started.'}</p>
                    {!search && <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Employee</button>}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Employee' : 'Add Employee'}
        subtitle={editItem ? 'Update employee details' : 'Register a new team member'}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button id="save-employee-btn" className="btn btn-primary" onClick={handleSubmit}>{editItem ? 'Save Changes' : 'Add Employee'}</button>
        </>}
      >
        <div className="form-row">
          <FInput field="name"  label="Full Name"    placeholder="e.g. Johan Eriksson" required />
          <FInput field="empId" label="Employee ID"  placeholder="e.g. EMP-001"        required />
        </div>
        <div className="form-group">
          <label>Role / Trade</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="">-- Select Role --</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-row">
          <FInput field="phone" label="Phone Number"  placeholder="+46 70 123 4567" />
          <FInput field="email" label="Email Address" type="email" placeholder="employee@email.com" />
        </div>

        {/* ── Assign Project ── */}
        <div className="form-group">
          <label>Assign Project</label>
          <select
            value={form.assignedProjectId}
            onChange={e => setForm(f => ({ ...f, assignedProjectId: e.target.value }))}
          >
            <option value="">— No Project Assigned —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.number}) — {p.status}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
            💡 The assigned project will automatically appear on the employee's dashboard.
          </p>
        </div>

        <div className="form-group">
          <label>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name} />
    </div>
  );
}
