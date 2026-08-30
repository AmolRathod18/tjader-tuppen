import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  BarChart3, Download, Printer, User, Calendar,
  FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';

// ─── helpers ────────────────────────────────────────────────
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Mon
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmt(d) {
  return d.toISOString().split('T')[0];
}

function displayDate(str) {
  return new Date(str + 'T00:00:00').toLocaleDateString('en-SE', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
}

function weekLabel(weekStart) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `${weekStart.toLocaleDateString('en-SE', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('en-SE', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── PDF generator ──────────────────────────────────────────
function generateWeeklyPDF({ employee, weekStart, weekEntries, getProjectById, getCompanyById }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;
  const PH = 297;
  const M = 15;       // margin
  const CW = PW - M * 2; // content width
  const now = new Date();
  const genStr = now.toLocaleString('en-SE', { dateStyle: 'long', timeStyle: 'short' });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekStr = `${weekStart.toLocaleDateString('en-SE', { day: '2-digit', month: 'short', year: 'numeric' })} — ${weekEnd.toLocaleDateString('en-SE', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const totalWeekHours = weekEntries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);

  // ── draw footer ──
  const drawFooter = (pg, total) => {
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.line(M, PH - 12, PW - M, PH - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(150, 150, 150);
    pdf.text('WeldPro — Welding Project Management System', M, PH - 6);
    pdf.text(`Generated: ${genStr}`, PW / 2, PH - 6, { align: 'center' });
    pdf.text(`Page ${pg} of ${total}`, PW - M, PH - 6, { align: 'right' });
  };

  // ════════════════════════════════════
  //  HEADER BAR (dark navy)
  // ════════════════════════════════════
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, PW, 28, 'F');

  // Blue logo box
  pdf.setFillColor(29, 78, 216);
  pdf.roundedRect(M, 6, 15, 15, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text('W', M + 5, 15.5);

  // App name
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('WeldPro', M + 19, 13);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text('Welding Project Management System', M + 19, 19);

  // Report type (right)
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('WEEKLY TIMESHEET', PW - M, 13, { align: 'right' });
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text(weekStr, PW - M, 19, { align: 'right' });

  // ── Blue accent stripe under header ──
  pdf.setFillColor(29, 78, 216);
  pdf.rect(0, 28, PW, 2, 'F');

  let y = 36;

  // ════════════════════════════════════
  //  EMPLOYEE PROFILE CARD
  // ════════════════════════════════════
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(M, y, CW, 32, 3, 3, 'FD');

  // Blue left accent
  pdf.setFillColor(29, 78, 216);
  pdf.roundedRect(M, y, 4, 32, 2, 2, 'F');

  // Avatar circle
  pdf.setFillColor(29, 78, 216);
  pdf.circle(M + 20, y + 16, 10, 'F');
  const initials = employee.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(initials, M + 20, y + 19, { align: 'center' });

  // Employee info
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42);
  pdf.text(employee.name, M + 34, y + 11);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Employee ID: ${employee.empId || '—'}   |   Role: ${employee.role || '—'}`, M + 34, y + 18);

  pdf.setFontSize(8.5);
  pdf.setTextColor(100, 116, 139);
  const contactLine = [
    employee.phone ? `Phone: ${employee.phone}` : null,
    employee.email ? `Email: ${employee.email}` : null,
  ].filter(Boolean).join('   |   ');
  if (contactLine) pdf.text(contactLine, M + 34, y + 25);

  // Status badge (right side)
  const statusColor = employee.status === 'Active' ? [22, 163, 74] : [100, 116, 139];
  pdf.setFillColor(...statusColor);
  pdf.roundedRect(PW - M - 24, y + 10, 22, 8, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(employee.status || 'Active', PW - M - 13, y + 15.2, { align: 'center' });

  y += 38;

  // ════════════════════════════════════
  //  WEEK SUMMARY STATS
  // ════════════════════════════════════
  const dayMap = {};
  weekEntries.forEach(e => {
    if (!dayMap[e.date]) dayMap[e.date] = 0;
    dayMap[e.date] += parseFloat(e.hours) || 0;
  });
  const workedDays = Object.keys(dayMap).length;
  const projectIds = [...new Set(weekEntries.map(e => e.projectId))];

  const summaryStats = [
    { label: 'TOTAL HOURS', value: `${totalWeekHours.toFixed(1)} h`, color: [29, 78, 216] },
    { label: 'DAYS WORKED', value: `${workedDays} / 7`, color: [22, 163, 74] },
    { label: 'WORK ENTRIES', value: String(weekEntries.length), color: [124, 58, 237] },
    { label: 'PROJECTS', value: String(projectIds.length), color: [217, 119, 6] },
  ];
  const sw = CW / summaryStats.length;
  summaryStats.forEach((s, i) => {
    const sx = M + i * sw;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(sx, y, sw - 3, 22, 2, 2, 'FD');
    // Top bar
    pdf.setFillColor(...s.color);
    pdf.roundedRect(sx, y, sw - 3, 3, 1, 1, 'F');
    // Value
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(...s.color);
    pdf.text(s.value, sx + (sw - 3) / 2, y + 13, { align: 'center' });
    // Label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(s.label, sx + (sw - 3) / 2, y + 19, { align: 'center' });
  });

  y += 28;

  // ════════════════════════════════════
  //  DAILY BREAKDOWN TABLE
  // ════════════════════════════════════
  // Section title
  pdf.setFillColor(29, 78, 216);
  pdf.rect(M, y, 3, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('DAILY WORK BREAKDOWN', M + 6, y + 6);
  y += 12;

  // Table header
  const cols = [
    { h: 'Day',         w: 26 },
    { h: 'Date',        w: 24 },
    { h: 'Project',     w: 48 },
    { h: 'Description', w: 62 },
    { h: 'Notes',       w: 26 },
    { h: 'Hours',       w: 14 },
  ];
  const ROW_H = 8;
  const HDR_H = 9;
  const USABLE_H = PH - 20;

  const drawHeader = (sy) => {
    pdf.setFillColor(15, 23, 42);
    pdf.rect(M, sy, CW, HDR_H, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    let cx = M;
    cols.forEach(c => {
      const isHours = c.h === 'Hours';
      pdf.text(c.h, isHours ? cx + c.w - 2 : cx + 2, sy + 6.2, { align: isHours ? 'right' : 'left' });
      cx += c.w;
    });
    return sy + HDR_H;
  };

  y = drawHeader(y);

  // Build rows: for each day of the week, show all entries (or a blank row)
  let rowIdx = 0;
  const dayTotals = {};
  let lastDay = null;

  // Group entries by date
  const entriesByDate = {};
  weekEntries.forEach(e => {
    if (!entriesByDate[e.date]) entriesByDate[e.date] = [];
    entriesByDate[e.date].push(e);
  });

  // Iterate Mon–Sun
  for (let di = 0; di < 7; di++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + di);
    const dateKey = fmt(dayDate);
    const dayName = DAY_NAMES[di];
    const dayEntries = entriesByDate[dateKey] || [];
    const isWeekend = di >= 5;
    const bgBase = isWeekend ? [245, 243, 255] : (rowIdx % 2 === 0 ? [255, 255, 255] : [248, 250, 252]);

    if (dayEntries.length === 0) {
      // Empty day row
      if (y + ROW_H > USABLE_H) {
        pdf.addPage();
        y = M;
        y = drawHeader(y);
      }
      pdf.setFillColor(...bgBase);
      pdf.rect(M, y, CW, ROW_H, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.15);
      pdf.line(M, y + ROW_H, M + CW, y + ROW_H);

      pdf.setFont('helvetica', isWeekend ? 'italic' : 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(isWeekend ? 150 : 15, isWeekend ? 100 : 23, isWeekend ? 180 : 42);
      pdf.text(dayName, M + 2, y + 5.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(dateKey, M + 28, y + 5.5);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(180, 180, 180);
      pdf.text('No work logged', M + 54, y + 5.5);
      // Hours: dash
      pdf.setTextColor(200, 200, 200);
      pdf.text('—', M + CW - 2, y + 5.5, { align: 'right' });
      y += ROW_H;
      rowIdx++;
    } else {
      // One row per entry in this day
      dayEntries.forEach((entry, ei) => {
        if (y + ROW_H > USABLE_H) {
          pdf.addPage();
          y = M;
          y = drawHeader(y);
        }
        const project = getProjectById(entry.projectId);
        const company = getCompanyById(project?.companyId);
        const projLabel = project ? `${project.name} (${project.number || ''})` : '—';

        pdf.setFillColor(...bgBase);
        pdf.rect(M, y, CW, ROW_H, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.15);
        pdf.line(M, y + ROW_H, M + CW, y + ROW_H);

        // Day name (only on first entry of day)
        if (ei === 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7.5);
          pdf.setTextColor(isWeekend ? 124 : 15, isWeekend ? 58 : 23, isWeekend ? 237 : 42);
          pdf.text(dayName, M + 2, y + 5.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 116, 139);
          pdf.text(dateKey, M + 28, y + 5.5);
        } else {
          // continuation rows: show arrow
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(180, 180, 180);
          pdf.text('↳', M + 2, y + 5.5);
        }

        // Project
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(15, 23, 42);
        let pTxt = projLabel.length > 28 ? projLabel.slice(0, 26) + '…' : projLabel;
        pdf.text(pTxt, M + 52, y + 5.5);

        // Description
        let desc = (entry.description || '—');
        if (desc.length > 38) desc = desc.slice(0, 36) + '…';
        pdf.setTextColor(71, 85, 105);
        pdf.text(desc, M + 100, y + 5.5);

        // Notes
        let notes = (entry.notes || '—');
        if (notes.length > 15) notes = notes.slice(0, 13) + '…';
        pdf.setTextColor(150, 150, 150);
        pdf.text(notes, M + 162, y + 5.5);

        // Hours
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(29, 78, 216);
        pdf.text(`${entry.hours} h`, M + CW - 2, y + 5.5, { align: 'right' });

        y += ROW_H;
        rowIdx++;
      });

      // Day subtotal row
      const dayTotal = dayEntries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
      if (y + 7 > USABLE_H) {
        pdf.addPage(); y = M; y = drawHeader(y);
      }
      pdf.setFillColor(235, 244, 255);
      pdf.rect(M, y, CW, 7, 'F');
      pdf.setDrawColor(180, 200, 240);
      pdf.setLineWidth(0.25);
      pdf.line(M, y + 7, M + CW, y + 7);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(29, 78, 216);
      pdf.text(`${dayName} Total`, M + 2, y + 4.8);
      pdf.text(`${dayTotal.toFixed(1)} h`, M + CW - 2, y + 4.8, { align: 'right' });
      y += 7;
    }
  }

  // ════════════════════════════════════
  //  PROJECT SUMMARY TABLE
  // ════════════════════════════════════
  y += 8;
  if (y + 80 > USABLE_H) { pdf.addPage(); y = M; }

  pdf.setFillColor(29, 78, 216);
  pdf.rect(M, y, 3, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('PROJECT SUMMARY', M + 6, y + 6);
  y += 12;

  // Project summary header
  const pCols = [
    { h: '#',       w: 8 },
    { h: 'Project', w: 58 },
    { h: 'Company', w: 52 },
    { h: 'Entries', w: 20 },
    { h: 'Hours',   w: 22 },
    { h: '% of Week', w: 20 },
  ];
  pdf.setFillColor(30, 64, 175);
  pdf.rect(M, y, CW, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 255, 255);
  let pcx = M;
  pCols.forEach(c => {
    pdf.text(c.h, pcx + 2, y + 5.5);
    pcx += c.w;
  });
  y += 8;

  // Project summary rows
  const projSummary = {};
  weekEntries.forEach(e => {
    if (!projSummary[e.projectId]) projSummary[e.projectId] = { entries: 0, hours: 0 };
    projSummary[e.projectId].entries++;
    projSummary[e.projectId].hours += parseFloat(e.hours) || 0;
  });

  Object.entries(projSummary).forEach(([pid, data], i) => {
    const project = getProjectById(pid);
    const company = getCompanyById(project?.companyId);
    const pct = totalWeekHours > 0 ? ((data.hours / totalWeekHours) * 100).toFixed(0) : 0;

    pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    pdf.rect(M, y, CW, 8, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.15);
    pdf.line(M, y + 8, M + CW, y + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);

    let cx2 = M;
    pdf.setTextColor(148, 163, 184);
    pdf.text(String(i + 1), cx2 + 2, y + 5.5); cx2 += 8;

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    const pn = (project?.name || '—').length > 34 ? (project?.name || '—').slice(0, 32) + '…' : (project?.name || '—');
    pdf.text(pn, cx2 + 2, y + 5.5); cx2 += 58;

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    const cn = (company?.name || '—').length > 30 ? (company?.name || '—').slice(0, 28) + '…' : (company?.name || '—');
    pdf.text(cn, cx2 + 2, y + 5.5); cx2 += 52;

    pdf.setTextColor(100, 116, 139);
    pdf.text(String(data.entries), cx2 + 2, y + 5.5); cx2 += 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(29, 78, 216);
    pdf.text(`${data.hours.toFixed(1)} h`, cx2 + 2, y + 5.5); cx2 += 22;

    // Progress bar for %
    const barW = 14;
    const filled = (parseInt(pct) / 100) * barW;
    pdf.setFillColor(226, 232, 240);
    pdf.roundedRect(cx2 + 2, y + 2.5, barW, 3, 1, 1, 'F');
    pdf.setFillColor(29, 78, 216);
    if (filled > 0) pdf.roundedRect(cx2 + 2, y + 2.5, Math.min(filled, barW), 3, 1, 1, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${pct}%`, cx2 + barW + 4, y + 5.5);

    y += 8;
  });

  // Project totals row
  pdf.setFillColor(235, 244, 255);
  pdf.rect(M, y, CW, 8, 'F');
  pdf.setDrawColor(29, 78, 216);
  pdf.setLineWidth(0.4);
  pdf.line(M, y, M + CW, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(29, 78, 216);
  pdf.text('WEEKLY TOTAL', M + 2, y + 5.5);
  pdf.text(`${totalWeekHours.toFixed(1)} h`, M + 138, y + 5.5);
  pdf.text('100%', M + 168, y + 5.5);
  y += 8;

  // ════════════════════════════════════
  //  SIGNATURE SECTION
  // ════════════════════════════════════
  y += 10;
  if (y + 40 > USABLE_H) { pdf.addPage(); y = M; }

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(M, y, CW, 36, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('SIGNATURES', M + 4, y + 8);

  // Employee signature box
  const sigW = (CW - 12) / 2;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(200, 210, 230);
  pdf.roundedRect(M + 4, y + 12, sigW, 20, 2, 2, 'FD');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Employee Signature', M + 6, y + 16);
  pdf.setDrawColor(180, 190, 210);
  pdf.setLineWidth(0.3);
  pdf.line(M + 8, y + 27, M + 4 + sigW - 4, y + 27);
  pdf.setFontSize(7);
  pdf.text(employee.name, M + 6, y + 30);

  // Supervisor signature box
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(200, 210, 230);
  pdf.roundedRect(M + sigW + 8, y + 12, sigW, 20, 2, 2, 'FD');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Supervisor / Manager Signature', M + sigW + 10, y + 16);
  pdf.setDrawColor(180, 190, 210);
  pdf.setLineWidth(0.3);
  pdf.line(M + sigW + 12, y + 27, M + sigW + 8 + sigW - 4, y + 27);
  pdf.setFontSize(7);
  pdf.text('Name: _______________________', M + sigW + 10, y + 30);

  // ── Footers ──
  const totalPages = pdf.internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    pdf.setPage(pg);
    drawFooter(pg, totalPages);
  }

  const safeName = employee.name.replace(/\s+/g, '_');
  const weekStr2 = fmt(weekStart);
  pdf.save(`WeldPro_Weekly_${safeName}_${weekStr2}.pdf`);
}

