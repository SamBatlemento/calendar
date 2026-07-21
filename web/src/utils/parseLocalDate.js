import dayjs from 'dayjs';

// Parses a date-only string (YYYY-MM-DD) as local midnight, not UTC midnight —
// avoids the "shows one day earlier" bug from new Date() interpreting bare dates as UTC.
export default function parseLocalDate(dateInput) {
  if (!dateInput) return null;
  const datePart = typeof dateInput === 'string' ? dateInput.split('T')[0] : dayjs(dateInput).format('YYYY-MM-DD');
  return new Date(`${datePart}T00:00:00`);
}
