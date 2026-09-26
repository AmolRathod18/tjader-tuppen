import React, { useEffect, useRef, useState } from 'react';
import { Car, Plus, Pencil, Trash2, Search, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';
import DatePicker from '../components/ui/DatePicker';

const EMPTY = {
  projectId: '', employeeId: '', journeyDate: new Date().toISOString().split('T')[0],
  startPlace: '', endPlace: '', kilometers: '', remarks: '',
};

function Field({ label, children, error }) {
  return <div className="form-group"><label>{label}</label>{children}
    {error && <p style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 4 }}>{error}</p>}
  </div>;
}

export default function Expenditure() {
  const {
    expenditures, projects, employees, addExpenditure, updateExpenditure, deleteExpenditure,
    loadExpenditures, loadProjects, loadEmployees, getProjectById, getEmployeeById,
  } = useApp();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    Promise.all([loadExpenditures(), loadProjects(), loadEmployees()])
      .catch(error => setSubmitError(error.message));
  }, []);

  const filtered = expenditures.filter(item => {
    const project = getProjectById(item.projectId);
    const employee = getEmployeeById(item.employeeId);
    const query = search.toLowerCase();
    return !query || project?.name?.toLowerCase().includes(query)
      || employee?.name?.toLowerCase().includes(query)
      || item.startPlace?.toLowerCase().includes(query)
      || item.endPlace?.toLowerCase().includes(query);
  });

  const openAdd = () => {
    setEditItem(null); setForm(EMPTY); setErrors({}); setSubmitError(''); setModalOpen(true);
  };
  const openEdit = item => {
    setEditItem(item);
    setForm({
      projectId: item.projectId, employeeId: item.employeeId, journeyDate: item.journeyDate,
      startPlace: item.startPlace, endPlace: item.endPlace, kilometers: item.kilometers, remarks: item.remarks || '',
    });
    setErrors({}); setSubmitError(''); setModalOpen(true);
  };
  const save = async () => {
    const nextErrors = {};
    if (!form.projectId) nextErrors.projectId = t('exp_err_project');
    if (!form.employeeId) nextErrors.employeeId = t('exp_err_employee');
    if (!form.journeyDate) nextErrors.journeyDate = t('exp_err_date');
    if (!form.startPlace.trim()) nextErrors.startPlace = t('exp_err_start_place');
    if (!form.endPlace.trim()) nextErrors.endPlace = t('exp_err_end_place');
    if (!form.kilometers || !Number.isInteger(Number(form.kilometers)) || Number(form.kilometers) <= 0) nextErrors.kilometers = t('exp_err_kilometers');
    if (form.startPlace.trim().length > 120) nextErrors.startPlace = t('exp_err_place_length');
    if (form.endPlace.trim().length > 120) nextErrors.endPlace = t('exp_err_place_length');
    if (form.remarks.trim().length > 500) nextErrors.remarks = t('exp_err_remarks_length');
    if (form.journeyDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.journeyDate)) nextErrors.journeyDate = t('exp_err_date_invalid');
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    try {
      if (editItem) await updateExpenditure(editItem.id, { ...form, kilometers: Number(form.kilometers) });
      else await addExpenditure({ ...form, kilometers: Number(form.kilometers) });
      setModalOpen(false);
    } catch (error) { setSubmitError(error.message); }
  };
  const remove = async () => {
    try { await deleteExpenditure(deleteTarget.id); setDeleteTarget(null); }
    catch (error) { setSubmitError(error.message); }
  };

  return <div>
    <div className="page-header">
      <div className="page-header-info"><h2>{t('exp_title')}</h2><p>{expenditures.length} {t('exp_records')}</p></div>
      <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> {t('exp_add')}</button>
    </div>
    <div className="card">
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
        <div className="search-input-wrapper"><Search size={16} className="search-icon" />
          <input placeholder={t('exp_search')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="table-wrapper table-expenditures">
        <table><thead><tr><th>#</th><th>{t('lbl_date')}</th><th>{t('lbl_project')}</th><th>{t('lbl_employee')}</th><th>{t('exp_journey')}</th><th>{t('exp_kilometers')}</th><th>{t('lbl_actions')}</th></tr></thead>
          <tbody>{filtered.map((item, index) => {
            const project = getProjectById(item.projectId);
            const employee = getEmployeeById(item.employeeId);
            return <tr key={item.id}>
              <td>{index + 1}</td><td>{item.journeyDate}</td>
              <td><strong>{project?.name || '—'}</strong><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{project?.number}</div></td>
              <td>{employee?.name || '—'}</td>
              <td><span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} />{item.startPlace} → {item.endPlace}</span></td>
              <td><strong>{Number(item.kilometers).toLocaleString()} km</strong></td>
              <td><div className="table-actions">
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(item)}><Pencil size={15} /></button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteTarget(item)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
              </div></td>
            </tr>;
          })}</tbody>
        </table>
        {filtered.length === 0 && <div className="empty-state"><div className="empty-state-icon"><Car size={32} /></div><h3>{t('exp_no_records')}</h3><p>{t('exp_no_records_sub')}</p></div>}
      </div>
    </div>
    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? t('exp_edit_title') : t('exp_add_title')} subtitle={t('exp_modal_subtitle')}
      footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t('btn_cancel')}</button><button className="btn btn-primary" onClick={save}>{editItem ? t('btn_save') : t('exp_add')}</button></>}>
      {submitError && <div className="form-submit-error" role="alert">{submitError}</div>}
      <div className="form-row">
        <Field label={`${t('lbl_project')} *`} error={errors.projectId}><select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}><option value="">{t('exp_select_project')}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)}</select></Field>
        <Field label={`${t('lbl_employee')} *`} error={errors.employeeId}><select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}><option value="">{t('exp_select_employee')}</option>{employees.filter(e => e.status === 'Active').map(e => <option key={e.id} value={e.id}>{e.name} ({e.empId})</option>)}</select></Field>
      </div>
      <Field label={`${t('exp_journey_date')} *`} error={errors.journeyDate}><DatePicker value={form.journeyDate} onChange={e => setForm(f => ({ ...f, journeyDate: e.target.value }))} /></Field>
      <div className="form-row">
        <Field label={`${t('exp_start_place')} *`} error={errors.startPlace}><input placeholder={t('exp_start_place_ph')} value={form.startPlace} onChange={e => setForm(f => ({ ...f, startPlace: e.target.value }))} /></Field>
        <Field label={`${t('exp_end_place')} *`} error={errors.endPlace}><input placeholder={t('exp_end_place_ph')} value={form.endPlace} onChange={e => setForm(f => ({ ...f, endPlace: e.target.value }))} /></Field>
      </div>
      <Field label={`${t('exp_kilometers_travelled')} *`} error={errors.kilometers}><input type="number" min="1" step="1" inputMode="numeric" placeholder={t('exp_kilometers_ph')} value={form.kilometers} onChange={e => setForm(f => ({ ...f, kilometers: e.target.value }))} /></Field>
      <Field label={t('exp_remarks')} error={errors.remarks}><textarea placeholder={t('exp_optional_notes')} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></Field>
    </Modal>
    <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName={t('exp_delete_item')} />
  </div>;
}
