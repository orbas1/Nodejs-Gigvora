import { randomUUID } from 'node:crypto';
import { ExplorerInteraction } from '../models/index.js';
import { getExplorerCollections, inferExplorerCategoryFromCollection } from '../utils/explorerCollections.js';

const SUPPORTED_COLLECTIONS = getExplorerCollections();

function assertCollection(collection) {
  if (!SUPPORTED_COLLECTIONS.includes(collection)) {
    const error = new Error(`Unsupported explorer collection: ${collection}`);
    error.status = 404;
    throw error;
  }
}

function normaliseAttachments(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry == null ? null : `${entry}`.trim()))
      .filter((entry) => entry && entry.length);
  }
  if (typeof value === 'string' && value.trim().length) {
    return value
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length);
  }
  return [];
}

function coerceNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function applyInteractionAttributes(interaction, payload = {}) {
  if ('type' in payload) interaction.type = payload.type;
  if ('name' in payload) interaction.name = payload.name;
  if ('email' in payload) interaction.email = payload.email;
  if ('phone' in payload) interaction.phone = payload.phone ?? null;
  if ('company' in payload) interaction.company = payload.company ?? null;
  if ('headline' in payload) interaction.headline = payload.headline ?? null;
  if ('message' in payload) interaction.message = payload.message;
  if ('budgetAmount' in payload) interaction.budgetAmount = coerceNumber(payload.budgetAmount);
  if ('budgetCurrency' in payload) interaction.budgetCurrency = payload.budgetCurrency ?? null;
  if ('availability' in payload) interaction.availability = payload.availability ?? null;
  if ('startDate' in payload) interaction.startDate = payload.startDate ?? null;
  if ('attachments' in payload) interaction.attachments = normaliseAttachments(payload.attachments);
  if ('linkedin' in payload) interaction.linkedin = payload.linkedin ?? null;
  if ('website' in payload) interaction.website = payload.website ?? null;
  if ('status' in payload) interaction.status = payload.status ?? 'new';
  if ('internalNotes' in payload) interaction.internalNotes = payload.internalNotes ?? null;
  if ('metadata' in payload) interaction.metadata = payload.metadata ?? null;
}

function inferCategory(collection, fallback) {
  return fallback || inferExplorerCategoryFromCollection(collection);
}

export async function listInteractions(collection, recordId) {
  assertCollection(collection);
  if (!recordId) {
    return [];
  }
  const rows = await ExplorerInteraction.findAll({
    where: { collection, recordId },
    order: [['createdAt', 'DESC']],
  });
  return rows.map((row) => row.toPublicObject());
}

export async function getInteraction(collection, recordId, interactionId) {
  assertCollection(collection);
  if (!recordId || !interactionId) {
    return null;
  }
  const interaction = await ExplorerInteraction.findOne({
    where: { collection, recordId, id: interactionId },
  });
  return interaction ? interaction.toPublicObject() : null;
}

export async function createInteraction(collection, recordId, payload = {}) {
  assertCollection(collection);
  if (!recordId) {
    throw new Error('A record identifier is required to create an interaction.');
  }
  const interaction = await ExplorerInteraction.create({
    id: payload.id || randomUUID(),
    recordId,
    collection,
    category: inferCategory(collection, payload.category),
    type: payload.type,
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    company: payload.company ?? null,
    headline: payload.headline ?? null,
    message: payload.message,
    budgetAmount: coerceNumber(payload.budgetAmount),
    budgetCurrency: payload.budgetCurrency ?? null,
    availability: payload.availability ?? null,
    startDate: payload.startDate ?? null,
    attachments: normaliseAttachments(payload.attachments),
    linkedin: payload.linkedin ?? null,
    website: payload.website ?? null,
    status: payload.status ?? 'new',
    internalNotes: payload.internalNotes ?? null,
    metadata: payload.metadata ?? null,
  });
  return interaction.toPublicObject();
}

export async function updateInteraction(collection, recordId, interactionId, payload = {}) {
  assertCollection(collection);
  if (!recordId || !interactionId) {
    return null;
  }
  const interaction = await ExplorerInteraction.findOne({
    where: { collection, recordId, id: interactionId },
  });
  if (!interaction) {
    return null;
  }
  applyInteractionAttributes(interaction, payload);
  await interaction.save();
  return interaction.toPublicObject();
}

export async function deleteInteraction(collection, recordId, interactionId) {
  assertCollection(collection);
  if (!recordId || !interactionId) {
    return false;
  }
  const deleted = await ExplorerInteraction.destroy({ where: { collection, recordId, id: interactionId } });
  return deleted > 0;
}

export default {
  listInteractions,
  getInteraction,
  createInteraction,
  updateInteraction,
  deleteInteraction,
};
