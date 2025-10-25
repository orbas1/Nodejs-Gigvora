/**
 * Format a numeric value for display within marketplace metrics and dashboards.
 *
 * @param {number|string|null|undefined} value - Raw value that should be rendered.
 * @param {object} [options]
 * @param {string} [options.locale] - Optional locale passed to Intl.NumberFormat.
 * @param {number} [options.minimumFractionDigits=0] - Minimum fraction digits.
 * @param {number} [options.maximumFractionDigits=0] - Maximum fraction digits.
 * @param {string} [options.fallback='0'] - Fallback string when the value cannot be formatted.
 * @returns {string}
 */
export function formatInteger(value, {
  locale,
  minimumFractionDigits = 0,
  maximumFractionDigits = 0,
  fallback = '0',
} = {}) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return formatter.format(numericValue);
}

/**
 * Format a numeric value using compact notation (e.g., 1.2K).
 *
 * @param {number|string|null|undefined} value
 * @param {object} [options]
 * @param {string} [options.locale]
 * @param {number} [options.maximumFractionDigits=1]
 * @param {string} [options.fallback='0']
 * @returns {string}
 */
export function formatCompactInteger(value, {
  locale,
  maximumFractionDigits = 1,
  fallback = '0',
} = {}) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const formatter = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits,
  });

  return formatter.format(numericValue);
}

export default {
  formatInteger,
  formatCompactInteger,
};
