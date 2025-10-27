const FALLBACK_EVENT_TYPES = ['project', 'interview', 'gig', 'mentorship', 'volunteering'];

function normalizeCompanyCalendarEventType(value) {
  if (value == null) {
    return null;
  }
  const normalised = `${value}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalised || null;
}

function normaliseEventTypeList(list) {
  const unique = [];
  const source = Array.isArray(list) ? list : FALLBACK_EVENT_TYPES;
  for (const candidate of source) {
    const normalised = normalizeCompanyCalendarEventType(candidate);
    if (!normalised) {
      continue;
    }
    if (!unique.includes(normalised)) {
      unique.push(normalised);
    }
  }
  return unique.length ? unique : [...FALLBACK_EVENT_TYPES];
}

const COMPANY_CALENDAR_EVENT_TYPES = Object.freeze(normaliseEventTypeList());
const COMPANY_CALENDAR_EVENT_TYPE_SET = new Set(COMPANY_CALENDAR_EVENT_TYPES);

function assertCompanyCalendarEventType(value) {
  const normalised = normalizeCompanyCalendarEventType(value);
  if (!normalised || !COMPANY_CALENDAR_EVENT_TYPE_SET.has(normalised)) {
    throw new Error(`Unsupported company calendar event type: ${value}`);
  }
  return normalised;
}

module.exports = {
  COMPANY_CALENDAR_EVENT_TYPES,
  COMPANY_CALENDAR_EVENT_TYPE_SET,
  normalizeCompanyCalendarEventType,
  assertCompanyCalendarEventType,
};
