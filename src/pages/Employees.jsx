import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Components';
import {
  Users, Plus, Search, Pencil, Trash2, Phone, Mail, Eye,
  Award, BriefcaseBusiness, MapPin, FileText, CheckCircle,
} from 'lucide-react';
import { getWorkEntryBreakdown, getWorkEntryHours } from '../utils/workHours';
import DatePicker from '../components/ui/DatePicker';

const EMPTY_FORM = {
  name: '', empId: '', role: '', phone: '', email: '', status: 'Active',
  customRole: '', experience: '', skills: '', workType: '', certifications: '', joiningDate: '', notes: '',
};
const ROLES = [
  ['Pipe Welder', 'role_pipe_welder'],
  ['Industrial Welder', 'role_industrial_welder'], ['Welder', 'role_welder'],
  ['Gas Welding', 'role_gas_welding'], ['Junior Welder', 'role_junior_welder'],
  ['SR Welder', 'role_sr_welder'],
  ['Other', 'role_other'],
];
const STATUS_OPTIONS = ['Active', 'Inactive'];

function EmployeeField({ field, label, type = 'text', placeholder, required, form, setForm, errors }) {
  return (
    <div className="form-group">
      <label>{label}{required ? ' *' : ''}</label>
      {type === 'date' ? (
        <DatePicker value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
      ) : (
        <input type={type} placeholder={placeholder} value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          style={errors[field] ? { borderColor: 'var(--color-danger)' } : {}} />
      )}
      {errors[field] && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors[field]}</p>}
    </div>
  );
}

