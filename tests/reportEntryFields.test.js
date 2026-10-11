import assert from 'node:assert/strict';
import test from 'node:test';
import { getDailyDescription, getWeekendNote, getWorkEntryTravelDetails, getWorkEntryTravelPlaces, getWorkHoursColumns, mapReportEntry } from '../src/utils/reportEntryFields.js';

test('maps the stored daily description separately from the weekend note', () => {
  const entry = mapReportEntry({
    daily_description: 'Installed wall panels',
    description: 'Worked Saturday: installed wall panels',
    remarks: 'Unrelated remark',
  });

  assert.equal(getDailyDescription(entry), 'Installed wall panels');
  assert.equal(getWeekendNote(entry), 'Worked Saturday: installed wall panels');
});

test('does not use daily description or remarks as a weekend note fallback', () => {
  const entry = mapReportEntry({
    dailyDescription: 'Prepared site',
    description: '',
    remarks: 'Not a weekend note',
  });

  assert.equal(getDailyDescription(entry), 'Prepared site');
  assert.equal(getWeekendNote(entry), '');
});

test('supports mapped database rows and trims both report fields', () => {
  const entry = mapReportEntry({
    dailyDescription: '  Daily work  ',
    description: '  Actual weekend note  ',
  });

  assert.equal(getDailyDescription(entry), 'Daily work');
  assert.equal(getWeekendNote(entry), 'Actual weekend note');
});

test('maps saved travel places from the expenditure linked to each work entry', () => {
  const entries = [{ id: 'entry-1' }, { id: 'entry-2' }];
  const expenditures = [
    { workEntryId: 'entry-2', start_place: '  bjp ', end_place: ' destination 2 ' },
    { workEntryId: 'entry-1', startPlace: ' indi ', endPlace: ' bjp ' },
  ];

  assert.deepEqual(getWorkEntryTravelPlaces(entries[0], expenditures), {
    fromPlace: 'indi',
    destination: 'bjp',
  });
  assert.deepEqual(getWorkEntryTravelPlaces(entries[1], expenditures), {
    fromPlace: 'bjp',
    destination: 'destination 2',
  });
  assert.deepEqual(getWorkEntryTravelPlaces({ id: 'entry-3' }, expenditures), {
    fromPlace: '',
    destination: '',
  });
});

test('maps saved travel distance and hours from only the linked expenditure', () => {
  const entry = { id: 'entry-1' };
  const expenditures = [
    { workEntryId: 'entry-1', kilometers: 12, hours: 1.5 },
    { workEntryId: 'entry-2', kilometers: 99, hours: 8 },
    { workEntryId: 'entry-1', kilometers: 3, hours: null },
  ];

  assert.deepEqual(getWorkEntryTravelDetails(entry, expenditures), {
    fromPlace: '',
    destination: '',
    kilometers: 15,
    travelHours: 1.5,
    hasTravelHours: true,
  });
});

test('places Description after Travel Hrs and fits the available landscape table width', () => {
  const width = 281;
  const columns = getWorkHoursColumns('en', width);

  assert.deepEqual(columns.map(column => column.label), [
    'Date',
    'Company / Project',
    'Normal\n(h)',
    'OT\n(h)',
    'Weekend\n(h)',
    'Travel KM',
    'Travel Hrs',
    'Description',
  ]);
  assert.equal(columns.at(-1).label, 'Description');
  assert.ok(Math.abs(columns.reduce((sum, column) => sum + column.width, 0) - width) < 0.001);
});
