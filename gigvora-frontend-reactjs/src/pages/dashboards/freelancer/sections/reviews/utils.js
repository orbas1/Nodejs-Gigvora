import { STATUS_OPTIONS } from './constants.js';

export function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch (error) {
    return `${value}`;
  }
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return `${value}`;
  }
}

export function getStatusConfig(status) {
  return STATUS_OPTIONS.find((option) => option.value === status) ?? STATUS_OPTIONS[2];
}

export function toFormValues(review) {
  if (!review) {
    return {
      title: '',
      reviewerName: '',
      reviewerRole: '',
      reviewerCompany: '',
      rating: '',
      status: 'draft',
      highlighted: false,
      reviewSource: 'manual',
      capturedAt: '',
      publishedAt: '',
      previewUrl: '',
      heroImageUrl: '',
      tags: '',
      body: '',
      privateNotes: '',
    };
  }

  return {
    title: review.title ?? '',
    reviewerName: review.reviewerName ?? '',
    reviewerRole: review.reviewerRole ?? '',
    reviewerCompany: review.reviewerCompany ?? '',
    rating: review.rating != null ? String(review.rating) : '',
    status: review.status ?? 'draft',
    highlighted: Boolean(review.highlighted),
    reviewSource: review.reviewSource ?? 'manual',
    capturedAt: review.capturedAt ? review.capturedAt.slice(0, 16) : '',
    publishedAt: review.publishedAt ? review.publishedAt.slice(0, 16) : '',
    previewUrl: review.previewUrl ?? '',
    heroImageUrl: review.heroImageUrl ?? '',
    tags: Array.isArray(review.tags) ? review.tags.join(', ') : '',
    body: review.body ?? '',
    privateNotes: review.privateNotes ?? '',
  };
}

export function toPayload(values) {
  const payload = { ...values };

  payload.rating = values.rating ? Number(values.rating) : null;
  if (!Number.isFinite(payload.rating)) {
    payload.rating = null;
  }

  payload.highlighted = Boolean(values.highlighted);
  payload.tags = values.tags
    ? values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  payload.capturedAt = values.capturedAt ? new Date(values.capturedAt).toISOString() : null;
  payload.publishedAt = values.publishedAt ? new Date(values.publishedAt).toISOString() : null;

  if (!payload.previewUrl) {
    payload.previewUrl = null;
  }
  if (!payload.heroImageUrl) {
    payload.heroImageUrl = null;
  }
  if (!payload.privateNotes) {
    payload.privateNotes = null;
  }

  return payload;
}
