import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError } from '../../utils/errors.js';

const modelsModule = new URL('../models/index.js', import.meta.url).pathname;

const mockUserModel = { findByPk: jest.fn() };
const mockPreferenceModel = {
  findOne: jest.fn(),
  findOrCreate: jest.fn(),
};

let getUserNavigationPreferences;
let updateUserNavigationPreferences;

function resetMocks() {
  mockUserModel.findByPk.mockReset();
  mockPreferenceModel.findOne.mockReset();
  mockPreferenceModel.findOrCreate.mockReset();
}

describe('userNavigationPreferenceService', () => {
  beforeEach(async () => {
    jest.resetModules();
    resetMocks();

    await jest.unstable_mockModule(modelsModule, () => ({
      User: mockUserModel,
      UserDashboardNavigationPreference: mockPreferenceModel,
    }));

    ({
      getUserNavigationPreferences,
      updateUserNavigationPreferences,
    } = await import('../userNavigationPreferenceService.js'));
  });

  it('returns default preferences when none are stored', async () => {
    mockPreferenceModel.findOne.mockResolvedValue(null);

    const result = await getUserNavigationPreferences(42, { dashboardKey: 'Company ' });

    expect(mockPreferenceModel.findOne).toHaveBeenCalledWith({
      where: { userId: 42, dashboardKey: 'company' },
    });
    expect(result).toEqual({
      dashboardKey: 'company',
      collapsed: false,
      order: [],
      hidden: [],
      pinned: [],
    });
  });

  it('throws NotFoundError when updating preferences for a missing user', async () => {
    mockUserModel.findByPk.mockResolvedValue(null);

    await expect(updateUserNavigationPreferences(77, {})).rejects.toMatchObject({ name: 'NotFoundError' });
    expect(mockUserModel.findByPk).toHaveBeenCalledWith(77);
    expect(mockPreferenceModel.findOrCreate).not.toHaveBeenCalled();
  });

  it('creates preferences with sanitized payloads', async () => {
    const storedRecord = {
      toPublicObject: jest.fn(() => ({
        dashboardKey: 'company',
        collapsed: true,
        order: ['overview', 'timeline'],
        hidden: ['timeline'],
        pinned: [],
      })),
    };

    mockUserModel.findByPk.mockResolvedValue({ id: 77 });
    mockPreferenceModel.findOrCreate.mockResolvedValue([storedRecord, true]);

    const result = await updateUserNavigationPreferences(77, {
      dashboardKey: ' Company ',
      collapsed: 'true',
      order: [' overview ', 'overview', 'timeline'],
      hidden: ['timeline', null, ''],
      pinned: undefined,
    });

    expect(mockPreferenceModel.findOrCreate).toHaveBeenCalledWith({
      where: { userId: 77, dashboardKey: 'company' },
      defaults: {
        userId: 77,
        dashboardKey: 'company',
        collapsed: true,
        order: ['overview', 'timeline'],
        hidden: ['timeline'],
        pinned: [],
      },
    });

    expect(result).toEqual({
      dashboardKey: 'company',
      collapsed: true,
      order: ['overview', 'timeline'],
      hidden: ['timeline'],
      pinned: [],
    });
  });

  it('updates existing preferences and reloads persisted state', async () => {
    const record = {
      set: jest.fn(),
      save: jest.fn(),
      reload: jest.fn().mockResolvedValue({
        toPublicObject: jest.fn(() => ({
          dashboardKey: 'agency',
          collapsed: false,
          order: ['pipeline'],
          hidden: [],
          pinned: ['pipeline'],
        })),
      }),
    };

    mockUserModel.findByPk.mockResolvedValue({ id: 91 });
    mockPreferenceModel.findOrCreate.mockResolvedValue([record, false]);

    const result = await updateUserNavigationPreferences(91, {
      dashboardKey: 'Agency',
      collapsed: 0,
      order: ['pipeline'],
      hidden: [],
      pinned: ['pipeline'],
    });

    expect(record.set).toHaveBeenCalledWith({
      collapsed: false,
      order: ['pipeline'],
      hidden: [],
      pinned: ['pipeline'],
      dashboardKey: 'agency',
    });
    expect(record.save).toHaveBeenCalledTimes(1);
    expect(record.reload).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      dashboardKey: 'agency',
      collapsed: false,
      order: ['pipeline'],
      hidden: [],
      pinned: ['pipeline'],
    });
  });
});
