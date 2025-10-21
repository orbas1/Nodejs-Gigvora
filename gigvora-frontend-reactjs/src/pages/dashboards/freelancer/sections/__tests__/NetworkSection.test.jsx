import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const mockedSection = vi.hoisted(() => vi.fn(() => 'networking-section'));

vi.mock('../networking/NetworkingSection.jsx', () => ({
  __esModule: true,
  default: mockedSection,
}));

// eslint-disable-next-line import/first
import NetworkSection from '../NetworkSection.jsx';

describe('NetworkSection', () => {
  it('re-exports the networking section implementation', () => {
    expect(NetworkSection()).toBe('networking-section');
    expect(mockedSection).toHaveBeenCalledTimes(1);
  });
});
