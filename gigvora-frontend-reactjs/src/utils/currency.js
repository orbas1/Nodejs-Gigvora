const DEFAULT_LOCALE = 'en-US';
const DEFAULT_MINIMUM_FRACTION_DIGITS = 0;
const DEFAULT_MAXIMUM_FRACTION_DIGITS = 2;

function toNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function formatCurrency(
  value,
  currency = 'USD',
  { locale = DEFAULT_LOCALE, fallback = '—', minimumFractionDigits, maximumFractionDigits } = {},
) {
  const amount = toNumber(value);
  if (amount === null) {
    return fallback;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits:
      minimumFractionDigits ?? (currency === 'JPY' ? 0 : DEFAULT_MINIMUM_FRACTION_DIGITS),
    maximumFractionDigits:
      maximumFractionDigits ?? (currency === 'JPY' ? 0 : DEFAULT_MAXIMUM_FRACTION_DIGITS),
  });

  return formatter.format(amount);
}

export function formatCurrencyRange(
  lower,
  upper,
  currency = 'USD',
  options = {},
) {
  const lowerFormatted = formatCurrency(lower, currency, options);
  const upperFormatted = formatCurrency(upper, currency, options);
  const fallback = options.fallback ?? '—';

  if (lowerFormatted === fallback && upperFormatted === fallback) {
    return fallback;
  }
  if (lowerFormatted === fallback) {
    return `≤ ${upperFormatted}`;
  }
  if (upperFormatted === fallback) {
    return `≥ ${lowerFormatted}`;
  }
  return `${lowerFormatted} – ${upperFormatted}`;
}

export default {
  formatCurrency,
  formatCurrencyRange,
};