// ─── COMPONENT ──────────────────────────────────────────────
export default function Reports() {
  const {
    companies, projects, employees, workEntries,
    getProjectById, getEmployeeById, getCompanyById
  } = useApp();
  const { t } = useLanguage();

  // ── Weekly tab state ──
  const [selEmployee, setSelEmployee] = useState('');
  const [weekStart, setWeekStart] = useState(() => fmt(getWeekStart(new Date())));

  // ── General report tab state ──
  const [tab, setTab] = useState('weekly'); // 'weekly' | 'general'
  const [filterCompany, setFilterCompany] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [viewMode, setViewMode]   = useState('table');

  // ─── Weekly: compute week range ───
  const wsDate = new Date(weekStart + 'T00:00:00');
  const weDate = new Date(wsDate);
  weDate.setDate(weDate.getDate() + 6);
  const weFmt = fmt(weDate);

  // Entries for selected employee this week
  const weekEntries = workEntries.filter(w =>
    w.employeeId === selEmployee && w.date >= weekStart && w.date <= weFmt
  ).sort((a, b) => a.date.localeCompare(b.date));

  const weekTotalHours = weekEntries.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);

  const prevWeek = () => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(fmt(d));
  };
  const nextWeek = () => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    setWeekStart(fmt(d));
  };

  const handleWeeklyPDF = () => {
    const emp = employees.find(e => e.id === selEmployee);
    if (!emp) return;
    generateWeeklyPDF({ employee: emp, weekStart: wsDate, weekEntries, getProjectById, getCompanyById });
  };

  // ─── General report ───
  const availableProjects = filterCompany
    ? projects.filter(p => p.companyId === filterCompany)
    : projects;

  const filtered = workEntries.filter(w => {
    const project = getProjectById(w.projectId);
    return (
      (!filterCompany  || project?.companyId === filterCompany) &&
      (!filterProject  || w.projectId === filterProject) &&
      (!filterEmployee || w.employeeId === filterEmployee) &&
      (!fromDate       || w.date >= fromDate) &&
      (!toDate         || w.date <= toDate)
    );
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalHours   = filtered.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);
  const uniqProjects = [...new Set(filtered.map(w => w.projectId))].length;
  const uniqEmps     = [...new Set(filtered.map(w => w.employeeId))].length;

  const dateMap = {};
  filtered.forEach(w => { dateMap[w.date] = (dateMap[w.date] || 0) + parseFloat(w.hours || 0); });
  const chartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-14)
    .map(([date, hours]) => ({ date: date.slice(5), hours: parseFloat(hours.toFixed(1)) }));

  // Build day-by-day preview for the weekly tab
  const dayRows = Array.from({ length: 7 }, (_, di) => {
    const d = new Date(wsDate); d.setDate(d.getDate() + di);
    const key = fmt(d);
    const entries = weekEntries.filter(w => w.date === key);
    const hours = entries.reduce((s, w) => s + (parseFloat(w.hours) || 0), 0);
    return { dayName: DAY_NAMES[di], date: key, entries, hours, isWeekend: di >= 5 };
  });

  return (
    <div>
      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('rep_title')}</h2>
          <p>Weekly employee timesheets and general work reports</p>
        </div>
      </div>

      {/* ── TAB SWITCHER ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', width: 'fit-content', boxShadow: 'var(--shadow-sm)' }}>
        <button
          onClick={() => setTab('weekly')}
          className={`btn btn-sm ${tab === 'weekly' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 0, border: 'none', padding: '10px 24px', fontSize: 13 }}
        >
          <User size={15} /> Weekly Employee Report
        </button>
        <button
          onClick={() => setTab('general')}
          className={`btn btn-sm ${tab === 'general' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 0, border: 'none', padding: '10px 24px', fontSize: 13 }}
        >
          <FileText size={15} /> General Report
        </button>
      </div>

      {/* ════════════════════════════════════
           WEEKLY TAB
          ════════════════════════════════════ */}
      {tab === 'weekly' && (
        <div>
          {/* Controls card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <h3>Weekly Timesheet Generator</h3>
                <p>Select an employee and week to preview and export their personal weekly PDF</p>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {/* Employee selector */}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Select Employee *
                  </label>
                  <select
                    value={selEmployee}
                    onChange={e => setSelEmployee(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.empId}) — {e.role}</option>
                    ))}
                  </select>
                </div>

                {/* Week navigator */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Week
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="btn btn-ghost btn-icon" onClick={prevWeek} title="Previous week">
                      <ChevronLeft size={18} />
                    </button>
                    <div style={{
                      background: 'var(--color-bg)', border: '1.5px solid var(--color-border)',
                      borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13,
                      whiteSpace: 'nowrap', color: 'var(--color-text-primary)'
                    }}>
                      <Calendar size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                      {weekLabel(wsDate)}
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={nextWeek} title="Next week">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                  <button className="btn btn-ghost" onClick={() => window.print()}>
                    <Printer size={16} /> Print
                  </button>
                  <button
                    id="weekly-pdf-btn"
                    className="btn btn-primary"
                    onClick={handleWeeklyPDF}
                    disabled={!selEmployee}
                    style={{ opacity: selEmployee ? 1 : 0.5 }}
                  >
                    <Download size={16} /> Export Weekly PDF
                  </button>
                </div>
              </div>

              {/* Employee card preview */}
              {selEmployee && (() => {
                const emp = employees.find(e => e.id === selEmployee);
                if (!emp) return null;
                const initials = emp.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div style={{
                    marginTop: 20, background: 'var(--color-bg)', borderRadius: 10,
                    border: '1px solid var(--color-border)', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0
                    }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {emp.empId} · {emp.role} · {emp.phone || '—'} · {emp.email || '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--color-primary)' }}>{weekTotalHours.toFixed(1)}h</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>this week</div>
                    </div>
                    <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{emp.status}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Weekly preview table */}
          {selEmployee && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Week Preview — {weekLabel(wsDate)}</h3>
                  <p>{weekEntries.length} entries · {weekTotalHours.toFixed(1)}h total logged</p>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Day</th>
                      <th style={{ width: 110 }}>Date</th>
                      <th>Project</th>
                      <th>Description</th>
                      <th>Notes</th>
                      <th style={{ textAlign: 'right', width: 80 }}>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayRows.map(({ dayName, date, entries, hours, isWeekend }) => {
                      if (entries.length === 0) {
                        return (
                          <tr key={date} style={{ background: isWeekend ? '#FAF5FF' : undefined }}>
                            <td style={{ fontWeight: isWeekend ? 400 : 600, color: isWeekend ? '#9333EA' : 'var(--color-text-primary)' }}>
                              {dayName}
                            </td>
                            <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{date}</td>
                            <td colSpan={3} style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 12 }}>
                              {isWeekend ? 'Weekend' : 'No work logged'}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>—</td>
                          </tr>
                        );
                      }
                      return entries.map((entry, ei) => {
                        const project = getProjectById(entry.projectId);
                        const company = getCompanyById(project?.companyId);
                        return (
                          <tr key={entry.id} style={{ background: isWeekend ? '#FAF5FF' : undefined }}>
                            <td style={{ fontWeight: ei === 0 ? 700 : 400, color: isWeekend ? '#9333EA' : 'var(--color-text-primary)', fontSize: ei > 0 ? 11 : undefined }}>
                              {ei === 0 ? dayName : '↳'}
                            </td>
                            <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{ei === 0 ? date : ''}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{project?.name || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{company?.name}</div>
                            </td>
                            <td style={{ maxWidth: 200 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry.description || '—'}
                              </div>
                            </td>
                            <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{entry.notes || '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{entry.hours}h</span>
                            </td>
                          </tr>
                        );
                      });
                    })}
                    {/* Day totals */}
                    {dayRows.filter(d => d.entries.length > 0).map(({ dayName, date, hours }) => null)}
                    {/* Week total */}
                    <tr style={{ background: 'var(--color-primary-light)', borderTop: '2px solid var(--color-primary)' }}>
                      <td colSpan={5} style={{ fontWeight: 700, color: 'var(--color-primary)', textAlign: 'right', paddingRight: 16 }}>
                        WEEKLY TOTAL
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-primary)' }}>
                          {weekTotalHours.toFixed(1)}h
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {weekEntries.length === 0 && (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div className="empty-state-icon"><Calendar size={32} /></div>
                  <h3>No entries this week</h3>
                  <p>No work was logged for this employee during this week. Navigate to another week or add work entries.</p>
                </div>
              )}
            </div>
          )}

          {!selEmployee && (
            <div className="card">
              <div className="empty-state" style={{ padding: '60px 20px' }}>
                <div className="empty-state-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  <User size={32} />
                </div>
                <h3>Select an Employee</h3>
                <p>Choose an employee from the dropdown above to preview their weekly timesheet and export a professional PDF report.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════
           GENERAL TAB
          ════════════════════════════════════ */}
      {tab === 'general' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="filters-bar">
              <div className="filter-group">
                <label>Client Company</label>
                <select value={filterCompany} onChange={e => { setFilterCompany(e.target.value); setFilterProject(''); }}>
                  <option value="">All Companies</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Project</label>
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                  <option value="">All Projects</option>
                  {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Employee</label>
                <select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                  <option value="">All Employees</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="filter-group">
                <label>To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setFilterCompany(''); setFilterProject(''); setFilterEmployee(''); setFromDate(''); setToDate(''); }}>
                  Clear
                </button>
                <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setViewMode('table')} className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }}>Table</button>
                  <button onClick={() => setViewMode('chart')} className={`btn btn-sm ${viewMode === 'chart' ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: 0, border: 'none' }}>Chart</button>
                </div>
              </div>
            </div>
          </div>

          <div className="summary-row" style={{ marginBottom: 20 }}>
            <div className="summary-item"><p>Entries</p><h4>{filtered.length}</h4></div>
            <div className="summary-item"><p>Total Hours</p><h4>{totalHours.toFixed(1)}h</h4></div>
            <div className="summary-item"><p>Projects</p><h4>{uniqProjects}</h4></div>
            <div className="summary-item"><p>Employees</p><h4>{uniqEmps}</h4></div>
            <div className="summary-item"><p>Avg / Entry</p><h4>{filtered.length > 0 ? (totalHours / filtered.length).toFixed(1) : 0}h</h4></div>
          </div>

          {viewMode === 'chart' && chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3>Hours by Date</h3></div>
              <div className="card-body">
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={v => [`${v}h`, 'Hours']} />
                      <Bar dataKey="hours" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div><h3>All Work Entries</h3><p>{filtered.length} records</p></div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Date</th><th>Company</th><th>Project</th>
                    <th>Employee</th><th>Role</th><th style={{ textAlign: 'right' }}>Hours</th>
                    <th>Description</th><th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w, i) => {
                    const project  = getProjectById(w.projectId);
                    const employee = getEmployeeById(w.employeeId);
                    const company  = getCompanyById(project?.companyId);
                    return (
                      <tr key={w.id}>
                        <td style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{w.date}</td>
                        <td>{company?.name || '—'}</td>
                        <td><div style={{ fontWeight: 600 }}>{project?.name || '—'}</div><div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{project?.number}</div></td>
                        <td style={{ fontWeight: 600 }}>{employee?.name || '—'}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{employee?.role || '—'}</td>
                        <td style={{ textAlign: 'right' }}><span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{w.hours}h</span></td>
                        <td>{w.description}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{w.notes || '—'}</td>
                      </tr>
                    );
                  })}
                  {filtered.length > 0 && (
                    <tr style={{ background: 'var(--color-primary-light)', fontWeight: 700 }}>
                      <td colSpan={6} style={{ textAlign: 'right', paddingRight: 16, color: 'var(--color-primary)' }}>TOTAL</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-primary)' }}>{totalHours.toFixed(1)}h</td>
                      <td colSpan={2} />
                    </tr>
                  )}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9}>
                      <div className="empty-state">
                        <div className="empty-state-icon"><BarChart3 size={32} /></div>
                        <h3>No data found</h3>
                        <p>Adjust your filters to see results.</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
