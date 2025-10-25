import { jest } from '@jest/globals';

const modulePath = (relativePath) => new URL(relativePath, import.meta.url).pathname;

describe('schemaIntrospectionService', () => {
  let inspectSchemaRedundancies;
  let mockQueryInterface;
  let mockLogger;

  beforeEach(async () => {
    jest.resetModules();
    mockQueryInterface = {
      showAllTables: jest.fn().mockResolvedValue(['alpha_members', 'beta_members', 'audit_log']),
      describeTable: jest.fn((table) => {
        if (table === 'alpha_members') {
          return Promise.resolve({ userId: {}, groupId: {}, createdAt: {} });
        }
        if (table === 'beta_members') {
          return Promise.resolve({ userId: {}, groupId: {}, metadata: {} });
        }
        return Promise.resolve({ id: {}, message: {}, createdAt: {} });
      }),
      showIndex: jest.fn().mockResolvedValue([]),
    };

    mockLogger = {
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
    };

    jest.unstable_mockModule(modulePath('../../models/index.js'), () => ({
      default: {
        sequelize: {
          getQueryInterface: () => mockQueryInterface,
        },
      },
    }));

    jest.unstable_mockModule(modulePath('../../utils/logger.js'), () => ({
      default: mockLogger,
    }));

    ({ inspectSchemaRedundancies } = await import(modulePath('../schemaIntrospectionService.js')));
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('identifies duplicate join tables by foreign key signature', async () => {
    const result = await inspectSchemaRedundancies({ logger: mockLogger });

    expect(mockQueryInterface.showAllTables).toHaveBeenCalled();
    expect(result.joinTables).toHaveLength(2);
    expect(result.duplicateJoinTables).toEqual([
      {
        signature: 'group|user',
        tables: ['alpha_members', 'beta_members'],
        columns: ['userId', 'groupId'],
      },
    ]);
  });

  test('logs warnings when metadata inspection fails', async () => {
    mockQueryInterface.describeTable.mockRejectedValueOnce(new Error('boom'));

    const result = await inspectSchemaRedundancies({ logger: mockLogger });

    expect(mockLogger.warn).toHaveBeenCalled();
    expect(result.tables.length).toBeGreaterThan(0);
  });
});
