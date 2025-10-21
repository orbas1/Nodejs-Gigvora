import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import fs from 'fs-extra';

const SUPPORTED_COLLECTIONS = [
  'projects',
  'gigs',
  'talent',
  'mentor',
  'volunteering',
  'job',
  'launchpad',
];

const DEFAULT_DATASET = Object.fromEntries(SUPPORTED_COLLECTIONS.map((key) => [key, []]));

const DATA_FILE_PATH = join(process.cwd(), 'database', 'explorerData.json');

async function ensureDataset() {
  const exists = await fs.pathExists(DATA_FILE_PATH);
  if (!exists) {
    await fs.ensureFile(DATA_FILE_PATH);
    await fs.writeJson(DATA_FILE_PATH, DEFAULT_DATASET, { spaces: 2 });
    return DEFAULT_DATASET;
  }

  const data = await fs.readJson(DATA_FILE_PATH).catch(() => null);
  if (!data || typeof data !== 'object') {
    await fs.writeJson(DATA_FILE_PATH, DEFAULT_DATASET, { spaces: 2 });
    return DEFAULT_DATASET;
  }

  const merged = { ...DEFAULT_DATASET };
  SUPPORTED_COLLECTIONS.forEach((collection) => {
    merged[collection] = Array.isArray(data[collection]) ? data[collection] : [];
  });
  return merged;
}

async function writeDataset(dataset) {
  await fs.writeJson(DATA_FILE_PATH, dataset, { spaces: 2 });
}

function assertCollection(collection) {
  if (!SUPPORTED_COLLECTIONS.includes(collection)) {
    const error = new Error(`Unsupported explorer collection: ${collection}`);
    error.status = 404;
    throw error;
  }
}

export async function listRecords(collection) {
  assertCollection(collection);
  const dataset = await ensureDataset();
  return dataset[collection];
}

export async function getRecord(collection, id) {
  const records = await listRecords(collection);
  return records.find((record) => record.id === id) ?? null;
}

export async function createRecord(collection, payload) {
  assertCollection(collection);
  const dataset = await ensureDataset();
  const records = dataset[collection];
  const now = new Date().toISOString();
  const record = {
    id: payload.id || randomUUID(),
    createdAt: payload.createdAt || now,
    updatedAt: now,
    ...payload,
  };
  record.category = payload.category || inferCategoryFromCollection(collection);
  dataset[collection] = [record, ...records.filter((existing) => existing.id !== record.id)];
  await writeDataset(dataset);
  return record;
}

export async function updateRecord(collection, id, payload) {
  assertCollection(collection);
  const dataset = await ensureDataset();
  const records = dataset[collection];
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) {
    return null;
  }
  const now = new Date().toISOString();
  const updated = {
    ...records[index],
    ...payload,
    id,
    updatedAt: now,
  };
  dataset[collection] = [...records.slice(0, index), updated, ...records.slice(index + 1)];
  await writeDataset(dataset);
  return updated;
}

export async function deleteRecord(collection, id) {
  assertCollection(collection);
  const dataset = await ensureDataset();
  const records = dataset[collection];
  const nextRecords = records.filter((record) => record.id !== id);
  const deleted = nextRecords.length !== records.length;
  if (deleted) {
    dataset[collection] = nextRecords;
    await writeDataset(dataset);
  }
  return deleted;
}

function inferCategoryFromCollection(collection) {
  switch (collection) {
    case 'projects':
      return 'project';
    case 'gigs':
      return 'gig';
    case 'talent':
      return 'talent';
    case 'mentor':
      return 'mentor';
    case 'volunteering':
      return 'volunteering';
    case 'job':
      return 'job';
    case 'launchpad':
      return 'launchpad';
    default:
      return collection;
  }
}

export default {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
};
