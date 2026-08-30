import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { StatCard } from '../components/ui/Components';
import { Badge } from '../components/ui/Components';
import {
  Building2, FolderKanban, Users, ClipboardList,
  Clock, TrendingUp, Plus, CalendarCheck, AlertTriangle, CheckCircle,
  Play, Coffee, StopCircle, LogIn, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { todayStr, formatTime, formatDistance } from '../utils/geoVerify';


function getLast7Days(workEntries) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-SE', { weekday: 'short', day: 'numeric' });
    const entries = workEntries.filter(w => w.date === key);
    const hours = entries.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);
    days.push({ day: label, hours: parseFloat(hours.toFixed(1)), entries: entries.length });
  }
  return days;
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-SE', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const WORK_STATUS_MAP = {
  offline:        { label: 'Offline',        cls: 'badge-neutral',  color: '#94A3B8', dot: '#94A3B8' },
  logged_in:      { label: 'Logged In',      cls: 'badge-warning',  color: '#D97706', dot: '#F59E0B' },
  working:        { label: 'Working',        cls: 'badge-success',  color: '#16A34A', dot: '#22C55E' },
  on_break:       { label: 'On Break',       cls: 'badge-info',     color: '#7C3AED', dot: '#A78BFA' },
  work_completed: { label: 'Work Completed', cls: 'badge-info',     color: '#0891B2', dot: '#22D3EE' },
};

