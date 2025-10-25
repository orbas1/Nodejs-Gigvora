import { formatStatusLabel } from '../../utils/format.js';

export function formatMoney(amount = 0, currency = 'USD') {
  const numeric = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  const code = currency ? String(currency).toUpperCase() : 'USD';
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch (error) {
    return `${code} ${numeric.toFixed(2)}`;
  }
}

export function formatMoneyFromCents(amountCents = 0, currency = 'USD') {
  if (amountCents == null || Number.isNaN(Number(amountCents))) {
    return formatMoney(0, currency);
  }
  return formatMoney(Number(amountCents) / 100, currency);
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-GB').format(Number(value));
}

export function toDateInput(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
}

export function toIsoString(value) {
  if (!value) {
    return undefined;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

export function parseInteger(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
}

export function parseFloatValue(value) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
}

export function tagsToField(tags) {
  if (!tags) {
    return '';
  }
  if (Array.isArray(tags)) {
    return tags.join(', ');
  }
  if (typeof tags === 'object') {
    return Object.values(tags)
      .map((entry) => String(entry))
      .join(', ');
  }
  return String(tags);
}

export function fieldToTags(value) {
  if (!value) {
    return undefined;
  }
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function resolveSessionLabel(session, fallbackId) {
  if (!session) {
    return fallbackId ? `Session #${fallbackId}` : 'Session';
  }
  return session.title || session.slug || session.name || `Session #${session.id ?? fallbackId}`;
}

export function resolveConnectionName(record) {
  if (!record) {
    return 'Connection';
  }
  if (record.connectionName) {
    return record.connectionName;
  }
  const contact = record.contact;
  if (contact?.firstName || contact?.lastName) {
    return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  }
  return record.connectionEmail || `Connection #${record.id ?? ''}`;
}

export function buildSessionOptions(sessions = []) {
  return sessions
    .map((session) => {
      if (!session) {
        return null;
      }
      return {
        id: session.id,
        label: resolveSessionLabel(session, session.id),
        startTime: session.startTime ?? null,
        endTime: session.endTime ?? null,
      };
    })
    .filter((entry) => entry && entry.id);
}

export default {
  formatMoney,
  formatMoneyFromCents,
  formatNumber,
  formatStatusLabel,
  toDateInput,
  toIsoString,
  parseInteger,
  parseFloatValue,
  tagsToField,
  fieldToTags,
  resolveSessionLabel,
  resolveConnectionName,
  buildSessionOptions,
};
