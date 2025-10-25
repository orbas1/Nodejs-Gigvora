import { DEFAULT_LANGUAGE, translate } from '../i18n/translations.js';

export function normaliseStatusKey(value) {
  if (value == null) {
    return 'unknown';
  }
  const normalised = `${value}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalised.length ? normalised : 'unknown';
}

export function formatStatusLabel(status) {
  if (status == null) {
    return 'Unknown';
  }
  return `${status}`
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function resolveStatusLabel(languageCode, status, fallbackLabel) {
  const statusKey = normaliseStatusKey(status);
  const fallback = fallbackLabel ?? formatStatusLabel(status);
  return translate(languageCode ?? DEFAULT_LANGUAGE, `status.${statusKey}`, fallback);
}

export default {
  normaliseStatusKey,
  formatStatusLabel,
  resolveStatusLabel,
};
