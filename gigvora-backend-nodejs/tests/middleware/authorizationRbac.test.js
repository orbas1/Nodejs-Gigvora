import { jest } from '@jest/globals';
import {
  extractMemberships,
  requireMembership,
  hasProjectManagementAccess,
} from '../../src/middleware/authorization.js';

describe('authorization middleware utilities', () => {
  function createResponse() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  }

  it('extracts memberships from headers and request context', () => {
    const reqFromHeaders = {
      headers: { 'x-gigvora-memberships': 'mentor,volunteer' },
    };
    expect(extractMemberships(reqFromHeaders)).toEqual(['mentor', 'volunteer']);

    const reqFromUser = {
      user: {
        memberships: [
          { role: 'Mentor' },
          { role: 'Volunteer' },
          { role: 'Volunteer' },
        ],
      },
    };
    expect(extractMemberships(reqFromUser)).toEqual(['mentor', 'volunteer']);
  });

  it('enforces membership access requirements', () => {
    const middleware = requireMembership(['mentor']);
    const res = createResponse();
    const next = jest.fn();

    middleware(
      {
        headers: { 'x-gigvora-memberships': 'mentor' },
      },
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith();

    const forbiddenRes = createResponse();
    const forbiddenNext = jest.fn();
    middleware({ headers: { 'x-gigvora-memberships': 'guest' } }, forbiddenRes, forbiddenNext);

    expect(forbiddenRes.status).toHaveBeenCalledWith(403);
    expect(forbiddenRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'volunteer_membership_required' }),
    );
    expect(forbiddenNext).not.toHaveBeenCalled();
  });

  it('detects project management access based on aggregated roles', () => {
    const req = {
      user: {
        roles: ['Company_Admin'],
        memberships: ['operations_lead'],
      },
    };
    expect(hasProjectManagementAccess(req)).toBe(true);

    const noAccessReq = { user: { roles: ['viewer'] } };
    expect(hasProjectManagementAccess(noAccessReq)).toBe(false);
  });
});
