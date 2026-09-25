import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const WEEKDAYS = { en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], sv: ['Sö', 'Må', 'Ti', 'On', 'To', 'Fr', 'Lö'] };
const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  sv: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'],
};

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;
  return new Date(year, month - 1, day);
}

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function displayDate(value) {
  const date = parseDate(value);
  return date ? `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}` : '';
}

export default function DatePicker({ value, onChange, id, name, required, disabled, className = '', style }) {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDate(value) || new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const close = event => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const days = useMemo(() => {
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const count = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const leading = first.getDay();
    return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, index) => new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1))];
  }, [viewDate]);

  const selectDate = date => {
    onChange({ target: { name, value: isoDate(date) } });
    setOpen(false);
  };

  return (
    <div className={`date-picker ${className}`} ref={containerRef} style={style}>
      <button
        id={id}
        type="button"
        className="date-picker-trigger"
        onClick={() => { if (!disabled) { setViewDate(parseDate(value) || new Date()); setOpen(current => !current); } }}
        disabled={disabled}
        aria-label={t('ui_swedish_calendar')}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? '' : 'date-picker-placeholder'}>{displayDate(value) || 'dd-mm-yyyy'}</span>
        <span aria-hidden="true">▣</span>
      </button>
      {required && <input type="hidden" name={name} value={value || ''} required />}
      {open && (
        <div className="date-picker-popover" role="dialog" aria-label={t('ui_swedish_calendar')}>
          <div className="date-picker-heading">
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} aria-label={t('ui_previous_month')}>‹</button>
            <strong>{MONTHS[lang][viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
            <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} aria-label={t('ui_next_month')}>›</button>
          </div>
          <div className="date-picker-weekdays">{WEEKDAYS[lang].map(day => <span key={day}>{day}</span>)}</div>
          <div className="date-picker-days">
            {days.map((date, index) => date ? (
              <button key={date.toISOString()} type="button" className={value === isoDate(date) ? 'selected' : ''} onClick={() => selectDate(date)}>{date.getDate()}</button>
            ) : <span key={`empty-${index}`} />)}
          </div>
          <div className="date-picker-footer">
            <button type="button" onClick={() => { onChange({ target: { name, value: '' } }); setOpen(false); }}>{t('ui_clear')}</button>
            <button type="button" onClick={() => selectDate(new Date())}>{t('ui_today')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
