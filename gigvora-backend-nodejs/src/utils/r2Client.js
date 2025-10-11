import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucket = process.env.CLOUDFLARE_R2_BUCKET;

let client;

function isConfigured() {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucket);
}

function getClient() {
  if (!isConfigured()) {
    return null;
  }
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

function buildObjectKey(prefix, fileName) {
  const normalizedPrefix = prefix?.replace(/\/$/, '') || 'evidence';
  const safeFileName = fileName?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'evidence';
  return `${normalizedPrefix}/${crypto.randomUUID()}-${safeFileName}`;
}

export async function uploadEvidence({
  prefix = 'disputes',
  fileName,
  contentType = 'application/octet-stream',
  body,
  metadata = {},
}) {
  if (!body) {
    throw new Error('Evidence body is required for upload');
  }

  const key = buildObjectKey(prefix, fileName);
  const r2Client = getClient();

  if (!r2Client) {
    return {
      stored: false,
      key,
      url: null,
    };
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    }),
  );

  let signedUrl = null;
  try {
    signedUrl = await getSignedUrl(
      r2Client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 60 * 60 },
    );
  } catch (error) {
    console.warn('Failed to generate signed URL for evidence object', key, error);
  }

  return {
    stored: true,
    key,
    url: signedUrl,
  };
}

export default {
  isConfigured,
  uploadEvidence,
};
