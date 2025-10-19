'use strict';

const { z } = require('zod');

require('dotenv').config();

const schema = z.object({
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  DB_STORAGE: z.string().optional(),
  DB_DIALECT: z.enum(['mysql', 'mariadb', 'postgres', 'postgresql', 'sqlite']).optional(),
  DB_URL: z.string().url().optional(),
});

const env = schema.parse(process.env);

const common = {
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: env.DB_DIALECT ?? 'mysql',
};

const sqliteStorage = env.DB_STORAGE || ':memory:';

module.exports = {
  development: common,
  production: env.DB_URL
    ? { url: env.DB_URL, dialect: (env.DB_DIALECT ?? 'mysql') }
    : common,
  test: {
    dialect: 'sqlite',
    storage: sqliteStorage,
    logging: false,
  },
};
