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
  const calculated = calculateShiftHours(entry?.startTime, entry?.endTime);
  return calculated === null ? (parseFloat(entry?.hours) || 0) : calculated;
}
