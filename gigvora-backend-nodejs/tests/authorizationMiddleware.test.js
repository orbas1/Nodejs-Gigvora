import { jest } from '@jest/globals';
import { requireUserType } from '../src/middleware/authorization.js';

describe('requireUserType middleware', () => {
  function buildResponse() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  }

  it('allows request when req.user carries an allowed type', () => {
    const middleware = requireUserType(['admin']);
    const req = { user: { userType: 'admin' } };
    const res = buildResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows request when header provides an allowed role', () => {
    const middleware = requireUserType(['admin']);
    const req = { headers: { 'x-user-type': 'ADMIN' } };
    const res = buildResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('denies requests when no allowed role present', () => {
    const middleware = requireUserType(['admin']);
    const req = { headers: { 'x-user-type': 'freelancer' } };
    const res = buildResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Only authorised administrators') }),
    );
  });
});
