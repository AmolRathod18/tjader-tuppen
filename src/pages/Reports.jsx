import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart3, Download, Calendar, FileText,
  ChevronLeft, ChevronRight, Filter, Clock, Users, FolderKanban
} from 'lucide-react';
import jsPDF from 'jspdf';
import logoUrl from '../assets/TJADERTUPPEN_Logo.jpeg';
import { getWorkEntryBreakdown, getWeeklyHours } from '../utils/workHours';
import { Modal } from '../components/ui/Modal';
import DatePicker from '../components/ui/DatePicker';

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

function weekLabel(weekStart, locale = 'en-GB') {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `${weekStart.toLocaleDateString(locale, { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function displayDate(str, locale = 'en-GB') {
  return new Date(str + 'T00:00:00').toLocaleDateString(locale, {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
}

function reportDate(str) {
  return `${str.slice(8, 10)}/${str.slice(5, 7)}/${str.slice(0, 4)}`;
}

// ─── PDF generator ──────────────────────────────────────────
async function loadLogoData(lang = 'en') {
  const errorText = lang === 'sv'
    ? {
      load: 'Det gick inte att läsa in TJÄDERTUPPEN-logotypen för PDF-rapporten.',
      decode: 'Det gick inte att avkoda TJÄDERTUPPEN-logotypen för PDF-rapporten.',
      prepare: 'Det gick inte att förbereda TJÄDERTUPPEN-logotypen för PDF-rapporten.',
    }
    : {
      load: 'Unable to load the TJÄDERTUPPEN logo for the PDF report.',
      decode: 'Unable to decode the TJÄDERTUPPEN logo for the PDF report.',
      prepare: 'Unable to prepare the TJÄDERTUPPEN logo for the PDF report.',
    };
  const response = await fetch(logoUrl);
  if (!response.ok) throw new Error(errorText.load);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = image.width;
        sourceCanvas.height = image.height;
        const sourceContext = sourceCanvas.getContext('2d');
        sourceContext.drawImage(image, 0, 0);
        const pixels = sourceContext.getImageData(0, 0, image.width, image.height).data;
        let left = image.width;
        let top = image.height;
        let right = 0;
        let bottom = 0;
        for (let y = 0; y < image.height; y += 1) {
          for (let x = 0; x < image.width; x += 1) {
            const offset = (y * image.width + x) * 4;
            const darkness = 255 - Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
            if (darkness > 18) {
              left = Math.min(left, x);
              top = Math.min(top, y);
              right = Math.max(right, x);
              bottom = Math.max(bottom, y);
            }
          }
        }
        const padding = 10;
        const cropLeft = Math.max(0, left - padding);
        const cropTop = Math.max(0, top - padding);
        const cropWidth = Math.min(image.width - cropLeft, right - left + padding * 2);
        const cropHeight = Math.min(image.height - cropTop, bottom - top + padding * 2);
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        cropCanvas.getContext('2d').drawImage(image, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        resolve({ data: cropCanvas.toDataURL('image/jpeg', 0.95), width: cropWidth, height: cropHeight });
      };
      image.onerror = () => reject(new Error(errorText.decode));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error(errorText.prepare));
    reader.readAsDataURL(blob);
  });
}

async function buildEmployeeWisePDF({ lang, title, subtitle, entries, expenditures, getProjectById, getCompanyById, getEmployeeById }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;
  const PH = 297;
  const M = 8;
  const CW = PW - M * 2;
  const logoData = await loadLogoData(lang);
  const employeeIds = [...new Set([
    ...entries.map(entry => entry.employeeId),
    ...expenditures.map(item => item.employeeId),
  ].filter(Boolean))].sort((a, b) => {
    const nameA = getEmployeeById(a)?.name || '';
    const nameB = getEmployeeById(b)?.name || '';
    return nameA.localeCompare(nameB);
  });
  const locale = lang === 'sv' ? 'sv-SE' : 'en-GB';
  const reportTitle = title.replace(/WORK REPORT|ARBETSRAPPORT/gi, lang === 'sv' ? 'RAPPORT' : 'REPORT');
  const headers = lang === 'sv'
    ? ['Datum', 'Företag / Projekt', 'Normal\n(tim)', 'ÖT\n(tim)', 'Helg\n(tim)', 'Resa KM', 'Resa tim']
    : ['Date', 'Company / Project', 'Normal\n(h)', 'OT\n(h)', 'Weekend\n(h)', 'Travel KM', 'Travel Hrs'];
  const columns = [26, 58, 24, 20, 24, 22, 20];

  const drawPageHeader = (employee) => {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, PW, PH, 'F');
    pdf.addImage(logoData.data, 'JPEG', M, 5, 82, 24);
    pdf.setFillColor(31, 48, 65);
    pdf.roundedRect(PW - M - 51, 8, 51, 10, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(reportTitle, PW - M - 25.5, 14.5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(24, 29, 33);
    pdf.text(subtitle, PW - M - 25.5, 23, { align: 'center' });
    pdf.setDrawColor(157, 169, 178);
    pdf.setLineWidth(0.35);
    pdf.line(M, 30, PW - M, 30);

    pdf.setFillColor(247, 249, 251);
    pdf.roundedRect(M, 34, CW, 16, 2, 2, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(92, 101, 109);
    pdf.text(lang === 'sv' ? 'ANSTÄLLD' : 'EMPLOYEE', M + 4, 40);
    pdf.text(lang === 'sv' ? 'ANSTÄLLNINGS-ID' : 'EMPLOYEE ID', PW - M - 4, 40, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text(employee?.name || (lang === 'sv' ? 'Okänd medarbetare' : 'Unknown employee'), M + 4, 46);
    pdf.text(employee?.empId || '—', PW - M - 4, 46, { align: 'right' });
  };

  const drawTableHeader = (y) => {
    pdf.setFillColor(31, 48, 65);
    pdf.rect(M, y, CW, 14, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    let x = M;
    headers.forEach((header, index) => {
      const lines = header.split('\n');
      lines.forEach((line, lineIndex) => pdf.text(line, index > 1 ? x + columns[index] / 2 : x + 3, y + 6 + lineIndex * 4, { align: index > 1 ? 'center' : 'left' }));
      pdf.setDrawColor(128, 139, 148);
      pdf.setLineWidth(0.2);
      pdf.line(x, y, x, y + 14);
      x += columns[index];
    });
    pdf.line(M + CW, y, M + CW, y + 14);
    return y + 14;
  };

  employeeIds.forEach((employeeId, employeeIndex) => {
    if (employeeIndex > 0) pdf.addPage();
    const employee = getEmployeeById(employeeId);
    const employeeEntries = entries.filter(entry => entry.employeeId === employeeId);
    const employeeExpenditures = expenditures.filter(item => item.employeeId === employeeId);
    const byDate = new Map();
    employeeEntries.forEach(entry => {
      const hours = getWorkEntryBreakdown(entry);
      const row = byDate.get(entry.date) || { date: entry.date, project: '', normal: 0, overtime: 0, weekend: 0, kilometers: 0, travelHours: 0 };
      const project = getProjectById(entry.projectId);
      const company = getCompanyById(entry.companyId || project?.companyId);
      row.project = [company?.name, project?.name].filter(Boolean).join(' / ') || '—';
      row.normal += hours.normalHours;
      row.overtime += hours.normalOvertime;
      row.weekend += hours.weekendOvertime;
      byDate.set(entry.date, row);
    });
    employeeExpenditures.forEach(item => {
      const row = byDate.get(item.journeyDate) || { date: item.journeyDate, project: '', normal: 0, overtime: 0, weekend: 0, kilometers: 0, travelHours: 0 };
      const project = getProjectById(item.projectId);
      const company = project ? getCompanyById(project.companyId) : null;
      if (!row.project) row.project = [company?.name, project?.name].filter(Boolean).join(' / ') || '—';
      row.kilometers += Number(item.kilometers || 0);
      row.travelHours += Number(item.kilometers || 0) / 50;
      byDate.set(item.journeyDate, row);
    });
    const rows = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    const totals = rows.reduce((sum, row) => ({
      normal: sum.normal + row.normal,
      overtime: sum.overtime + row.overtime,
      weekend: sum.weekend + row.weekend,
      kilometers: sum.kilometers + row.kilometers,
      travelHours: sum.travelHours + row.travelHours,
    }), { normal: 0, overtime: 0, weekend: 0, kilometers: 0, travelHours: 0 });

    drawPageHeader(employee);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(15, 23, 42);
    pdf.text(lang === 'sv' ? '1. Veckotid och resor' : '1. Weekly Working Hours & Travel', M, 66);
    let y = drawTableHeader(72);
    rows.forEach((row, index) => {
      const rowHeight = 13;
      pdf.setFillColor(index % 2 ? 247 : 255, index % 2 ? 249 : 255, index % 2 ? 251 : 255);
      pdf.rect(M, y, CW, rowHeight, 'F');
      pdf.setDrawColor(220, 226, 231);
      pdf.setLineWidth(0.2);
      pdf.rect(M, y, CW, rowHeight, 'S');
      const values = [
        new Date(`${row.date}T00:00:00`).toLocaleDateString(locale),
        row.project || '—',
        row.normal.toFixed(1),
        row.overtime.toFixed(1),
        row.weekend.toFixed(1),
        row.kilometers.toLocaleString(),
        row.travelHours.toFixed(2).replace(/0$/, ''),
      ];
      let x = M;
      values.forEach((value, valueIndex) => {
        pdf.setFont('helvetica', valueIndex === 1 ? 'bold' : 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(24, 29, 33);
        pdf.text(String(value), valueIndex > 1 ? x + columns[valueIndex] / 2 : x + 4, y + 8, { align: valueIndex > 1 ? 'center' : 'left' });
        pdf.line(x, y, x, y + rowHeight);
        x += columns[valueIndex];
      });
      y += rowHeight;
    });
    pdf.setFillColor(231, 239, 247);
    pdf.rect(M, y, CW, 12, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(lang === 'sv' ? 'TOTALT' : 'TOTAL', M + 4, y + 8);
    let totalX = M + columns[0] + columns[1];
    [totals.normal, totals.overtime, totals.weekend, totals.kilometers, totals.travelHours].forEach((value, index) => {
      const columnIndex = index + 2;
      pdf.text(index > 2 ? (index === 3 ? value.toLocaleString() : value.toFixed(2).replace(/0$/, '')) : value.toFixed(1), totalX + columns[columnIndex] / 2, y + 8, { align: 'center' });
      totalX += columns[columnIndex];
    });
    y += 24;
    pdf.setDrawColor(157, 169, 178);
    pdf.line(M, y, PW - M, y);
    pdf.setFontSize(15);
    pdf.text(lang === 'sv' ? '2. Veckosammanfattning' : '2. Weekly Totals', M, y + 11);
    const boxY = y + 18;
    const boxW = (CW - 6) / 2;
    pdf.setFillColor(235, 245, 255);
    pdf.roundedRect(M, boxY, boxW, 23, 2, 2, 'F');
    pdf.setFillColor(232, 247, 237);
    pdf.roundedRect(M + boxW + 6, boxY, boxW, 23, 2, 2, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(61, 75, 87);
    pdf.text(lang === 'sv' ? 'Total arbetstid' : 'Total Work Hours', M + 24, boxY + 8);
    pdf.text(lang === 'sv' ? 'Total resa' : 'Total Travel', M + boxW + 30, boxY + 8);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${(totals.normal + totals.overtime + totals.weekend).toFixed(1)} h`, M + 24, boxY + 17);
    pdf.text(`${totals.kilometers.toLocaleString()} KM -> ${totals.travelHours.toFixed(2).replace(/0$/, '')} hr`, M + boxW + 30, boxY + 17);
    pdf.setDrawColor(157, 169, 178);
    pdf.line(M, PH - 18, PW - M, PH - 18);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(92, 101, 109);
    pdf.text('Tjädertuppen Svets och konsult', PW / 2 - 15, PH - 9, { align: 'right' });
    pdf.text(`${lang === 'sv' ? 'Sida' : 'Page'} ${employeeIndex + 1}`, PW / 2 + 15, PH - 9);
  });
  return pdf;
}

