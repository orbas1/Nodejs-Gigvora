function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeTime(value, { locale = 'en', now = new Date(), numeric = 'auto' } = {}) {
  const date = toDate(value);
  if (!date) return '';

  const reference = toDate(now) ?? new Date();
  const diffMs = date.getTime() - reference.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric });

  if (absSeconds < 60) {
    return rtf.format(diffSeconds, 'second');
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

export function formatAbsolute(value, { locale = 'en-GB', dateStyle = 'medium', timeStyle = 'short', timeZone } = {}) {
  const date = toDate(value);
  if (!date) return '';
  const formatOptions = { dateStyle };
  if (timeStyle) {
    formatOptions.timeStyle = timeStyle;
  }
  if (timeZone) {
    formatOptions.timeZone = timeZone;
  }
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  return formatter.format(date);
}

export function describeTimeSince(value, options = {}) {
  const date = toDate(value);
  if (!date) return '';

  const { now, locale, numeric, ...absoluteOptions } = options;
  const relative = formatRelativeTime(date, { now, locale, numeric });
  const absolute = formatAbsolute(date, {
    ...absoluteOptions,
    locale: absoluteOptions.locale || locale || 'en-GB',
  });
  return `${relative} (${absolute})`;
}

export function formatDateLabel(value, { includeTime = false, fallback = '—', locale = 'en-US', timeZone } = {}) {
  const date = toDate(value);
  if (!date) {
    return fallback;
  }
  const formatOptions = { dateStyle: 'medium' };
  if (includeTime) {
    formatOptions.timeStyle = 'short';
  }
  if (timeZone) {
    formatOptions.timeZone = timeZone;
  }
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  return formatter.format(date);
}
