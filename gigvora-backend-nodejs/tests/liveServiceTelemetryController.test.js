import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';
process.env.LIVE_TELEMETRY_TOKEN = 'shared-token';

const sampleLiveServiceTelemetry = jest.fn();

jest.unstable_mockModule('../src/services/liveServiceTelemetryService.js', () => ({
  sampleLiveServiceTelemetry,
}));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../src/controllers/liveServiceTelemetryController.js');
  ({ AuthorizationError, ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  sampleLiveServiceTelemetry.mockReset();
});

describe('liveServiceTelemetryController.getLiveServiceTelemetry', () => {
  it('rejects unauthorised callers', async () => {
    await expect(controller.getLiveServiceTelemetry({ query: {} }, {})).rejects.toThrow(AuthorizationError);
    expect(sampleLiveServiceTelemetry).not.toHaveBeenCalled();
  });

  it('accepts internal tokens', async () => {
    sampleLiveServiceTelemetry.mockResolvedValue({ status: 'ok' });
    const res = { json: jest.fn() };

    await controller.getLiveServiceTelemetry(
      { query: { windowMinutes: '800', forceRefresh: 'true' }, headers: { 'x-internal-token': 'shared-token' } },
      res,
    );

    expect(sampleLiveServiceTelemetry).toHaveBeenCalledWith({ windowMinutes: 240, forceRefresh: true });
    expect(res.json).toHaveBeenCalledWith({ telemetry: { status: 'ok' } });
  });

  it('validates booleans', async () => {
    await expect(
      controller.getLiveServiceTelemetry(
        { query: { forceRefresh: 'nope' }, headers: { 'x-internal-token': 'shared-token' } },
        {},
      ),
    ).rejects.toThrow(ValidationError);
  });
});