export default function Dashboard() {
  const {
    companies, projects, employees, workEntries, attendance,
    getProjectById, getEmployeeById, getCompanyById, getEmployeeCurrentStatus,
  } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const today = todayStr();
  const activeProjects  = projects.filter(p => p.status === 'Active').length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const totalHours = workEntries.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);
  const chartData  = getLast7Days(workEntries);

  // Today's attendance
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentToday    = todayAttendance.filter(a => a.checkInStatus === 'verified').length;
  const flaggedToday    = todayAttendance.filter(a => a.checkInStatus === 'flagged').length;
  const workingNow      = todayAttendance.filter(a => a.workStatus === 'working').length;
  const onBreakNow      = todayAttendance.filter(a => a.workStatus === 'on_break').length;
  const workDoneNow     = todayAttendance.filter(a => a.workStatus === 'work_completed').length;
  const loggedInNow     = todayAttendance.filter(a => a.workStatus === 'logged_in').length;

  const recentEntries = [...workEntries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const recentDots = ['blue', 'green', 'purple', 'orange', 'blue'];

  return (
    <div>
      {/* ── Stat Cards ── */}
      <div className="stat-grid">
        <StatCard label={t('dash_stat_companies')}  value={companies.length}            subtext={t('dash_stat_companies_sub')}                colorClass="blue"   icon={Building2} />
        <StatCard label={t('dash_stat_projects')}   value={activeProjects}              subtext={`${projects.length} ${t('lbl_total').toLowerCase()}`}  colorClass="green"  icon={FolderKanban} />
        <StatCard label={t('dash_stat_employees')}  value={activeEmployees}             subtext={`${employees.length} ${t('lbl_total').toLowerCase()}`}   colorClass="purple" icon={Users} />
        <StatCard label={t('dash_stat_hours')} value={totalHours.toFixed(0) + 'h'} subtext={`${workEntries.length} ${t('lbl_entries')}`} colorClass="orange" icon={Clock} />
      </div>

      {/* ── Live Work Status Summary ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3>{t('dash_live_title')}</h3>
            <p>{today} · {t('dash_live_sub')}</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/attendance')}>
            <Activity size={14} /> {t('btn_view_details')}
          </button>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { labelKey: 'status_working',        count: workingNow,   color: '#16A34A', bg: '#F0FDF4', icon: Play,        dot: '#22C55E' },
            { labelKey: 'status_on_break',       count: onBreakNow,   color: '#7C3AED', bg: '#F5F3FF', icon: Coffee,      dot: '#A78BFA' },
            { labelKey: 'status_logged_in',      count: loggedInNow,  color: '#D97706', bg: '#FFFBEB', icon: LogIn,       dot: '#F59E0B' },
            { labelKey: 'status_work_completed', count: workDoneNow,  color: '#0891B2', bg: '#ECFEFF', icon: StopCircle,  dot: '#22D3EE' },
            { labelKey: 'status_gps_verified',   count: presentToday, color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle, dot: '#22C55E' },
            { labelKey: 'status_gps_flagged',    count: flaggedToday, color: '#DC2626', bg: '#FEF2F2', icon: AlertTriangle,dot: '#FCA5A5' },
          ].map(({ labelKey, count, color, bg, icon: Icon, dot }) => (
            <div key={labelKey} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: bg, borderRadius: 12, border: `1.5px solid ${color}25`, minWidth: 140 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: 11, color, fontWeight: 600, opacity: 0.8 }}>{t(labelKey)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Live employee status mini-cards */}
        {employees.filter(e => e.status === 'Active').length > 0 && (
          <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {employees.filter(e => e.status === 'Active').map((emp, i) => {
              const status = getEmployeeCurrentStatus(emp.id);
              const cfg    = WORK_STATUS_MAP[status] || WORK_STATUS_MAP.offline;
              const avatarColors = ['#1D4ED8','#16A34A','#7C3AED','#D97706','#0891B2','#DC2626'];
              const initials = emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--color-bg)', borderRadius: 20, border: `1.5px solid ${cfg.color}30` }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: avatarColors[i % 6], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 9, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{emp.name.split(' ')[0]}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot,
                      animation: (status === 'working' || status === 'logged_in') ? 'pulse-dot 1.5s ease-in-out infinite' : 'none' }} />
                    <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Today's Attendance Table ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3>{t('dash_attendance_title')} — {today}</h3>
            <p>{workingNow} {t('dash_working_dot')} · {onBreakNow} {t('dash_on_break_dot')} · {todayAttendance.length} {t('dash_total_records')}</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/attendance')}>
            <CalendarCheck size={14} /> {t('btn_view_all')}
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('dash_col_employee')}</th>
                <th>{t('dash_col_project')}</th>
                <th>{t('dash_col_login')}</th>
                <th>{t('dash_col_work_start')}</th>
                <th>{t('dash_col_work_end')}</th>
                <th>{t('dash_col_gps_checkin')}</th>
                <th>{t('dash_col_work_status')}</th>
              </tr>
            </thead>
            <tbody>
              {todayAttendance.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>{t('dash_no_attendance')}</td></tr>
              )}
              {todayAttendance.map((a, i) => {
                const emp   = getEmployeeById(a.employeeId);
                const proj  = getProjectById(a.projectId);
                const workSt    = a.workStatus || 'offline';
                const workStCfg = WORK_STATUS_MAP[workSt] || WORK_STATUS_MAP.offline;
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{emp?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp?.empId}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{proj?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{proj?.number}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatTimestamp(a.loginTime)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#16A34A', fontWeight: 700 }}>{formatTimestamp(a.workStartTime)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#D97706', fontWeight: 700 }}>{formatTimestamp(a.workEndTime)}</td>
                    <td style={{ fontWeight: 600 }}>{formatTime(a.checkInTime)}</td>
                    <td>
                      <span className={`badge ${workStCfg.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: workStCfg.dot,
                          animation: (workSt === 'working' || workSt === 'logged_in') ? 'pulse-dot 1.5s ease-in-out infinite' : 'none' }} />
                        {workStCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Charts + Activity ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3>{t('dash_chart_title')}</h3>
              <p>{t('dash_chart_sub')}</p>
            </div>
            <TrendingUp size={20} color="var(--color-text-muted)" />
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                    formatter={(v) => [`${v}h`, 'Hours']}
                  />
                  <Bar dataKey="hours" fill="#1D4ED8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>{t('dash_recent_title')}</h3>
              <p>{t('dash_recent_sub')}</p>
            </div>
          </div>
          <div className="card-body">
            {recentEntries.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>{t('dash_no_entries')}</p>
            ) : (
              <div className="recent-activity">
                {recentEntries.map((entry, i) => {
                  const project  = getProjectById(entry.projectId);
                  const employee = getEmployeeById(entry.employeeId);
                  return (
                    <div key={entry.id} className="activity-item">
                      <div className={`activity-dot ${recentDots[i % recentDots.length]}`} />
                      <div className="activity-info">
                        <p><strong>{employee?.name || 'Unknown'}</strong> — {project?.name || 'Unknown'}</p>
                        <span>{entry.hours}h on {entry.date} · {entry.description?.slice(0, 48) || 'No description'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Projects Overview ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>{t('dash_projects_title')}</h3>
            <p>{t('dash_projects_sub')}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')}>
            <Plus size={14} /> {t('btn_add_project')}
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('dash_col_project')}</th>
                <th>{t('dash_col_client')}</th>
                <th>{t('dash_col_location')}</th>
                <th>{t('dash_col_start')}</th>
                <th>{t('dash_col_end')}</th>
                <th>{t('dash_col_status')}</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.number}</div>
                  </td>
                  <td>{getCompanyById(p.companyId)?.name || '—'}</td>
                  <td>{p.location}</td>
                  <td>{p.startDate}</td>
                  <td>{p.endDate}</td>
                  <td><Badge status={p.status} /></td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 32 }}>{t('dash_no_projects')}</td></tr>
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
