import { addCalendarDays, getIsoWeekInfo } from './isoWeek';

export function calculateShiftHours(startTime, endTime) {
  if (!startTime || !endTime) return null;

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return null;

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const durationMinutes = endMinutes >= startMinutes
    ? endMinutes - startMinutes
    : (24 * 60 - startMinutes) + endMinutes;

  return Number((durationMinutes / 60).toFixed(2));
}

export function getWorkEntryHours(entry) {
  const { normalHours, normalOvertime, weekendOvertime } = getWorkEntryBreakdown(entry);
  return normalHours + normalOvertime + weekendOvertime;
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function getWorkEntryBreakdown(entry) {
  const legacyHours = numeric(entry?.hours);
  const shiftHours = calculateShiftHours(entry?.startTime, entry?.endTime);
  const fallbackHours = shiftHours === null ? legacyHours : shiftHours;
  const date = entry?.date ? new Date(`${entry.date}T00:00:00`) : null;
  const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6);

  if (isWeekend) {
    return {
      normalHours: 0,
      normalOvertime: 0,
      weekendOvertime: numeric(entry?.weekendOvertime) || fallbackHours,
    };
  }

  return {
    normalHours: entry?.normalHours == null ? fallbackHours : numeric(entry.normalHours),
    normalOvertime: numeric(entry?.normalOvertime),
    weekendOvertime: 0,
  };
}

export function getWeeklyHours(entries, employeeId, date) {
  const week = getIsoWeekInfo(date);
  if (!week) return 0;
  const start = week.startDate;
  const end = addCalendarDays(start, 6);
  return entries
    .filter(entry => (!employeeId || entry.employeeId === employeeId) && entry.date >= start && entry.date <= end)
    .reduce((sum, entry) => sum + getWorkEntryHours(entry), 0);
}
