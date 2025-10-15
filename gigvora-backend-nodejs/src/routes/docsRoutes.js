import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Router } from 'express';

const router = Router();

const RUNTIME_SPEC_PATH = new URL('../../docs/openapi/runtime-security.json', import.meta.url);
let cachedSpec = null;

async function loadRuntimeSpec() {
  if (cachedSpec) {
    return cachedSpec;
  }
  const raw = await readFile(RUNTIME_SPEC_PATH, 'utf8');
  const document = JSON.parse(raw);
  const etag = crypto.createHash('sha256').update(raw).digest('hex');
  cachedSpec = { document, etag };
  return cachedSpec;
}

router.get('/runtime-security', async (req, res, next) => {
  try {
    const { document, etag } = await loadRuntimeSpec();
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.json(document);
  } catch (error) {
    next(error);
  }
});

router.head('/runtime-security', async (req, res, next) => {
  try {
    const { etag } = await loadRuntimeSpec();
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
