import { ValidationError } from '../utils/errors.js';

const DEFAULT_MAX_ATTACHMENT_BYTES = Number.parseInt(
  process.env.MESSAGING_ATTACHMENT_MAX_BYTES ?? `${50 * 1024 * 1024}`,
  10,
);

function normaliseString(value, label, { maxLength = 255, optional = false } = {}) {
  if (value == null) {
    if (optional) return null;
    throw new ValidationError(`${label} is required.`);
  }
  const text = String(value).trim();
  if (!text) {
    if (optional) return null;
    throw new ValidationError(`${label} cannot be empty.`);
  }
  if (text.length > maxLength) {
    throw new ValidationError(`${label} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function normaliseFileSize(value) {
  if (value == null || value === '') {
    return 0;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new ValidationError('fileSize must be a positive number.');
  }
  if (DEFAULT_MAX_ATTACHMENT_BYTES && numeric > DEFAULT_MAX_ATTACHMENT_BYTES) {
    throw new ValidationError('Attachment exceeds the maximum supported size.');
  }
  return Math.round(numeric);
}

export function normaliseMessageAttachments(attachments, { maxAttachments = 5 } = {}) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return [];
  }

  const uniqueByStorage = new Map();

  attachments.slice(0, maxAttachments).forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new ValidationError(`Attachment at index ${index} is invalid.`);
    }
    const fileName = normaliseString(raw.fileName, `Attachment ${index} fileName`, { maxLength: 255 });
    const storageKey = normaliseString(raw.storageKey, `Attachment ${index} storageKey`, { maxLength: 512 });
    const mimeType = raw.mimeType ? normaliseString(raw.mimeType, `Attachment ${index} mimeType`, { maxLength: 128, optional: true }) : 'application/octet-stream';
    const fileSize = normaliseFileSize(raw.fileSize);
    const checksum = raw.checksum
      ? normaliseString(raw.checksum, `Attachment ${index} checksum`, { maxLength: 128, optional: true })
      : null;
    const metadata = raw.metadata && typeof raw.metadata === 'object' ? { ...raw.metadata } : null;

    if (!uniqueByStorage.has(storageKey)) {
      uniqueByStorage.set(storageKey, {
        fileName,
        storageKey,
        mimeType,
        fileSize,
        checksum,
        metadata,
      });
    }
  });

  return Array.from(uniqueByStorage.values());
}

export default {
  normaliseMessageAttachments,
};
