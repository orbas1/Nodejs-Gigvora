import { ValidationError } from '../utils/errors.js';

export const RECURRENCE_FREQUENCIES = Object.freeze(['DAILY', 'WEEKLY', 'MONTHLY']);

export const WEEKDAY_ALIASES = Object.freeze({
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
});

export const DEFAULT_OVERVIEW_MONTH_WINDOW = 3;

export function normaliseFrequency(value) {
  const frequency = typeof value === 'string' ? value.trim().toUpperCase() : null;
  if (!frequency || !RECURRENCE_FREQUENCIES.includes(frequency)) {
    throw new ValidationError('recurrence.frequency must be daily, weekly, or monthly.');
  }
  return frequency;
}

export function normaliseWeekdays(values) {
  if (!values) return [];
  if (!Array.isArray(values)) {
    throw new ValidationError('recurrence.byWeekday must be an array when provided.');
  }
  const normalized = values
    .map((value) => (typeof value === 'string' ? value.trim().slice(0, 2).toUpperCase() : null))
    .filter((code) => code && WEEKDAY_ALIASES[code] !== undefined);
  if (values.length && normalized.length === 0) {
    throw new ValidationError('recurrence.byWeekday must include valid weekday abbreviations.');
  }
  return normalized;
}

export function summariseRecurrence({ rule, count, until } = {}) {
  if (!rule) {
    return null;
  }
  const parts = rule.split(';').reduce((acc, segment) => {
    const [key, value] = segment.split('=');
    if (key && value) {
      acc[key.toUpperCase()] = value;
    }
    return acc;
  }, {});
  const frequency = parts.FREQ ?? null;
  if (!frequency) {
    return null;
  }
  const interval = parts.INTERVAL ? Number.parseInt(parts.INTERVAL, 10) : 1;
  const everyText = interval > 1 ? `every ${interval} ` : 'every ';
  let description = '';
  switch (frequency) {
    case 'DAILY':
      description = `${everyText}day`;
      break;
    case 'WEEKLY': {
      const dayText = parts.BYDAY ? parts.BYDAY.split(',').join(', ') : 'week';
      description = `${everyText}week on ${dayText}`;
      break;
    }
    case 'MONTHLY':
      description = `${everyText}month`;
      break;
    default:
      description = `Recurring (${frequency.toLowerCase()})`;
  }
  if (count) {
    description = `${description} for ${count} occurrence${count > 1 ? 's' : ''}`;
  } else if (until) {
    description = `${description} until ${new Date(until).toISOString().split('T')[0]}`;
  }
  return description;
}

export default {
  RECURRENCE_FREQUENCIES,
  WEEKDAY_ALIASES,
  DEFAULT_OVERVIEW_MONTH_WINDOW,
  normaliseFrequency,
  normaliseWeekdays,
  summariseRecurrence,
};
