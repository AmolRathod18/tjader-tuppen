import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { CalendarCheck, Play, Coffee, StopCircle, LogIn } from 'lucide-react';
import { formatTime, formatDistance } from '../../utils/geoVerify';

const STATUS_LABELS = {
  verified:       { label: 'GPS Verified',   cls: 'badge-success' },
  flagged:        { label: 'Flagged',        cls: 'badge-danger' },
  not_checked_in: { label: 'Not Checked In', cls: 'badge-warning' },
  checked_out:    { label: 'Checked Out',    cls: 'badge-info' },
  no_activity:    { label: 'No Activity',    cls: 'badge-neutral' },
};

const WORK_STATUS_LABELS = {
  offline:        { label: 'Offline',        cls: 'badge-neutral' },
  logged_in:      { label: 'Logged In',      cls: 'badge-warning' },
  working:        { label: 'Working',        cls: 'badge-success' },
  on_break:       { label: 'On Break',       cls: 'badge-info' },
  work_completed: { label: 'Work Completed', cls: 'badge-info' },
};

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function calcWorkDuration(start, end) {
  if (!start || !end) return '—';
  const diff = Math.floor((new Date(end) - new Date(start)) / 60000);
  if (diff < 0) return '—';
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

export default function MyAttendance() {
  const { loggedInEmployeeId, attendance, getProjectById } = useApp();
  const { t } = useLanguage();
  const [filterMonth, setFilterMonth] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => setExpandedRows(p => ({ ...p, [id]: !p[id] }));

  const myRecords = attendance
    .filter(a => a.employeeId === loggedInEmployeeId)
    .filter(a => !filterMonth || a.date.startsWith(filterMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalNormalHours = myRecords.reduce((s, a) => s + (parseFloat(a.normalHours) || 0), 0);
  const totalExtraHours  = myRecords.reduce((s, a) => s + (parseFloat(a.extraHours) || 0), 0);
  const presentDays      = myRecords.filter(a => a.checkInStatus === 'verified').length;
  const workDoneDays     = myRecords.filter(a => a.workStatus === 'work_completed').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('myatt_title')}</h2>
          <p>{myRecords.length} {t('att_total_records')} — {workDoneDays} {t('myatt_completed').toLowerCase()} · {(totalNormalHours + totalExtraHours).toFixed(1)}h {t('lbl_total').toLowerCase()}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="summary-row" style={{ marginBottom: 20 }}>
        <div className="summary-item"><p>{t('myatt_total')}</p><h4>{myRecords.length}</h4></div>
        <div className="summary-item"><p>{t('myatt_completed')}</p><h4 style={{ color: '#0891B2' }}>{workDoneDays}</h4></div>
        <div className="summary-item"><p>{t('myatt_gps_verified')}</p><h4 style={{ color: '#16A34A' }}>{presentDays}</h4></div>
        <div className="summary-item"><p>{t('myatt_normal_hours')}</p><h4>{totalNormalHours.toFixed(1)}h</h4></div>
        <div className="summary-item"><p>{t('myatt_extra_hours')}</p><h4 style={{ color: '#D97706' }}>{totalExtraHours.toFixed(1)}h</h4></div>
      </div>

      <div className="card">
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{t('lbl_filter_month')}</label>
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ maxWidth: 180 }} />
          </div>
          {filterMonth && <button className="btn btn-ghost btn-sm" style={{ marginTop: 18 }} onClick={() => setFilterMonth('')}>{t('btn_clear')}</button>}
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('myatt_col_num')}</th>
                <th>{t('myatt_col_date')}</th>
                <th>{t('myatt_col_project')}</th>
                <th>{t('myatt_col_login')}</th>
                <th>{t('myatt_col_work_start')}</th>
                <th>{t('myatt_col_break_start')}</th>
                <th>{t('myatt_col_break_end')}</th>
                <th>{t('myatt_col_work_end')}</th>
                <th>{t('myatt_col_duration')}</th>
                <th>{t('myatt_col_normal')}</th>
                <th>{t('myatt_col_extra')}</th>
                <th>{t('myatt_col_work_status')}</th>
                <th>{t('myatt_col_gps')}</th>
                <th>{t('myatt_col_desc')}</th>
              </tr>
            </thead>
            <tbody>
              {myRecords.map((a, i) => {
                const project   = getProjectById(a.projectId);
                const gpsStatus = a.checkOutTime ? 'checked_out' : (a.checkInStatus || 'no_activity');
                const gpsCfg    = STATUS_LABELS[gpsStatus] || STATUS_LABELS.no_activity;
                const workSt    = a.workStatus || 'offline';
                const workStCfg = WORK_STATUS_LABELS[workSt] || WORK_STATUS_LABELS.offline;
                const activityLog = a.activityLog || [];
                const isExpanded = expandedRows[a.id];

                return (
                  <React.Fragment key={a.id}>
                    <tr
                      style={{ cursor: activityLog.length > 0 ? 'pointer' : 'default' }}
                      onClick={() => activityLog.length > 0 && toggleRow(a.id)}
                      title={activityLog.length > 0 ? t('myatt_click_hint') : ''}
                    >
                      <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{a.date}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{project?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{project?.number}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatTimestamp(a.loginTime)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#16A34A', fontWeight: 700 }}>{formatTimestamp(a.workStartTime)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#7C3AED' }}>{formatTimestamp(a.breakStartTime)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#0891B2' }}>{formatTimestamp(a.breakEndTime)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#D97706', fontWeight: 700 }}>{formatTimestamp(a.workEndTime)}</td>
                      <td style={{ fontWeight: 600 }}>{calcWorkDuration(a.workStartTime, a.workEndTime)}</td>
                      <td>{a.normalHours ? `${a.normalHours}h` : '—'}</td>
                      <td>{a.extraHours ? `${a.extraHours}h` : '—'}</td>
                      <td><span className={`badge ${workStCfg.cls}`}>{workStCfg.label}</span></td>
                      <td><span className={`badge ${gpsCfg.cls}`}>{gpsCfg.label}</span></td>
                      <td style={{ maxWidth: 200 }}>
                        {a.workDescription
                          ? <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }} title={a.workDescription}>{a.workDescription.slice(0, 40)}{a.workDescription.length > 40 ? '…' : ''}</span>
                          : '—'}
                      </td>
                    </tr>

                    {/* Activity Log expansion */}
                    {isExpanded && activityLog.length > 0 && (
                      <tr>
                        <td colSpan={14} style={{ padding: 0, background: 'var(--color-bg)' }}>
                          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border-light)' }}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                              {t('myatt_activity_log')}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {activityLog.map((log, li) => {
                                const COLORS = { login: '#1D4ED8', check_in: '#16A34A', start_work: '#16A34A', start_break: '#7C3AED', end_break: '#0891B2', end_work: '#D97706', check_out: '#DC2626' };
                                const LABS   = { login: t('act_login'), check_in: t('act_check_in'), start_work: t('act_start_work'), start_break: t('act_start_break'), end_break: t('act_end_break'), end_work: t('act_end_work'), check_out: t('act_check_out') };
                                const color  = COLORS[log.action] || '#94A3B8';
                                const label  = LABS[log.action] || log.action;
                                return (
                                  <div key={li} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#fff', borderRadius: 6, border: '1px solid var(--color-border-light)', fontSize: 11 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                    <span style={{ fontWeight: 700, color }}>{label}</span>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{formatTimestamp(log.time)}</span>
                                  </div>
                                );
                              })}
                            </div>
                            {a.workDescription && (
                              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                                <strong>{t('myatt_description')}</strong> {a.workDescription}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {myRecords.length === 0 && (
                <tr><td colSpan={14}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><CalendarCheck size={32} /></div>
                    <h3>{t('myatt_empty_title')}</h3>
                    <p>{t('myatt_empty_sub')}</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
