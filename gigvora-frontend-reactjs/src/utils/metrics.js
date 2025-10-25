export function formatMetricNumber(
  value,
  { fallback = '—', maximumFractionDigits = 0, minimumFractionDigits, prefix = '', suffix = '' } = {},
) {
  if (value == null || value === '') {
    return fallback;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `${prefix}${value}${suffix}`;
  }

  const options = {
    maximumFractionDigits,
    ...(minimumFractionDigits != null ? { minimumFractionDigits } : {}),
  };

  return `${prefix}${numeric.toLocaleString(undefined, options)}${suffix}`;
}

export function formatMetricPercent(
  value,
  { fallback = '—', decimals = 1, includeSymbol = true, includeSign = false, scale } = {},
) {
  if (value == null || value === '') {
    return fallback;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  const effectiveScale = scale != null ? Number(scale) : Math.abs(numeric) > 1 ? 1 : 100;
  if (!Number.isFinite(effectiveScale) || effectiveScale === 0) {
    return fallback;
  }

  const scaledValue = numeric * effectiveScale;
  const magnitude = Math.abs(scaledValue).toFixed(decimals);
  const positive = numeric > 0;
  const negative = numeric < 0;
  const signPrefix = negative ? '−' : includeSign && positive ? '+' : '';
  const formatted = `${signPrefix}${magnitude}`;
  return includeSymbol ? `${formatted}%` : formatted;
}

export function formatMetricPercentChange(
  value,
  { fallback = '—', decimals = 1, includeSymbol = true, includeSign = true } = {},
) {
  return formatMetricPercent(value, { fallback, decimals, includeSymbol, includeSign });
}

export function formatMetricCurrency(
  value,
  { fallback = '—', currency = 'USD', maximumFractionDigits, minimumFractionDigits } = {},
) {
  if (value == null || value === '') {
    return fallback;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    ...(maximumFractionDigits != null
      ? { maximumFractionDigits }
      : { maximumFractionDigits: numeric < 100 ? 2 : 0 }),
    ...(minimumFractionDigits != null ? { minimumFractionDigits } : {}),
  }).format(numeric);
}

export function formatMetricChange(
  current,
  previous,
  { fallback = '—', decimals = 1, asPercent = false, includeSymbol = true } = {},
) {
  if (current == null || previous == null) {
    return fallback;
  }

  const currentNumeric = Number(current);
  const previousNumeric = Number(previous);
  if (!Number.isFinite(currentNumeric) || !Number.isFinite(previousNumeric)) {
    return fallback;
  }

  const delta = currentNumeric - previousNumeric;
  const change = asPercent && previousNumeric !== 0 ? (delta / Math.abs(previousNumeric)) * 100 : delta;
  const formatted = change.toFixed(decimals);
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';

  if (!includeSymbol) {
    return `${sign === '−' ? '-' : ''}${Math.abs(change).toFixed(decimals)}`;
  }

  const suffix = asPercent ? '%' : '';
  return `${sign}${Math.abs(formatted)}${suffix}`;
}

export default {
  formatMetricNumber,
  formatMetricPercent,
  formatMetricCurrency,
  formatMetricChange,
};
