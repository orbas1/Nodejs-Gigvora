import { describe, it, expect } from 'vitest';
import { resolveAccessControl } from '../ProjectWorkspaceModule.jsx';

describe('resolveAccessControl', () => {
  it('returns fallback when access control is undefined', () => {
    expect(resolveAccessControl(undefined)).toEqual({ allowed: true, reason: null });
  });

  it('honours boolean values', () => {
    expect(resolveAccessControl(false, { defaultReason: 'Denied' })).toEqual({ allowed: false, reason: 'Denied' });
    expect(resolveAccessControl(true)).toEqual({ allowed: true, reason: null });
  });

  it('parses string descriptors', () => {
    expect(resolveAccessControl('manage')).toEqual({ allowed: true, reason: null });
    expect(resolveAccessControl('read', { defaultReason: 'View only' })).toEqual({
      allowed: false,
      reason: 'View only',
    });
  });

  it('detects permissions from arrays', () => {
    expect(resolveAccessControl(['view', 'manage'])).toEqual({ allowed: true, reason: null });
    expect(resolveAccessControl(['read', 'none'], { defaultReason: 'No edit rights' })).toEqual({
      allowed: false,
      reason: 'No edit rights',
    });
  });

  it('evaluates object based access control', () => {
    expect(
      resolveAccessControl(
        { canManage: false, reason: 'Only workspace owners can edit.' },
        { defaultReason: 'Denied' },
      ),
    ).toEqual({ allowed: false, reason: 'Only workspace owners can edit.' });
    expect(resolveAccessControl({ mode: 'write' })).toEqual({ allowed: true, reason: null });
  });
});
