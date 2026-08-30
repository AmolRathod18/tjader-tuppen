import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck, AlertTriangle, Search, Activity,
  LogIn, Play, Coffee, StopCircle, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { formatTime, formatDistance, todayStr } from '../../utils/geoVerify';

const STATUS_MAP = {
  verified:       { label: 'GPS Verified',   cls: 'badge-success' },
  flagged:        { label: 'Flagged ⚠️',      cls: 'badge-danger'  },
  not_checked_in: { label: 'Not Checked In', cls: 'badge-warning'  },
  checked_out:    { label: 'Checked Out',    cls: 'badge-info'     },
  no_activity:    { label: 'No Activity',    cls: 'badge-neutral'  },
};

const WORK_STATUS_MAP = {
  offline:        { label: 'Offline',        cls: 'badge-neutral',  color: '#94A3B8', dot: '#94A3B8' },
  logged_in:      { label: 'Logged In',      cls: 'badge-warning',  color: '#D97706', dot: '#F59E0B' },
  working:        { label: 'Working',        cls: 'badge-success',  color: '#16A34A', dot: '#22C55E' },
  on_break:       { label: 'On Break',       cls: 'badge-info',     color: '#7C3AED', dot: '#A78BFA' },
  work_completed: { label: 'Work Completed', cls: 'badge-info',     color: '#0891B2', dot: '#22D3EE' },
};

const ACTIVITY_ICONS = {
  login:       { icon: LogIn,       color: '#1D4ED8' },
  check_in:    { icon: CalendarCheck, color: '#16A34A' },
  start_work:  { icon: Play,        color: '#16A34A' },
  start_break: { icon: Coffee,      color: '#7C3AED' },
  end_break:   { icon: Play,        color: '#0891B2' },
  end_work:    { icon: StopCircle,  color: '#D97706' },
  check_out:   { icon: CalendarCheck, color: '#DC2626' },
};

