import formatDateTime from '../../../utils/formatDateTime.js';
import {
  STATUS_ORDER,
  STATUS_LABELS,
  STATUS_BADGES,
  STATUS_OPTIONS,
  VISIBILITY_OPTIONS,
  WORKPLACE_OPTIONS,
  EMPLOYMENT_OPTIONS,
  CONTRACT_OPTIONS,
  EXPERIENCE_OPTIONS,
  COMPENSATION_OPTIONS,
  WORKFLOW_OPTIONS,
  APPROVAL_OPTIONS,
  PROMOTION_FLAGS,
} from './jobPostConstants.js';

export {
  STATUS_ORDER,
  STATUS_LABELS,
  STATUS_BADGES,
  STATUS_OPTIONS,
  VISIBILITY_OPTIONS,
  WORKPLACE_OPTIONS,
  EMPLOYMENT_OPTIONS,
  CONTRACT_OPTIONS,
  EXPERIENCE_OPTIONS,
  COMPENSATION_OPTIONS,
  WORKFLOW_OPTIONS,
  APPROVAL_OPTIONS,
  PROMOTION_FLAGS,
};

const DEFAULT_PROMOTION_FLAGS = Object.freeze(
  PROMOTION_FLAGS.reduce((acc, item) => {
    acc[item.key] = false;
    return acc;
  }, {}),
);

const DEFAULT_ATTACHMENT = Object.freeze({ label: '', url: '', type: '' });

const DEFAULT_FORM = Object.freeze({
  id: null,
  slug: '',
  title: '',
  description: '',
  location: '',
  employmentType: '',
  status: 'draft',
  workflowStage: 'draft',
  approvalStatus: 'pending_review',
  approvalNotes: '',
  visibility: 'public',
  workplaceType: 'hybrid',
  compensationType: 'salary',
  contractType: 'full_time',
  experienceLevel: 'mid',
  department: '',
  team: '',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  applicationUrl: '',
  applicationEmail: '',
  applicationInstructions: '',
  hiringManagerName: '',
  hiringManagerEmail: '',
  recruiterName: '',
  recruiterEmail: '',
  tagsText: '',
  benefits: [''],
  responsibilities: [''],
  requirements: [''],
  attachments: [DEFAULT_ATTACHMENT],
  promotionFlags: DEFAULT_PROMOTION_FLAGS,
  publishedAt: '',
  expiresAt: '',
  archiveReason: '',
  externalReference: '',
  metadataJson: '',
});

export function createEmptyForm() {
  return {
    ...DEFAULT_FORM,
    benefits: [''],
    responsibilities: [''],
    requirements: [''],
    attachments: [{ ...DEFAULT_ATTACHMENT }],
    promotionFlags: { ...DEFAULT_PROMOTION_FLAGS },
  };
}

function normalizeList(values) {
  if (!Array.isArray(values) || !values.length) {
    return [''];
  }
  const cleaned = values.map((value) => `${value ?? ''}`.trim());
  return cleaned.length ? cleaned : [''];
}

function normalizeAttachments(values) {
  if (!Array.isArray(values) || !values.length) {
    return [{ ...DEFAULT_ATTACHMENT }];
  }
  return values.map((item) => ({
    label: `${item?.label ?? ''}`.trim(),
    url: `${item?.url ?? ''}`.trim(),
    type: `${item?.type ?? ''}`.trim(),
  }));
}

function formatInputDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

