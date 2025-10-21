import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsIndexPath = path.resolve(__dirname, '../../src/models/index.js');
await jest.unstable_mockModule(modelsIndexPath, () => ({}));

const rtcBuildTokenWithAccount = jest.fn();
const rtmBuildToken = jest.fn();

await jest.unstable_mockModule('agora-access-token', () => ({
  default: {
    RtcTokenBuilder: { buildTokenWithAccount: rtcBuildTokenWithAccount },
    RtmTokenBuilder: { buildToken: rtmBuildToken },
    RtcRole: { SUBSCRIBER: 'subscriber', PUBLISHER: 'publisher' },
    RtmRole: { Rtm_User: 'rtm_user' },
  },
}));

const agoraConfigPath = path.resolve(__dirname, '../../src/config/agora.js');
const getAgoraCredentials = jest.fn(() => ({ appId: 'app123', certificate: 'secretCert' }));
const getAgoraTokenTtl = jest.fn(() => 3600);
await jest.unstable_mockModule(agoraConfigPath, () => ({ getAgoraCredentials, getAgoraTokenTtl }));

const serviceModulePath = path.resolve(__dirname, '../../src/services/agoraService.js');
const { createRtcToken, createRtmToken, createCallTokens, getDefaultAgoraExpiry } = await import(serviceModulePath);

const { ApplicationError } = await import('../../src/utils/errors.js');

describe('agoraService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00Z'));
    rtcBuildTokenWithAccount.mockReset().mockReturnValue('rtcToken');
    rtmBuildToken.mockReset().mockReturnValue('rtmToken');
    getAgoraCredentials.mockClear().mockReturnValue({ appId: 'app123', certificate: 'secretCert' });
    getAgoraTokenTtl.mockClear().mockReturnValue(3600);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates RTC tokens with resolved roles and expiration', () => {
    const token = createRtcToken({ channelName: 'stage', identity: 'user-1', role: 'audience', expireSeconds: 600 });

    expect(getAgoraCredentials).toHaveBeenCalled();
    expect(rtcBuildTokenWithAccount).toHaveBeenCalledWith(
      'app123',
      'secretCert',
      'stage',
      'user-1',
      'subscriber',
      expect.any(Number),
    );
    expect(token).toBe('rtcToken');
  });

  it('creates RTM token with default ttl when expiration not provided', () => {
    const token = createRtmToken({ identity: 'agent-2' });

    expect(getAgoraTokenTtl).toHaveBeenCalled();
    expect(rtmBuildToken).toHaveBeenCalledWith('app123', 'secretCert', 'agent-2', 'rtm_user', expect.any(Number));
    expect(token).toBe('rtmToken');
  });

  it('returns combined call tokens and metadata snapshot', () => {
    rtcBuildTokenWithAccount.mockReturnValue('rtc');
    rtmBuildToken.mockReturnValue('rtm');
    const payload = createCallTokens({ channelName: 'support', identity: 42, role: 'publisher', expireSeconds: 1200 });

    expect(payload).toMatchObject({
      appId: 'app123',
      rtcToken: 'rtc',
      rtmToken: 'rtm',
      identity: '42',
      expiresIn: 1200,
    });
    expect(new Date(payload.expiresAt).toISOString()).toBe(payload.expiresAt);
  });

  it('throws application errors when channel or identity is missing', () => {
    expect(() => createRtcToken({ channelName: '', identity: 'abc' })).toThrow(ApplicationError);
    expect(() => createRtcToken({ channelName: 'stage' })).toThrow(ApplicationError);
  });

  it('exposes default ttl helper', () => {
    expect(getDefaultAgoraExpiry()).toBe(3600);
  });
});

