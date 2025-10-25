#!/usr/bin/env node
import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';
import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import process from 'process';
import { fileURLToPath } from 'url';
import databaseConfig from '../src/config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_BACKUP_DIR = path.resolve(__dirname, '../backups');
const MYSQL_ENV_KEYS = ['DB_HOST', 'DB_USER', 'DB_NAME'];

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) {
        options[key] = next;
        index += 1;
      } else {
        options[key] = true;
      }
    }
  }
  return options;
}

function ensureMysqlDialect(config) {
  if (!config || !config.dialect || !['mysql', 'mariadb'].includes(config.dialect)) {
    throw new Error('Database backup utility currently supports MySQL/MariaDB configurations only.');
  }
}

function collectMissingEnvironmentVariables() {
  if (process.env.DB_URL && process.env.DB_URL.trim().length > 0) {
    return [];
  }
  return MYSQL_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

function resolveCredentials(config) {
  if (config.url) {
    const url = new URL(config.url);
    return {
      host: url.hostname,
      port: url.port ? Number.parseInt(url.port, 10) : 3306,
      username: decodeURIComponent(url.username || ''),
      password: decodeURIComponent(url.password || ''),
      database: url.pathname.replace(/^\//, ''),
    };
  }
  return {
    host: config.host || '127.0.0.1',
    port: config.port ? Number.parseInt(config.port, 10) : 3306,
    username: config.username,
    password: config.password,
    database: config.database,
  };
}

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with status ${code}`));
      }
    });
  });
}

function createCipher(encryptionKey) {
  const key = crypto.createHash('sha256').update(encryptionKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  return { cipher, iv };
}

async function writeMetadata(filePath, metadata) {
  const metaPath = `${filePath}.meta.json`;
  await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
}

async function readMetadata(filePath) {
  const metaPath = `${filePath}.meta.json`;
  const raw = await fs.readFile(metaPath, 'utf8');
  return JSON.parse(raw);
}

async function backupDatabase(options) {
  ensureMysqlDialect(databaseConfig);
  const missingEnv = collectMissingEnvironmentVariables();
  if (missingEnv.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missingEnv.join(
        ', ',
      )}. Provide DB_URL or set each variable before running the backup.`,
    );
  }
  const credentials = resolveCredentials(databaseConfig);
  if (!credentials.database || !credentials.username) {
    throw new Error('Missing database credentials. Please configure DB_NAME and DB_USER.');
  }

  const mysqldump = process.env.MYSQLDUMP_PATH || 'mysqldump';
  const outputDirectory = path.resolve(process.cwd(), options.output || DEFAULT_BACKUP_DIR);
  await ensureDirectory(outputDirectory);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = options.file || `gigvora-${credentials.database}-${timestamp}.sql.gz${options['encrypt-key'] ? '.enc' : ''}`;
  const outputPath = path.resolve(outputDirectory, fileName);

  const args = [
    '-h',
    credentials.host,
    '-P',
    String(credentials.port),
    '-u',
    credentials.username,
    '--single-transaction',
    '--routines',
    '--triggers',
    credentials.database,
  ];

  if (credentials.password) {
    args.push(`--password=${credentials.password}`);
  }

  if (options['dry-run']) {
    console.info('Database backup dry run complete.');
    console.info(`Command: ${mysqldump} ${args.join(' ')}`);
    console.info(`Output: ${outputPath}`);
    if (options['encrypt-key']) {
      console.info('Encryption: aes-256-gcm (simulated for dry run)');
    }
    console.info(
      'Set MYSQLDUMP_PATH to point at a custom binary if the default is unavailable on the host.',
    );
    return {
      outputPath,
      command: mysqldump,
      args,
    };
  }

  const dump = spawn(mysqldump, args, { stdio: ['ignore', 'pipe', 'inherit'] });
  dump.on('error', (error) => {
    console.error('mysqldump failed:', error.message);
  });
  const dumpExit = new Promise((resolve, reject) => {
    dump.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`mysqldump exited with status ${code}`));
      }
    });
  });

  const gzip = zlib.createGzip({ level: 9 });
  let sourceStream = dump.stdout.pipe(gzip);
  const metadata = {
    createdAt: new Date().toISOString(),
    database: credentials.database,
    host: credentials.host,
    port: credentials.port,
    tool: 'mysqldump',
    version: 1,
  };

  let authTagValue = null;

  if (options['encrypt-key']) {
    const { cipher, iv } = createCipher(options['encrypt-key']);
    const authTagPromise = new Promise((resolve, reject) => {
      cipher.on('end', () => {
        try {
          resolve(cipher.getAuthTag());
        } catch (error) {
          reject(error);
        }
      });
      cipher.on('error', reject);
    });
    sourceStream = sourceStream.pipe(cipher);
    metadata.encryption = {
      algorithm: 'aes-256-gcm',
      iv: iv.toString('hex'),
    };

    await Promise.all([
      pipeline(sourceStream, fssync.createWriteStream(outputPath)),
      dumpExit,
    ]);
    authTagValue = await authTagPromise;
    metadata.encryption.authTag = authTagValue.toString('hex');
  } else {
    metadata.encryption = null;
    await Promise.all([
      pipeline(sourceStream, fssync.createWriteStream(outputPath)),
      dumpExit,
    ]);
  }

  const hash = crypto.createHash('sha256');
  await pipeline(fssync.createReadStream(outputPath), hash);
  metadata.checksum = hash.digest('hex');
  const stats = await fs.stat(outputPath);
  metadata.sizeBytes = stats.size;

  await writeMetadata(outputPath, metadata);

  if (!options['encrypt-key']) {
    await runCommand('gzip', ['-t', outputPath]);
  }

  console.info(`Backup written to ${outputPath}`);
}

