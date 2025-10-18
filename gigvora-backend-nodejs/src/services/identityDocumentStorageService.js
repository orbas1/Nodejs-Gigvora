import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const DEFAULT_STORAGE_ROOT = path.join(process.cwd(), 'storage', 'identity-documents');
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

function ensureString(value, label, { required = true, maxLength = 500 } = {}) {
  if (value == null) {
    if (required) {
      throw new ValidationError(`${label} is required.`);
    }
    return null;
  }
  const stringValue = `${value}`.trim();
  if (!stringValue && required) {
    throw new ValidationError(`${label} is required.`);
  }
  if (stringValue.length > maxLength) {
    throw new ValidationError(`${label} must be ${maxLength} characters or fewer.`);
  }
  return stringValue;
}

function sanitizeFileName(fileName) {
  const safe = fileName
    .replace(/[^a-zA-Z0-9_.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return safe || 'document';
}

function extractBase64Payload(rawData) {
  const trimmed = ensureString(rawData, 'data');
  const base64Index = trimmed.indexOf('base64,');
  if (base64Index >= 0) {
    return trimmed.slice(base64Index + 'base64,'.length);
  }
  return trimmed;
}

function validateBase64String(value) {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized) {
    throw new ValidationError('data is required.');
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    throw new ValidationError('data must be a valid base64-encoded string.');
  }
  return normalized;
}

export async function storeIdentityDocument({ data, fileName, contentType, actorId }, { storageRoot } = {}) {
  const resolvedStorageRoot = storageRoot ? path.resolve(storageRoot) : DEFAULT_STORAGE_ROOT;
  await fs.mkdir(resolvedStorageRoot, { recursive: true });

  const safeFileName = sanitizeFileName(ensureString(fileName, 'fileName'));
  const type = ensureString(contentType, 'contentType', { required: true, maxLength: 120 });
  if (!type.includes('/')) {
    throw new ValidationError('contentType must be a valid mime type.');
  }

  if (!data) {
    throw new ValidationError('data is required.');
  }

  const base64Payload = validateBase64String(extractBase64Payload(data));
  let buffer;
  try {
    buffer = Buffer.from(base64Payload, 'base64');
  } catch (error) {
    throw new ValidationError('data must be a valid base64-encoded string.');
  }

  if (!buffer || !buffer.length) {
    throw new ValidationError('Uploaded document cannot be empty.');
  }

  const reEncoded = buffer.toString('base64').replace(/=+$/, '');
  const sanitizedOriginal = base64Payload.replace(/=+$/, '');
  if (reEncoded !== sanitizedOriginal) {
    throw new ValidationError('data must be a valid base64-encoded string.');
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError('Uploaded document exceeds the 15MB size limit.');
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = `${now.getUTCMonth() + 1}`.padStart(2, '0');
  const uuid = randomUUID();
  const directory = path.join(resolvedStorageRoot, `${year}`, `${month}`);
  await fs.mkdir(directory, { recursive: true });

  const rawExtension = path.extname(safeFileName);
  const baseName = rawExtension ? safeFileName.slice(0, safeFileName.length - rawExtension.length) : safeFileName;
  const extension = rawExtension || '.bin';
  const finalName = `${uuid}-${baseName}${extension}`;
  const filePath = path.join(directory, finalName);

  await fs.writeFile(filePath, buffer);

  const relativePath = path.relative(resolvedStorageRoot, filePath).replace(/\\/g, '/');
  const storageKey = `identity/${relativePath}`;

  const metadata = {
    key: storageKey,
    size: buffer.length,
    contentType: type,
    fileName: safeFileName,
    actorId: actorId ?? null,
    storedAt: now.toISOString(),
  };

  await fs.writeFile(`${filePath}.json`, JSON.stringify(metadata));

  return metadata;
}

export async function readIdentityDocument(key, { storageRoot } = {}) {
  if (!key) {
    throw new ValidationError('key is required.');
  }

  const resolvedStorageRoot = storageRoot ? path.resolve(storageRoot) : DEFAULT_STORAGE_ROOT;
  const relative = key.replace(/^identity\//, '');
  const filePath = path.join(resolvedStorageRoot, relative);

  let buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new NotFoundError('Document not found.');
    }
    throw error;
  }

  let metadata = null;
  try {
    const raw = await fs.readFile(`${filePath}.json`, 'utf8');
    metadata = JSON.parse(raw);
  } catch (metaError) {
    if (!(metaError && metaError.code === 'ENOENT')) {
      throw metaError;
    }
  }

  const fileName = metadata?.fileName ?? path.basename(filePath);
  const contentType = metadata?.contentType ?? 'application/octet-stream';
  const storedAt = metadata?.storedAt ?? null;
  const actorId = metadata?.actorId ?? null;
  const base64 = buffer.toString('base64');

  return {
    key,
    size: buffer.length,
    fileName,
    contentType,
    storedAt,
    actorId,
    data: `data:${contentType};base64,${base64}`,
  };
}

export default {
  storeIdentityDocument,
  readIdentityDocument,
};
