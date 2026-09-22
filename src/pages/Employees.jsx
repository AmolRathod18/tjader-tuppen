import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Components';
import {
  Users, Plus, Search, Pencil, Trash2, Phone, Mail, Eye,
  Award, BriefcaseBusiness, MapPin, FileText,
} from 'lucide-react';
import { getWorkEntryBreakdown, getWorkEntryHours } from '../utils/workHours';

const EMPTY_FORM = {
  name: '', empId: '', role: '', phone: '', email: '', status: 'Active', photo: '',
  experience: '', skills: '', workType: '', certifications: '', joiningDate: '', notes: '',
};
const ROLES = ['Senior Welder', 'Pipe Welder', 'MIG/MAG Welder', 'TIG Welder', 'Welding Inspector', 'Foreman', 'Helper', 'Other'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

function EmployeeField({ field, label, type = 'text', placeholder, required, form, setForm, errors }) {
  return (
    <div className="form-group">
      <label>{label}{required ? ' *' : ''}</label>
      <input type={type} placeholder={placeholder} value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={errors[field] ? { borderColor: 'var(--color-danger)' } : {}} />
      {errors[field] && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors[field]}</p>}
    </div>
  );
}

export default function Employees() {
  const {
    employees, addEmployee, updateEmployee, deleteEmployee,
    workEntries, projects, companies, loadEmployees, loadWorkEntries,
  } = useApp();
  const { t } = useLanguage();

  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [profileEmployee, setProfileEmployee] = useState(null);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [errors,        setErrors]        = useState({});
  const [submitError,   setSubmitError]   = useState('');
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    Promise.all([loadEmployees(), loadWorkEntries()]).catch(error => setSubmitError(error.message));
  }, []);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.name.toLowerCase().includes(q) || e.empId?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setErrors({}); setSubmitError(''); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, empId: item.empId, role: item.role || '',
      phone: item.phone || '', email: item.email || '',
      status: item.status, photo: item.photo || item.photoUrl || '',
      experience: item.experience || '', skills: Array.isArray(item.skills) ? item.skills.join(', ') : (item.skills || ''),
      workType: item.workType || '', certifications: item.certifications || '',
      joiningDate: item.joiningDate || item.createdAt || '', notes: item.notes || '',
    });
    setErrors({});
    setSubmitError('');
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = t('emp_err_name');
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = t('emp_err_email');
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      if (editItem) await updateEmployee(editItem.id, form);
      else await addEmployee(form);
      setModalOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = () => { deleteEmployee(deleteTarget.id); setDeleteTarget(null); };

  const profileEntries = useMemo(() => {
    if (!profileEmployee) return [];
    return workEntries
      .filter(entry => entry.employeeId === profileEmployee.id)
      .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  }, [profileEmployee, workEntries]);

  const getWorkCount = (empId) => workEntries.filter(w => w.employeeId === empId).length;
  const getTotalHrs  = (empId) => workEntries.filter(w => w.employeeId === empId).reduce((s, w) => s + getWorkEntryHours(w), 0).toFixed(1);

  const getInitials  = (name) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const avatarColors = ['#B88A3B', '#527A5A', '#80683D', '#D97706', '#4B7A7A', '#B94A3D'];
  const formatDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not provided';
  const profileValue = (value) => value || 'Not provided';
  const getSkills = (employee) => Array.isArray(employee?.skills) ? employee.skills : (employee?.skills ? employee.skills.split(',').map(skill => skill.trim()).filter(Boolean) : []);

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

        <div className="table-wrapper table-employees">
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
                <tr
                  key={e.id}
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setProfileEmployee(e)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setProfileEmployee(e);
                    }
                  }}
                  aria-label={`Open profile for ${e.name}`}
                >
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
                      {e.email && <a href={`mailto:${e.email}`} onClick={event => event.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none' }}><Mail size={11} /> {e.email}</a>}
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
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={event => { event.stopPropagation(); openEdit(e); }}><Pencil size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View employee profile" onClick={event => { event.stopPropagation(); setProfileEmployee(e); }}><Eye size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={event => { event.stopPropagation(); setDeleteTarget(e); }} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
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

      {/* ── Employee Profile ── */}
      <Modal
        isOpen={!!profileEmployee}
        onClose={() => setProfileEmployee(null)}
        title="Employee Profile"
        subtitle={profileEmployee ? `${profileEmployee.name} · ${profileEmployee.empId}` : ''}
        size="xl"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setProfileEmployee(null)}>Close Profile</button>
          <button className="btn btn-primary" onClick={() => { const employee = profileEmployee; setProfileEmployee(null); openEdit(employee); }}><Pencil size={14} /> Edit Profile</button>
        </>}
      >
        {profileEmployee && (
          <div className="employee-profile">
            <div className="employee-profile-hero">
              <div className="employee-profile-avatar">
                {profileEmployee.photo || profileEmployee.photoUrl
                  ? <img src={profileEmployee.photo || profileEmployee.photoUrl} alt={profileEmployee.name} />
                  : getInitials(profileEmployee.name)}
              </div>
              <div className="employee-profile-heading">
                <div className="employee-profile-kicker">{profileEmployee.empId}</div>
                <h3>{profileEmployee.name}</h3>
                <p>{profileValue(profileEmployee.role)} <span>·</span> <Badge status={profileEmployee.status} /></p>
              </div>
              <div className="employee-profile-total">
                <strong>{profileEntries.reduce((sum, entry) => sum + getWorkEntryHours(entry), 0).toFixed(1)}h</strong>
                <span>Total hours logged</span>
              </div>
            </div>

            <div className="employee-profile-grid">
              <section className="employee-profile-section">
                <div className="employee-profile-section-title"><Users size={16} /><h4>Contact & employment</h4></div>
                <div className="employee-profile-details">
                  <div><span>Employee ID</span><strong>{profileValue(profileEmployee.empId)}</strong></div>
                  <div><span>Phone</span><strong>{profileValue(profileEmployee.phone)}</strong></div>
                  <div><span>Email</span><strong>{profileValue(profileEmployee.email)}</strong></div>
                  <div><span>Joining date</span><strong>{formatDate(profileEmployee.joiningDate || profileEmployee.createdAt)}</strong></div>
                  <div><span>Work type</span><strong>{profileValue(profileEmployee.workType)}</strong></div>
                  <div><span>Experience</span><strong>{profileValue(profileEmployee.experience)}</strong></div>
                </div>
              </section>

              <section className="employee-profile-section">
                <div className="employee-profile-section-title"><Award size={16} /><h4>Skills & certifications</h4></div>
                <div className="employee-profile-tags">
                  {getSkills(profileEmployee).length > 0 ? getSkills(profileEmployee).map(skill => <span key={skill}>{skill}</span>) : <em>Skills not provided</em>}
                </div>
                <div className="employee-profile-certification"><Award size={14} /><span>{profileValue(profileEmployee.certifications)}</span></div>
              </section>
            </div>

            <section className="employee-profile-section employee-profile-notes">
              <div className="employee-profile-section-title"><FileText size={16} /><h4>Notes</h4></div>
              <p>{profileValue(profileEmployee.notes)}</p>
            </section>

            <section className="employee-history">
              <div className="employee-history-heading">
                <div><h4>Work & project history</h4><p>Every recorded work entry connected to this employee.</p></div>
                <span>{profileEntries.length} entries</span>
              </div>
              {profileEntries.length === 0 ? (
                <div className="employee-history-empty">No work history recorded for this employee.</div>
              ) : (
                <div className="employee-history-list">
                  {profileEntries.map((entry, index) => {
                    const project = projects.find(item => item.id === entry.projectId);
                    const company = companies.find(item => item.id === (entry.companyId || project?.companyId));
                    return (
                      <article className="employee-history-item" key={entry.id}>
                        <div className="employee-history-marker"><span>{index + 1}</span></div>
                        <div className="employee-history-date"><strong>{formatDate(entry.date)}</strong><span>{entry.startTime || '—'} – {entry.endTime || '—'}</span></div>
                        <div className="employee-history-content">
                          <strong>{project?.name || 'Project not found'}</strong>
                          <span className="employee-history-client"><BriefcaseBusiness size={12} /> {company?.name || 'Client not provided'} {project?.location && <><MapPin size={12} /> {project.location}</>}</span>
                          <p>{entry.description || 'No work details recorded.'}{entry.remarks && ` · ${entry.remarks}`}</p>
                        </div>
                        <div className="employee-history-hours">
                          <strong>{getWorkEntryHours(entry).toFixed(1)}h</strong>
                          <span>Normal {getWorkEntryBreakdown(entry).normalHours.toFixed(1)}h · OT {getWorkEntryBreakdown(entry).normalOvertime.toFixed(1)}h · Weekend {getWorkEntryBreakdown(entry).weekendOvertime.toFixed(1)}h</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </Modal>

      {/* ── Add / Edit Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? t('emp_modal_edit_title') : t('emp_modal_add_title')}
        subtitle={editItem ? t('emp_modal_edit_sub') : t('emp_modal_add_sub')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button>
          <button id="save-employee-btn" className="btn btn-primary" onClick={handleSubmit}>{editItem ? t('btn_save') : t('btn_add_employee')}</button>
        </>}
      >
        {submitError && <div className="form-submit-error" role="alert">{submitError}</div>}
        <EmployeeField form={form} setForm={setForm} errors={errors} field="name" label={t('emp_form_name')} placeholder={t('emp_form_name_ph')} required />
        <div className="form-group">
          <label>{t('emp_form_role')}</label>
          <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="">{t('emp_form_role_ph')}</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-row">
          <EmployeeField form={form} setForm={setForm} errors={errors} field="phone" label={t('emp_form_phone')} placeholder={t('emp_form_phone_ph')} />
          <EmployeeField form={form} setForm={setForm} errors={errors} field="email" type="email" label={t('emp_form_email')} placeholder={t('emp_form_email_ph')} />
        </div>
        <div className="form-group">
          <label>{t('emp_form_status')}</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="profile-form-divider">Profile details</div>
        <div className="form-row">
          <EmployeeField form={form} setForm={setForm} errors={errors} field="photo" label="Photo URL" placeholder="https://..." />
          <EmployeeField form={form} setForm={setForm} errors={errors} field="joiningDate" type="date" label="Joining date" />
        </div>
        <div className="form-row">
          <EmployeeField form={form} setForm={setForm} errors={errors} field="experience" label="Experience" placeholder="e.g. 8 years" />
          <EmployeeField form={form} setForm={setForm} errors={errors} field="workType" label="Work type" placeholder="e.g. Field / Project-based" />
        </div>
        <div className="form-group">
          <label>Skills</label>
          <input placeholder="Separate skills with commas" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Certifications</label>
          <input placeholder="e.g. ISO 9606, Hot Work" value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea rows={3} placeholder="Add professional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name} />
    </div>
  );
}
