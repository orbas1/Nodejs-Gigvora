import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import ensureEnvLoaded from './envLoader.js';

ensureEnvLoaded({ silent: process.env.NODE_ENV === 'test' });

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'staging', 'production'])
      .default('development'),
    DB_DIALECT: z
      .enum(['mysql', 'mariadb', 'postgres', 'postgresql', 'sqlite'])
      .optional(),
    DB_URL: z.string().url().optional(),
    DB_HOST: z.string().min(1).optional(),
    DB_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    DB_USER: z.string().min(1).optional(),
    DB_PASSWORD: z.string().optional(),
    DB_NAME: z.string().min(1).optional(),
    DB_LOGGING: z
      .string()
      .transform((value) => value === 'true')
      .optional(),
    DB_STORAGE: z.string().optional(),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(500).default(10),
    DB_POOL_MIN: z.coerce.number().int().min(0).max(250).default(0),
    DB_POOL_IDLE: z.coerce.number().int().min(1000).max(600000).default(10000),
    DB_POOL_ACQUIRE: z.coerce.number().int().min(1000).max(180000).default(30000),
    DB_POOL_EVICT: z.coerce.number().int().min(1000).max(600000).default(60000),
    DB_SSL: z
      .string()
      .transform((value) => value === 'true')
      .optional(),
    DB_SSL_MODE: z.enum(['require', 'verify-ca', 'verify-full', 'prefer']).optional(),
    DB_CHARSET: z.string().optional(),
    DB_COLLATE: z.string().optional(),
  })
  .transform((data) => {
    if (data.DB_POOL_MIN > data.DB_POOL_MAX) {
      return { ...data, DB_POOL_MIN: data.DB_POOL_MAX };
    }
    return data;
  });

const parsedEnv = envSchema.parse(process.env);

const environment = parsedEnv.NODE_ENV;
const requiredConnectionKeys = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingConnectionKeys = requiredConnectionKeys.filter((key) => !parsedEnv[key]);
const hasExplicitConnection = missingConnectionKeys.length === 0;
const hasConnectionUrl = Boolean(parsedEnv.DB_URL);
const resolvedDialect =
  parsedEnv.DB_DIALECT ??
  (environment === 'test' || (!hasConnectionUrl && !hasExplicitConnection) ? 'sqlite' : 'mysql');

const poolConfig = {
  max: parsedEnv.DB_POOL_MAX,
  min: parsedEnv.DB_POOL_MIN,
  idle: parsedEnv.DB_POOL_IDLE,
  acquire: parsedEnv.DB_POOL_ACQUIRE,
  evict: parsedEnv.DB_POOL_EVICT,
};

if (poolConfig.min > poolConfig.max) {
  poolConfig.min = poolConfig.max;
}

const baseConfig = {
  dialect: resolvedDialect,
  logging: Boolean(parsedEnv.DB_LOGGING) && environment !== 'test',
  pool: poolConfig,
  define: {
    underscored: false,
    freezeTableName: false,
    ...(parsedEnv.DB_CHARSET ? { charset: parsedEnv.DB_CHARSET } : {}),
    ...(parsedEnv.DB_COLLATE ? { collate: parsedEnv.DB_COLLATE } : {}),
  },
};

if (resolvedDialect === 'sqlite') {
  const configuredStorage = parsedEnv.DB_STORAGE;
  const storagePath = configuredStorage
    ? path.resolve(process.cwd(), configuredStorage)
    : path.resolve(process.cwd(), 'tmp/test.sqlite');

  const storageDirectory = path.dirname(storagePath);
  if (!fs.existsSync(storageDirectory)) {
    fs.mkdirSync(storageDirectory, { recursive: true });
  }

  baseConfig.storage = storagePath;
  baseConfig.logging = false;
  baseConfig.pool = {
    max: 1,
    min: 0,
    idle: parsedEnv.DB_POOL_IDLE,
    acquire: parsedEnv.DB_POOL_ACQUIRE,
    evict: parsedEnv.DB_POOL_EVICT,
  };
  baseConfig.dialectOptions = {
    ...(baseConfig.dialectOptions ?? {}),
    multipleStatements: true,
  };
} else {
  if (!hasConnectionUrl && missingConnectionKeys.length > 0) {
    throw new Error(
      `Database configuration missing required values: ${missingConnectionKeys.join(', ')}`,
    );
  }

  baseConfig.username = parsedEnv.DB_USER;
  baseConfig.password = parsedEnv.DB_PASSWORD;
  baseConfig.database = parsedEnv.DB_NAME;
  baseConfig.host = parsedEnv.DB_HOST;
  if (parsedEnv.DB_PORT) {
    baseConfig.port = parsedEnv.DB_PORT;
  }

  if (parsedEnv.DB_SSL) {
    const rejectUnauthorized = parsedEnv.DB_SSL_MODE
      ? ['verify-full', 'verify-ca'].includes(parsedEnv.DB_SSL_MODE)
      : false;
    baseConfig.dialectOptions = {
      ...(baseConfig.dialectOptions ?? {}),
      ssl: {
        require: true,
        rejectUnauthorized,
      },
    };
  }
}

const connectionUri = parsedEnv.DB_URL;

const config = connectionUri ? { ...baseConfig, url: connectionUri } : baseConfig;

export default config;
