const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function parseCalendarDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function formatCalendarDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function formatIsoCalendarDate(dateValue, locale = 'en-GB') {
  const date = parseCalendarDate(dateValue);
  if (!date) return '';
  const parts = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value || '';
  return `${part('weekday')} ${part('day')} ${part('month')} ${part('year')}`;
}

export function addCalendarDays(dateValue, days) {
  const date = parseCalendarDate(dateValue);
  if (!date || !Number.isInteger(days)) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return formatCalendarDate(date);
}

export function getIsoWeekInfo(dateValue) {
  const date = parseCalendarDate(dateValue);
  if (!date) return null;

  const weekday = date.getUTCDay() || 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - weekday + 1);

  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const weekYear = thursday.getUTCFullYear();
  const januaryFourth = new Date(Date.UTC(weekYear, 0, 4));
  const januaryFourthWeekday = januaryFourth.getUTCDay() || 7;
  const firstMonday = new Date(januaryFourth);
  firstMonday.setUTCDate(januaryFourth.getUTCDate() - januaryFourthWeekday + 1);
  const week = Math.floor((monday.getTime() - firstMonday.getTime()) / WEEK_MS) + 1;
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    week,
    weekYear,
    startDate: formatCalendarDate(monday),
    endDate: formatCalendarDate(sunday),
  };
}

export function formatIsoWeekPeriod(dateValue, locale = 'en-GB', labels = {}) {
  const info = getIsoWeekInfo(dateValue);
  if (!info) return '';
  const weekLabel = labels.week || 'Week';
  const periodLabel = labels.period || 'Period';
  return `${weekLabel} ${String(info.week).padStart(2, '0')} · ${info.weekYear} — ${periodLabel}: ${formatIsoCalendarDate(info.startDate, locale)} – ${formatIsoCalendarDate(info.endDate, locale)}`;
}

export function getIsoWeekPeriodLabels(dateValues, locale = 'en-GB', labels = {}) {
  const weeks = new Map();
  dateValues.filter(Boolean).forEach(dateValue => {
    const info = getIsoWeekInfo(dateValue);
    if (info) weeks.set(`${info.weekYear}-${info.week}`, info.startDate);
  });

  return [...weeks.values()]
    .sort()
    .map(startDate => {
      const info = getIsoWeekInfo(startDate);
      return {
        ...info,
        label: formatIsoWeekPeriod(startDate, locale, labels),
      };
    });
}
