import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Components';
import { Users, Plus, Search, Pencil, Trash2, Phone, Mail } from 'lucide-react';

const EMPTY_FORM = { name: '', empId: '', role: '', phone: '', email: '', status: 'Active' };
const ROLES = ['Senior Welder', 'Pipe Welder', 'MIG/MAG Welder', 'TIG Welder', 'Welding Inspector', 'Foreman', 'Helper', 'Other'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

export default function Employees() {
  const {
    employees, addEmployee, updateEmployee, deleteEmployee,
    workEntries,
  } = useApp();
  const { t } = useLanguage();

  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [errors,        setErrors]        = useState({});

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
      status: item.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = t('emp_err_name');
    if (!form.empId.trim()) e.empId = t('emp_err_id');
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = t('emp_err_email');
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    if (editItem) updateEmployee(editItem.id, form);
    else addEmployee(form);
    setModalOpen(false);
  };

  const handleDelete = () => { deleteEmployee(deleteTarget.id); setDeleteTarget(null); };

  const getWorkCount = (empId) => workEntries.filter(w => w.employeeId === empId).length;
  const getTotalHrs  = (empId) => workEntries.filter(w => w.employeeId === empId).reduce((s, w) => s + (parseFloat(w.hours) || 0), 0).toFixed(1);

  const getInitials  = (name) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const avatarColors = ['#1D4ED8', '#16A34A', '#7C3AED', '#D97706', '#0891B2', '#DC2626'];

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
          <h2>{t('emp_title')}</h2>
          <p>{employees.length} {t('lbl_total')} · {employees.filter(e => e.status === 'Active').length} {t('lbl_active').toLowerCase()}</p>
        </div>
        <button id="add-employee-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> {t('btn_add_employee')}
        </button>
      </div>

      <div className="card">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input id="search-employees" placeholder={t('emp_search_ph')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">{t('emp_all_statuses')}</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('emp_col_employee')}</th>
                <th>{t('emp_col_id')}</th>
                <th>{t('emp_col_role')}</th>
                <th>Contact</th>
                <th>Work Log</th>
                <th>{t('emp_col_status')}</th>
                <th>{t('emp_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id}>
                  <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColors[i % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {getInitials(e.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{e.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-neutral">{e.empId}</span></td>
                  <td>{e.role || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {e.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><Phone size={11} color="var(--color-text-muted)" /> {e.phone}</span>}
                      {e.email && <a href={`mailto:${e.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none' }}><Mail size={11} /> {e.email}</a>}
                      {!e.phone && !e.email && <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{getTotalHrs(e.id)}h</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{getWorkCount(e.id)} {t('emp_entries')}</div>
                  </td>
                  <td><Badge status={e.status} /></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(e)}><Pencil size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => setDeleteTarget(e)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Users size={32} /></div>
                    <h3>{t('emp_empty_title')}</h3>
                    <p>{search ? t('emp_empty_search') : t('emp_empty_start')}</p>
                    {!search && <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> {t('btn_add_employee')}</button>}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? t('emp_modal_edit_title') : t('emp_modal_add_title')}
        subtitle={editItem ? t('emp_modal_edit_sub') : t('emp_modal_add_sub')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button>
          <button id="save-employee-btn" className="btn btn-primary" onClick={handleSubmit}>{editItem ? t('btn_save') : t('btn_add_employee')}</button>
        </>}
      >
        <div className="form-row">
          <FInput field="name"  label={t('emp_form_name')}  placeholder={t('emp_form_name_ph')}  required />
          <FInput field="empId" label={t('emp_form_id')}    placeholder={t('emp_form_id_ph')}    required />
        </div>
        <div className="form-group">
          <label>{t('emp_form_role')}</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="">{t('emp_form_role_ph')}</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-row">
          <FInput field="phone" label={t('emp_form_phone')} placeholder={t('emp_form_phone_ph')} />
          <FInput field="email" label={t('emp_form_email')} type="email" placeholder={t('emp_form_email_ph')} />
        </div>
        <div className="form-group">
          <label>{t('emp_form_status')}</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name} />
    </div>
  );
}
