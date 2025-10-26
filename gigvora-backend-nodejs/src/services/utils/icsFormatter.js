const DEFAULT_PROD_ID = '-//Gigvora//Calendar 1.0//EN';
const NEWLINE = '\r\n';

function toDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pad(value) {
  return value.toString().padStart(2, '0');
}

function formatUtcDateTime(value) {
  const date = toDate(value);
  if (!date) {
    return null;
  }
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function formatAllDayDate(value, { inclusiveEnd = false } = {}) {
  const date = toDate(value);
  if (!date) {
    return null;
  }
  if (inclusiveEnd) {
    const clone = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    clone.setUTCDate(clone.getUTCDate() + 1);
    return `${clone.getUTCFullYear()}${pad(clone.getUTCMonth() + 1)}${pad(clone.getUTCDate())}`;
  }
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

export function escapeIcsText(value) {
  if (value == null) {
    return '';
  }
  return `${value}`
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function buildLines(entries) {
  return entries.filter(Boolean).join(NEWLINE);
}

export function createIcsEvent({
  uid,
  title,
  description,
  location,
  url,
  startsAt,
  endsAt,
  allDay = false,
  timezone,
  status = 'CONFIRMED',
  categories = [],
  reminderMinutes,
  createdAt,
  updatedAt,
  organizer,
  metadata = {},
  extraFields = [],
} = {}) {
  if (!uid) {
    throw new Error('ICS events require a uid.');
  }
  const safeTitle = title ? escapeIcsText(title) : 'Gigvora Event';
  const dtStamp = formatUtcDateTime(updatedAt || createdAt || new Date()) || formatUtcDateTime(new Date());
  const dtStart = allDay
    ? formatAllDayDate(startsAt)
    : formatUtcDateTime(startsAt);
  if (!dtStart) {
    throw new Error('ICS events require a valid start time.');
  }
  const dtEnd = allDay
    ? formatAllDayDate(endsAt || startsAt, { inclusiveEnd: true })
    : formatUtcDateTime(endsAt);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${dtStamp}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    dtEnd ? (allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`) : null,
    `SUMMARY:${safeTitle}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    url ? `URL:${escapeIcsText(url)}` : null,
    timezone ? `X-MICROSOFT-CDO-TZID:${escapeIcsText(timezone)}` : null,
    status ? `STATUS:${escapeIcsText(status.toUpperCase())}` : null,
    categories.length ? `CATEGORIES:${categories.map((item) => escapeIcsText(item)).join(',')}` : null,
    organizer?.email
      ? `ORGANIZER;CN=${escapeIcsText(organizer.name || 'Gigvora')}:MAILTO:${escapeIcsText(organizer.email)}`
      : null,
    createdAt ? `CREATED:${formatUtcDateTime(createdAt)}` : null,
    updatedAt ? `LAST-MODIFIED:${formatUtcDateTime(updatedAt)}` : null,
    metadata.relatedEntityType
      ? `X-GIGVORA-RELATED-TYPE:${escapeIcsText(metadata.relatedEntityType)}`
      : null,
    metadata.relatedEntityId
      ? `X-GIGVORA-RELATED-ID:${escapeIcsText(metadata.relatedEntityId)}`
      : null,
    metadata.source ? `X-GIGVORA-SOURCE:${escapeIcsText(metadata.source)}` : null,
    ...extraFields.filter(Boolean).map((field) => `${field}`),
  ];

  if (Number.isFinite(reminderMinutes) && reminderMinutes >= 0) {
    const triggerMinutes = Math.max(0, Math.min(10080, Math.floor(reminderMinutes)));
    lines.push('BEGIN:VALARM');
    lines.push(`TRIGGER:-PT${triggerMinutes}M`);
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:${safeTitle}`);
    lines.push('END:VALARM');
  }

  lines.push('END:VEVENT');
  return buildLines(lines);
}

export function createIcsCalendar({
  events = [],
  name = 'Gigvora Schedule',
  description,
  method = 'PUBLISH',
  prodId = DEFAULT_PROD_ID,
  customProperties = [],
} = {}) {
  if (!Array.isArray(events) || !events.length) {
    throw new Error('At least one event is required to build an ICS calendar.');
  }
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${escapeIcsText(prodId)}`,
    'CALSCALE:GREGORIAN',
    method ? `METHOD:${escapeIcsText(method)}` : null,
    name ? `X-WR-CALNAME:${escapeIcsText(name)}` : null,
    description ? `X-WR-CALDESC:${escapeIcsText(description)}` : null,
    ...customProperties.filter(Boolean).map((field) => `${field}`),
    ...events.map((event) => event.trim()),
    'END:VCALENDAR',
  ];
  return `${buildLines(lines)}${NEWLINE}`;
}

export function suggestIcsFilename(title, { id, prefix = 'gigvora-event' } = {}) {
  const base = (title || '').toString().trim().toLowerCase();
  const safeTitle = base
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const parts = [safeTitle || prefix];
  if (id != null) {
    parts.push(String(id));
  }
  return `${parts.join('-')}.ics`;
}

export default {
  createIcsEvent,
  createIcsCalendar,
  escapeIcsText,
  suggestIcsFilename,
};
