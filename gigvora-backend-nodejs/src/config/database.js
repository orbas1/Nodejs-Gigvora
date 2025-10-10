import dotenv from 'dotenv';

dotenv.config();

const environment = process.env.NODE_ENV ?? 'development';
const dialect = process.env.DB_DIALECT ?? (environment === 'test' ? 'sqlite' : 'mysql');

const baseConfig = {
  dialect,
  logging: process.env.DB_LOGGING === 'true' && environment !== 'test',
  pool: {
    max: Number.parseInt(process.env.DB_POOL_MAX ?? '10', 10),
    min: Number.parseInt(process.env.DB_POOL_MIN ?? '0', 10),
    idle: Number.parseInt(process.env.DB_POOL_IDLE ?? '10000', 10),
    acquire: Number.parseInt(process.env.DB_POOL_ACQUIRE ?? '30000', 10),
  },
  define: {
    underscored: false,
    freezeTableName: false,
  },
};

if (dialect === 'sqlite') {
  baseConfig.storage = process.env.DB_STORAGE ?? ':memory:';
  baseConfig.logging = false;
} else {
  baseConfig.username = process.env.DB_USER;
  baseConfig.password = process.env.DB_PASSWORD;
  baseConfig.database = process.env.DB_NAME;
  baseConfig.host = process.env.DB_HOST;
  if (process.env.DB_PORT) {
    baseConfig.port = Number.parseInt(process.env.DB_PORT, 10);
  }

  if (process.env.DB_SSL === 'true') {
    baseConfig.dialectOptions = {
      ...(baseConfig.dialectOptions ?? {}),
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }
}

const connectionUri = process.env.DB_URL;

const config = connectionUri ? { ...baseConfig, url: connectionUri } : baseConfig;

export default config;
