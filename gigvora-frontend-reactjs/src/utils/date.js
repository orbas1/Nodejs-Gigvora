function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeTime(value) {
  const date = toDate(value);
  if (!date) return '';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absSeconds < 60) {
    return rtf.format(Math.round(diffSeconds), 'second');
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, 'day');
  }

  const diffWeeks = Math.round(diffDays / 7);
  if (Math.abs(diffWeeks) < 5) {
    return rtf.format(diffWeeks, 'week');
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, 'month');
  }

  const diffYears = Math.round(diffDays / 365);
  return rtf.format(diffYears, 'year');
}

export function formatAbsolute(value, options = {}) {
  const date = toDate(value);
  if (!date) return '';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: options.dateStyle || 'medium',
    timeStyle: options.timeStyle || 'short',
  });
  return formatter.format(date);
}

export function describeTimeSince(value) {
  const date = toDate(value);
  if (!date) return '';
  return `${formatRelativeTime(date)} (${formatAbsolute(date)})`;
}

export function formatDateLabel(value, { includeTime = false, fallback = '—' } = {}) {
  const date = toDate(value);
  if (!date) {
    return fallback;
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' } : {}),
  });
  return formatter.format(date);
}
