export function mapReportEntry(entry) {
  return {
    ...entry,
    dailyDescription: entry.dailyDescription ?? entry.daily_description ?? '',
    weekendNote: entry.description ?? '',
  };
}

export function getDailyDescription(entry) {
  return String(entry.dailyDescription ?? entry.daily_description ?? '').trim();
}

export function getWeekendNote(entry) {
  return String(entry.weekendNote ?? entry.description ?? '').trim();
}

export function getWorkEntryTravelPlaces(entry, expenditures) {
  const details = getWorkEntryTravelDetails(entry, expenditures);
  return {
    fromPlace: details.fromPlace,
    destination: details.destination,
  };
}

export function getWorkEntryTravelDetails(entry, expenditures) {
  const linkedExpenditures = expenditures.filter(item => item.workEntryId === entry.id);
  return linkedExpenditures.reduce((details, expenditure) => ({
    fromPlace: details.fromPlace || String(expenditure.startPlace ?? expenditure.start_place ?? '').trim(),
    destination: details.destination || String(expenditure.endPlace ?? expenditure.end_place ?? '').trim(),
    kilometers: details.kilometers + Number(expenditure.kilometers || 0),
    travelHours: details.travelHours + Number(expenditure.hours || 0),
    hasTravelHours: details.hasTravelHours || expenditure.hours != null,
  }), { fromPlace: '', destination: '', kilometers: 0, travelHours: 0, hasTravelHours: false });
}

export function getWorkHoursColumns(lang, tableWidth) {
  const columns = [
    { label: lang === 'sv' ? 'Datum' : 'Date', width: 22 },
    { label: lang === 'sv' ? 'Företag / Projekt' : 'Company / Project', width: 42 },
    { label: lang === 'sv' ? 'Ordinarie\n(tim)' : 'Normal\n(h)', width: 25 },
    { label: lang === 'sv' ? 'Övertid\n(tim)' : 'OT\n(h)', width: 22 },
    { label: lang === 'sv' ? 'Helg\n(tim)' : 'Weekend\n(h)', width: 28 },
    { label: lang === 'sv' ? 'Resa km' : 'Travel KM', width: 22 },
    { label: lang === 'sv' ? 'Restid' : 'Travel Hrs', width: 22 },
    { label: lang === 'sv' ? 'Beskrivning' : 'Description', width: 98 },
  ];
  const scale = tableWidth / columns.reduce((sum, column) => sum + column.width, 0);
  return columns.map(column => ({ ...column, width: column.width * scale }));
}