async function buildPDF({ lang, title, subtitle, entries, expenditures, getProjectById, getCompanyById, getEmployeeById }) {
  return buildEmployeeWisePDF({ lang, title, subtitle, entries, expenditures, getProjectById, getCompanyById, getEmployeeById });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297, M = 12, CW = PW - M * 2;
  const now = new Date();
  const locale = lang === 'sv' ? 'sv-SE' : 'en-GB';
  const genStr = now.toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' });
  const text = lang === 'sv' ? {
    generated: 'Skapad', page: 'Sida', reportFor: 'RAPPORT FÖR', reportPeriod: 'RAPPORTPERIOD',
    multipleEmployees: 'Flera anställda', workingHours: 'ARBETSTID', overtimeHours: 'ÖVERTID',
    weekendHours: 'HELGTID', totalHours: 'TOTALT', employee: 'Anställd', entries: 'Poster',
    hoursByEmployee: 'ARBETSTID PER ANSTÄLLD', allEmployees: 'TOTALT — ALLA ANSTÄLLDA',
    workEntries: 'ARBETSPOSTER', legend: 'NW = Normal arbetstid  |  OT = Övertid  |  WE = Helg',
    date: 'Datum', client: 'Kund', project: 'Projekt', description: 'Beskrivning',
    total: 'Totalt', travel: 'RESOR / UTGIFTER', employeeId: 'Anställnings-ID', journey: 'Resa',
    km: 'KM', journeys: 'Resor', unknownEmployee: 'Okänd anställd',
  } : {
    generated: 'Generated', page: 'Page', reportFor: 'REPORT FOR', reportPeriod: 'REPORT PERIOD',
    multipleEmployees: 'Multiple employees', workingHours: 'WORKING HOURS', overtimeHours: 'OVERTIME HOURS',
    weekendHours: 'WEEKEND HOURS', totalHours: 'TOTAL HOURS', employee: 'Employee', entries: 'Entries',
    hoursByEmployee: 'HOURS BY EMPLOYEE', allEmployees: 'TOTAL — ALL EMPLOYEES',
    workEntries: 'WORK ENTRIES DETAIL', legend: 'NW = Normal working hrs  |  OT = Overtime  |  WE = Weekend',
    date: 'Date', client: 'Client', project: 'Project', description: 'Description',
    total: 'Total', travel: 'TRAVEL / EXPENDITURE DETAILS', employeeId: 'Employee ID', journey: 'Journey',
    km: 'KM', journeys: 'Journeys', unknownEmployee: 'Unknown employee',
  };
  const totals = entries.reduce((sum, entry) => {
    const hours = getWorkEntryBreakdown(entry);
    return {
      normal: sum.normal + hours.normalHours,
      overtime: sum.overtime + hours.normalOvertime,
      weekend: sum.weekend + hours.weekendOvertime,
    };
  }, { normal: 0, overtime: 0, weekend: 0 });
  const totalHours = totals.normal + totals.overtime + totals.weekend;
  const logoData = await loadLogoData(lang);
  const employeeIds = [...new Set(entries.map(entry => entry.employeeId).filter(Boolean))];
  const employeeNames = employeeIds.map(id => getEmployeeById(id)?.name).filter(Boolean);
  const employeeTotals = employeeIds.map(id => {
    const employeeEntries = entries.filter(entry => entry.employeeId === id);
    const employeeHours = employeeEntries.reduce((sum, entry) => {
      const hours = getWorkEntryBreakdown(entry);
      return {
        normal: sum.normal + hours.normalHours,
        overtime: sum.overtime + hours.normalOvertime,
        weekend: sum.weekend + hours.weekendOvertime,
      };
    }, { normal: 0, overtime: 0, weekend: 0 });
    return {
      id,
      name: getEmployeeById(id)?.name || text.unknownEmployee,
      entries: employeeEntries.length,
      ...employeeHours,
      total: employeeHours.normal + employeeHours.overtime + employeeHours.weekend,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const employeeCode = id => {
    const value = String(getEmployeeById(id)?.empId || id);
    return /^\d+$/.test(value) ? `EMP-${value.padStart(3, '0')}` : value;
  };
  const employeeLabel = employeeNames.length === 1 ? employeeNames[0] : text.multipleEmployees;

  const drawSectionTitle = (label, sy) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(15, 23, 42);
    pdf.text(label, M, sy + 7);
    return sy + 15;
  };

  const drawFooter = (pg, total) => {
    pdf.setDrawColor(190, 198, 205);
    pdf.setLineWidth(0.3);
    pdf.line(M, PH - 12, PW - M, PH - 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(92, 101, 109);
    pdf.text('Tjädertuppen Svets och konsult', M, PH - 6);
    pdf.text(`${text.generated}: ${genStr}`, PW / 2, PH - 6, { align: 'center' });
    pdf.text(`${text.page} ${pg} / ${total}`, PW - M, PH - 6, { align: 'right' });
  };

  // ── Header ──
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PW, 31, 'F');
  pdf.addImage(logoData.data, 'JPEG', M, 5, 28, 20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(24, 29, 33);
  pdf.text('TJÄDERTUPPEN', M + 34, 13);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(92, 101, 109);
  pdf.text('Tjädertuppen Svets och konsult', M + 34, 19);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(24, 29, 33);
  pdf.text(title, PW - M, 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
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
  pdf.text(text.reportFor, M + 5, y + 7);
  pdf.text(text.reportPeriod, M + 95, y + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(24, 29, 33);
  pdf.text(employeeLabel, M + 5, y + 14);
  pdf.text(subtitle, M + 95, y + 14);
  y += 22;

  // ── Clear overall summary ──
  const stats = [
    { label: text.workingHours, value: `${totals.normal.toFixed(1)} h` },
    { label: text.overtimeHours, value: `${totals.overtime.toFixed(1)} h` },
    { label: text.weekendHours, value: `${totals.weekend.toFixed(1)} h` },
    { label: text.totalHours, value: `${totalHours.toFixed(1)} h` },
  ];
  const sw = CW / stats.length;
  stats.forEach((s, i) => {
    const sx = M + i * sw;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(207, 213, 218);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(sx, y, sw - 5, 25, 2, 2, 'FD');
    pdf.setFillColor(193, 151, 72);
    pdf.roundedRect(sx, y, sw - 3, 2, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(21);
    pdf.setTextColor(24, 29, 33);
    pdf.text(s.value, sx + (sw - 5) / 2, y + 15, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(92, 101, 109);
    pdf.text(s.label, sx + (sw - 5) / 2, y + 21, { align: 'center' });
  });
  y += 30;

  // ── Hours by employee ──
  y = drawSectionTitle(text.hoursByEmployee, y);

  const employeeSummaryCols = [
    { h: text.employee, ratio: 0.26 },
    { h: text.entries, ratio: 0.08 },
    { h: text.workingHours, ratio: 0.17 },
    { h: text.overtimeHours, ratio: 0.17 },
    { h: text.weekendHours, ratio: 0.17 },
    { h: text.totalHours, ratio: 0.15 },
  ];
  const employeeSummaryWidths = employeeSummaryCols.map(column => CW * column.ratio);
  const summaryHeaderHeight = 13;
  const drawEmployeeSummaryHeader = (sy) => {
    pdf.setFillColor(31, 48, 65);
    pdf.rect(M, sy, CW, summaryHeaderHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    let cx = M;
    employeeSummaryCols.forEach((column, index) => {
      const columnWidth = employeeSummaryWidths[index];
      const rightAligned = index > 0;
      const headerLines = pdf.splitTextToSize(column.h, columnWidth - 5);
      headerLines.forEach((line, lineIndex) => {
        pdf.text(line, rightAligned ? cx + columnWidth - 3 : cx + 3, sy + 4 + lineIndex * 3.2, { align: rightAligned ? 'right' : 'left' });
      });
      pdf.setDrawColor(128, 139, 148);
      pdf.setLineWidth(0.2);
      pdf.line(cx, sy, cx, sy + summaryHeaderHeight);
      cx += columnWidth;
    });
    pdf.line(M + CW, sy, M + CW, sy + summaryHeaderHeight);
    return sy + summaryHeaderHeight;
  };

  y = drawEmployeeSummaryHeader(y);
  employeeTotals.forEach((employee, index) => {
    const values = [
      employee.name,
      String(employee.entries),
      `${employee.normal.toFixed(1)} h`,
      `${employee.overtime.toFixed(1)} h`,
      `${employee.weekend.toFixed(1)} h`,
      `${employee.total.toFixed(1)} h`,
    ];
    const rowH = 9;
    pdf.setFillColor(index % 2 === 0 ? 255 : 247, index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 249);
    pdf.rect(M, y, CW, rowH, 'F');
    pdf.setDrawColor(207, 213, 218);
    pdf.setLineWidth(0.2);
    pdf.rect(M, y, CW, rowH, 'S');
    let cx = M;
    values.forEach((value, cellIndex) => {
      const columnWidth = employeeSummaryWidths[cellIndex];
      const rightAligned = cellIndex > 0;
      pdf.setFont('helvetica', cellIndex === 0 || cellIndex === 5 ? 'bold' : 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(24, 29, 33);
      pdf.text(value, rightAligned ? cx + columnWidth - 3 : cx + 3, y + 6, { align: rightAligned ? 'right' : 'left' });
      pdf.setDrawColor(224, 228, 231);
      pdf.line(cx, y, cx, y + rowH);
      cx += columnWidth;
    });
    y += rowH;
  });

  pdf.setFillColor(235, 238, 241);
  pdf.rect(M, y, CW, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(24, 29, 33);
  pdf.text(text.allEmployees, M + 3, y + 5.5);
  let totalColumnX = M + employeeSummaryWidths[0] + employeeSummaryWidths[1];
  pdf.text(`${totals.normal.toFixed(1)} h`, totalColumnX + employeeSummaryWidths[2] - 3, y + 5.5, { align: 'right' });
  totalColumnX += employeeSummaryWidths[2];
  pdf.text(`${totals.overtime.toFixed(1)} h`, totalColumnX + employeeSummaryWidths[3] - 3, y + 5.5, { align: 'right' });
  totalColumnX += employeeSummaryWidths[3];
  pdf.text(`${totals.weekend.toFixed(1)} h`, totalColumnX + employeeSummaryWidths[4] - 3, y + 5.5, { align: 'right' });
  pdf.text(`${totalHours.toFixed(1)} h`, M + CW - 3, y + 5.5, { align: 'right' });
  y += 8;

  // ── Work entries continue when the current page has room ──
  if (y > PH * 0.6) {
    pdf.addPage();
    y = 20;
  } else {
    y += 14;
  }
  y = drawSectionTitle(text.workEntries, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(92, 101, 109);
  pdf.text(text.legend, M, y);
  y += 7;

  const cols = [
    { h: text.date,       w: 24 },
    { h: text.employee,   w: 24 },
    { h: text.client,     w: 20 },
    { h: text.project,    w: 20 },
    { h: lang === 'sv' ? 'NW + OT + WE' : 'NW + OT + WE', w: 34 },
    { h: text.description, w: 64 },
  ];
  const HDR_H = 9;
  const drawHeader = (sy) => {
    pdf.setFillColor(31, 48, 65);
    pdf.rect(M, sy, CW, HDR_H, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    let cx = M;
    cols.forEach(c => {
      const rightAligned = c.h === 'NW + OT + WE';
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
      entry.date ? reportDate(entry.date) : '—',
      emp?.name || '—',
      co?.name || '—',
      proj?.name || '—',
      (() => {
        const hours = getWorkEntryBreakdown(entry);
        return `${hours.normalHours.toFixed(1)} + ${hours.normalOvertime.toFixed(1)} + ${hours.weekendOvertime.toFixed(1)} h`;
      })(),
      entry.description || '—',
    ];
    const descriptionText = String(cellValues[5]);
    const descriptionFontSize = Math.max(7.2, Math.min(10, 10 - Math.max(0, descriptionText.length - 32) * 0.08));
    const lines = cellValues.map((value, cellIndex) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(cellIndex === 5 ? descriptionFontSize : 10);
      const wrappedLines = pdf.splitTextToSize(String(value), cols[cellIndex].w - 6);
      return cellIndex === 5 ? wrappedLines : wrappedLines.slice(0, 8);
    });
    const rowH = Math.max(12, Math.max(...lines.map(cellLines => cellLines.length)) * 4.2 + 4.5);
    if (y + rowH > PH - 18) {
      pdf.addPage();
      y = drawHeader(18);
    }
    pdf.setFillColor(idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 249);
    pdf.rect(M, y, CW, rowH, 'F');
    pdf.setDrawColor(207, 213, 218);
    pdf.setLineWidth(0.2);
    pdf.rect(M, y, CW, rowH, 'S');
    let cx = M;
    lines.forEach((cellLines, cellIndex) => {
      const isHoursColumn = cellIndex === 4;
      pdf.setFont('helvetica', cellIndex === 0 || isHoursColumn ? 'bold' : 'normal');
      pdf.setFontSize(cellIndex === 5 ? descriptionFontSize : 10);
      pdf.setTextColor(isHoursColumn ? 61 : 24, isHoursColumn ? 75 : 29, isHoursColumn ? 87 : 33);
      cellLines.forEach((line, lineIndex) => {
        const align = isHoursColumn ? 'right' : 'left';
        pdf.text(line, align === 'right' ? cx + cols[cellIndex].w - 3 : cx + 3, y + 5.5 + lineIndex * 4.2, { align });
      });
      pdf.setDrawColor(224, 228, 231);
      pdf.line(cx, y, cx, y + rowH);
      cx += cols[cellIndex].w;
    });
    y += rowH;
  });

  // ── Totals row ──
  if (y + 7 > PH - 18) {
    pdf.addPage();
    y = drawHeader(18);
  }
  pdf.setFillColor(235, 238, 241);
  pdf.rect(M, y, CW, 7, 'F');
  pdf.setDrawColor(61, 75, 87);
  pdf.setLineWidth(0.4);
  pdf.line(M, y, M + CW, y);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(24, 29, 33);
  pdf.text(`TOTAL — ${entries.length} ${text.entries}`, M + 2, y + 5);
  const totalX = M + cols[0].w + cols[1].w + cols[2].w + cols[3].w;
  pdf.text(
    `${totals.normal.toFixed(1)} + ${totals.overtime.toFixed(1)} + ${totals.weekend.toFixed(1)} h`,
    totalX + cols[4].w - 3,
    y + 5,
    { align: 'right' },
  );
  pdf.text(`${text.total} ${totalHours.toFixed(1)} h`, M + CW - 3, y + 5, { align: 'right' });
  y += 7;

  // ── Travel details on their own page ──
  if (expenditures.length > 0) {
    if (y > PH * 0.6) {
      pdf.addPage();
      y = 20;
    } else {
      y += 14;
    }
    y = drawSectionTitle(text.travel, y);
    const travelCols = [
      { h: text.date, w: 28 },
      { h: text.employeeId, w: 24 },
      { h: text.project, w: 20 },
      { h: text.journey, w: 34 },
      { h: text.km, w: 20 },
      { h: text.description, w: 60 },
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
        const rightAligned = column.h === 'KM';
        pdf.text(column.h, rightAligned ? cx + column.w - 2 : cx + 2, sy + 5, { align: rightAligned ? 'right' : 'left' });
        pdf.setDrawColor(128, 139, 148);
        pdf.setLineWidth(0.2);
        pdf.line(cx, sy, cx, sy + travelHeaderHeight);
        cx += column.w;
      });
      pdf.line(M + CW, sy, M + CW, sy + travelHeaderHeight);
      return sy + travelHeaderHeight;
    };

    y = drawTravelHeader(y);

    const totalKilometers = expenditures.reduce((sum, item) => sum + Number(item.kilometers || 0), 0);
    [...expenditures].sort((a, b) => a.journeyDate.localeCompare(b.journeyDate)).forEach((item, idx) => {
      const employee = getEmployeeById(item.employeeId);
      const project = getProjectById(item.projectId);
      const values = [
        item.journeyDate ? reportDate(item.journeyDate) : '—',
        employee ? employeeCode(item.employeeId) : '—',
        project?.name || '—',
        `${item.startPlace || '—'}  >  ${item.endPlace || '—'}`,
        `${Number(item.kilometers || 0).toLocaleString()} km`,
        item.remarks || '—',
      ];
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const lines = values.map((value, cellIndex) =>
        pdf.splitTextToSize(String(value), travelCols[cellIndex].w - 6).slice(0, 4)
      );
      const rowH = Math.max(12, Math.max(...lines.map(cellLines => cellLines.length)) * 4.2 + 4.5);
      if (y + rowH > PH - 18) {
        pdf.addPage();
        y = drawTravelHeader(18);
      }
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
          pdf.text(line, rightAligned ? cx + travelCols[cellIndex].w - 3 : cx + 3, y + 5.5 + lineIndex * 4.2, { align: rightAligned ? 'right' : 'left' });
        });
        pdf.setDrawColor(224, 228, 231);
        pdf.line(cx, y, cx, y + rowH);
        cx += travelCols[cellIndex].w;
      });
      y += rowH;
    });
    if (y + 7 > PH - 18) {
      pdf.addPage();
      y = drawTravelHeader(18);
    }
    pdf.setFillColor(235, 238, 241);
    pdf.rect(M, y, CW, 7, 'F');
    pdf.setDrawColor(61, 75, 87);
    pdf.setLineWidth(0.4);
    pdf.line(M, y, M + CW, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(24, 29, 33);
    pdf.text(`TOTAL — ${expenditures.length} ${text.journeys}`, M + 2, y + 5);
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

async function buildEmployeeReportPDF({ lang, title, subtitle, period, groups, rangeStart, rangeEnd, getProjectById, getCompanyById, getEmployeeById }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const logoData = await loadLogoData(lang);
  const periodName = period === 'daily' ? (lang === 'sv' ? 'Daglig' : 'Daily') : period === 'monthly' ? (lang === 'sv' ? 'Månads' : 'Monthly') : period === 'custom' ? (lang === 'sv' ? 'Anpassad' : 'Custom') : (lang === 'sv' ? 'Vecko' : 'Weekly');
  const formatEmployeeCode = employee => {
    const value = String(employee?.empId || '');
    return value || '—';
  };

  const getDates = (entries, expenditures) => {
    const values = [...entries.map(entry => entry.date), ...expenditures.map(item => item.journeyDate)].filter(Boolean);
    if (!rangeStart || !rangeEnd) return [...new Set(values)].sort();
    const start = new Date(`${rangeStart}T00:00:00`);
    const end = new Date(`${rangeEnd}T00:00:00`);
    const days = Math.round((end - start) / 86400000);
    if (days < 0 || days > 31) return [...new Set(values)].sort();
    const matchingValues = values.filter(value => value >= rangeStart && value <= rangeEnd);
    if (days === 0 && matchingValues.length === 0 && values.length > 0) return [...new Set(values)].sort();
    const dates = [];
    for (let index = 0; index <= days; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      dates.push(fmt(date));
    }
    return [...new Set([...dates, ...matchingValues])].sort();
  };

  const drawHeader = (employee) => {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.addImage(logoData.data, 'JPEG', margin, 7, 82, 24);
    pdf.setFillColor(31, 48, 65);
    pdf.roundedRect(pageWidth - margin - 53, 8, 53, 10, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(title.replace('DAILY WORK REPORT', 'DAILY REPORT').replace('WEEKLY WORK REPORT', 'WEEKLY REPORT').replace('MONTHLY WORK REPORT', 'MONTHLY REPORT'), pageWidth - margin - 26.5, 14.5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(24, 29, 33);
    pdf.text(subtitle, pageWidth - margin - 26.5, 24, { align: 'center' });
    pdf.setDrawColor(157, 169, 177);
    pdf.setLineWidth(0.35);
    pdf.line(margin, 35, pageWidth - margin, 35);

    pdf.setFillColor(247, 248, 249);
    pdf.roundedRect(margin, 40, contentWidth, 15, 1.5, 1.5, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(92, 101, 109);
    pdf.text(lang === 'sv' ? 'MEDARBETARE' : 'EMPLOYEE', margin + 4, 46);
    pdf.text(lang === 'sv' ? 'MEDARBETAR-ID' : 'EMPLOYEE ID', pageWidth - margin - 23, 46, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(24, 29, 33);
    pdf.text(employee?.name || (lang === 'sv' ? 'Okänd medarbetare' : 'Unknown employee'), margin + 4, 52);
    pdf.text(formatEmployeeCode(employee), pageWidth - margin - 4, 52, { align: 'right' });
  };

  const drawFooter = (page, totalPages) => {
    pdf.setDrawColor(157, 169, 177);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(92, 101, 109);
    pdf.text('Tjädertuppen Svets och konsult', pageWidth / 2 - 8, pageHeight - 10, { align: 'right' });
    pdf.text(`${lang === 'sv' ? 'Sida' : 'Page'} ${page} / ${totalPages}`, pageWidth / 2 + 8, pageHeight - 10);
  };

  const drawPage = (group, isFirstPage) => {
    if (!isFirstPage) pdf.addPage();
    const employee = getEmployeeById(group.employeeId);
    drawHeader(employee);
    const entries = group.entries;
    const expenditures = group.expenditures;
    const dates = getDates(entries, expenditures);
    const rows = dates.map(date => {
      const dateEntries = entries.filter(entry => entry.date === date);
      const dateTravel = expenditures.filter(item => item.journeyDate === date);
      const hours = dateEntries.reduce((sum, entry) => {
        const breakdown = getWorkEntryBreakdown(entry);
        return {
          normal: sum.normal + breakdown.normalHours,
          overtime: sum.overtime + breakdown.normalOvertime,
          weekend: sum.weekend + breakdown.weekendOvertime,
        };
      }, { normal: 0, overtime: 0, weekend: 0 });
      const project = dateEntries[0] ? getProjectById(dateEntries[0].projectId) : dateTravel[0] ? getProjectById(dateTravel[0].projectId) : null;
      const company = project ? getCompanyById(project.companyId) : null;
      const kilometers = dateTravel.reduce((sum, item) => sum + Number(item.kilometers || 0), 0);
      return { date, project, company, hours, kilometers, travelHours: kilometers ? kilometers / 50 : 0 };
    });
    const totals = rows.reduce((sum, row) => ({
      normal: sum.normal + row.hours.normal,
      overtime: sum.overtime + row.hours.overtime,
      weekend: sum.weekend + row.hours.weekend,
      kilometers: sum.kilometers + row.kilometers,
      travelHours: sum.travelHours + row.travelHours,
    }), { normal: 0, overtime: 0, weekend: 0, kilometers: 0, travelHours: 0 });
    const totalHours = totals.normal + totals.overtime + totals.weekend;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`1. ${periodName} ${lang === 'sv' ? 'arbetstid och resor' : 'Working Hours & Travel'}`, margin, 70);

    const columns = [
      { label: lang === 'sv' ? 'Datum' : 'Date', width: 28 },
      { label: lang === 'sv' ? 'Företag / Projekt' : 'Company / Project', width: 58 },
      { label: lang === 'sv' ? 'Ordinarie\n(tim)' : 'Normal\n(h)', width: 20 },
      { label: lang === 'sv' ? 'Övertid\n(tim)' : 'OT\n(h)', width: 18 },
      { label: lang === 'sv' ? 'Helg\n(tim)' : 'Weekend\n(h)', width: 24 },
      { label: lang === 'sv' ? 'Resa km' : 'Travel KM', width: 22 },
      { label: lang === 'sv' ? 'Restid' : 'Travel Hrs', width: 20 },
    ];
    const tableTop = 76;
    const headerHeight = 14;
    const rowHeight = 13;
    let x = margin;
    pdf.setFillColor(31, 48, 65);
    pdf.rect(margin, tableTop, contentWidth, headerHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    columns.forEach(column => {
      const lines = column.label.split('\n');
      lines.forEach((line, index) => pdf.text(line, x + column.width / 2, tableTop + 6 + index * 4, { align: 'center' }));
      x += column.width;
    });
    let y = tableTop + headerHeight;
    rows.forEach((row, index) => {
      if (y + rowHeight > pageHeight - 55) {
        pdf.addPage();
        drawHeader(employee);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(15, 23, 42);
        pdf.text(`1. ${periodName} ${lang === 'sv' ? 'arbetstid och resor' : 'Working Hours & Travel'}`, margin, 70);
        pdf.setFillColor(31, 48, 65);
        pdf.rect(margin, tableTop, contentWidth, headerHeight, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(255, 255, 255);
        let headerX = margin;
        columns.forEach(column => {
          column.label.split('\n').forEach((line, lineIndex) => pdf.text(line, headerX + column.width / 2, tableTop + 6 + lineIndex * 4, { align: 'center' }));
          headerX += column.width;
        });
        y = tableTop + headerHeight;
      }
      pdf.setFillColor(index % 2 === 0 ? 255 : 247, index % 2 === 0 ? 255 : 249, index % 2 === 0 ? 255 : 252);
      pdf.rect(margin, y, contentWidth, rowHeight, 'F');
      pdf.setDrawColor(220, 226, 230);
      pdf.setLineWidth(0.2);
      pdf.rect(margin, y, contentWidth, rowHeight, 'S');
      const values = [
        row.date ? reportDate(row.date) : '—',
        row.project ? `${row.company?.name || '—'}\n${row.project.name}` : '—',
        row.hours.normal.toFixed(1),
        row.hours.overtime.toFixed(1),
        row.hours.weekend.toFixed(1),
        String(Math.round(row.kilometers)),
        row.travelHours.toFixed(2).replace(/\.00$/, ''),
      ];
      let cellX = margin;
      values.forEach((value, cellIndex) => {
        pdf.setFont('helvetica', cellIndex === 1 ? 'bold' : 'normal');
        pdf.setFontSize(cellIndex === 1 ? 8.5 : 9);
        pdf.setTextColor(24, 29, 33);
        String(value).split('\n').forEach((line, lineIndex) => pdf.text(line, cellX + (cellIndex === 1 ? 4 : columns[cellIndex].width / 2), y + 5 + lineIndex * 4, { align: cellIndex === 1 ? 'left' : 'center' }));
        cellX += columns[cellIndex].width;
      });
      y += rowHeight;
    });

    pdf.setFillColor(232, 240, 247);
    pdf.rect(margin, y, contentWidth, rowHeight, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(24, 29, 33);
    pdf.text(lang === 'sv' ? 'TOTALT' : 'TOTAL', margin + 4, y + 8);
    const totalValues = [totals.normal, totals.overtime, totals.weekend, totals.kilometers, totals.travelHours];
    let totalX = margin + columns[0].width + columns[1].width;
    totalValues.forEach((value, index) => {
      const column = columns[index + 2];
      pdf.text(index === 3 ? String(Math.round(value)) : value.toFixed(2).replace(/\.00$/, ''), totalX + column.width / 2, y + 8, { align: 'center' });
      totalX += column.width;
    });

    if (y + rowHeight + 58 > pageHeight - 18) {
      pdf.addPage();
      drawHeader(employee);
      y = tableTop + headerHeight;
    }
    const totalsY = y + rowHeight + 28;
    pdf.setFontSize(16);
    pdf.text(`2. ${periodName} ${lang === 'sv' ? 'sammanfattning' : 'Totals'}`, margin, totalsY);
    const summaryY = totalsY + 9;
    const summaryWidth = (contentWidth - 6) / 2;
    [{ label: lang === 'sv' ? 'Total arbetstid' : 'Total Work Hours', value: `${totalHours.toFixed(1)} h`, fill: [236, 245, 255] }, { label: lang === 'sv' ? 'Total resa' : 'Total Travel', value: `${Math.round(totals.kilometers)} km -> ${totals.travelHours.toFixed(2).replace(/\.00$/, '')} h`, fill: [237, 249, 241] }].forEach((summary, index) => {
      const summaryX = margin + index * (summaryWidth + 6);
      pdf.setFillColor(...summary.fill);
      pdf.roundedRect(summaryX, summaryY, summaryWidth, 23, 2, 2, 'F');
      const iconX = summaryX + 13;
      const iconY = summaryY + 11.5;
      pdf.setFillColor(index === 0 ? 219 : 216, index === 0 ? 235 : 242, index === 0 ? 252 : 224);
      pdf.circle(iconX, iconY, 7, 'F');
      pdf.setDrawColor(index === 0 ? 37 : 41, index === 0 ? 112 : 91, index === 0 ? 177 : 73);
      pdf.setLineWidth(1.1);
      if (index === 0) {
        pdf.circle(iconX, iconY, 4.2, 'S');
        pdf.line(iconX, iconY, iconX, iconY - 2.8);
        pdf.line(iconX, iconY, iconX + 2.4, iconY + 1.8);
      } else {
        pdf.setLineWidth(2.2);
        pdf.line(iconX - 3.6, iconY + 5, iconX - 1.3, iconY - 5);
        pdf.line(iconX + 3.6, iconY + 5, iconX + 1.3, iconY - 5);
        pdf.setLineWidth(1.1);
        pdf.line(iconX, iconY - 3.5, iconX, iconY - 1.5);
        pdf.line(iconX, iconY + 0.5, iconX, iconY + 2.5);
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(70, 80, 88);
      pdf.text(summary.label, summaryX + 24, summaryY + 9);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(17);
      pdf.setTextColor(15, 23, 42);
      pdf.text(summary.value, summaryX + 24, summaryY + 18);
    });
    return { totalHours, totals };
  };

  groups.forEach((group, index) => drawPage(group, index === 0));
  const totalPages = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    drawFooter(page, totalPages);
  }
  return pdf;
}

// ─── COMPONENT ──────────────────────────────────────────────
const TABS = [
  { key: 'daily',   labelKey: 'rep_daily',   icon: Calendar },
  { key: 'weekly',  labelKey: 'rep_weekly',  icon: ChevronRight },
  { key: 'monthly', labelKey: 'rep_monthly', icon: BarChart3 },
  { key: 'custom',  labelKey: 'rep_custom',  icon: Filter },
];

export default function Reports() {
  const {
    companies, projects, employees, workEntries, expenditures,
    getProjectById, getEmployeeById, getCompanyById,
    loadCompanies, loadProjects, loadEmployees, loadWorkEntries, loadExpenditures,
  } = useApp();
  const { lang, t } = useLanguage();
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
  const [reportMessage, setReportMessage] = useState('');

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
    ? `${selectedEmployee.name} · ${t('rep_entries_count', [filtered.length])} · ${totalHours.toFixed(1)}h`
    : `${t('rep_all_employees')} · ${t('rep_entries_count', [filtered.length])} · ${totalHours.toFixed(1)}h ${t('rep_combined')}`;

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
    const locale = lang === 'sv' ? 'sv-SE' : 'en-GB';
    if (tab === 'daily') return { title: lang === 'sv' ? 'DAGLIG ARBETSRAPPORT' : 'DAILY WORK REPORT', subtitle: displayDate(dailyDate, locale) };
    if (tab === 'weekly') return { title: lang === 'sv' ? 'VECKORAPPORT' : 'WEEKLY WORK REPORT', subtitle: weekLabel(wsDate, locale) };
    if (tab === 'monthly') return { title: lang === 'sv' ? 'MÅNADSRAPPORT' : 'MONTHLY WORK REPORT', subtitle: new Date(mYear, mMonth - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }) };
    return { title: lang === 'sv' ? 'ARBETSRAPPORT' : 'WORK REPORT', subtitle: `${fromDate || '—'} ${lang === 'sv' ? 'till' : 'to'} ${toDate || '—'}` };
  };

  const getEmployeePDFGroups = (reportEntries, reportTravel) => {
    const employeeIds = [...new Set([
      ...reportEntries.map(entry => entry.employeeId),
      ...reportTravel.map(item => item.employeeId),
    ].filter(Boolean))];
    return employeeIds
      .sort((a, b) => (getEmployeeById(a)?.name || '').localeCompare(getEmployeeById(b)?.name || ''))
      .map(employeeId => ({
        employeeId,
        entries: reportEntries.filter(entry => entry.employeeId === employeeId),
        expenditures: reportTravel.filter(item => item.employeeId === employeeId),
      }));
  };

  const handleDownloadPDF = async () => {
    if (filtered.length === 0) {
      setReportMessage('rep_no_entries_download');
      return;
    }
    try {
      const { title, subtitle } = getReportTitle();
      const pdf = await buildEmployeeReportPDF({
        lang,
        title,
        subtitle,
        period: tab,
        groups: getEmployeePDFGroups(filtered, reportExpenditures),
        rangeStart: dateFrom,
        rangeEnd: dateTo,
        getProjectById,
        getCompanyById,
        getEmployeeById,
      });
      const safeTitle = title.replace(/\s+/g, '_');
      const filename = selectedEmployee
        ? `${sanitizeFilenamePart(selectedEmployee.name)}_${safeTitle}_${todayStr()}.pdf`
        : `TJADERTUPPEN_${safeTitle}_All_Employees_${todayStr()}.pdf`;
      pdf.save(filename);
    } catch (error) {
      window.alert(error.message);
    }
  };

  const handlePreviewPDF = async () => {
    if (filtered.length === 0) {
      setReportMessage('rep_no_entries_preview');
      return;
    }
    try {
      const { title, subtitle } = getReportTitle();
      const pdf = await buildEmployeeReportPDF({
        lang,
        title,
        subtitle,
        period: tab,
        groups: getEmployeePDFGroups(filtered, reportExpenditures),
        rangeStart: dateFrom,
        rangeEnd: dateTo,
        getProjectById,
        getCompanyById,
        getEmployeeById,
      });
      window.open(pdf.output('bloburl'), '_blank');
    } catch (error) {
      window.alert(error.message);
    }
  };

  const LabelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-info">
          <h2>{t('rep_title')}</h2>
          <p>
            {reportScope} · {t('rep_page_subtitle')}
          </p>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="report-tabs" style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', width: 'fit-content', boxShadow: 'var(--shadow-sm)' }}>
        {TABS.map(({ key, labelKey, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, border: 'none', padding: '10px 22px', fontSize: 13 }}
          >
            <Icon size={14} /> {t(labelKey)}
          </button>
        ))}
      </div>

      {/* ── Summary Stats ── */}
      <div className="stat-grid report-stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Clock size={20} /></div>
          <div className="stat-info">
            <p>{t('rep_normal_hours')}</p>
            <h3>{reportTotals.normal.toFixed(1)}h</h3>
            <span>{t('rep_for_period')}</span>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><FileText size={20} /></div>
          <div className="stat-info">
            <p>{t('rep_total_entries')}</p>
            <h3>{filtered.length}</h3>
            <span>{t('rep_entries_found')}</span>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><Users size={20} /></div>
          <div className="stat-info">
            <p>{t('rep_employees_count')}</p>
            <h3>{[...new Set(filtered.map(w => w.employeeId))].length}</h3>
            <span>{t('rep_in_report')}</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><FolderKanban size={20} /></div>
          <div className="stat-info">
            <p>{t('rep_projects_count')}</p>
            <h3>{[...new Set(filtered.map(w => w.projectId))].length}</h3>
            <span>{t('rep_covered')}</span>
          </div>
        </div>
      </div>

      {/* ── Filters Card ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div><h3>{t('rep_filters')}</h3><p>{t('rep_select_scope')}</p></div>
        </div>
        <div className="card-body">
          <div className="report-filters" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>

            {/* Period control */}
            {tab === 'daily' && (
              <div>
                <label style={LabelStyle}>{t('lbl_date')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-ghost btn-icon" onClick={prevDay}><ChevronLeft size={18} /></button>
                  <DatePicker value={dailyDate} onChange={e => setDailyDate(e.target.value)} style={{ fontWeight: 600 }} />
                  <button className="btn btn-ghost btn-icon" onClick={nextDay}><ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {tab === 'weekly' && (
              <div>
                <label style={LabelStyle}>{t('rep_week')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-ghost btn-icon" onClick={prevWeek}><ChevronLeft size={18} /></button>
                  <div style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                    {weekLabel(wsDate, t('ui_locale'))}
                  </div>
                  <button className="btn btn-ghost btn-icon" onClick={nextWeek}><ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {tab === 'monthly' && (
              <div>
                <label style={LabelStyle}>{t('rep_month')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="btn btn-ghost btn-icon" onClick={prevMonth}><ChevronLeft size={18} /></button>
                  <input type="month" lang={t('ui_locale')} value={monthYear} onChange={e => setMonthYear(e.target.value)} style={{ fontWeight: 600, padding: '8px 12px' }} />
                  <button className="btn btn-ghost btn-icon" onClick={nextMonth}><ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {tab === 'custom' && (
              <div className="report-custom-dates" style={{ display: 'flex', gap: 12 }}>
                <div>
                  <label style={LabelStyle}>{t('rep_filter_from')}</label>
                  <DatePicker value={fromDate} onChange={e => setFromDate(e.target.value)} />
                </div>
                <div>
                  <label style={LabelStyle}>{t('rep_filter_to')}</label>
                  <DatePicker value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
              </div>
            )}

            {/* Common filters */}
            <div>
              <label style={LabelStyle}>{t('lbl_employee')}</label>
              <select value={filterEmployee} onChange={e => {
                setFilterEmployee(e.target.value);
                setFilterClient('');
                setFilterProject('');
              }} style={{ minWidth: 180 }}>
                <option value="">{t('rep_all_employees')}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label style={LabelStyle}>{t('rep_client')}</label>
              <select value={filterClient} onChange={e => { setFilterClient(e.target.value); setFilterProject(''); }} style={{ minWidth: 180 }}>
                <option value="">{t('we_all_clients')}</option>
                {availableCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={LabelStyle}>{t('lbl_project')}</label>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ minWidth: 180 }}>
                <option value="">{t('rep_all_projects')}</option>
                {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {(filterEmployee || filterClient || filterProject) && (
              <div style={{ alignSelf: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setFilterEmployee(''); setFilterClient(''); setFilterProject(''); }}>
                  {t('rep_clear_filters')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Entries Table ── */}
      <div className="card report-entries-card">
        <div className="card-header">
          <div>
            <h3>{t('rep_work_entries')}</h3>
            <p>{reportScope}</p>
          </div>
        </div>
        <div className="table-wrapper table-report-entries">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('lbl_date')}</th>
                <th>{t('lbl_employee')}</th>
                <th>{t('rep_client')}</th>
                <th>{t('lbl_project')}</th>
                <th>{t('rep_normal_hours')}</th>
                <th>{t('we_normal_overtime')}</th>
                <th>{t('we_weekend_overtime')}</th>
                <th>{t('we_weekly_hours')}</th>
                <th>{t('we_description')}</th>
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
                        {new Date(w.date + 'T00:00:00').toLocaleDateString(t('ui_locale'), { weekday: 'short' })}
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
                        {w.description || '—'}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><BarChart3 size={32} /></div>
                    <h3>{t('rep_no_entries')}</h3>
                    <p>{t('rep_no_match')}</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        {filtered.length > 0 && (
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'flex-end', gap: 24, background: 'var(--color-bg)' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('rep_total_entries')}: <strong style={{ color: 'var(--color-text-primary)' }}>{filtered.length}</strong></span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('rep_normal_short')}: <strong>{reportTotals.normal.toFixed(1)}h</strong></span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('rep_normal_ot')}: <strong>{reportTotals.overtime.toFixed(1)}h</strong></span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('rep_weekend_ot')}: <strong>{reportTotals.weekend.toFixed(1)}h</strong></span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('we_weekly_hours')}: <strong style={{ color: 'var(--color-primary)', fontSize: 15 }}>{totalHours.toFixed(1)}h</strong></span>
          </div>
        )}
      </div>
      <div className="report-actions-bottom">
        <button className="btn btn-outline" onClick={handlePreviewPDF}>
          <FileText size={15} /> {t('rep_preview')}
        </button>
        <button className="btn btn-primary" onClick={handleDownloadPDF}>
          <Download size={15} /> {t('rep_download')}
        </button>
      </div>
      <Modal
        isOpen={!!reportMessage}
        onClose={() => setReportMessage('')}
        title={t('rep_no_data_title')}
        subtitle={t('rep_pdf_unavailable')}
        footer={<button className="btn btn-primary" onClick={() => setReportMessage('')}>{t('ui_close')}</button>}
      >
        <p className="report-empty-message">{t(reportMessage)}</p>
      </Modal>
    </div>
  );
}
