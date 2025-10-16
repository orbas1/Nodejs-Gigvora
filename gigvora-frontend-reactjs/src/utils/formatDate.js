const DEFAULT_LOCALE = 'en-GB';

function normaliseDate(input) {
  if (!input) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function formatDate(input, options = {}) {
  const date = normaliseDate(input);
  if (!date) {
    return '';
  }

  const {
    locale = DEFAULT_LOCALE,
    dateStyle = 'medium',
    timeZone,
  } = options;

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle,
    ...(timeZone ? { timeZone } : {}),
  });

  return formatter.format(date);
}

export { normaliseDate };
