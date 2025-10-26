import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prefersReducedMotion, scrollToElement, announcePolite } from '../accessibility.js';

describe('accessibility utilities', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.body.innerHTML = '';
  });

  it('returns false for prefersReducedMotion when matchMedia is unavailable', () => {
    // eslint-disable-next-line no-undefined
    window.matchMedia = undefined;
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns matchMedia preference for prefersReducedMotion', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });

  it('scrolls with smooth behaviour by default and without focusing', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    const element = {
      scrollIntoView: vi.fn(),
      focus: vi.fn(),
      tabIndex: 0,
      getAttribute: vi.fn().mockReturnValue(null),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    };

    scrollToElement(element);

    expect(element.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    expect(element.focus).not.toHaveBeenCalled();
  });

  it('scrolls with reduced motion behaviour and focuses element when requested', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const element = {
      scrollIntoView: vi.fn(),
      focus: vi.fn(),
      tabIndex: -1,
      getAttribute: vi.fn().mockReturnValue(null),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    };

    scrollToElement(element, { focus: true, block: 'center' });

    expect(element.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'center', inline: 'nearest' });
    expect(element.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(element.setAttribute).toHaveBeenCalledWith('tabindex', '-1');
    expect(element.removeAttribute).toHaveBeenCalledWith('tabindex');
  });

  it('creates and updates a polite live region announcement', () => {
    announcePolite('Initial message');
    const region = document.getElementById('gv-global-live-region');
    expect(region).toBeTruthy();
    expect(region?.getAttribute('role')).toBe('status');
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.textContent).toBe('Initial message');

    announcePolite('Updated');
    expect(document.getElementById('gv-global-live-region')?.textContent).toBe('Updated');
  });
});
