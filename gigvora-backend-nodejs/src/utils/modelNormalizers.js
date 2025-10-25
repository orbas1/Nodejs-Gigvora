import crypto from 'node:crypto';

export function normaliseSlug(value, { fallback = 'entry', maxLength = 120 } = {}) {
  const base = value ? String(value).normalize('NFKD') : '';
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export function normaliseHexColor(value, { fallback = '#000000' } = {}) {
  if (!value) {
    return fallback;
  }
  const candidate = String(value).trim().toLowerCase();
  if (/^#?[0-9a-f]{6}$/.test(candidate)) {
    return candidate.startsWith('#') ? candidate : `#${candidate}`;
  }
  return fallback;
}

export function normaliseEmail(value) {
  if (!value) {
    return null;
  }
  const trimmed = String(value).trim().toLowerCase();
  return trimmed || null;
}

export function applyModelSlug(
  instance,
  {
    slugField = 'slug',
    sourceField = 'name',
    fallback = 'entry',
    maxLength = 120,
    randomiseOnCreate = false,
    randomBytes = (size) => crypto.randomBytes(size).toString('hex'),
  } = {},
) {
  if (!instance) {
    return;
  }
  const candidate = instance[slugField] ?? instance[sourceField];
  let slug = normaliseSlug(candidate ?? fallback, { fallback, maxLength });

  if (randomiseOnCreate && (instance.isNewRecord || !instance[slugField])) {
    const suffix = randomBytes(4).slice(0, 6);
    const baseLength = Math.max(1, maxLength - suffix.length - 1);
    slug = `${slug.slice(0, baseLength)}-${suffix}`;
  }

  instance[slugField] = slug;
}

export function ensurePublishedTimestamp(
  instance,
  {
    statusField = 'status',
    publishedAtField = 'publishedAt',
    publishStatuses = ['published'],
    now = () => new Date(),
  } = {},
) {
  if (!instance) {
    return;
  }
  const status = instance[statusField];
  if (publishStatuses.includes(status)) {
    if (!instance[publishedAtField]) {
      instance[publishedAtField] = now();
    }
  } else if (typeof instance.changed === 'function' && instance.changed(statusField)) {
    instance[publishedAtField] = null;
  }
}

export default {
  normaliseSlug,
  normaliseHexColor,
  normaliseEmail,
  applyModelSlug,
  ensurePublishedTimestamp,
};
