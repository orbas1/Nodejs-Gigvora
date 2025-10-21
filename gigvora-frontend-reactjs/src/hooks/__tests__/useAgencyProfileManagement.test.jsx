import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAgencyProfileManagement from '../useAgencyProfileManagement.js';

const fetchAgencyProfileManagement = vi.fn();
const updateAgencyProfileBasics = vi.fn();
const createAgencyProfileMedia = vi.fn();

let removeCache;
let refresh;

vi.mock('../useCachedResource.js', () => ({
  __esModule: true,
  default: () => {
    refresh = vi.fn();
    return { data: { profile: {} }, loading: false, error: null, refresh };
  },
}));

vi.mock('../../services/apiClient.js', () => ({
  apiClient: {
    removeCache: (...args) => {
      if (!removeCache) {
        removeCache = vi.fn();
      }
      return removeCache(...args);
    },
  },
}));

vi.mock('../../services/agency.js', () => ({
  fetchAgencyProfileManagement: (...args) => fetchAgencyProfileManagement(...args),
  updateAgencyProfileBasics: (...args) => updateAgencyProfileBasics(...args),
  createAgencyProfileMedia: (...args) => createAgencyProfileMedia(...args),
  updateAgencyProfileMedia: vi.fn(),
  deleteAgencyProfileMedia: vi.fn(),
  createAgencyProfileSkill: vi.fn(),
  updateAgencyProfileSkill: vi.fn(),
  deleteAgencyProfileSkill: vi.fn(),
  createAgencyProfileCredential: vi.fn(),
  updateAgencyProfileCredential: vi.fn(),
  deleteAgencyProfileCredential: vi.fn(),
  createAgencyProfileExperience: vi.fn(),
  updateAgencyProfileExperience: vi.fn(),
  deleteAgencyProfileExperience: vi.fn(),
  createAgencyProfileWorkforceSegment: vi.fn(),
  updateAgencyProfileWorkforceSegment: vi.fn(),
  deleteAgencyProfileWorkforceSegment: vi.fn(),
}));

describe('useAgencyProfileManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateAgencyProfileBasics.mockResolvedValue({ success: true });
    createAgencyProfileMedia.mockResolvedValue({ id: 'media-1' });
  });

  it('runs updates and clears the cache', async () => {
    const { result } = renderHook(() => useAgencyProfileManagement());

    await act(async () => {
      await result.current.updateBasics({ tagline: 'We build teams' });
    });
    expect(updateAgencyProfileBasics).toHaveBeenCalledWith({ tagline: 'We build teams' });
    expect(removeCache).toHaveBeenCalledWith('agency:profile:management');
    expect(refresh).toHaveBeenCalledWith({ force: true });

    await act(async () => {
      await result.current.createMedia({ url: 'https://cdn.example.com/logo.png' });
    });
    expect(createAgencyProfileMedia).toHaveBeenCalledWith({ url: 'https://cdn.example.com/logo.png' });
  });
});
