import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { storeIdentityDocument, readIdentityDocument } from '../../src/services/identityDocumentStorageService.js';
import { ValidationError } from '../../src/utils/errors.js';

const TMP_PREFIX = 'identity-docs-test-';

async function directoryExists(dir) {
  try {
    const stats = await fs.stat(dir);
    return stats.isDirectory();
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

describe('identityDocumentStorageService', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), TMP_PREFIX));
  });

  afterEach(async () => {
    if (tmpDir && (await directoryExists(tmpDir))) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('stores a base64 encoded document and returns metadata', async () => {
    const buffer = Buffer.from('Sample identity payload', 'utf8');
    const base64 = buffer.toString('base64');

    const result = await storeIdentityDocument(
      {
        data: `data:image/png;base64,${base64}`,
        fileName: 'passport.png',
        contentType: 'image/png',
        actorId: 42,
      },
      { storageRoot: tmpDir },
    );

    expect(result).toEqual(
      expect.objectContaining({
        key: expect.stringMatching(/^identity\//),
        size: buffer.length,
        contentType: 'image/png',
        fileName: 'passport.png',
        actorId: 42,
      }),
    );

    const storedPath = path.join(tmpDir, result.key.replace(/^identity\//, ''));
    await expect(fs.stat(storedPath)).resolves.toBeDefined();
    const storedBuffer = await fs.readFile(storedPath);
    expect(storedBuffer.equals(buffer)).toBe(true);

    const metadataRaw = await fs.readFile(`${storedPath}.json`, 'utf8');
    const metadata = JSON.parse(metadataRaw);
    expect(metadata).toEqual(
      expect.objectContaining({
        key: result.key,
        fileName: 'passport.png',
        contentType: 'image/png',
        size: buffer.length,
        actorId: 42,
      }),
    );
  });

  it('reads back stored documents including metadata and data uri', async () => {
    const buffer = Buffer.from('Sample identity payload', 'utf8');
    const base64 = buffer.toString('base64');

    const stored = await storeIdentityDocument(
      {
        data: base64,
        fileName: 'selfie.jpg',
        contentType: 'image/jpeg',
        actorId: 55,
      },
      { storageRoot: tmpDir },
    );

    const loaded = await readIdentityDocument(stored.key, { storageRoot: tmpDir });

    expect(loaded).toEqual(
      expect.objectContaining({
        key: stored.key,
        fileName: 'selfie.jpg',
        contentType: 'image/jpeg',
        size: buffer.length,
        actorId: 55,
      }),
    );
    expect(loaded.data).toBe(`data:image/jpeg;base64,${base64}`);
  });

  it('rejects invalid base64 payloads', async () => {
    await expect(
      storeIdentityDocument(
        {
          data: 'not-base64',
          fileName: 'id.txt',
          contentType: 'text/plain',
        },
        { storageRoot: tmpDir },
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('enforces the maximum file size', async () => {
    const largeBuffer = Buffer.alloc(16 * 1024 * 1024, randomUUID());
    const largeBase64 = largeBuffer.toString('base64');

    await expect(
      storeIdentityDocument(
        {
          data: largeBase64,
          fileName: 'oversized.bin',
          contentType: 'application/octet-stream',
        },
        { storageRoot: tmpDir },
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
