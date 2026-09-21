import React, { useEffect, useRef, useState } from 'react';
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
import logoUrl from '../assets/TJADERTUPPEN_Logo.jpeg';
import { getWorkEntryHours } from '../utils/workHours';

// ─── helpers ────────────────────────────────────────────────
function fmt(d) { return d.toISOString().split('T')[0]; }

function todayStr() { return new Date().toISOString().split('T')[0]; }

function sanitizeFilenamePart(value) {
  return String(value || 'Employee')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Employee';
}

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
async function loadLogoData() {
  const response = await fetch(logoUrl);
  if (!response.ok) throw new Error('Unable to load the TJÄDERTUPPEN logo for the PDF report.');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to prepare the TJÄDERTUPPEN logo for the PDF report.'));
    reader.readAsDataURL(blob);
  });
}

async function buildPDF({ title, subtitle, entries, getProjectById, getCompanyById, getEmployeeById }) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297, PH = 210, M = 12, CW = PW - M * 2;
  const now = new Date();
  const genStr = now.toLocaleString('en-SE', { dateStyle: 'long', timeStyle: 'short' });
  const totalHours = entries.reduce((s, e) => s + getWorkEntryHours(e), 0);
  const logoData = await loadLogoData();
  const employeeIds = [...new Set(entries.map(entry => entry.employeeId).filter(Boolean))];
  const employeeNames = employeeIds.map(id => getEmployeeById(id)?.name).filter(Boolean);
  const employeeLabel = employeeNames.length === 1 ? employeeNames[0] : 'Multiple employees';
  const employeeIdLabel = employeeIds.length === 1 ? employeeIds[0] : '—';

  const drawFooter = (pg, total) => {
    pdf.setDrawColor(190, 198, 205);
    pdf.setLineWidth(0.3);
    pdf.line(M, PH - 12, PW - M, PH - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(92, 101, 109);
    pdf.text('TJÄDERTUPPEN | Project Management System', M, PH - 6);
    pdf.text(`Generated: ${genStr}`, PW / 2, PH - 6, { align: 'center' });
    pdf.text(`Page ${pg} of ${total}`, PW - M, PH - 6, { align: 'right' });
  };

  // ── Header ──
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PW, 31, 'F');
  pdf.addImage(logoData, 'JPEG', M, 5, 28, 20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(24, 29, 33);
  pdf.text('TJÄDERTUPPEN', M + 34, 13);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(92, 101, 109);
  pdf.text('Project Management System', M + 34, 19);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(24, 29, 33);
  pdf.text(title, PW - M, 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(92, 101, 109);
  pdf.text(subtitle, PW - M, 19, { align: 'right' });
  pdf.setFillColor(61, 75, 87);
  pdf.rect(0, 31, PW, 1.5, 'F');

  let y = 39;

  // ── Employee and report metadata ──
  pdf.setFillColor(247, 248, 249);
  pdf.setDrawColor(207, 213, 218);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, CW, 19, 1.5, 1.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(92, 101, 109);
  pdf.text('EMPLOYEE NAME', M + 5, y + 7);
  pdf.text('EMPLOYEE ID', M + 82, y + 7);
  pdf.text('REPORT PERIOD', M + 145, y + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(24, 29, 33);
  pdf.text(employeeLabel, M + 5, y + 14);
  pdf.text(String(employeeIdLabel), M + 82, y + 14);
  pdf.text(subtitle, M + 145, y + 14);
  y += 26;

  // ── Summary stats ──
  const stats = [
    { label: 'TOTAL ENTRIES', value: String(entries.length) },
    { label: 'TOTAL HOURS',   value: `${totalHours.toFixed(1)} h` },
    { label: 'EMPLOYEES',     value: String([...new Set(entries.map(e => e.employeeId))].length) },
    { label: 'PROJECTS',      value: String([...new Set(entries.map(e => e.projectId))].length) },
  ];
  const sw = CW / stats.length;
  stats.forEach((s, i) => {
    const sx = M + i * sw;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(207, 213, 218);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(sx, y, sw - 3, 22, 2, 2, 'FD');
    pdf.setFillColor(61, 75, 87);
    pdf.roundedRect(sx, y, sw - 3, 2, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(24, 29, 33);
    pdf.text(s.value, sx + (sw - 3) / 2, y + 13, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(92, 101, 109);
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
    { h: 'Date',        w: 26 },
    { h: 'Employee',    w: 38 },
    { h: 'Client',      w: 36 },
    { h: 'Project',     w: 40 },
    { h: 'Description', w: 56 },
    { h: 'Time',        w: 29 },
    { h: 'Hours',       w: 18 },
    { h: 'Remarks',     w: 30 },
  ];
  const HDR_H = 9;
  const USABLE_H = PH - 19;
  let pageNum = 1;

  const drawHeader = (sy) => {
    pdf.setFillColor(61, 75, 87);
    pdf.rect(M, sy, CW, HDR_H, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    let cx = M;
    cols.forEach(c => {
      const isH = c.h === 'Hours';
      pdf.text(c.h, isH ? cx + c.w - 2 : cx + 2, sy + 6.2, { align: isH ? 'right' : 'left' });
      pdf.setDrawColor(128, 139, 148);
      pdf.setLineWidth(0.2);
      pdf.line(cx, sy, cx, sy + HDR_H);
      cx += c.w;
    });
    pdf.line(M + CW, sy, M + CW, sy + HDR_H);
    return sy + HDR_H;
  };

  y = drawHeader(y);

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  sortedEntries.forEach((entry, idx) => {
    const emp  = getEmployeeById(entry.employeeId);
    const proj = getProjectById(entry.projectId);
    const co   = getCompanyById(entry.companyId || proj?.companyId);
    const cellValues = [
      entry.date || '—',
      emp?.name || '—',
      co?.name || '—',
      proj?.name || '—',
      entry.description || '—',
      (entry.startTime && entry.endTime) ? `${entry.startTime}–${entry.endTime}` : '—',
      `${getWorkEntryHours(entry).toFixed(1)}h`,
      entry.remarks || '—',
    ];
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    const lines = cellValues.map((value, cellIndex) =>
      pdf.splitTextToSize(String(value), cols[cellIndex].w - 4).slice(0, 3)
    );
    const rowH = Math.max(9, Math.max(...lines.map(cellLines => cellLines.length)) * 3.5 + 3.5);
    if (y + rowH > USABLE_H) {
      pdf.addPage();
      pageNum++;
      y = M;
      y = drawHeader(y);
    }
    pdf.setFillColor(idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 249);
    pdf.rect(M, y, CW, rowH, 'F');
    pdf.setDrawColor(207, 213, 218);
    pdf.setLineWidth(0.2);
    pdf.rect(M, y, CW, rowH, 'S');
    let cx = M;
    lines.forEach((cellLines, cellIndex) => {
      pdf.setFont('helvetica', cellIndex === 0 || cellIndex === 6 ? 'bold' : 'normal');
      pdf.setTextColor(cellIndex === 6 ? 61 : 24, cellIndex === 6 ? 75 : 29, cellIndex === 6 ? 87 : 33);
      cellLines.forEach((line, lineIndex) => {
        const align = cellIndex === 6 ? 'right' : 'left';
        pdf.text(line, align === 'right' ? cx + cols[cellIndex].w - 2 : cx + 2, y + 4.5 + lineIndex * 3.5, { align });
      });
      pdf.setDrawColor(224, 228, 231);
      pdf.line(cx, y, cx, y + rowH);
      cx += cols[cellIndex].w;
    });
    y += rowH;
  });

  // ── Totals row ──
  if (y + 9 > USABLE_H) { pdf.addPage(); pageNum++; y = M; y = drawHeader(y); }
  pdf.setFillColor(235, 238, 241);
  pdf.rect(M, y, CW, 9, 'F');
  pdf.setDrawColor(61, 75, 87);
  pdf.setLineWidth(0.4);
  pdf.line(M, y, M + CW, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(24, 29, 33);
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
    loadCompanies, loadProjects, loadEmployees, loadWorkEntries,
  } = useApp();
  const { t } = useLanguage();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    Promise.all([loadCompanies(), loadProjects(), loadEmployees(), loadWorkEntries()])
      .catch(error => console.error('Unable to load report data:', error));
  }, []);

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

  const scopedEntries = workEntries.filter(w => (
    (!filterEmployee || w.employeeId === filterEmployee) &&
    (!dateFrom || w.date >= dateFrom) &&
    (!dateTo || w.date <= dateTo)
  ));
  const employeeProjectIds = new Set(scopedEntries.map(w => w.projectId));
  const employeeClientIds = new Set(scopedEntries.map(w => {
    const project = getProjectById(w.projectId);
    return w.companyId || project?.companyId;
  }).filter(Boolean));
  const availableCompanies = companies.filter(c => employeeClientIds.has(c.id));
  const availableProjects = projects.filter(p =>
    employeeProjectIds.has(p.id) && (!filterClient || p.companyId === filterClient)
  );

  const filtered = scopedEntries.filter(w => {
    const proj = getProjectById(w.projectId);
    const clientId = w.companyId || proj?.companyId;
    return (
      (!filterClient   || clientId === filterClient) &&
      (!filterProject  || w.projectId === filterProject)
    );
  }).sort((a, b) => a.date.localeCompare(b.date));

  const totalHours = filtered.reduce((s, w) => s + getWorkEntryHours(w), 0);
  const selectedEmployee = filterEmployee ? getEmployeeById(filterEmployee) : null;
  const reportScope = selectedEmployee
    ? `${selectedEmployee.name} · ${filtered.length} entries · ${totalHours.toFixed(1)}h`
    : `All Employees · ${filtered.length} entries · ${totalHours.toFixed(1)}h combined`;

  // Chart data
  const dateMap = {};
  filtered.forEach(w => { dateMap[w.date] = (dateMap[w.date] || 0) + getWorkEntryHours(w); });
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

  const handleDownloadPDF = async () => {
    if (filtered.length === 0) return;
    const { title, subtitle } = getReportTitle();
    const pdf = await buildPDF({ title, subtitle, entries: filtered, getProjectById, getCompanyById, getEmployeeById });
    if (tab === 'daily' && selectedEmployee) {
      const employeeName = sanitizeFilenamePart(selectedEmployee.name);
      pdf.save(`${employeeName}_Today_work_${todayStr()}.pdf`);
      return;
    }
    const safeTitle = title.replace(/\s+/g, '_');
    pdf.save(`TJADERTUPPEN_${safeTitle}_${todayStr()}.pdf`);
  };

  const handlePreviewPDF = async () => {
    if (filtered.length === 0) return;
    const { title, subtitle } = getReportTitle();
    const pdf = await buildPDF({ title, subtitle, entries: filtered, getProjectById, getCompanyById, getEmployeeById });
    window.open(pdf.output('bloburl'), '_blank');
  };

  const LabelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('rep_title')}</h2>
          <p>
            {reportScope} · Generate daily, weekly, monthly, and custom reports with professional PDF export
          </p>
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
          <div><h3>Report Filters</h3><p>Select period and narrow results by employee, client or project. Every total, chart, detail row and PDF uses the selected scope.</p></div>
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
              <select value={filterEmployee} onChange={e => {
                setFilterEmployee(e.target.value);
                setFilterClient('');
                setFilterProject('');
              }} style={{ minWidth: 180 }}>
                <option value="">All Employees</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label style={LabelStyle}>Client</label>
              <select value={filterClient} onChange={e => { setFilterClient(e.target.value); setFilterProject(''); }} style={{ minWidth: 180 }}>
                <option value="">All Clients</option>
                {availableCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            <div><h3>Hours per Day</h3><p>{selectedEmployee ? `Work hours for ${selectedEmployee.name}` : 'Combined work hours for all employees'} across the selected period</p></div>
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
            <p>{reportScope}</p>
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
        <div className="table-wrapper table-report-entries">
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
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{getWorkEntryHours(w)}h</span>
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