const ACTIVITY_LABELS = {
  login:       'Logged In',
  check_in:    'GPS Check-In',
  start_work:  'Started Work',
  start_break: 'Break Started',
  end_break:   'Break Ended',
  end_work:    'Work Ended',
  check_out:   'GPS Check-Out',
};

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function calcDuration(start, end) {
  if (!start) return '—';
  const diff = Math.floor((new Date(end || new Date()) - new Date(start)) / 60000);
  if (diff < 0) return '—';
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

export default function Attendance() {
  const {
    attendance, employees, projects, companies,
    getEmployeeById, getProjectById, getCompanyById,
    updateAttendance, getEmployeeCurrentStatus,
  } = useApp();

  const [filterDate,    setFilterDate]    = useState(todayStr());
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterWorkStatus, setFilterWorkStatus] = useState('');
  const [search,        setSearch]        = useState('');
  const [expandedRows,  setExpandedRows]  = useState({});

  const toggleRow = (id) => setExpandedRows(p => ({ ...p, [id]: !p[id] }));

  // ── Filtered table records ──
  const filtered = attendance
    .filter(a => {
      const emp  = getEmployeeById(a.employeeId);
      const q    = search.toLowerCase();
      const matchSearch  = !search || emp?.name?.toLowerCase().includes(q) || emp?.empId?.toLowerCase().includes(q);
      const matchDate    = !filterDate    || a.date === filterDate;
      const matchProject = !filterProject || a.projectId === filterProject;
      const matchStatus  = !filterStatus  || (a.checkOutTime ? 'checked_out' : (a.checkInStatus || 'no_activity')) === filterStatus;
      const matchWorkSt  = !filterWorkStatus || (a.workStatus || 'offline') === filterWorkStatus;
      return matchSearch && matchDate && matchProject && matchStatus && matchWorkSt;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.employeeId.localeCompare(b.employeeId));

  // ── Today summary stats ──
  const today        = todayStr();
  const todayRecords = attendance.filter(a => a.date === today);
  const presentToday = todayRecords.filter(a => a.checkInStatus === 'verified').length;
  const flaggedToday = todayRecords.filter(a => a.checkInStatus === 'flagged').length;
  const workingNow   = todayRecords.filter(a => a.workStatus === 'working').length;
  const onBreakNow   = todayRecords.filter(a => a.workStatus === 'on_break').length;
  const workDoneNow  = todayRecords.filter(a => a.workStatus === 'work_completed').length;
  const loggedInNow  = todayRecords.filter(a => a.workStatus === 'logged_in').length;

  const activeEmployees = employees.filter(e => e.status === 'Active');

  const flaggedRecords = attendance.filter(a => a.checkInStatus === 'flagged');
  const approveFlag    = (id) => updateAttendance(id, { checkInStatus: 'verified' });
  const denyFlag       = (id) => updateAttendance(id, { checkInStatus: 'denied' });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h2>Attendance Management</h2>
          <p>Monitor employee attendance, work sessions, and location verification</p>
        </div>
      </div>

      {/* ── Live Employee Status Panel ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3>Live Employee Status — Today</h3>
            <p>{today} · {activeEmployees.length} active employees</p>
          </div>
          <Activity size={20} color="var(--color-text-muted)" />
        </div>
        <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {activeEmployees.map((emp, i) => {
            const status = getEmployeeCurrentStatus(emp.id);
            const cfg    = WORK_STATUS_MAP[status] || WORK_STATUS_MAP.offline;
            const todayRec = attendance.find(a => a.employeeId === emp.id && a.date === today);
            const avatarColors = ['#1D4ED8','#16A34A','#7C3AED','#D97706','#0891B2','#DC2626'];
            const initials = emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
            return (
              <div key={emp.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: 'var(--color-bg)', borderRadius: 12, minWidth: 220,
                border: `1.5px solid ${cfg.color}30`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColors[i % 6], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp.empId}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <span className={`badge ${cfg.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot,
                      animation: (status === 'working' || status === 'logged_in') ? 'pulse-dot 1.5s ease-in-out infinite' : 'none' }} />
                    {cfg.label}
                  </span>
                  {todayRec?.workStartTime && (
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                      Since {formatTimestamp(todayRec.workStartTime)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {activeEmployees.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '8px 0' }}>No active employees.</p>
          )}
        </div>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card green">
          <div className="stat-icon green"><Play size={24} /></div>
          <div className="stat-info">
            <p>Working Now</p>
            <h3>{workingNow}</h3>
            <small>Active work sessions</small>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><Coffee size={24} /></div>
          <div className="stat-info">
            <p>On Break</p>
            <h3>{onBreakNow}</h3>
            <small>Currently on break</small>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <p>GPS Flagged</p>
            <h3>{flaggedToday}</h3>
            <small>Needs review</small>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><CalendarCheck size={24} /></div>
          <div className="stat-info">
            <p>Work Completed</p>
            <h3>{workDoneNow}</h3>
            <small>Finished today</small>
          </div>
        </div>
      </div>

      {/* ── Flagged Alert ── */}
      {flaggedRecords.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#DC2626', fontSize: 14 }}>
              {flaggedRecords.length} Flagged Check-In{flaggedRecords.length > 1 ? 's' : ''} — Admin Review Required
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {flaggedRecords.map(a => {
                const emp  = getEmployeeById(a.employeeId);
                const proj = getProjectById(a.projectId);
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #FECACA' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{emp?.name}</span>
                      <span style={{ color: '#94A3B8', fontSize: 12 }}> · {proj?.name} · {a.date}</span>
                      <span style={{ color: '#DC2626', fontSize: 12 }}> · Distance: {formatDistance(a.checkInDistance)}</span>
                    </div>
                    <button className="btn btn-success btn-sm" onClick={() => approveFlag(a.id)}>Approve</button>
                    <button className="btn btn-danger btn-sm"  onClick={() => denyFlag(a.id)}>Deny</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 24px', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Date</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ maxWidth: 160 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Project</label>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Work Status</label>
            <select value={filterWorkStatus} onChange={e => setFilterWorkStatus(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="">All Work Status</option>
              <option value="offline">Offline</option>
              <option value="logged_in">Logged In</option>
              <option value="working">Working</option>
              <option value="on_break">On Break</option>
              <option value="work_completed">Work Completed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>GPS Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 180 }}>
              <option value="">All GPS Status</option>
              <option value="verified">GPS Verified</option>
              <option value="flagged">Flagged</option>
              <option value="not_checked_in">Not Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="no_activity">No Activity</option>
            </select>
          </div>
          {(filterDate || filterProject || filterStatus || filterWorkStatus || search) && (
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 0 }}
              onClick={() => { setFilterDate(''); setFilterProject(''); setFilterStatus(''); setFilterWorkStatus(''); setSearch(''); }}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Main table ── */}
      <div className="card">
        <div className="card-header">
          <div><h3>Attendance Records</h3><p>{filtered.length} records</p></div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>#</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Project</th>
                <th>Login</th>
                <th>Work Start</th>
                <th>Break</th>
                <th>Work End</th>
                <th>GPS Check-In</th>
                <th>GPS Check-Out</th>
                <th>Normal Hrs</th>
                <th>Extra Hrs</th>
                <th>Work Status</th>
                <th>GPS Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const emp     = getEmployeeById(a.employeeId);
                const project = getProjectById(a.projectId);
                const gpsStatus  = a.checkOutTime ? 'checked_out' : (a.checkInStatus || 'no_activity');
                const gpsCfg     = STATUS_MAP[gpsStatus] || STATUS_MAP.no_activity;
                const workSt     = a.workStatus || 'offline';
                const workStCfg  = WORK_STATUS_MAP[workSt] || WORK_STATUS_MAP.offline;
                const allowed    = project?.allowedRadius || 200;
                const initials   = emp ? emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';
                const avatarColors = ['#1D4ED8','#16A34A','#7C3AED','#D97706','#0891B2','#DC2626'];
                const isExpanded = expandedRows[a.id];
                const activityLog = a.activityLog || [];

                return (
                  <React.Fragment key={a.id}>
                    <tr style={{ cursor: activityLog.length > 0 ? 'pointer' : 'default' }}
                        onClick={() => activityLog.length > 0 && toggleRow(a.id)}>
                      <td>
                        {activityLog.length > 0 && (
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColors[i % 6], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{emp?.name || '—'}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp?.empId}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{a.date}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{project?.name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{project?.number}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{formatTimestamp(a.loginTime)}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#16A34A', fontWeight: 700 }}>{formatTimestamp(a.workStartTime)}</td>
                      <td>
                        {a.breakStartTime ? (
                          <div>
                            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#7C3AED' }}>↓ {formatTimestamp(a.breakStartTime)}</div>
                            {a.breakEndTime && <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#0891B2' }}>↑ {formatTimestamp(a.breakEndTime)}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#D97706', fontWeight: 700 }}>{formatTimestamp(a.workEndTime)}</td>
                      <td style={{ fontWeight: 600 }}>{formatTime(a.checkInTime)}</td>
                      <td>{formatTime(a.checkOutTime)}</td>
                      <td>{a.normalHours ? `${a.normalHours}h` : '—'}</td>
                      <td>{a.extraHours ? `${a.extraHours}h` : '—'}</td>
                      <td>
                        <span className={`badge ${workStCfg.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: workStCfg.dot,
                            animation: (workSt === 'working' || workSt === 'logged_in') ? 'pulse-dot 1.5s ease-in-out infinite' : 'none' }} />
                          {workStCfg.label}
                        </span>
                      </td>
                      <td><span className={`badge ${gpsCfg.cls}`}>{gpsCfg.label}</span></td>
                    </tr>

                    {/* ── Expandable activity log row ── */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={15} style={{ padding: 0, background: 'var(--color-bg)' }}>
                          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-light)' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                              Activity Log — {activityLog.length} events
                            </div>
                            {a.workDescription && (
                              <div style={{ background: '#fff', border: '1px solid var(--color-border-light)', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 13 }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', marginRight: 8 }}>Work Description:</span>
                                {a.workDescription}
                              </div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {activityLog.map((log, li) => {
                                const cfg = ACTIVITY_ICONS[log.action] || ACTIVITY_ICONS.login;
                                const Icon = cfg.icon;
                                const label = ACTIVITY_LABELS[log.action] || log.action;
                                return (
                                  <div key={li} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--color-border-light)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                                    <Icon size={13} color={cfg.color} />
                                    <span style={{ fontWeight: 600, color: cfg.color }}>{label}</span>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text)', background: 'var(--color-bg)', padding: '1px 6px', borderRadius: 4 }}>
                                      {formatTimestamp(log.time)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={15}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><CalendarCheck size={32} /></div>
                    <h3>No attendance records</h3>
                    <p>No records match the current filters.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
