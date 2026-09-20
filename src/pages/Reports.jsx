import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  BarChart3, Download, Calendar, FileText,
  ChevronLeft, ChevronRight, Filter, Clock, Users, Building2, FolderKanban
} from 'lucide-react';
import jsPDF from 'jspdf';

// ─── helpers ────────────────────────────────────────────────
function fmt(d) { return d.toISOString().split('T')[0]; }

function todayStr() { return new Date().toISOString().split('T')[0]; }

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(weekStart) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `${weekStart.toLocaleDateString('en-SE', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('en-SE', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function displayDate(str) {
  return new Date(str + 'T00:00:00').toLocaleDateString('en-SE', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ─── PDF generator ──────────────────────────────────────────
function buildPDF({ title, subtitle, entries, getProjectById, getCompanyById, getEmployeeById }) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297, PH = 210, M = 12, CW = PW - M * 2;
  const now = new Date();
  const genStr = now.toLocaleString('en-SE', { dateStyle: 'long', timeStyle: 'short' });
  const totalHours = entries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);

  const drawFooter = (pg, total) => {
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(M, PH - 12, PW - M, PH - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(150, 150, 150);
    pdf.text('TJÄDERTUPPEN Management System — Confidential', M, PH - 6);
    pdf.text(`Generated: ${genStr}`, PW / 2, PH - 6, { align: 'center' });
    pdf.text(`Page ${pg} of ${total}`, PW - M, PH - 6, { align: 'right' });
  };

  // ── Header ──
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, PW, 30, 'F');

  // Logo box
  pdf.setFillColor(29, 78, 216);
  pdf.roundedRect(M, 6, 16, 16, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text('TJ', M + 4.5, 15.5);

  // Company name
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('TJÄDERTUPPEN', M + 20, 13);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text('Management System', M + 20, 20);

  // Report title (right)
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(title, PW - M, 13, { align: 'right' });
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text(subtitle, PW - M, 20, { align: 'right' });

  // Blue stripe
  pdf.setFillColor(29, 78, 216);
  pdf.rect(0, 30, PW, 2, 'F');

  let y = 38;

  // ── Summary stats ──
  const stats = [
    { label: 'TOTAL ENTRIES', value: String(entries.length),          color: [29, 78, 216] },
    { label: 'TOTAL HOURS',   value: `${totalHours.toFixed(1)} h`,    color: [22, 163, 74] },
    { label: 'EMPLOYEES',     value: String([...new Set(entries.map(e => e.employeeId))].length), color: [124, 58, 237] },
    { label: 'PROJECTS',      value: String([...new Set(entries.map(e => e.projectId))].length),  color: [217, 119, 6] },
  ];
  const sw = CW / stats.length;
  stats.forEach((s, i) => {
    const sx = M + i * sw;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(sx, y, sw - 3, 22, 2, 2, 'FD');
    pdf.setFillColor(...s.color);
    pdf.roundedRect(sx, y, sw - 3, 3, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(...s.color);
    pdf.text(s.value, sx + (sw - 3) / 2, y + 13, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(s.label, sx + (sw - 3) / 2, y + 19, { align: 'center' });
  });
  y += 28;

  // ── Table ──
  pdf.setFillColor(29, 78, 216);
  pdf.rect(M, y, 3, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('WORK ENTRIES DETAIL', M + 6, y + 6);
  y += 12;

  const cols = [
    { h: 'Date',        w: 24 },
    { h: 'Employee',    w: 38 },
    { h: 'Client',      w: 38 },
    { h: 'Project',     w: 42 },
    { h: 'Description', w: 55 },
    { h: 'Time',        w: 28 },
    { h: 'Hours',       w: 18 },
    { h: 'Remarks',     w: 30 },
  ];
  const ROW_H = 8;
  const HDR_H = 9;
  const USABLE_H = PH - 18;
  let pageNum = 1;

  const drawHeader = (sy) => {
    pdf.setFillColor(15, 23, 42);
    pdf.rect(M, sy, CW, HDR_H, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    let cx = M;
    cols.forEach(c => {
      const isH = c.h === 'Hours';
      pdf.text(c.h, isH ? cx + c.w - 2 : cx + 2, sy + 6.2, { align: isH ? 'right' : 'left' });
      cx += c.w;
    });
    return sy + HDR_H;
  };

  y = drawHeader(y);

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  sortedEntries.forEach((entry, idx) => {
    if (y + ROW_H > USABLE_H) {
      pdf.addPage();
      pageNum++;
      y = M;
      y = drawHeader(y);
    }

    const emp  = getEmployeeById(entry.employeeId);
    const proj = getProjectById(entry.projectId);
    const co   = getCompanyById(entry.companyId || proj?.companyId);

    const isEven = idx % 2 === 0;
    pdf.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    pdf.rect(M, y, CW, ROW_H, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.15);
    pdf.line(M, y + ROW_H, M + CW, y + ROW_H);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);

    let cx = M;
    const truncate = (str, maxLen) => {
      const s = str || '—';
      return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
    };

    // Date
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.text(entry.date || '—', cx + 2, y + 5.5); cx += cols[0].w;

    // Employee
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(29, 78, 216);
    pdf.text(truncate(emp?.name, 22), cx + 2, y + 5.5); cx += cols[1].w;

    // Client
    pdf.setTextColor(71, 85, 105);
    pdf.text(truncate(co?.name, 24), cx + 2, y + 5.5); cx += cols[2].w;

    // Project
    pdf.setTextColor(15, 23, 42);
    pdf.text(truncate(proj?.name, 24), cx + 2, y + 5.5); cx += cols[3].w;

    // Description
    pdf.setTextColor(100, 116, 139);
    pdf.text(truncate(entry.description, 28), cx + 2, y + 5.5); cx += cols[4].w;

    // Time
    const timeStr = (entry.startTime && entry.endTime) ? `${entry.startTime}–${entry.endTime}` : '—';
    pdf.setTextColor(100, 116, 139);
    pdf.text(timeStr, cx + 2, y + 5.5); cx += cols[5].w;

    // Hours
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(29, 78, 216);
    pdf.text(`${parseFloat(entry.hours || 0).toFixed(1)}h`, cx + cols[6].w - 2, y + 5.5, { align: 'right' });
    cx += cols[6].w;

    // Remarks
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(truncate(entry.remarks, 20), cx + 2, y + 5.5);

    y += ROW_H;
  });

  // ── Totals row ──
  if (y + ROW_H > USABLE_H) { pdf.addPage(); pageNum++; y = M; }
  pdf.setFillColor(235, 244, 255);
  pdf.rect(M, y, CW, 9, 'F');
  pdf.setDrawColor(29, 78, 216);
  pdf.setLineWidth(0.4);
  pdf.line(M, y, M + CW, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(29, 78, 216);
  pdf.text(`TOTAL — ${entries.length} Entries`, M + 2, y + 6);
  pdf.text(`${totalHours.toFixed(1)} h`, M + CW - 2, y + 6, { align: 'right' });
  y += 9;

  // ── Signature section ──
  y += 10;
  if (y + 38 > USABLE_H) { pdf.addPage(); pageNum++; y = M; }
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, CW, 34, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('AUTHORISATION', M + 4, y + 8);
  const sigW = (CW - 12) / 2;
  [
    { label: 'Prepared By (Administrator)', name: 'TJÄDERTUPPEN Admin' },
    { label: 'Approved By / Manager', name: 'Name: _______________________' },
  ].forEach((sig, si) => {
    const sx = M + 4 + si * (sigW + 4);
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(200, 210, 230);
    pdf.roundedRect(sx, y + 12, sigW, 18, 2, 2, 'FD');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(sig.label, sx + 2, y + 16);
    pdf.setDrawColor(180, 190, 210);
    pdf.setLineWidth(0.3);
    pdf.line(sx + 4, y + 25, sx + sigW - 4, y + 25);
    pdf.text(sig.name, sx + 2, y + 28);
  });

  // Footers
  const totalPages = pdf.internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    pdf.setPage(pg);
    drawFooter(pg, totalPages);
  }

  return pdf;
}

// ─── COMPONENT ──────────────────────────────────────────────
const TABS = [
  { key: 'daily',   label: 'Daily',    icon: Calendar },
  { key: 'weekly',  label: 'Weekly',   icon: ChevronRight },
  { key: 'monthly', label: 'Monthly',  icon: BarChart3 },
  { key: 'custom',  label: 'Custom Range', icon: Filter },
];

export default function Reports() {
  const {
    companies, projects, employees, workEntries,
    getProjectById, getEmployeeById, getCompanyById,
  } = useApp();
  const { t } = useLanguage();

  const [tab,            setTab]           = useState('daily');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterClient,   setFilterClient]   = useState('');
  const [filterProject,  setFilterProject]  = useState('');

  // Daily
  const [dailyDate, setDailyDate] = useState(todayStr());

  // Weekly
  const [weekStart, setWeekStart] = useState(() => fmt(getWeekStart(new Date())));

  // Monthly
  const today = new Date();
  const [monthYear, setMonthYear] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

  // Custom
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  // Derived week dates
  const wsDate = new Date(weekStart + 'T00:00:00');
  const weDate = new Date(wsDate);
  weDate.setDate(weDate.getDate() + 6);
  const weFmt = fmt(weDate);

  // Month date range
  const [mYear, mMonth] = monthYear.split('-').map(Number);
  const monthFrom = `${monthYear}-01`;
  const monthTo   = fmt(new Date(mYear, mMonth, 0)); // last day of month

  // Active date range based on tab
  const dateFrom = tab === 'daily'   ? dailyDate
                 : tab === 'weekly'  ? weekStart
                 : tab === 'monthly' ? monthFrom
                 : fromDate;
  const dateTo   = tab === 'daily'   ? dailyDate
                 : tab === 'weekly'  ? weFmt
                 : tab === 'monthly' ? monthTo
                 : toDate;

  const availableProjects = filterClient
    ? projects.filter(p => p.companyId === filterClient)
    : projects;

  const filtered = workEntries.filter(w => {
    const proj = getProjectById(w.projectId);
    const clientId = w.companyId || proj?.companyId;
    return (
      (!filterEmployee || w.employeeId === filterEmployee) &&
      (!filterClient   || clientId === filterClient) &&
      (!filterProject  || w.projectId === filterProject) &&
      (!dateFrom       || w.date >= dateFrom) &&
      (!dateTo         || w.date <= dateTo)
    );
  }).sort((a, b) => a.date.localeCompare(b.date));

  const totalHours = filtered.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);

  // Chart data
  const dateMap = {};
  filtered.forEach(w => { dateMap[w.date] = (dateMap[w.date] || 0) + parseFloat(w.hours || 0); });
  const chartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-20)
    .map(([date, hours]) => ({ date: date.slice(5), hours: parseFloat(hours.toFixed(1)) }));

  const prevWeek = () => { const d = new Date(weekStart + 'T00:00:00'); d.setDate(d.getDate() - 7); setWeekStart(fmt(d)); };
  const nextWeek = () => { const d = new Date(weekStart + 'T00:00:00'); d.setDate(d.getDate() + 7); setWeekStart(fmt(d)); };
  const prevDay  = () => { const d = new Date(dailyDate + 'T00:00:00'); d.setDate(d.getDate() - 1); setDailyDate(fmt(d)); };
  const nextDay  = () => { const d = new Date(dailyDate + 'T00:00:00'); d.setDate(d.getDate() + 1); setDailyDate(fmt(d)); };
  const prevMonth = () => {
    const d = new Date(mYear, mMonth - 2, 1);
    setMonthYear(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const d = new Date(mYear, mMonth, 1);
    setMonthYear(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const getReportTitle = () => {
    if (tab === 'daily')   return { title: 'DAILY WORK REPORT',   subtitle: displayDate(dailyDate) };
    if (tab === 'weekly')  return { title: 'WEEKLY WORK REPORT',  subtitle: weekLabel(wsDate) };
    if (tab === 'monthly') return { title: 'MONTHLY WORK REPORT', subtitle: new Date(mYear, mMonth - 1, 1).toLocaleDateString('en-SE', { month: 'long', year: 'numeric' }) };
    return { title: 'WORK REPORT', subtitle: `${fromDate || '—'} to ${toDate || '—'}` };
  };

  const handleDownloadPDF = () => {
    if (filtered.length === 0) return;
    const { title, subtitle } = getReportTitle();
    const pdf = buildPDF({ title, subtitle, entries: filtered, getProjectById, getCompanyById, getEmployeeById });
    const safeTitle = title.replace(/\s+/g, '_');
    pdf.save(`TJADERTUPPEN_${safeTitle}_${todayStr()}.pdf`);
  };

  const handlePreviewPDF = () => {
    if (filtered.length === 0) return;
    const { title, subtitle } = getReportTitle();
    const pdf = buildPDF({ title, subtitle, entries: filtered, getProjectById, getCompanyById, getEmployeeById });
    window.open(pdf.output('bloburl'), '_blank');
  };

  const LabelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('rep_title')}</h2>
          <p>Generate daily, weekly, monthly, and custom reports with professional PDF export</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={handlePreviewPDF} disabled={filtered.length === 0}>
            <FileText size={15} /> Preview PDF
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPDF} disabled={filtered.length === 0}>
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="report-tabs" style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', width: 'fit-content', boxShadow: 'var(--shadow-sm)' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, border: 'none', padding: '10px 22px', fontSize: 13 }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Filters Card ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div><h3>Report Filters</h3><p>Select period and narrow results by employee, client or project</p></div>
        </div>
        <div className="card-body">
          <div className="report-filters" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>

            {/* Period control */}
            {tab === 'daily' && (
              <div>
                <label style={LabelStyle}>Date</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-ghost btn-icon" onClick={prevDay}><ChevronLeft size={18} /></button>
                  <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} style={{ fontWeight: 600 }} />
                  <button className="btn btn-ghost btn-icon" onClick={nextDay}><ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {tab === 'weekly' && (
              <div>
                <label style={LabelStyle}>Week</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-ghost btn-icon" onClick={prevWeek}><ChevronLeft size={18} /></button>
                  <div style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                    {weekLabel(wsDate)}
                  </div>
                  <button className="btn btn-ghost btn-icon" onClick={nextWeek}><ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {tab === 'monthly' && (
              <div>
                <label style={LabelStyle}>Month</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-ghost btn-icon" onClick={prevMonth}><ChevronLeft size={18} /></button>
                  <input type="month" value={monthYear} onChange={e => setMonthYear(e.target.value)} style={{ fontWeight: 600, padding: '8px 12px' }} />
                  <button className="btn btn-ghost btn-icon" onClick={nextMonth}><ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {tab === 'custom' && (
              <div className="report-custom-dates" style={{ display: 'flex', gap: 12 }}>
                <div>
                  <label style={LabelStyle}>From Date</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </div>
                <div>
                  <label style={LabelStyle}>To Date</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
              </div>
            )}

            {/* Common filters */}
            <div>
              <label style={LabelStyle}>Employee</label>
              <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} style={{ minWidth: 180 }}>
                <option value="">All Employees</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label style={LabelStyle}>Client</label>
              <select value={filterClient} onChange={e => { setFilterClient(e.target.value); setFilterProject(''); }} style={{ minWidth: 180 }}>
                <option value="">All Clients</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={LabelStyle}>Project</label>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ minWidth: 180 }}>
                <option value="">All Projects</option>
                {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {(filterEmployee || filterClient || filterProject) && (
              <div style={{ alignSelf: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setFilterEmployee(''); setFilterClient(''); setFilterProject(''); }}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-icon"><Clock size={20} /></div>
          <div className="stat-content">
            <p>Total Hours</p>
            <h3>{totalHours.toFixed(1)}h</h3>
            <span>for selected period</span>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><FileText size={20} /></div>
          <div className="stat-content">
            <p>Total Entries</p>
            <h3>{filtered.length}</h3>
            <span>work entries found</span>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-content">
            <p>Employees</p>
            <h3>{[...new Set(filtered.map(w => w.employeeId))].length}</h3>
            <span>in this report</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><FolderKanban size={20} /></div>
          <div className="stat-content">
            <p>Projects</p>
            <h3>{[...new Set(filtered.map(w => w.projectId))].length}</h3>
            <span>covered</span>
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div><h3>Hours per Day</h3><p>Work hours distribution across the selected period</p></div>
            <BarChart3 size={20} color="var(--color-text-muted)" />
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3DDD2" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                    formatter={(v) => [`${v}h`, 'Hours']}
                  />
                  <Bar dataKey="hours" fill="#B88A3B" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Entries Table ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Work Entries</h3>
            <p>{filtered.length} entries · {totalHours.toFixed(1)}h total</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={handlePreviewPDF} disabled={filtered.length === 0}>
              <FileText size={13} /> Preview
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF} disabled={filtered.length === 0}>
              <Download size={13} /> PDF
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Client</th>
                <th>Project</th>
                <th>Description</th>
                <th>Time</th>
                <th>Hours</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w, i) => {
                const proj = getProjectById(w.projectId);
                const emp  = getEmployeeById(w.employeeId);
                const co   = getCompanyById(w.companyId || proj?.companyId);
                return (
                  <tr key={w.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{w.date}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {new Date(w.date + 'T00:00:00').toLocaleDateString('en-SE', { weekday: 'short' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{emp?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{emp?.empId}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{co?.name || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{proj?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{proj?.number}</div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.description || '—'}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {w.startTime && w.endTime ? `${w.startTime}–${w.endTime}` : '—'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{w.hours}h</span>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', maxWidth: 140 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.remarks || '—'}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><BarChart3 size={32} /></div>
                    <h3>No entries found</h3>
                    <p>No work entries match the selected period and filters.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        {filtered.length > 0 && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'flex-end', gap: 24, background: 'var(--color-bg)' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Total Entries: <strong style={{ color: 'var(--color-text-primary)' }}>{filtered.length}</strong></span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Total Hours: <strong style={{ color: 'var(--color-primary)', fontSize: 15 }}>{totalHours.toFixed(1)}h</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