export default function Employees() {
  const {
    employees, addEmployee, updateEmployee, deleteEmployee,
    workEntries, projects, companies, loadEmployees, loadWorkEntries, loadProjects, loadCompanies,
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
  const [successMessage, setSuccessMessage] = useState('');
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    Promise.all([loadEmployees(), loadWorkEntries(), loadProjects(), loadCompanies()]).catch(error => setSubmitError(error.message));
  }, []);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.name.toLowerCase().includes(q) || e.empId?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setErrors({}); setSubmitError(''); setSuccessMessage(''); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, empId: item.empId, role: ROLES.some(([role]) => role === item.role) ? item.role : (item.role ? 'Other' : ''),
      phone: item.phone || '', email: item.email || '',
      status: item.status,
      customRole: ROLES.some(([role]) => role === item.role) ? '' : (item.role || ''),
      experience: item.experience || '', skills: Array.isArray(item.skills) ? item.skills.join(', ') : (item.skills || ''),
      workType: item.workType || '', certifications: item.certifications || '',
      joiningDate: item.joiningDate || item.createdAt || '', notes: item.notes || '',
    });
    setErrors({});
    setSubmitError('');
    setSuccessMessage('');
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    if (!name) e.name = t('emp_err_name');
    else if (name.length < 2 || name.length > 100) e.name = t('emp_err_name_length');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('emp_err_email');
    if (phone && !/^\+?[0-9 ()-]{7,20}$/.test(phone)) e.phone = t('emp_err_phone');
    if (form.status && !STATUS_OPTIONS.includes(form.status)) e.status = t('emp_err_status');
    if (form.role === 'Other' && (form.customRole.trim().length < 2 || form.customRole.trim().length > 80)) e.customRole = t('emp_err_custom_role');
    if (form.experience && (!/^\d+(\.\d+)?$/.test(form.experience.trim()) || Number(form.experience) < 0)) e.experience = t('emp_err_experience');
    if (form.joiningDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.joiningDate)) e.joiningDate = t('emp_err_joining_date');
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      const employeeData = {
        ...form,
        role: form.role === 'Other' ? form.customRole.trim() : form.role,
      };
      delete employeeData.customRole;
      if (editItem) await updateEmployee(editItem.id, employeeData);
      else {
        const employeePayload = { ...employeeData };
        delete employeePayload.empId;
        await addEmployee(employeePayload);
      }
      setModalOpen(false);
      setSuccessMessage(t(editItem ? 'emp_update_success' : 'emp_insert_success'));
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
  const formatDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString(t('ui_locale'), { day: 'numeric', month: 'short', year: 'numeric' }) : t('ui_not_provided');
  const formatTime = (value) => {
    if (!value) return '—';
    const [rawHours, rawMinutes] = value.split(':');
    const hours = Number(rawHours);
    if (!Number.isInteger(hours) || !rawMinutes) return value;
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${rawMinutes} ${meridiem}`;
  };
  const profileValue = (value) => value || t('ui_not_provided');
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
                <th>{t('lbl_contact')}</th>
                <th>{t('lbl_work_log')}</th>
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
                  aria-label={t('emp_open_profile', [e.name])}
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
                      <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_edit')} onClick={event => { event.stopPropagation(); openEdit(e); }}><Pencil size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title={t('emp_view_profile')} onClick={event => { event.stopPropagation(); setProfileEmployee(e); }}><Eye size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_delete')} onClick={event => { event.stopPropagation(); setDeleteTarget(e); }} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
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
        title={t('emp_profile_title')}
        subtitle={profileEmployee ? `${profileEmployee.name} · ${profileEmployee.empId}` : ''}
        size="xl"
        className="employee-profile-modal"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setProfileEmployee(null)}>{t('emp_close_profile')}</button>
          <button className="btn btn-primary" onClick={() => { const employee = profileEmployee; setProfileEmployee(null); openEdit(employee); }}><Pencil size={14} /> {t('emp_edit_profile')}</button>
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
                <span>{t('emp_total_hours_logged')}</span>
              </div>
            </div>

            <div className="employee-profile-grid">
              <section className="employee-profile-section">
                <div className="employee-profile-section-title"><Users size={16} /><h4>{t('emp_contact_employment')}</h4></div>
                <div className="employee-profile-details">
                  <div><span>{t('lbl_employee_id')}</span><strong>{profileValue(profileEmployee.empId)}</strong></div>
                  <div><span>{t('lbl_phone')}</span><strong>{profileValue(profileEmployee.phone)}</strong></div>
                  <div><span>{t('lbl_email')}</span><strong>{profileValue(profileEmployee.email)}</strong></div>
                  <div><span>{t('emp_joining_date')}</span><strong>{formatDate(profileEmployee.joiningDate || profileEmployee.createdAt)}</strong></div>
                  <div><span>{t('emp_work_type')}</span><strong>{profileValue(profileEmployee.workType)}</strong></div>
                  <div><span>{t('emp_experience')}</span><strong>{profileValue(profileEmployee.experience)}</strong></div>
                </div>
              </section>

              <section className="employee-profile-section">
                <div className="employee-profile-section-title"><Award size={16} /><h4>{t('emp_skills_certifications')}</h4></div>
                <div className="employee-profile-tags">
                  {getSkills(profileEmployee).length > 0 ? getSkills(profileEmployee).map(skill => <span key={skill}>{skill}</span>) : <em>{t('emp_skills_not_provided')}</em>}
                </div>
                <div className="employee-profile-certification"><Award size={14} /><span>{profileValue(profileEmployee.certifications)}</span></div>
              </section>
            </div>

            <section className="employee-profile-section employee-profile-notes">
              <div className="employee-profile-section-title"><FileText size={16} /><h4>{t('lbl_notes')}</h4></div>
              <p>{profileValue(profileEmployee.notes)}</p>
            </section>

            <section className="employee-history">
              <div className="employee-history-heading">
                <div><h4>{t('emp_work_history')}</h4><p>{t('emp_work_history_sub')}</p></div>
                <span>{t('emp_entries_count', [profileEntries.length])}</span>
              </div>

              {profileEntries.length === 0 ? (
                <div className="employee-history-empty">{t('emp_no_work_history')}</div>
              ) : (
                <div className="employee-detail-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('lbl_date')}</th>
                        <th>{t('lbl_project')}</th>
                        <th>{t('lbl_time')}</th>
                        <th>{t('we_total_hours')}</th>
                        <th>{t('emp_col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profileEntries.map((entry) => {
                        const project = projects.find(item => item.id === entry.projectId);
                        const company = companies.find(item => item.id === (entry.companyId || project?.companyId));
                        const totalHours = getWorkEntryHours(entry);
                        const breakdown = getWorkEntryBreakdown(entry);

                        return (
                          <tr key={entry.id}>
                            <td className="employee-history-date">
                              <strong>{formatDate(entry.date)}</strong>
                              <span>{entry.description || t('emp_no_work_details')}</span>
                            </td>
                            <td className="employee-history-project">
                              <strong>{project?.name || t('emp_project_not_found')}</strong>
                              <span>{company?.name || t('emp_client_not_provided')} {project?.location ? `• ${project.location}` : ''}</span>
                            </td>
                            <td className="employee-history-time">
                              <span>{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>
                              <small>{breakdown.normalHours.toFixed(1)}h normal · {breakdown.normalOvertime.toFixed(1)}h OT</small>
                            </td>
                            <td className="employee-history-hours">
                              <strong>{totalHours.toFixed(1)}h</strong>
                              <span>{breakdown.weekendOvertime > 0 ? `${breakdown.weekendOvertime.toFixed(1)}h weekend` : 'Regular shift'}</span>
                            </td>
                            <td className="employee-history-actions">
                              <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_edit')} onClick={() => openEdit(profileEmployee)}>
                                <Pencil size={14} />
                              </button>
                              <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_delete')} onClick={() => setDeleteTarget(profileEmployee)} style={{ color: 'var(--color-danger)' }}>
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
            {ROLES.map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
          </select>
          {form.role === 'Other' && (
            <div style={{ marginTop: 10 }}>
              <input
                value={form.customRole}
                placeholder={t('emp_custom_role_ph')}
                onChange={e => setForm(f => ({ ...f, customRole: e.target.value }))}
                style={errors.customRole ? { borderColor: 'var(--color-danger)' } : {}}
              />
              {errors.customRole && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.customRole}</p>}
            </div>
          )}
        </div>
        <div className="form-row">
          <EmployeeField form={form} setForm={setForm} errors={errors} field="phone" label={t('emp_form_phone')} placeholder={t('emp_form_phone_ph')} />
          <EmployeeField form={form} setForm={setForm} errors={errors} field="email" type="email" label={t('emp_form_email')} placeholder={t('emp_form_email_ph')} />
        </div>
        <div className="form-group">
          <label>{t('emp_form_status')}</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(`status_${s.toLowerCase()}`)}</option>)}
          </select>
        </div>
        <div className="profile-form-divider">{t('emp_profile_details')}</div>
        <div className="form-group">
          <EmployeeField form={form} setForm={setForm} errors={errors} field="joiningDate" type="date" label={t('emp_joining_date')} />
        </div>
        <div className="form-row">
          <EmployeeField form={form} setForm={setForm} errors={errors} field="experience" label={t('emp_experience')} placeholder={t('emp_experience_ph')} />
          <EmployeeField form={form} setForm={setForm} errors={errors} field="workType" label={t('emp_work_type')} placeholder={t('emp_work_type_ph')} />
        </div>
        <div className="form-group">
          <label>{t('emp_skills')}</label>
          <input placeholder={t('emp_skills_ph')} value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>{t('emp_certifications')}</label>
          <input placeholder={t('emp_certifications_ph')} value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>{t('lbl_notes')}</label>
          <textarea rows={3} placeholder={t('emp_notes_ph')} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name} />

      <Modal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage('')}
        title={t('emp_success_title')}
        size="sm"
        footer={<button className="btn btn-primary" onClick={() => setSuccessMessage('')}>{t('btn_ok')}</button>}
      >
        <div className="success-dialog">
          <CheckCircle size={28} />
          <p>{successMessage}</p>
        </div>
      </Modal>
    </div>
  );
}
