process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const modulePath = new URL('../../src/config/database.js', import.meta.url).pathname;

const DB_KEYS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_URL',
  'DB_DIALECT',
  'DB_STORAGE',
  'DB_LOGGING',
  'DB_POOL_MAX',
  'DB_POOL_MIN',
  'DB_POOL_IDLE',
  'DB_POOL_ACQUIRE',
  'DB_POOL_EVICT',
  'DB_SSL',
  'DB_SSL_MODE',
  'DB_CHARSET',
  'DB_COLLATE',
  'NODE_ENV',
];

async function importDatabaseConfig(envOverrides) {
  const keys = new Set([...DB_KEYS, ...Object.keys(envOverrides ?? {})]);
  const original = {};
  keys.forEach((key) => {
    original[key] = process.env[key];
  });

  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(envOverrides, key)) {
      const value = envOverrides[key];
      if (value === undefined || value === null) {
        delete process.env[key];
      } else {
        process.env[key] = String(value);
      }
    } else {
      delete process.env[key];
    }
  });

  try {
    const module = await import(`${modulePath}?t=${Date.now()}-${Math.random()}`);
    return module.default;
  } finally {
    keys.forEach((key) => {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    });
  }
}

describe('database configuration', () => {
  test('provides sqlite configuration during tests', async () => {
    const config = await importDatabaseConfig({
      NODE_ENV: 'test',
      DB_DIALECT: 'sqlite',
      DB_STORAGE: 'tmp/test-db.sqlite',
    });

    expect(config.dialect).toBe('sqlite');
    expect(config.storage).toMatch(/tmp\/test-db\.sqlite$/);
    expect(config.pool.max).toBe(1);
    expect(config.logging).toBe(false);
  });

  test('throws when mandatory mysql credentials are missing', async () => {
    await expect(
      importDatabaseConfig({
        NODE_ENV: 'production',
        DB_DIALECT: 'mysql',
      }),
    ).rejects.toThrow(/Database configuration missing required values/);
  });

  test('prefers connection url when provided', async () => {
    const config = await importDatabaseConfig({
      NODE_ENV: 'production',
      DB_URL: 'mysql://user:pass@localhost:3306/gigvora',
      DB_DIALECT: 'mysql',
    });

    expect(config.url).toBe('mysql://user:pass@localhost:3306/gigvora');
    expect(config.dialect).toBe('mysql');
    expect(config.username).toBeUndefined();
  });
});
