import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getWorkEntryBreakdown, getWorkEntryHours } from '../utils/workHours';
import { useLanguage } from '../context/LanguageContext';
import { StatCard } from '../components/ui/Components';
import { Badge } from '../components/ui/Components';
import {
  Building2, FolderKanban, Users,
  Clock, TrendingUp, Plus, CalendarCheck,
} from 'lucide-react';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function Dashboard() {
  const {
    companies, projects, employees, workEntries,
    getProjectById, getEmployeeById, getCompanyById,
    loadCompanies, loadProjects, loadEmployees, loadWorkEntries,
  } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    Promise.all([loadCompanies(), loadProjects(), loadEmployees(), loadWorkEntries()])
      .catch(error => console.error('Unable to load dashboard data:', error));
  }, []);

  const today = todayStr();
  const todayLabel = new Date(`${today}T00:00:00`).toLocaleDateString(t('ui_locale'));
  const activeProjects  = projects.filter(p => p.status === 'Active').length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const hourTotals = workEntries.reduce((sum, entry) => {
    const hours = getWorkEntryBreakdown(entry);
    return {
      normal: sum.normal + hours.normalHours,
      overtime: sum.overtime + hours.normalOvertime,
      weekend: sum.weekend + hours.weekendOvertime,
    };
  }, { normal: 0, overtime: 0, weekend: 0 });
  const todayEntries    = workEntries.filter(w => w.date === today);

  const recentEntries = [...workEntries]
    .sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      return dateDiff !== 0 ? dateDiff : b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5);

  const recentDots = ['blue', 'green', 'purple', 'orange', 'blue'];

  return (
    <div className="dashboard-page">
      {/* ── Stat Cards ── */}
      <div className="stat-grid">
        <StatCard label={t('dash_clients')} value={companies.length} subtext={t('dash_registered', [companies.length])} colorClass="blue" icon={Building2} />
        <StatCard label={t('dash_active_projects')} value={activeProjects} subtext={t('dash_total', [projects.length])} colorClass="green" icon={FolderKanban} />
        <StatCard label={t('lbl_employee')} value={activeEmployees} subtext={t('dash_total', [employees.length])} colorClass="purple" icon={Users} />
        <StatCard label={t('dash_today_entries')} value={todayEntries.length} subtext={todayLabel} colorClass="orange" icon={CalendarCheck} />
        <StatCard label={t('dash_regular_hours')} value={hourTotals.normal.toFixed(1) + 'h'} subtext={`${workEntries.length} ${t('lbl_entries')}`} colorClass="blue" icon={Clock} />
        <StatCard label={t('dash_regular_overtime')} value={hourTotals.overtime.toFixed(1) + 'h'} subtext={t('dash_manual_entered')} colorClass="orange" icon={TrendingUp} />
        <StatCard label={t('dash_weekend_overtime')} value={hourTotals.weekend.toFixed(1) + 'h'} subtext={t('dash_saturday_sunday')} colorClass="purple" icon={CalendarCheck} />
      </div>

      {/* ── Today's Work Entries ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3>{t('dash_today_work_entries')}</h3>
            <p>{todayLabel} · {t('dash_entries_logged', [todayEntries.length])}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/work-entry')}>
            <Plus size={14} /> {t('dash_add_entry')}
          </button>
        </div>
        <div className="table-wrapper table-dashboard-entries">
          <table>
            <thead>
              <tr>
                <th>{t('lbl_employee')}</th>
                <th>{t('dash_col_client')}</th>
                <th>{t('lbl_project')}</th>
                <th>{t('dash_normal_hours')}</th>
                <th>{t('dash_normal_ot')}</th>
                <th>{t('dash_weekend_ot')}</th>
                <th>{t('lbl_description')}</th>
                <th>{t('dash_time')}</th>
              </tr>
            </thead>
            <tbody>
              {todayEntries.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 32 }}>
                    {t('dash_no_today_entries')} <button className="btn btn-primary btn-sm" style={{ marginLeft: 12 }} onClick={() => navigate('/work-entry')}><Plus size={13} /> {t('dash_add_entry')}</button>
                  </td>
                </tr>
              )}
              {todayEntries.map((w) => {
                const emp  = getEmployeeById(w.employeeId);
                const proj = getProjectById(w.projectId);
                const co   = getCompanyById(w.companyId || proj?.companyId);
                return (
                  <tr key={w.id}>
                    <td>
                        <div style={{ fontWeight: 600 }}>{emp?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp?.role}</div>
                    </td>
                    <td>{co?.name || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{proj?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{proj?.number}</div>
                    </td>
                    <td>{getWorkEntryBreakdown(w).normalHours.toFixed(1)}h</td>
                    <td>{getWorkEntryBreakdown(w).normalOvertime.toFixed(1)}h</td>
                    <td>{getWorkEntryBreakdown(w).weekendOvertime.toFixed(1)}h</td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.description || '—'}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {w.startTime && w.endTime ? `${w.startTime} – ${w.endTime}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <h3>{t('dash_recent_title')}</h3>
              <p>{t('dash_recent_sub')}</p>
            </div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/work-entry')}>
              {t('btn_view_all')}
            </button>
          </div>
          <div className="card-body">
            {recentEntries.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', padding: '24px 0' }}>{t('dash_no_entries')}</p>
            ) : (
              <div className="recent-activity">
                {recentEntries.map((entry, i) => {
                  const project  = getProjectById(entry.projectId);
                  const employee = getEmployeeById(entry.employeeId);
                  const co       = getCompanyById(entry.companyId || project?.companyId);
                  return (
                    <div key={entry.id} className="activity-item">
                      <div className={`activity-dot ${recentDots[i % recentDots.length]}`} />
                      <div className="activity-info">
                        <p><strong>{employee?.name || t('ui_unknown')}</strong> — {project?.name || t('ui_unknown')}</p>
                        <span>{getWorkEntryHours(entry)}h {t('dash_on_date')} {entry.date} · {co?.name || ''} · {entry.description?.slice(0, 40) || t('ui_no_description')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
        <div className="table-wrapper table-dashboard-projects">
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
    </div>
  );
}
