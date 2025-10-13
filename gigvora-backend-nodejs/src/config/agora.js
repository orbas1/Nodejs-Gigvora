import { ApplicationError } from '../utils/errors.js';

function parseTtl(value) {
  const numeric = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 3600;
  }
  return Math.min(numeric, 24 * 60 * 60);
}
function resolveAppId() {
  return process.env.AGORA_APP_ID ? String(process.env.AGORA_APP_ID).trim() : '';
}

function resolveCertificate() {
  return process.env.AGORA_APP_CERTIFICATE ? String(process.env.AGORA_APP_CERTIFICATE).trim() : '';
}

export function ensureAgoraConfigured() {
  const appId = resolveAppId();
  const certificate = resolveCertificate();
  if (!appId || !certificate) {
    throw new ApplicationError('Agora credentials are not configured for this environment.', 500, {
      hint: 'Set AGORA_APP_ID and AGORA_APP_CERTIFICATE environment variables.',
    });
  }
}

export function getAgoraCredentials() {
  ensureAgoraConfigured();
  return { appId: resolveAppId(), certificate: resolveCertificate() };
}

export function getAgoraTokenTtl() {
  return parseTtl(process.env.AGORA_TOKEN_TTL);
}

export function getAgoraAppId() {
  return getAgoraCredentials().appId;
}

