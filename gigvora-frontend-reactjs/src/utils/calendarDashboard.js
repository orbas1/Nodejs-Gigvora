const ICS_LINE_BREAK = '\r\n';

function formatIcsTimestamp(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(text) {
  if (!text) {
    return '';
  }
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function buildCalendarExportBlob(events = [], {
  calendarName = 'Gigvora calendar',
  description = 'Gigvora schedule export',
  timezone = null,
  source = 'gigvora-calendar',
} = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gigvora//' + escapeIcsText(calendarName) + '//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  if (timezone) {
    lines.push(`X-WR-TIMEZONE:${escapeIcsText(timezone)}`);
  }

  if (description) {
    lines.push(`X-WR-CALDESC:${escapeIcsText(description)}`);
  }

  const dtStamp = formatIcsTimestamp(new Date());

  events.forEach((event, index) => {
    const startsAt = formatIcsTimestamp(event?.startsAt ?? event?.start ?? null);
    if (!startsAt) {
      return;
    }
    const endsAt = formatIcsTimestamp(event?.endsAt ?? event?.end ?? event?.startsAt ?? null);
    const uidSource = event?.id ?? `${source}-${index}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${escapeIcsText(uidSource)}@gigvora.com`);
    if (dtStamp) {
      lines.push(`DTSTAMP:${dtStamp}`);
    }
    if (timezone) {
      lines.push(`DTSTART;TZID=${escapeIcsText(timezone)}:${startsAt.replace(/Z$/, '')}`);
      if (endsAt) {
        lines.push(`DTEND;TZID=${escapeIcsText(timezone)}:${endsAt.replace(/Z$/, '')}`);
      }
    } else {
      lines.push(`DTSTART:${startsAt}`);
      if (endsAt) {
        lines.push(`DTEND:${endsAt}`);
      }
    }

    if (event?.title || event?.summary) {
      lines.push(`SUMMARY:${escapeIcsText(event.title ?? event.summary)}`);
    }

    if (event?.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }

    if (event?.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }

    const url = event?.url ?? event?.link;
    if (url) {
      lines.push(`URL:${escapeIcsText(url)}`);
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const payload = `${lines.join(ICS_LINE_BREAK)}${ICS_LINE_BREAK}`;
  return new Blob([payload], { type: 'text/calendar' });
}

export function downloadCalendarExport(blob, filename = 'gigvora-calendar.ics') {
  if (!(blob instanceof Blob)) {
    throw new TypeError('A Blob payload is required to download the calendar export.');
  }
  if (typeof window === 'undefined') {
    return;
  }
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

export function detectBrowserTimezone() {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions()?.timeZone;
    if (resolved && typeof resolved === 'string') {
      return resolved;
    }
  } catch (error) {
    // Ignore detection errors and fall back to UTC.
  }
  return 'UTC';
}

function startOfDayUtc(date) {
  const instance = new Date(date);
  instance.setUTCHours(0, 0, 0, 0);
  return instance;
}

export function moveEventToDate(event, date) {
  if (!event?.startsAt || !date) {
    return { startsAt: event?.startsAt ?? null, endsAt: event?.endsAt ?? null };
  }
  const targetDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(targetDate.getTime())) {
    return { startsAt: event.startsAt, endsAt: event.endsAt ?? null };
  }

  const start = new Date(event.startsAt);
  if (Number.isNaN(start.getTime())) {
    return { startsAt: event.startsAt, endsAt: event.endsAt ?? null };
  }

  const dayOffset = startOfDayUtc(targetDate).getTime() - startOfDayUtc(start).getTime();

  const nextStart = new Date(start.getTime() + dayOffset);
  const nextEnd = event.endsAt ? new Date(new Date(event.endsAt).getTime() + dayOffset) : null;

  return {
    startsAt: nextStart.toISOString(),
    endsAt: nextEnd ? nextEnd.toISOString() : null,
  };
}

export function buildCalendarSummary(events = []) {
  const total = Array.isArray(events) ? events.length : 0;
  const nextEvent = Array.isArray(events)
    ? [...events]
        .filter((event) => event?.startsAt)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0] ?? null
    : null;
  return { total, nextEvent };
}

export default {
  buildCalendarExportBlob,
  downloadCalendarExport,
  detectBrowserTimezone,
  moveEventToDate,
  buildCalendarSummary,
};
