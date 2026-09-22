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
import { getWorkEntryBreakdown, getWorkEntryHours, getWeeklyHours } from '../utils/workHours';

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

async function buildPDF({ title, subtitle, entries, expenditures, getProjectById, getCompanyById, getEmployeeById }) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297, PH = 210, M = 12, CW = PW - M * 2;
  const now = new Date();
  const genStr = now.toLocaleString('en-SE', { dateStyle: 'long', timeStyle: 'short' });
  const totals = entries.reduce((sum, entry) => {
    const hours = getWorkEntryBreakdown(entry);
    return {
      normal: sum.normal + hours.normalHours,
      overtime: sum.overtime + hours.normalOvertime,
      weekend: sum.weekend + hours.weekendOvertime,
    };
  }, { normal: 0, overtime: 0, weekend: 0 });
  const totalHours = totals.normal + totals.overtime + totals.weekend;
  const logoData = await loadLogoData();
  const employeeIds = [...new Set(entries.map(entry => entry.employeeId).filter(Boolean))];
  const employeeNames = employeeIds.map(id => getEmployeeById(id)?.name).filter(Boolean);
  const employeeCode = id => {
    const value = String(getEmployeeById(id)?.empId || id);
    return /^\d+$/.test(value) ? `EMP-${value.padStart(3, '0')}` : value;
  };
  const employeeLabel = employeeNames.length === 1 ? employeeNames[0] : 'Multiple employees';

  const drawFooter = (pg, total) => {
    pdf.setDrawColor(190, 198, 205);
    pdf.setLineWidth(0.3);
    pdf.line(M, PH - 12, PW - M, PH - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(92, 101, 109);
    pdf.text('Tjädertuppen Svets och konsult', M, PH - 6);
    pdf.text(`Generated: ${genStr}`, PW / 2, PH - 6, { align: 'center' });
    pdf.text(`Page ${pg} of ${total}`, PW - M, PH - 6, { align: 'right' });
  };

  // ── Header ──
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PW, 31, 'F');
  pdf.addImage(logoData, 'JPEG', M, 5, 28, 20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(19);
  pdf.setTextColor(24, 29, 33);
  pdf.text('TJÄDERTUPPEN', M + 34, 13);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(92, 101, 109);
  pdf.text('Tjädertuppen Svets och konsult', M + 34, 19);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(24, 29, 33);
  pdf.text(title, PW - M, 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(92, 101, 109);
  pdf.text(subtitle, PW - M, 19, { align: 'right' });
  pdf.setFillColor(31, 48, 65);
  pdf.rect(0, 31, PW, 1.5, 'F');

  let y = 39;

  // ── Employee and report metadata ──
  pdf.setFillColor(247, 248, 249);
  pdf.setDrawColor(207, 213, 218);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, CW, 16, 1.5, 1.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(92, 101, 109);
  pdf.text('EMPLOYEE NAME', M + 5, y + 7);
  pdf.text('REPORT PERIOD', M + 145, y + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(24, 29, 33);
  pdf.text(employeeLabel, M + 5, y + 14);
  pdf.text(subtitle, M + 145, y + 14);
  y += 22;

  // ── Summary stats ──
  const stats = [
    { label: 'TOTAL ENTRIES', value: String(entries.length) },
    { label: 'NORMAL HOURS',  value: `${totals.normal.toFixed(1)} h` },
    { label: 'NORMAL OVERTIME', value: `${totals.overtime.toFixed(1)} h` },
    { label: 'WEEKEND OVERTIME', value: `${totals.weekend.toFixed(1)} h` },
    { label: 'WEEKLY HOURS', value: `${totalHours.toFixed(1)} h` },
    { label: 'EMPLOYEES',     value: String([...new Set(entries.map(e => e.employeeId))].length) },
    { label: 'PROJECTS',      value: String([...new Set(entries.map(e => e.projectId))].length) },
  ];
  const sw = CW / stats.length;
  stats.forEach((s, i) => {
    const sx = M + i * sw;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(207, 213, 218);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(sx, y, sw - 3, 18, 2, 2, 'FD');
    pdf.setFillColor(193, 151, 72);
    pdf.roundedRect(sx, y, sw - 3, 2, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(24, 29, 33);
    pdf.text(s.value, sx + (sw - 3) / 2, y + 11, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(92, 101, 109);
    pdf.text(s.label, sx + (sw - 3) / 2, y + 16, { align: 'center' });
  });
  y += 22;

  // ── Table ──
  pdf.setFillColor(193, 151, 72);
  pdf.rect(M, y, 3, 7, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42);
  pdf.text('WORK ENTRIES DETAIL', M + 6, y + 5.5);
  y += 9;

  const cols = [
    { h: 'Date',          w: 20 },
    { h: 'Employee ID',   w: 28 },
    { h: 'Client',        w: 25 },
    { h: 'Project',       w: 28 },
    { h: 'Normal hrs',    w: 25 },
    { h: 'Normal OT',     w: 23 },
    { h: 'Weekend OT',    w: 28 },
    { h: 'Weekly hrs',    w: 25 },
    { h: 'Remarks',       w: 71 },
  ];
  const HDR_H = 9;
  const drawHeader = (sy) => {
    pdf.setFillColor(31, 48, 65);
    pdf.rect(M, sy, CW, HDR_H, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    let cx = M;
    cols.forEach(c => {
      const rightAligned = c.h === 'Hours' || c.h === 'Weekly hrs';
      pdf.text(c.h, rightAligned ? cx + c.w - 2 : cx + 2, sy + 6.2, { align: rightAligned ? 'right' : 'left' });
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
      emp ? `${emp.name || '—'}\nID: ${employeeCode(entry.employeeId)}` : '—',
      co?.name || '—',
      proj?.name || '—',
      `${getWorkEntryBreakdown(entry).normalHours.toFixed(1)}h`,
      `${getWorkEntryBreakdown(entry).normalOvertime.toFixed(1)}h`,
      `${getWorkEntryBreakdown(entry).weekendOvertime.toFixed(1)}h`,
      `${getWeeklyHours(entries, entry.employeeId, entry.date).toFixed(1)}h`,
      entry.remarks || '—',
    ];
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const lines = cellValues.map((value, cellIndex) =>
      pdf.splitTextToSize(String(value), cols[cellIndex].w - 4).slice(0, 3)
    );
    const rowH = Math.max(10, Math.max(...lines.map(cellLines => cellLines.length)) * 3.8 + 3.8);
    pdf.setFillColor(idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 249);
    pdf.rect(M, y, CW, rowH, 'F');
    pdf.setDrawColor(207, 213, 218);
    pdf.setLineWidth(0.2);
    pdf.rect(M, y, CW, rowH, 'S');
    let cx = M;
    lines.forEach((cellLines, cellIndex) => {
      pdf.setFont('helvetica', cellIndex === 0 || cellIndex >= 4 && cellIndex <= 7 ? 'bold' : 'normal');
      pdf.setTextColor(cellIndex >= 4 && cellIndex <= 7 ? 61 : 24, cellIndex >= 4 && cellIndex <= 7 ? 75 : 29, cellIndex >= 4 && cellIndex <= 7 ? 87 : 33);
      cellLines.forEach((line, lineIndex) => {
        const align = cellIndex >= 4 && cellIndex <= 7 ? 'right' : 'left';
        pdf.text(line, align === 'right' ? cx + cols[cellIndex].w - 2 : cx + 2, y + 4.8 + lineIndex * 3.8, { align });
      });
      pdf.setDrawColor(224, 228, 231);
      pdf.line(cx, y, cx, y + rowH);
      cx += cols[cellIndex].w;
    });
    y += rowH;
  });

  // ── Totals row ──
  pdf.setFillColor(235, 238, 241);
  pdf.rect(M, y, CW, 7, 'F');
  pdf.setDrawColor(61, 75, 87);
  pdf.setLineWidth(0.4);
  pdf.line(M, y, M + CW, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(24, 29, 33);
  pdf.text(`TOTAL — ${entries.length} Entries`, M + 2, y + 5);
  pdf.text(`Normal ${totals.normal.toFixed(1)} h | OT ${totals.overtime.toFixed(1)} h | Weekend ${totals.weekend.toFixed(1)} h | Weekly ${totalHours.toFixed(1)} h`, M + CW - 2, y + 5, { align: 'right' });
  y += 7;

  // ── Travel details (only shown when journeys were recorded) ──
  if (expenditures.length > 0) {
    y += 10;
    const travelCols = [
      { h: 'Date', w: 23 },
      { h: 'Employee ID', w: 40 },
      { h: 'Project', w: 36 },
      { h: 'Journey', w: 70 },
      { h: 'Kilometers', w: 27 },
      { h: 'Remarks', w: 77 },
    ];
    const travelHeaderHeight = 7;
    const drawTravelHeader = (sy) => {
      pdf.setFillColor(31, 48, 65);
      pdf.rect(M, sy, CW, travelHeaderHeight, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      let cx = M;
      travelCols.forEach(column => {
        const rightAligned = column.h === 'Kilometers';
        pdf.text(column.h, rightAligned ? cx + column.w - 2 : cx + 2, sy + 5, { align: rightAligned ? 'right' : 'left' });
        pdf.setDrawColor(128, 139, 148);
        pdf.setLineWidth(0.2);
        pdf.line(cx, sy, cx, sy + travelHeaderHeight);
        cx += column.w;
      });
      pdf.line(M + CW, sy, M + CW, sy + travelHeaderHeight);
      return sy + travelHeaderHeight;
    };

    pdf.setFillColor(193, 151, 72);
    pdf.rect(M, y, 3, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text('TRAVEL / EXPENDITURE DETAILS', M + 6, y + 5.5);
    y += 9;
    y = drawTravelHeader(y);

    const totalKilometers = expenditures.reduce((sum, item) => sum + Number(item.kilometers || 0), 0);
    [...expenditures].sort((a, b) => a.journeyDate.localeCompare(b.journeyDate)).forEach((item, idx) => {
      const employee = getEmployeeById(item.employeeId);
      const project = getProjectById(item.projectId);
      const values = [
        item.journeyDate || '—',
        employee ? `${employee.name || '—'}\nID: ${employeeCode(item.employeeId)}` : '—',
        project?.name || '—',
        `${item.startPlace || '—'} → ${item.endPlace || '—'}`,
        `${Number(item.kilometers || 0).toLocaleString()} km`,
        item.remarks || '—',
      ];
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const lines = values.map((value, cellIndex) =>
        pdf.splitTextToSize(String(value), travelCols[cellIndex].w - 4).slice(0, 3)
      );
      const rowH = Math.max(10, Math.max(...lines.map(cellLines => cellLines.length)) * 3.8 + 3.8);
      pdf.setFillColor(idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 249);
      pdf.rect(M, y, CW, rowH, 'F');
      pdf.setDrawColor(207, 213, 218);
      pdf.setLineWidth(0.2);
      pdf.rect(M, y, CW, rowH, 'S');
      let cx = M;
      lines.forEach((cellLines, cellIndex) => {
        const rightAligned = cellIndex === 4;
        pdf.setFont('helvetica', cellIndex === 4 ? 'bold' : 'normal');
        pdf.setTextColor(cellIndex === 4 ? 61 : 24, cellIndex === 4 ? 75 : 29, cellIndex === 4 ? 87 : 33);
        cellLines.forEach((line, lineIndex) => {
          pdf.text(line, rightAligned ? cx + travelCols[cellIndex].w - 2 : cx + 2, y + 4.8 + lineIndex * 3.8, { align: rightAligned ? 'right' : 'left' });
        });
        pdf.setDrawColor(224, 228, 231);
        pdf.line(cx, y, cx, y + rowH);
        cx += travelCols[cellIndex].w;
      });
      y += rowH;
    });
    pdf.setFillColor(235, 238, 241);
    pdf.rect(M, y, CW, 7, 'F');
    pdf.setDrawColor(61, 75, 87);
    pdf.setLineWidth(0.4);
    pdf.line(M, y, M + CW, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(24, 29, 33);
    pdf.text(`TOTAL — ${expenditures.length} Journeys`, M + 2, y + 5);
    pdf.text(`${totalKilometers.toLocaleString()} km`, M + CW - 2, y + 5, { align: 'right' });
    y += 7;
  }

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
    companies, projects, employees, workEntries, expenditures,
    getProjectById, getEmployeeById, getCompanyById,
    loadCompanies, loadProjects, loadEmployees, loadWorkEntries, loadExpenditures,
  } = useApp();
  const { t } = useLanguage();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    Promise.all([loadCompanies(), loadProjects(), loadEmployees(), loadWorkEntries(), loadExpenditures()])
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

  const reportExpenditures = expenditures.filter(item => (
    (!filterEmployee || item.employeeId === filterEmployee) &&
    (!dateFrom || item.journeyDate >= dateFrom) &&
    (!dateTo || item.journeyDate <= dateTo) &&
    (!filterProject || item.projectId === filterProject) &&
    (!filterClient || getProjectById(item.projectId)?.companyId === filterClient)
  ));

  const reportTotals = filtered.reduce((sum, entry) => {
    const hours = getWorkEntryBreakdown(entry);
    return {
      normal: sum.normal + hours.normalHours,
      overtime: sum.overtime + hours.normalOvertime,
      weekend: sum.weekend + hours.weekendOvertime,
    };
  }, { normal: 0, overtime: 0, weekend: 0 });
  const totalHours = reportTotals.normal + reportTotals.overtime + reportTotals.weekend;
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
    const pdf = await buildPDF({ title, subtitle, entries: filtered, expenditures: reportExpenditures, getProjectById, getCompanyById, getEmployeeById });
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
    const pdf = await buildPDF({ title, subtitle, entries: filtered, expenditures: reportExpenditures, getProjectById, getCompanyById, getEmployeeById });
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
            <p>Normal Working Hours</p>
            <h3>{reportTotals.normal.toFixed(1)}h</h3>
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
                <th>Normal Working Hours</th>
                <th>Normal Overtime</th>
                <th>Weekend Overtime</th>
                <th>Weekly Hours</th>
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
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{getWorkEntryBreakdown(w).normalHours.toFixed(1)}h</span>
                    </td>
                    <td>{getWorkEntryBreakdown(w).normalOvertime.toFixed(1)}h</td>
                    <td>{getWorkEntryBreakdown(w).weekendOvertime.toFixed(1)}h</td>
                    <td>{getWeeklyHours(workEntries, w.employeeId, w.date).toFixed(1)}h</td>
                    <td style={{ color: 'var(--color-text-muted)', maxWidth: 140 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.remarks || '—'}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10}>
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
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Normal: <strong>{reportTotals.normal.toFixed(1)}h</strong></span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Normal OT: <strong>{reportTotals.overtime.toFixed(1)}h</strong></span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Weekend OT: <strong>{reportTotals.weekend.toFixed(1)}h</strong></span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Weekly Hours: <strong style={{ color: 'var(--color-primary)', fontSize: 15 }}>{totalHours.toFixed(1)}h</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
