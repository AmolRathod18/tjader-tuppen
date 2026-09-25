import React, { useEffect, useRef, useState } from 'react';
import { Car, Plus, Pencil, Trash2, Search, MapPin, Calendar, Route } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal, ConfirmDeleteModal } from '../components/ui/Modal';

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
    if (!form.projectId) nextErrors.projectId = 'Project is required';
    if (!form.employeeId) nextErrors.employeeId = 'Employee is required';
    if (!form.journeyDate) nextErrors.journeyDate = 'Date is required';
    if (!form.startPlace.trim()) nextErrors.startPlace = 'Start place is required';
    if (!form.endPlace.trim()) nextErrors.endPlace = 'End place is required';
    if (!form.kilometers || !Number.isInteger(Number(form.kilometers)) || Number(form.kilometers) <= 0) nextErrors.kilometers = 'Enter whole kilometers greater than 0';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    try {
      if (editItem) await updateExpenditure(editItem.id, form);
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
      <div className="page-header-info"><h2>Expenditure</h2><p>{expenditures.length} journey records</p></div>
      <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Journey</button>
    </div>
    <div className="card">
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
        <div className="search-input-wrapper"><Search size={16} className="search-icon" />
          <input placeholder="Search project, employee or place…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="table-wrapper table-expenditures">
        <table><thead><tr><th>#</th><th>Date</th><th>Project</th><th>Employee</th><th>Journey</th><th>Kilometers</th><th>Actions</th></tr></thead>
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
        {filtered.length === 0 && <div className="empty-state"><div className="empty-state-icon"><Car size={32} /></div><h3>No journey records</h3><p>Record a project journey to track kilometers.</p></div>}
      </div>
    </div>
    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Journey' : 'Add Journey'} subtitle="Record travel for a project and employee"
      footer={<><button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>{editItem ? 'Save Changes' : 'Add Journey'}</button></>}>
      {submitError && <div className="form-submit-error" role="alert">{submitError}</div>}
      <div className="form-row">
        <Field label="Project *" error={errors.projectId}><select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}><option value="">Select project…</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.number})</option>)}</select></Field>
        <Field label="Employee *" error={errors.employeeId}><select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}><option value="">Select employee…</option>{employees.filter(e => e.status === 'Active').map(e => <option key={e.id} value={e.id}>{e.name} ({e.empId})</option>)}</select></Field>
      </div>
      <Field label="Journey Date *" error={errors.journeyDate}><input type="date" value={form.journeyDate} onChange={e => setForm(f => ({ ...f, journeyDate: e.target.value }))} /></Field>
      <div className="form-row">
        <Field label="Start Place *" error={errors.startPlace}><input placeholder="e.g. Stockholm office" value={form.startPlace} onChange={e => setForm(f => ({ ...f, startPlace: e.target.value }))} /></Field>
        <Field label="End Place *" error={errors.endPlace}><input placeholder="e.g. Project site" value={form.endPlace} onChange={e => setForm(f => ({ ...f, endPlace: e.target.value }))} /></Field>
      </div>
      <Field label="Kilometers Travelled *" error={errors.kilometers}><input type="number" min="1" step="1" inputMode="numeric" placeholder="e.g. 42" value={form.kilometers} onChange={e => setForm(f => ({ ...f, kilometers: e.target.value }))} /></Field>
      <Field label="Remarks"><textarea placeholder="Optional notes…" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></Field>
    </Modal>
    <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={remove} itemName="this journey record" />
  </div>;
}
