import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Components';
import { FolderKanban, Plus, Search, Pencil, Trash2, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { getWorkEntryHours } from '../utils/workHours';
import DatePicker from '../components/ui/DatePicker';

const EMPTY_FORM = { companyId: '', name: '', location: '', startDate: '', endDate: '', status: 'Active' };
const STATUS_OPTIONS = ['Active', 'Completed', 'On Hold'];
const stockholmToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm' }).format(new Date());

function ProjectField({ field, label, type = 'text', placeholder, required, form, setForm, errors }) {
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

export default function Projects() {
  const { projects, companies, addProject, updateProject, deleteProject, getCompanyById, workEntries, loadProjects, loadCompanies, loadWorkEntries } = useApp();
  const { t } = useLanguage();
  const [search,         setSearch]         = useState('');
  const [filterCompany,  setFilterCompany]  = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editItem,       setEditItem]       = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [errors,         setErrors]         = useState({});
  const [submitError,    setSubmitError]    = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    Promise.all([loadProjects(), loadCompanies(), loadWorkEntries()]).catch(error => setSubmitError(error.message));
  }, []);

  const filtered = projects.filter(p => {
    const effectiveStatus = p.endDate < stockholmToday() ? 'Completed' : p.status;
    const q = search.toLowerCase();
    const matchSearch  = p.name.toLowerCase().includes(q) || p.number?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q);
    const matchCompany = !filterCompany || p.companyId === filterCompany;
    const matchStatus  = !filterStatus  || effectiveStatus === filterStatus;
    return matchSearch && matchCompany && matchStatus;
  });

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setErrors({}); setSubmitError(''); setSuccessMessage(''); setModalOpen(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ companyId: item.companyId, name: item.name, location: item.location, startDate: item.startDate, endDate: item.endDate, status: item.endDate < stockholmToday() ? 'Completed' : item.status });
    setErrors({});
    setSubmitError('');
    setSuccessMessage('');
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    const name = form.name.trim();
    const location = form.location.trim();
    if (!form.companyId)      e.companyId = t('proj_err_company');
    if (!name)                e.name      = t('proj_err_name');
    else if (name.length < 2 || name.length > 120) e.name = t('proj_err_name_length');
    if (location.length > 200) e.location = t('proj_err_location_length');
    if (!form.startDate)      e.startDate = t('proj_err_start');
    if (!form.endDate)        e.endDate   = t('proj_err_end');
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = t('proj_err_dates');
    if (form.status && !STATUS_OPTIONS.includes(form.status)) e.status = t('proj_err_status');
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      const projectData = {
        ...form,
        status: form.endDate < stockholmToday() ? 'Completed' : form.status,
      };
      if (editItem) await updateProject(editItem.id, projectData);
      else await addProject(projectData);
      setModalOpen(false);
      setSuccessMessage(t(editItem ? 'proj_update_success' : 'proj_insert_success'));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  const getEntryCount = (projectId) => workEntries.filter(w => w.projectId === projectId).length;
  const getTotalHrs   = (projectId) => {
    const hrs = workEntries.filter(w => w.projectId === projectId).reduce((s, w) => s + getWorkEntryHours(w), 0);
    return hrs.toFixed(1);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('proj_title')}</h2>
          <p>{projects.length} {t('lbl_total')} · {projects.filter(p => (p.endDate < stockholmToday() ? 'Completed' : p.status) === 'Active').length} {t('lbl_active').toLowerCase()}</p>
        </div>
        <button id="add-project-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> {t('btn_add_project')}
        </button>
      </div>

      <div className="card">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input id="search-projects" placeholder={t('proj_search_ph')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">{t('proj_all_companies')}</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">{t('proj_all_statuses')}</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{t(`status_${s.toLowerCase().replace(' ', '_')}`)}</option>)}
          </select>
        </div>

        <div className="table-wrapper table-projects">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('proj_col_project')}</th>
                <th>{t('proj_col_company')}</th>
                <th>{t('proj_col_location')}</th>
                <th>{t('proj_col_start')}</th>
                <th>{t('proj_col_end')}</th>
                <th>{t('lbl_work_log')}</th>
                <th>{t('proj_col_status')}</th>
                <th>{t('proj_col_actions')}</th>
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
                      <div style={{ fontWeight: 700 }}>{getTotalHrs(p.id)}h</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{getEntryCount(p.id)} {t('lbl_entries')}</div>
                    </td>
                    <td><Badge status={p.endDate < stockholmToday() ? 'Completed' : p.status} /></td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_edit')} onClick={() => openEdit(p)}><Pencil size={15} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title={t('ui_delete')} onClick={() => setDeleteTarget(p)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><FolderKanban size={32} /></div>
                    <h3>{t('proj_empty_title')}</h3>
                    <p>{search ? t('proj_empty_search') : t('proj_empty_start')}</p>
                    {!search && <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> {t('btn_add_project')}</button>}
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? t('proj_modal_edit_title') : t('proj_modal_add_title')}
        subtitle={editItem ? t('proj_modal_edit_sub') : t('proj_modal_add_sub')}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button>
          <button id="save-project-btn" className="btn btn-primary" onClick={handleSubmit}>{editItem ? t('btn_save') : t('btn_create_project')}</button>
        </>}
      >
        {submitError && <div className="form-submit-error" role="alert">{submitError}</div>}
        <div className="form-group">
          <label>{t('proj_form_company')} *</label>
          <select value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
            style={errors.companyId ? { borderColor: 'var(--color-danger)' } : {}}>
            <option value="">{t('proj_form_company_ph')}</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.companyId && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors.companyId}</p>}
        </div>
        <ProjectField form={form} setForm={setForm} errors={errors} field="name" label={t('proj_form_name')} placeholder={t('proj_form_name_ph')} required />
        <ProjectField form={form} setForm={setForm} errors={errors} field="location" label={t('proj_form_location')} placeholder={t('proj_form_location_ph')} />
        <div className="form-row">
          <ProjectField form={form} setForm={setForm} errors={errors} field="startDate" label={t('proj_form_start')} type="date" required />
          <ProjectField form={form} setForm={setForm} errors={errors} field="endDate" label={t('proj_form_end')} type="date" required />
        </div>
        <div className="form-group">
          <label>{t('proj_form_status')}</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Modal>

      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} itemName={deleteTarget?.name} />

      <Modal
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage('')}
        title={t('proj_success_title')}
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
