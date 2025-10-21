import { jest } from '@jest/globals';

const moduleUrl = new URL('../../src/middleware/errorHandler.js', import.meta.url);

describe('middleware/errorHandler', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('logs the error and sends a sanitized response payload', async () => {
    const { default: errorHandler } = await import(moduleUrl.pathname);

    const log = { error: jest.fn() };
    const err = Object.assign(new Error('Validation failed'), {
      status: 422,
      details: { field: 'email' },
      expose: true,
    });

    const json = jest.fn();
    const res = {
      headersSent: false,
      status: jest.fn().mockReturnValue({ json }),
    };

    const req = { originalUrl: '/api/profile', method: 'POST', id: 'req-123', log };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({
      message: 'Validation failed',
      requestId: 'req-123',
      details: { field: 'email' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('delegates to the default error handler when headers were already sent', async () => {
    const { default: errorHandler } = await import(moduleUrl.pathname);

    const err = new Error('Stream failure');
    const log = { error: jest.fn() };
    const res = {
      headersSent: true,
    };
    const req = { id: 'req-404', log };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(err);
  });
});
