import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { webcrypto, randomUUID } from 'node:crypto';

beforeAll(() => {
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: webcrypto,
    });
  } else if (!globalThis.crypto.randomUUID && typeof randomUUID === 'function') {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      configurable: true,
      value: randomUUID,
    });
  }

  if (!globalThis.matchMedia) {
    Object.defineProperty(globalThis, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  if (!globalThis.IntersectionObserver) {
    class MockIntersectionObserver {
      constructor(callback = () => {}) {
        this.callback = callback;
        this.observe = vi.fn((target) => {
          this.callback([{ isIntersecting: false, target }], this);
        });
        this.unobserve = vi.fn();
        this.disconnect = vi.fn();
        this.takeRecords = vi.fn(() => []);
      }
    }

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: MockIntersectionObserver,
    });
  }

  if (!globalThis.ResizeObserver) {
    class MockResizeObserver {
      constructor(callback = () => {}) {
        this.callback = callback;
        this.observe = vi.fn((target) => {
          this.callback([{ target, contentRect: target?.getBoundingClientRect?.() }], this);
        });
        this.unobserve = vi.fn();
        this.disconnect = vi.fn();
      }
    }

    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    });
  }

  if (!globalThis.URL.createObjectURL) {
    Object.defineProperty(globalThis.URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:mock-url'),
    });
  }

  if (!globalThis.URL.revokeObjectURL) {
    Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
  }
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
