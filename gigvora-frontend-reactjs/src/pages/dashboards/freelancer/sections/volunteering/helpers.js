export const DEFAULT_APPLICATION = {
  title: '',
  organizationName: '',
  focusArea: '',
  location: '',
  remoteFriendly: true,
  status: 'draft',
  appliedAt: '',
  targetStartDate: '',
  hoursPerWeek: '',
  impactSummary: '',
  notes: '',
  coverImageUrl: '',
  skills: [],
};

export const DEFAULT_RESPONSE = {
  applicationId: '',
  responderName: '',
  responderEmail: '',
  status: 'awaiting_reply',
  respondedAt: '',
  nextSteps: '',
  message: '',
  attachments: [],
};

export const DEFAULT_CONTRACT = {
  title: '',
  organizationName: '',
  status: 'pending',
  applicationId: '',
  startDate: '',
  endDate: '',
  expectedHours: '',
  hoursCommitted: '',
  financialValue: '',
  currencyCode: 'USD',
  impactNotes: '',
  agreementUrl: '',
};

export const DEFAULT_SPEND = {
  contractId: '',
  description: '',
  category: 'other',
  amount: '',
  currencyCode: 'USD',
  spentAt: '',
  receiptUrl: '',
};

export function toDateInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 10);
}

export function fromDateInput(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = `${value}`.split('-').map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utcDate.getTime())) {
    return null;
  }

  return utcDate.toISOString();
}

export function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatCurrency(amount, currency = 'USD') {
  const numeric = Number.parseFloat(amount ?? 0);
  if (!Number.isFinite(numeric)) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(0);
    } catch (error) {
      return `${currency} 0`;
    }
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch (error) {
    return `${currency} ${numeric.toFixed(2)}`;
  }
}

export function formatHours(value) {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0 hrs';
  }
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(numeric);
  return `${formatted} hrs`;
}

export function serialiseSkills(skills) {
  if (!Array.isArray(skills)) {
    return '';
  }
  return skills
    .map((skill) => `${skill}`.trim())
    .filter(Boolean)
    .join(', ');
}

export function parseSkills(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input.map((item) => `${item}`.trim()).filter(Boolean);
  }
  return `${input}`
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseAttachmentList(input) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input.map((item) => `${item}`.trim()).filter(Boolean);
  }
  return `${input}`
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serialiseAttachments(list) {
  if (!Array.isArray(list)) {
    return '';
  }
  return list
    .map((item) => `${item}`.trim())
    .filter(Boolean)
    .join('\n');
}
