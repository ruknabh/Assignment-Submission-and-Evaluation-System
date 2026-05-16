// Get initials from full name — "Ruknabh Das" → "RD"
export const getInitials = (name = '') => {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
};

// Format ISO date to readable string — "2025-12-01T00:00:00Z" → "Dec 1, 2025"
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
  });
};

// Format bytes to KB/MB — 1048576 → "1.00 MB"
export const formatFileSize = (kb) => {
  if (!kb) return '—';
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

// Capitalize first letter — "student" → "Student"
export const capitalize = (str = '') => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};