export function buildFormFromJob(job) {
  if (!job) {
    return createEmptyForm();
  }
  const detail = job.detail ?? {};
  const promotionFlags = detail.promotionFlags ?? {};
  const metadata = detail.metadata && Object.keys(detail.metadata).length ? JSON.stringify(detail.metadata, null, 2) : '';
  const tagsText = Array.isArray(detail.tags) ? detail.tags.join(', ') : '';

  return {
    id: job.id,
    slug: detail.slug ?? '',
    title: job.title ?? '',
    description: job.description ?? '',
    location: job.location ?? '',
    employmentType: job.employmentType ?? '',
    status: detail.status ?? 'draft',
    workflowStage: detail.workflowStage ?? 'draft',
    approvalStatus: detail.approvalStatus ?? 'pending_review',
    approvalNotes: detail.approvalNotes ?? '',
    visibility: detail.visibility ?? 'public',
    workplaceType: detail.workplaceType ?? 'hybrid',
    compensationType: detail.compensationType ?? 'salary',
    contractType: detail.contractType ?? 'full_time',
    experienceLevel: detail.experienceLevel ?? 'mid',
    department: detail.department ?? '',
    team: detail.team ?? '',
    salaryMin: detail.salaryMin ?? '',
    salaryMax: detail.salaryMax ?? '',
    currency: detail.currency ?? 'USD',
    applicationUrl: detail.applicationUrl ?? '',
    applicationEmail: detail.applicationEmail ?? '',
    applicationInstructions: detail.applicationInstructions ?? '',
    hiringManagerName: detail.hiringManagerName ?? '',
    hiringManagerEmail: detail.hiringManagerEmail ?? '',
    recruiterName: detail.recruiterName ?? '',
    recruiterEmail: detail.recruiterEmail ?? '',
    tagsText,
    benefits: normalizeList(detail.benefits),
    responsibilities: normalizeList(detail.responsibilities),
    requirements: normalizeList(detail.requirements),
    attachments: normalizeAttachments(detail.attachments),
    promotionFlags: {
      ...DEFAULT_PROMOTION_FLAGS,
      ...promotionFlags,
    },
    publishedAt: detail.publishedAt ? formatInputDate(detail.publishedAt) : '',
    expiresAt: detail.expiresAt ? formatInputDate(detail.expiresAt) : '',
    archiveReason: detail.archiveReason ?? '',
    externalReference: detail.externalReference ?? '',
    metadataJson: metadata,
  };
}

function parseList(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((value) => `${value ?? ''}`.trim())
    .filter((value) => value.length);
}

function parseAttachments(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((item) => ({
      label: `${item?.label ?? ''}`.trim(),
      url: `${item?.url ?? ''}`.trim(),
      type: `${item?.type ?? ''}`.trim(),
    }))
    .filter((item) => item.label || item.url || item.type);
}

function parseTags(tagsText) {
  if (!tagsText) {
    return [];
  }
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length);
}

function parseMetadata(value) {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    throw new Error('Metadata must be valid JSON.');
  }
}

function normalizeDateForPayload(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function buildPayloadFromForm(form) {
  const base = {
    title: form.title?.trim(),
    slug: form.slug?.trim() || undefined,
    description: form.description?.trim(),
    location: form.location?.trim() || null,
    employmentType: form.employmentType || null,
    status: form.status,
    workflowStage: form.workflowStage,
    approvalStatus: form.approvalStatus,
    approvalNotes: form.approvalNotes?.trim() || null,
    visibility: form.visibility,
    workplaceType: form.workplaceType,
    compensationType: form.compensationType,
    contractType: form.contractType,
    experienceLevel: form.experienceLevel,
    department: form.department?.trim() || null,
    team: form.team?.trim() || null,
    salaryMin: form.salaryMin !== '' && form.salaryMin !== null ? Number(form.salaryMin) : null,
    salaryMax: form.salaryMax !== '' && form.salaryMax !== null ? Number(form.salaryMax) : null,
    currency: form.currency?.trim() || null,
    applicationUrl: form.applicationUrl?.trim() || null,
    applicationEmail: form.applicationEmail?.trim() || null,
    applicationInstructions: form.applicationInstructions?.trim() || null,
    hiringManagerName: form.hiringManagerName?.trim() || null,
    hiringManagerEmail: form.hiringManagerEmail?.trim() || null,
    recruiterName: form.recruiterName?.trim() || null,
    recruiterEmail: form.recruiterEmail?.trim() || null,
    tags: parseTags(form.tagsText),
    benefits: parseList(form.benefits),
    responsibilities: parseList(form.responsibilities),
    requirements: parseList(form.requirements),
    attachments: parseAttachments(form.attachments),
    promotionFlags: form.promotionFlags || { ...DEFAULT_PROMOTION_FLAGS },
    publishedAt: normalizeDateForPayload(form.publishedAt),
    expiresAt: normalizeDateForPayload(form.expiresAt),
    archiveReason: form.archiveReason?.trim() || null,
    externalReference: form.externalReference?.trim() || null,
  };

  if (form.metadataJson && form.metadataJson.trim()) {
    base.metadata = parseMetadata(form.metadataJson);
  }

  return base;
}

export function describeJobRow(job) {
  if (!job) {
    return null;
  }
  const detail = job.detail ?? {};
  return {
    id: job.id,
    title: job.title,
    status: detail.status,
    statusLabel: STATUS_LABELS[detail.status] ?? detail.status,
    visibility: detail.visibility,
    workflowStage: detail.workflowStage,
    approvalStatus: detail.approvalStatus,
    updatedAtLabel: formatDateTime(detail.updatedAt ?? job.updatedAt),
  };
}
