import formatDate, { normaliseDate } from './formatDate.js';

const DEFAULT_LOCALE = 'en-GB';

export default function formatDateTime(input, options = {}) {
  const date = normaliseDate(input);
  if (!date) {
    return '';
  }

  const {
    locale = DEFAULT_LOCALE,
    dateStyle = 'medium',
    timeStyle = 'short',
    timeZone,
  } = options;

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    ...(timeZone ? { timeZone } : {}),
  });

  return formatter.format(date);
}

export function formatDateWithFallback(input, fallback = '—') {
  const formatted = formatDate(input);
  return formatted || fallback;
}
