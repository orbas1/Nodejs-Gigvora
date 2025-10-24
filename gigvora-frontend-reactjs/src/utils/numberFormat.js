const DEFAULT_FALLBACK = '—';

function isNumeric(value) {
  if (value === null || value === undefined) {
    return false;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric);
}

export function formatNumber(
  value,
  {
    fallback = DEFAULT_FALLBACK,
    decimals = null,
    suffix = '',
    prefix = '',
    style = 'number',
    currency = 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
  } = {},
) {
  if (!isNumeric(value)) {
    return fallback;
  }

  const numeric = Number(value);

  if (style === 'currency') {
    const resolvedMin =
      minimumFractionDigits ?? (decimals != null ? decimals : numeric < 100 ? 2 : 0);
    const resolvedMax =
      maximumFractionDigits ?? (decimals != null ? decimals : numeric < 100 ? 2 : resolvedMin);

    return (
      prefix +
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: resolvedMin,
        maximumFractionDigits: resolvedMax,
      }).format(numeric) +
      suffix
    );
  }

  if (style === 'compact') {
    return (
      prefix +
      new Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: decimals ?? 1,
      }).format(numeric) +
      suffix
    );
  }

  const resolvedMinimum =
    minimumFractionDigits ?? (decimals != null ? decimals : undefined);
  const resolvedMaximum =
    maximumFractionDigits ?? (decimals != null ? decimals : undefined);

  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: resolvedMinimum,
    maximumFractionDigits: resolvedMaximum,
  }).format(numeric);

  return `${prefix}${formatted}${suffix}`;
}

export function formatPercent(value, { fallback = DEFAULT_FALLBACK, decimals = 1, suffix = '%' } = {}) {
  if (!isNumeric(value)) {
    return fallback;
  }

  const numeric = Number(value);
  return `${numeric.toFixed(decimals)}${suffix}`;
}

export function formatCurrency(value, currency = 'USD', options = {}) {
  return formatNumber(value, { ...options, style: 'currency', currency });
}

export function formatDelta(
  current,
  previous,
  { fallback = DEFAULT_FALLBACK, decimals = 1, suffix = '' } = {},
) {
  if (!isNumeric(current) || !isNumeric(previous)) {
    return fallback;
  }

  const delta = Number(current) - Number(previous);
  if (!Number.isFinite(delta)) {
    return fallback;
  }

  const sign = delta > 0 ? '+' : delta < 0 ? '-' : '';
  return `${sign}${Math.abs(delta).toFixed(decimals)}${suffix}`;
}

export function normaliseTrend(values, { fallbackLength = 4, clampMinimum = 0 } = {}) {
  if (Array.isArray(values)) {
    const normalised = values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .map((value) => Math.max(value, clampMinimum));
    if (normalised.length > 0) {
      return normalised;
    }
  }

  // Generate a gentle ascending fallback trend to avoid empty charts.
  const seed = clampMinimum + 50;
  return Array.from({ length: fallbackLength }, (_, index) => seed + index * 2);
}

export default {
  formatNumber,
  formatPercent,
  formatCurrency,
  formatDelta,
  normaliseTrend,
};
