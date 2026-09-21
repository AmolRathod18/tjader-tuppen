import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import { Building2, Plus, Search, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';

const EMPTY_FORM = { name: '', contact: '', email: '', phone: '', address: '' };

function CompanyField({ field, label, type = 'text', placeholder, form, setForm, errors }) {
  return (
    <div className="form-group">
      <label>{label}{field === 'name' || field === 'contact' ? ' *' : ''}</label>
      <input type={type} placeholder={placeholder} value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={errors[field] ? { borderColor: 'var(--color-danger)' } : {}} />
      {errors[field] && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{errors[field]}</p>}
    </div>
  );
}

export default function Companies() {
  const { companies, addCompany, updateCompany, deleteCompany, getProjectsByCompany, loadCompanies, loadProjects } = useApp();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    Promise.all([loadCompanies(), loadProjects()]).catch(error => setSubmitError(error.message));
  }, []);

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setErrors({}); setSubmitError(''); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name, contact: item.contact, email: item.email, phone: item.phone, address: item.address }); setErrors({}); setSubmitError(''); setModalOpen(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('co_err_name');
    if (!form.contact.trim()) e.contact = t('co_err_contact');
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = t('co_err_email');
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      if (editItem) await updateCompany(editItem.id, form);
      else await addCompany(form);
      setModalOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCompany(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('co_title')}</h2>
          <p>{companies.length} {t('co_registered')}</p>
        </div>
        <button id="add-company-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> {t('btn_add_company')}
        </button>
      </div>

      <div className="card">
        {/* Search */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              id="search-companies"
              placeholder={t('co_search_ph')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper table-companies">
          <table>
            <thead>
              <tr>
                <th>{t('co_col_num')}</th>
                <th>{t('co_col_name')}</th>
                <th>{t('co_col_contact')}</th>
                <th>{t('co_col_email')}</th>
                <th>{t('co_col_phone')}</th>
                <th>{t('co_col_address')}</th>
                <th>{t('co_col_projects')}</th>
                <th>{t('co_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const projectCount = getProjectsByCompany(c.id).length;
                return (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: 'var(--color-primary-light)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'var(--color-primary)', flexShrink: 0
                        }}>
                          <Building2 size={16} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>{c.contact}</td>
                    <td>
                      {c.email ? (
                        <a href={`mailto:${c.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Mail size={13} /> {c.email}
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      {c.phone ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={13} color="var(--color-text-muted)" /> {c.phone}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {c.address ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} color="var(--color-text-muted)" /> {c.address}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="badge badge-primary">{projectCount} {projectCount !== 1 ? t('co_project_count_many') : t('co_project_count_one')}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(c)}>
                          <Pencil size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => setDeleteTarget(c)}
                          style={{ color: 'var(--color-danger)' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><Building2 size={32} /></div>
                      <h3>{t('co_empty_title')}</h3>
                      <p>{search ? t('co_empty_search') : t('co_empty_start')}</p>
                      {!search && <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> {t('btn_add_company')}</button>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? t('co_modal_edit_title') : t('co_modal_add_title')}
        subtitle={editItem ? t('co_modal_edit_sub') : t('co_modal_add_sub')}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button>
            <button id="save-company-btn" className="btn btn-primary" onClick={handleSubmit}>
              {editItem ? t('btn_save') : t('co_btn_save')}
            </button>
          </>
        }
      >
        {submitError && <div className="form-submit-error" role="alert">{submitError}</div>}
        <CompanyField form={form} setForm={setForm} errors={errors} field="name" label={t('co_form_name')} placeholder={t('co_form_name_ph')} />
        <CompanyField form={form} setForm={setForm} errors={errors} field="contact" label={t('co_form_contact')} placeholder={t('co_form_contact_ph')} />
        <div className="form-row">
          <CompanyField form={form} setForm={setForm} errors={errors} field="email" label={t('co_form_email')} type="email" placeholder={t('co_form_email_ph')} />
          <CompanyField form={form} setForm={setForm} errors={errors} field="phone" label={t('co_form_phone')} placeholder={t('co_form_phone_ph')} />
        </div>
        <CompanyField form={form} setForm={setForm} errors={errors} field="address" label={t('co_form_address')} placeholder={t('co_form_address_ph')} />
      </Modal>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name}
      />
    </div>
  );
}
