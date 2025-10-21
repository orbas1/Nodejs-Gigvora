import { describe, expect, it, vi } from 'vitest';
import { humanFileSize, readFileAsBase64 } from './file.js';

function createMockFileReader(result, shouldError = false) {
  const listeners = {};
  return class {
    constructor() {
      this.result = result;
      this.error = shouldError ? new Error('read failure') : null;
    }

    addEventListener(event, callback) {
      listeners[event] = callback;
    }

    readAsDataURL() {
      setTimeout(() => {
        if (shouldError) {
          listeners.error?.(this.error);
        } else {
          listeners.load?.({ target: this });
          this.onload?.({ target: this });
        }
      }, 0);
    }

    set onload(callback) {
      listeners.load = callback;
    }

    set onerror(callback) {
      listeners.error = callback;
    }
  };
}

describe('humanFileSize', () => {
  it('returns a readable size for bytes', () => {
    expect(humanFileSize(500)).toBe('500 B');
    expect(humanFileSize(1536)).toBe('1.5 KB');
    expect(humanFileSize(1048576)).toBe('1.0 MB');
  });

  it('handles invalid input gracefully', () => {
    expect(humanFileSize(null)).toBe('0 B');
    expect(humanFileSize('abc')).toBe('0 B');
  });
});

describe('readFileAsBase64', () => {
  it('resolves with the base64 payload when FileReader succeeds', async () => {
    vi.stubGlobal('FileReader', createMockFileReader('data:text/plain;base64,SGVsbG8='));

    const result = await readFileAsBase64({ name: 'file.txt' });

    expect(result).toBe('SGVsbG8=');

    vi.unstubAllGlobals();
  });

  it('rejects when FileReader fails', async () => {
    vi.stubGlobal('FileReader', createMockFileReader(null, true));

    await expect(readFileAsBase64({ name: 'file.txt' })).rejects.toThrow('read failure');

    vi.unstubAllGlobals();
  });
});
