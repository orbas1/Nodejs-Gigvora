import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InboxProvider, useInbox } from '../InboxProvider.jsx';

const controller = {
  state: { threads: [{ id: 't-1' }] },
  actions: {},
};

vi.mock('../useInboxController.js', () => ({
  __esModule: true,
  default: vi.fn(() => controller),
}));

describe('InboxProvider', () => {
  it('throws an error when useInbox is used outside the provider', () => {
    expect(() => renderHook(() => useInbox())).toThrow('useInbox must be used within an InboxProvider.');
  });

  it('provides the inbox controller to descendants', () => {
    const { result } = renderHook(() => useInbox(), {
      wrapper: ({ children }) => <InboxProvider>{children}</InboxProvider>,
    });

    expect(result.current).toBe(controller);
  });
});
