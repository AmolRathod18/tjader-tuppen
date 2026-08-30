import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPin, Clock, CheckCircle, XCircle, AlertTriangle,
  Loader, Building2, FolderKanban, Save, Navigation,
  Play, Coffee, StopCircle, LogIn, Activity, ChevronDown, ChevronUp
} from 'lucide-react';
import { getCurrentPosition, verifyLocation, formatDistance, todayStr, formatTime } from '../../utils/geoVerify';

// ── Status config for work lifecycle ──
const WORK_STATUS_CONFIG = {
  offline:        { label: 'Offline',         color: '#94A3B8', bg: '#F8FAFC', dot: '#94A3B8' },
  logged_in:      { label: 'Logged In',       color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
  working:        { label: 'Working',         color: '#16A34A', bg: '#F0FDF4', dot: '#22C55E' },
  on_break:       { label: 'On Break',        color: '#7C3AED', bg: '#F5F3FF', dot: '#A78BFA' },
  work_completed: { label: 'Work Completed',  color: '#0891B2', bg: '#ECFEFF', dot: '#22D3EE' },
};

// GPS check-in status labels
const CHECKIN_STATUS_CONFIG = {
  not_checked_in: { label: 'Not Checked In', color: '#D97706', bg: '#FFFBEB' },
  verified:       { label: 'GPS Verified ✓',  color: '#16A34A', bg: '#F0FDF4' },
  flagged:        { label: 'GPS Flagged ⚠️',  color: '#DC2626', bg: '#FEF2F2' },
  checked_out:    { label: 'Checked Out',     color: '#0891B2', bg: '#ECFEFF' },
};

// Activity log icons / colors
const ACTIVITY_CONFIG = {
  login:       { icon: LogIn,       color: '#1D4ED8', label: 'Logged In' },
  check_in:    { icon: MapPin,      color: '#16A34A', label: 'GPS Check-In' },
  start_work:  { icon: Play,        color: '#16A34A', label: 'Started Work' },
  start_break: { icon: Coffee,      color: '#7C3AED', label: 'Break Started' },
  end_break:   { icon: Play,        color: '#0891B2', label: 'Break Ended' },
  end_work:    { icon: StopCircle,  color: '#D97706', label: 'Work Ended' },
  check_out:   { icon: MapPin,      color: '#DC2626', label: 'GPS Check-Out' },
};

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function calcDuration(start, end) {
  if (!start) return '—';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const diff = Math.floor((e - s) / 60000);
  if (diff < 0) return '—';
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

export default function EmployeeDashboard() {
  const {
    loggedInEmployeeId, employees, projects, companies,
    attendance, getTodayAttendance, createAttendanceRecord,
    checkIn, checkOut, saveWorkDetails, getCompanyById,
    startWork, startBreak, endBreak, endWork,
    getEmployeeTodayRecord, getAssignmentsByEmployee,
  } = useApp();

  const today = todayStr();
  const emp = employees.find(e => e.id === loggedInEmployeeId);
  // Primary project for GPS check-in / attendance (from employee record)
  const assignedProject = emp?.assignedProjectId ? projects.find(p => p.id === emp.assignedProjectId) : null;
  const company = assignedProject ? getCompanyById(assignedProject.companyId) : null;
  // All projects from the assignments table for this employee
  const myAssignments = getAssignmentsByEmployee(loggedInEmployeeId);

  const [record, setRecord]         = useState(null);
  const [gpsState, setGpsState]     = useState('idle');
  const [gpsError, setGpsError]     = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [workForm, setWorkForm]     = useState({ workDescription: '', normalHours: '', extraHours: '' });
  const [workSaved, setWorkSaved]   = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [liveTime, setLiveTime]     = useState(new Date());

  // Live clock for duration display
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Sync record from context whenever attendance changes
  useEffect(() => {
    const r = getTodayAttendance(loggedInEmployeeId, today);
    if (r) {
      setRecord(r);
      setWorkForm({
        workDescription: r.workDescription || '',
        normalHours: r.normalHours ? String(r.normalHours) : '',
        extraHours: r.extraHours ? String(r.extraHours) : '',
      });
    } else if (emp && assignedProject) {
      const loginTime = new Date().toISOString();
      const newRecord = createAttendanceRecord(loggedInEmployeeId, assignedProject.id, today, loginTime);
      setRecord(newRecord);
    }
  }, [attendance]);

  // ── GPS handlers ──
  const handleCheckIn = async () => {
    if (!assignedProject || !record) return;
    setGpsState('loading'); setGpsError(''); setLastResult(null);
    try {
      const pos = await getCurrentPosition();
      const { verified, distance } = verifyLocation(
        assignedProject.lat, assignedProject.lng,
        pos.lat, pos.lng, assignedProject.allowedRadius || 200
      );
      checkIn(record.id, { lat: pos.lat, lng: pos.lng, distance, status: verified ? 'verified' : 'flagged' });
      setGpsState('success');
      setLastResult({ verified, distance, action: 'check-in', lat: pos.lat, lng: pos.lng });
    } catch (err) { setGpsState('error'); setGpsError(err.message); }
  };

  const handleCheckOut = async () => {
    if (!record?.checkInTime || !assignedProject) return;
    setGpsState('loading'); setGpsError('');
    try {
      const pos = await getCurrentPosition();
      const { verified, distance } = verifyLocation(
        assignedProject.lat, assignedProject.lng,
        pos.lat, pos.lng, assignedProject.allowedRadius || 200
      );
      checkOut(record.id, { lat: pos.lat, lng: pos.lng, distance, status: verified ? 'verified' : 'flagged' });
      setGpsState('success');
      setLastResult({ verified, distance, action: 'check-out' });
    } catch (err) { setGpsState('error'); setGpsError(err.message); }
  };

  // ── Work lifecycle handlers ──
  const handleStartWork = () => {
    if (!record) return;
    startWork(record.id);
  };

  const handleStartBreak = () => {
    if (!record) return;
    startBreak(record.id);
  };

  const handleEndBreak = () => {
    if (!record) return;
    endBreak(record.id);
  };

  const handleEndWork = () => {
    if (!record) return;
    endWork(record.id, {
      workDescription: workForm.workDescription,
      normalHours: parseFloat(workForm.normalHours) || 0,
      extraHours: parseFloat(workForm.extraHours) || 0,
    });
  };

  const handleSaveDescription = () => {
    if (!record) return;
    saveWorkDetails(record.id, {
      workDescription: workForm.workDescription,
      normalHours: parseFloat(workForm.normalHours) || 0,
      extraHours: parseFloat(workForm.extraHours) || 0,
    });
    setWorkSaved(true);
    setTimeout(() => setWorkSaved(false), 3000);
  };

  if (!emp) return <div className="empty-state"><h3>Employee not found.</h3></div>;

  const ws          = record?.workStatus || 'logged_in';
  const wsCfg       = WORK_STATUS_CONFIG[ws] || WORK_STATUS_CONFIG.logged_in;
  const checkedIn   = !!record?.checkInTime;
  const checkedOut  = !!record?.checkOutTime;
  const isWorking   = ws === 'working';
  const onBreak     = ws === 'on_break';
  const workDone    = ws === 'work_completed';
  const workStarted = !!record?.workStartTime;
  const activityLog = record?.activityLog || [];

  const greeting = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening';

  return (
    <div>
      {/* ── Welcome header ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>
          Good {greeting}, {emp.name.split(' ')[0]}! 👋
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
          {emp.empId} · {emp.role} · {today}
        </p>
      </div>

      {/* ── Status + summary cards ── */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {/* Live Work Status */}
        <div className="stat-card" style={{ background: wsCfg.bg, borderColor: wsCfg.color + '40' }}>
          <div className="stat-icon" style={{ background: wsCfg.color + '20', color: wsCfg.color }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <p>Current Status</p>
            <h3 style={{ color: wsCfg.color, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: wsCfg.dot, display: 'inline-block', flexShrink: 0,
                animation: (isWorking || ws === 'logged_in') ? 'pulse-dot 1.5s ease-in-out infinite' : 'none' }} />
              {wsCfg.label}
            </h3>
          </div>
        </div>

        {/* Login Time */}
        <div className="stat-card blue">
          <div className="stat-icon blue"><LogIn size={24} /></div>
          <div className="stat-info">
            <p>Login Time</p>
            <h3>{formatTimestamp(record?.loginTime)}</h3>
            {record?.loginTime && <small>{today}</small>}
          </div>
        </div>

        {/* Work Start */}
        <div className="stat-card green">
          <div className="stat-icon green"><Play size={24} /></div>
          <div className="stat-info">
            <p>Work Started</p>
            <h3>{formatTimestamp(record?.workStartTime)}</h3>
            {record?.workStartTime && record?.workEndTime && (
              <small>Ended: {formatTimestamp(record.workEndTime)}</small>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="stat-card purple">
          <div className="stat-icon purple"><Clock size={24} /></div>
          <div className="stat-info">
            <p>Work Duration</p>
            <h3>{calcDuration(record?.workStartTime, record?.workEndTime)}</h3>
            {record?.breakStartTime && (
              <small>Break: {calcDuration(record.breakStartTime, record.breakEndTime)}</small>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        {/* ── My Assigned Projects (from Assignments table) ── */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <h3>My Assigned Projects</h3>
              <p>{myAssignments.filter(a => a.status === 'Active').length} active · {myAssignments.length} total</p>
            </div>
            <FolderKanban size={20} color="var(--color-text-muted)" />
          </div>
          <div className="card-body">
            {myAssignments.length === 0 ? (
              <div className="empty-state" style={{ padding: '16px 0' }}>
                <div className="empty-state-icon"><FolderKanban size={28} /></div>
                <h3>No Projects Assigned</h3>
                <p>Contact your admin to assign projects to you.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myAssignments.map(asgn => {
                  const proj = projects.find(p => p.id === asgn.projectId);
                  const co   = proj ? getCompanyById(proj.companyId) : null;
                  const isPrimary = proj?.id === emp?.assignedProjectId;
                  const statusCls = asgn.status === 'Active' ? 'badge-success' : asgn.status === 'Completed' ? 'badge-info' : 'badge-neutral';
                  return proj ? (
                    <div key={asgn.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '12px 14px', background: 'var(--color-bg)',
                      borderRadius: 10, border: `1.5px solid ${isPrimary ? '#16A34A40' : 'var(--color-border-light)'}`,
                    }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: isPrimary ? '#EDFAF1' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isPrimary ? '#16A34A' : '#64748B', flexShrink: 0 }}>
                        <FolderKanban size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{proj.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{proj.number}</span>
                          <span className={`badge ${statusCls}`}>{asgn.status}</span>
                          {isPrimary && <span className="badge badge-success" style={{ fontSize: 10 }}>⭐ Primary</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={11} /> {co?.name || '—'}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={11} /> {proj.location}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> {asgn.startDate} → {asgn.endDate}
                          </span>
                        </div>
                        {asgn.notes && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                            {asgn.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Today's Work Controls ── */}
      <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div><h3>Today's Status</h3><p>Work session controls</p></div>
            <span className="badge" style={{ background: wsCfg.bg, color: wsCfg.color, border: `1px solid ${wsCfg.color}30`, fontSize: 11, fontWeight: 700 }}>
              {wsCfg.label}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Timestamps row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
                <div style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 2 }}>Login</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{formatTimestamp(record?.loginTime)}</div>
              </div>
              <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
                <div style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 2 }}>Work Start</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#16A34A' }}>{formatTimestamp(record?.workStartTime)}</div>
              </div>
              <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
                <div style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 2 }}>Break Start</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#7C3AED' }}>{formatTimestamp(record?.breakStartTime)}</div>
              </div>
              <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
                <div style={{ color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 2 }}>Break End</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0891B2' }}>{formatTimestamp(record?.breakEndTime)}</div>
              </div>
            </div>

            {/* Work End timestamp */}
            {record?.workEndTime && (
              <div style={{ background: '#ECFEFF', borderRadius: 8, padding: '10px 12px', border: '1px solid #A5F3FC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0891B2' }}>Work Ended</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0891B2' }}>{formatTimestamp(record.workEndTime)}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              {/* Start Work */}
              <button
                onClick={handleStartWork}
                disabled={workStarted || workDone}
                style={{
                  padding: '11px 8px', borderRadius: 10, border: 'none', cursor: workStarted || workDone ? 'default' : 'pointer',
                  background: workStarted ? '#DCFCE7' : '#16A34A',
                  color: workStarted ? '#16A34A' : '#fff',
                  fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
                  opacity: workDone && !workStarted ? 0.4 : 1,
                }}
              >
                <Play size={15} />
                {workStarted ? `Started ${formatTimestamp(record.workStartTime)}` : 'Start Work'}
              </button>

              {/* Start Break */}
              <button
                onClick={handleStartBreak}
                disabled={!isWorking || workDone}
                style={{
                  padding: '11px 8px', borderRadius: 10, border: 'none', cursor: (!isWorking || workDone) ? 'default' : 'pointer',
                  background: onBreak ? '#EDE9FE' : (!isWorking ? '#F1F5F9' : '#7C3AED'),
                  color: onBreak ? '#7C3AED' : (!isWorking ? '#94A3B8' : '#fff'),
                  fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
                }}
              >
                <Coffee size={15} />
                {onBreak ? `On Break ${formatTimestamp(record.breakStartTime)}` : 'Start Break'}
              </button>

              {/* End Break */}
              <button
                onClick={handleEndBreak}
                disabled={!onBreak || workDone}
                style={{
                  padding: '11px 8px', borderRadius: 10, border: 'none', cursor: (!onBreak || workDone) ? 'default' : 'pointer',
                  background: (!onBreak) ? '#F1F5F9' : '#0891B2',
                  color: (!onBreak) ? '#94A3B8' : '#fff',
                  fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
                }}
              >
                <Play size={15} />
                {record?.breakEndTime && !onBreak ? `Resumed ${formatTimestamp(record.breakEndTime)}` : 'End Break'}
              </button>

              {/* End Work */}
              <button
                onClick={handleEndWork}
                disabled={!workStarted || workDone || onBreak}
                style={{
                  padding: '11px 8px', borderRadius: 10, border: 'none', cursor: (!workStarted || workDone || onBreak) ? 'default' : 'pointer',
                  background: workDone ? '#ECFEFF' : (!workStarted || onBreak ? '#F1F5F9' : '#DC2626'),
                  color: workDone ? '#0891B2' : (!workStarted || onBreak ? '#94A3B8' : '#fff'),
                  fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
                }}
              >
                <StopCircle size={15} />
                {workDone ? `Ended ${formatTimestamp(record.workEndTime)}` : 'End Work'}
              </button>
            </div>

            {onBreak && (
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Coffee size={14} /> Break started at {formatTimestamp(record?.breakStartTime)} — click "End Break" to resume.
              </div>
            )}
          </div>
        </div>

      {/* ── Work Description (shown once work started) ── */}
      {workStarted && (
        <div className="card animate-in" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div><h3>Work Description</h3><p>Describe your work for today</p></div>
            {workSaved && <span className="badge badge-success">✓ Saved</span>}
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Work Description *</label>
              <textarea
                placeholder="e.g. Welding steel beams section A, completed 12 joints..."
                value={workForm.workDescription}
                onChange={e => setWorkForm(f => ({ ...f, workDescription: e.target.value }))}
                style={{ minHeight: 80 }}
                disabled={workDone}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Normal Working Hours</label>
                <input type="number" min="0" max="24" step="0.5"
                  placeholder="e.g. 8"
                  value={workForm.normalHours}
                  onChange={e => setWorkForm(f => ({ ...f, normalHours: e.target.value }))}
                  disabled={workDone} />
              </div>
              <div className="form-group">
                <label>Extra / Overtime Hours</label>
                <input type="number" min="0" max="12" step="0.5"
                  placeholder="e.g. 2"
                  value={workForm.extraHours}
                  onChange={e => setWorkForm(f => ({ ...f, extraHours: e.target.value }))}
                  disabled={workDone} />
              </div>
            </div>
            {!workDone && (
              <button className="btn btn-primary" onClick={handleSaveDescription} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save size={16} /> Save Description
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── GPS Check-In / Check-Out ── */}
      {assignedProject && (
        <div className="card animate-in" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div><h3>GPS Attendance</h3><p>Location-verified check-in / check-out</p></div>
            <MapPin size={20} color="var(--color-text-muted)" />
          </div>
          <div className="card-body">
            {gpsError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12.5, color: '#DC2626', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {gpsError}
              </div>
            )}
            {lastResult && (
              <div style={{
                background: lastResult.verified ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${lastResult.verified ? '#BBF7D0' : '#FECACA'}`,
                borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {lastResult.verified ? <CheckCircle size={14} color="#16A34A" /> : <AlertTriangle size={14} color="#DC2626" />}
                <span style={{ fontWeight: 600, color: lastResult.verified ? '#16A34A' : '#DC2626' }}>
                  {lastResult.verified
                    ? `${lastResult.action === 'check-in' ? 'Check-In' : 'Check-Out'} Verified ✓ — Distance: ${formatDistance(lastResult.distance)}`
                    : `Outside project area ⚠️ — Distance: ${formatDistance(lastResult.distance)} (limit: ${assignedProject.allowedRadius || 200}m)`}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleCheckIn}
                disabled={checkedIn || gpsState === 'loading'}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  background: checkedIn ? '#D1FAE5' : '#16A34A',
                  color: checkedIn ? '#16A34A' : '#fff',
                  fontWeight: 700, fontSize: 14, cursor: checkedIn ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                }}
              >
                {gpsState === 'loading' && !checkedIn ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
                {checkedIn ? `Checked In — ${formatTime(record?.checkInTime)}` : 'GPS Check-In'}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!checkedIn || checkedOut || gpsState === 'loading'}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                  background: checkedOut ? '#FEE2E2' : (!checkedIn ? '#F1F5F9' : '#DC2626'),
                  color: checkedOut ? '#DC2626' : (!checkedIn ? '#94A3B8' : '#fff'),
                  fontWeight: 700, fontSize: 14, cursor: (!checkedIn || checkedOut) ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                }}
              >
                {gpsState === 'loading' && checkedIn && !checkedOut ? <Loader size={16} /> : <XCircle size={16} />}
                {checkedOut ? `Checked Out — ${formatTime(record?.checkOutTime)}` : 'GPS Check-Out'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
              📍 Location is verified only when you click Check-In or Check-Out — no continuous tracking.
            </p>
          </div>
        </div>
      )}

      {/* ── Today's Activity Log ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setShowActivity(s => !s)}>
          <div>
            <h3>Today's Activity Log</h3>
            <p>{activityLog.length} events recorded</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-neutral">{activityLog.length}</span>
            {showActivity ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
          </div>
        </div>
        {showActivity && (
          <div className="card-body">
            {activityLog.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0', fontSize: 13 }}>
                No activity yet today. Start by clicking "Start Work".
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                {activityLog.map((log, i) => {
                  const cfg = ACTIVITY_CONFIG[log.action] || ACTIVITY_CONFIG.login;
                  const Icon = cfg.icon;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: i < activityLog.length - 1 ? 16 : 0, position: 'relative' }}>
                      {/* Timeline line */}
                      {i < activityLog.length - 1 && (
                        <div style={{ position: 'absolute', left: 15, top: 30, bottom: 0, width: 2, background: 'var(--color-border-light)' }} />
                      )}
                      {/* Icon */}
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0, position: 'relative', zIndex: 1 }}>
                        <Icon size={15} />
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, paddingTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: cfg.color }}>{cfg.label}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-bg)', padding: '1px 7px', borderRadius: 6, border: '1px solid var(--color-border-light)', fontFamily: 'monospace', fontWeight: 600 }}>
                            {formatTimestamp(log.time)}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{log.note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