async function restoreDatabase(options) {
  ensureMysqlDialect(databaseConfig);
  const credentials = resolveCredentials(databaseConfig);
  if (!options.file) {
    throw new Error('Restore requires --file <path>');
  }

  const mysqlBinary = process.env.MYSQL_PATH || 'mysql';
  const inputPath = path.resolve(process.cwd(), options.file);
  if (!fssync.existsSync(inputPath)) {
    throw new Error(`Backup file not found: ${inputPath}`);
  }

  const metadata = await readMetadata(inputPath);
  const args = [
    '-h',
    credentials.host,
    '-P',
    String(credentials.port),
    '-u',
    credentials.username,
    credentials.database,
  ];
  if (credentials.password) {
    args.push(`--password=${credentials.password}`);
  }

  const mysql = spawn(mysqlBinary, args, { stdio: ['pipe', 'inherit', 'inherit'] });
  mysql.on('error', (error) => {
    console.error('mysql client failed:', error.message);
  });

  let readStream = fssync.createReadStream(inputPath);
  if (metadata.encryption) {
    if (!options['encrypt-key']) {
      throw new Error('Encrypted backup provided but --encrypt-key not supplied.');
    }
    const key = crypto.createHash('sha256').update(options['encrypt-key']).digest();
    const iv = Buffer.from(metadata.encryption.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(metadata.encryption.authTag, 'hex'));
    readStream = readStream.pipe(decipher);
  }

  const gunzip = zlib.createGunzip();
  await pipeline(readStream.pipe(gunzip), mysql.stdin);

  await new Promise((resolve, reject) => {
    mysql.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`mysql exited with status ${code}`));
      }
    });
  });

  console.info(`Restore completed for ${credentials.database}`);
}

async function verifyBackup(options) {
  if (!options.file) {
    throw new Error('verify requires --file <path>');
  }
  const inputPath = path.resolve(process.cwd(), options.file);
  if (!fssync.existsSync(inputPath)) {
    throw new Error(`Backup file not found: ${inputPath}`);
  }
  const metadata = await readMetadata(inputPath);
  const fileBuffer = await fs.readFile(inputPath);
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  console.info(
    JSON.stringify(
      {
        status: 'ok',
        path: inputPath,
        sizeBytes: fssync.statSync(inputPath).size,
        checksum,
        metadata,
      },
      null,
      2,
    ),
  );
}

async function main() {
  const [action, ...rest] = process.argv.slice(2);
  if (!action) {
    console.error('Usage: node scripts/databaseBackup.js <backup|restore|verify> [options]');
    process.exitCode = 1;
    return;
  }

  const options = parseArgs(rest);
  try {
    if (action === 'backup') {
      await backupDatabase(options);
    } else if (action === 'restore') {
      await restoreDatabase(options);
    } else if (action === 'verify') {
      await verifyBackup(options);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

await main();
