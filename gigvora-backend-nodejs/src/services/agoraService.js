import agoraTokenBuilder from 'agora-access-token';
import { getAgoraCredentials, getAgoraTokenTtl } from '../config/agora.js';
import { ApplicationError } from '../utils/errors.js';

const { RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole } = agoraTokenBuilder;

function resolveExpiration(expireSeconds, explicit) {
  if (Number.isInteger(explicit) && explicit > 0) {
    return explicit;
  }
  const ttl = Number.isFinite(expireSeconds) && expireSeconds > 0 ? expireSeconds : getAgoraTokenTtl();
  return Math.floor(Date.now() / 1000) + ttl;
}

function resolveRtcRole(role) {
  const normalized = String(role ?? '').toLowerCase();
  if (normalized === 'audience' || normalized === 'subscriber') {
    return RtcRole.SUBSCRIBER;
  }
  return RtcRole.PUBLISHER;
}

export function createRtcToken({
  channelName,
  identity,
  role = 'publisher',
  expireSeconds = getAgoraTokenTtl(),
  expirationTimestamp,
}) {
  if (!channelName) {
    throw new ApplicationError('Agora channel name is required to generate a token.');
  }
  if (!identity) {
    throw new ApplicationError('Agora identity is required to generate a token.');
  }

  const { appId, certificate } = getAgoraCredentials();
  const expiresAt = resolveExpiration(expireSeconds, expirationTimestamp);

  return RtcTokenBuilder.buildTokenWithAccount(
    appId,
    certificate,
    channelName,
    String(identity),
    resolveRtcRole(role),
    expiresAt,
  );
}

export function createRtmToken({ identity, expireSeconds = getAgoraTokenTtl(), expirationTimestamp }) {
  if (!identity) {
    throw new ApplicationError('Agora identity is required to generate an RTM token.');
  }

  const { appId, certificate } = getAgoraCredentials();
  const expiresAt = resolveExpiration(expireSeconds, expirationTimestamp);

  return RtmTokenBuilder.buildToken(appId, certificate, String(identity), RtmRole.Rtm_User, expiresAt);
}

export function createCallTokens({ channelName, identity, role = 'publisher', expireSeconds = getAgoraTokenTtl() }) {
  const { appId, certificate } = getAgoraCredentials();
  const expirationTimestamp = resolveExpiration(expireSeconds);
  const rtcToken = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    certificate,
    channelName,
    String(identity),
    resolveRtcRole(role),
    expirationTimestamp,
  );
  const rtmToken = RtmTokenBuilder.buildToken(
    appId,
    certificate,
    String(identity),
    RtmRole.Rtm_User,
    expirationTimestamp,
  );

  return {
    appId,
    rtcToken,
    rtmToken,
    expiresAt: new Date(expirationTimestamp * 1000).toISOString(),
    expiresIn: Number.isFinite(expireSeconds) && expireSeconds > 0 ? expireSeconds : getAgoraTokenTtl(),
    identity: String(identity),
  };
}

export function getDefaultAgoraExpiry() {
  return getAgoraTokenTtl();
}

