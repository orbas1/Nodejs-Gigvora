import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import fs from 'fs-extra';
import { getExplorerCollections } from '../utils/explorerCollections.js';

const SUPPORTED_COLLECTIONS = getExplorerCollections();

const DEFAULT_DATASET = Object.fromEntries(
  SUPPORTED_COLLECTIONS.map((collection) => [collection, Object.create(null)]),
);

function cloneDataset(dataset) {
  return JSON.parse(JSON.stringify(dataset));
}

const DATA_FILE_PATH = join(process.cwd(), 'database', 'explorerEngagements.json');

async function ensureDataset() {
  const exists = await fs.pathExists(DATA_FILE_PATH);
  if (!exists) {
    await fs.ensureFile(DATA_FILE_PATH);
    await fs.writeJson(DATA_FILE_PATH, DEFAULT_DATASET, { spaces: 2 });
    return cloneDataset(DEFAULT_DATASET);
  }

  const data = await fs.readJson(DATA_FILE_PATH).catch(() => null);
  if (!data || typeof data !== 'object') {
    await fs.writeJson(DATA_FILE_PATH, DEFAULT_DATASET, { spaces: 2 });
    return cloneDataset(DEFAULT_DATASET);
  }

  const merged = cloneDataset(DEFAULT_DATASET);
  SUPPORTED_COLLECTIONS.forEach((collection) => {
    const bucket = data[collection];
    merged[collection] = bucket && typeof bucket === 'object' ? { ...bucket } : {};
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

function getRecordInteractions(dataset, collection, recordId) {
  const bucket = dataset[collection];
  if (!bucket[recordId]) {
    bucket[recordId] = [];
  }
  return bucket[recordId];
}

export async function listInteractions(collection, recordId) {
  assertCollection(collection);
  const dataset = await ensureDataset();
  const bucket = dataset[collection];
  const interactions = bucket?.[recordId];
  return Array.isArray(interactions)
    ? [...interactions].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    : [];
}

export async function getInteraction(collection, recordId, interactionId) {
  const interactions = await listInteractions(collection, recordId);
  return interactions.find((interaction) => interaction.id === interactionId) ?? null;
}

export async function createInteraction(collection, recordId, payload) {
  assertCollection(collection);
  const dataset = await ensureDataset();
  const interactions = getRecordInteractions(dataset, collection, recordId);
  const now = new Date().toISOString();
  const interaction = {
    id: payload.id || randomUUID(),
    recordId,
    categoryCollection: collection,
    createdAt: now,
    updatedAt: now,
    status: payload.status ?? 'new',
    ...payload,
  };
  interactions.unshift(interaction);
  await writeDataset(dataset);
  return interaction;
}

export async function updateInteraction(collection, recordId, interactionId, payload) {
  assertCollection(collection);
  const dataset = await ensureDataset();
  const interactions = getRecordInteractions(dataset, collection, recordId);
  const index = interactions.findIndex((interaction) => interaction.id === interactionId);
  if (index === -1) {
    return null;
  }
  const now = new Date().toISOString();
  const updated = {
    ...interactions[index],
    ...payload,
    id: interactionId,
    updatedAt: now,
  };
  interactions.splice(index, 1, updated);
  await writeDataset(dataset);
  return updated;
}

export async function deleteInteraction(collection, recordId, interactionId) {
  assertCollection(collection);
  const dataset = await ensureDataset();
  const interactions = getRecordInteractions(dataset, collection, recordId);
  const next = interactions.filter((interaction) => interaction.id !== interactionId);
  const deleted = next.length !== interactions.length;
  if (deleted) {
    dataset[collection][recordId] = next;
    await writeDataset(dataset);
  }
  return deleted;
}

export default {
  listInteractions,
  getInteraction,
  createInteraction,
  updateInteraction,
  deleteInteraction,
};
