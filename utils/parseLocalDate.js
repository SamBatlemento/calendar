export default function parseLocalDate(dateInput) {
  if (!dateInput) return null;
  const datePart = typeof dateInput === 'string' ? dateInput.split('T')[0] : dateInput.toISOString().split('T')[0];
  return new Date(`${datePart}T00:00:00`);
}