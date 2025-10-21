import { z } from 'zod';
import { getRecord } from '../services/explorerStore.js';
import {
  createInteraction,
  deleteInteraction,
  getInteraction,
  listInteractions,
  updateInteraction,
} from '../services/explorerEngagementStore.js';
import { resolveExplorerCollection } from '../utils/explorerCollections.js';

const INTERACTION_TYPES = ['application', 'bid', 'enquiry', 'intro_request', 'booking', 'volunteer'];

const interactionSchema = z.object({
  type: z.enum(INTERACTION_TYPES, { invalid_type_error: 'Interaction type is required' }),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  headline: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  budgetAmount: z.number().nonnegative().optional(),
  budgetCurrency: z.string().min(1).optional(),
  availability: z.string().optional(),
  startDate: z.string().optional(),
  attachments: z.array(z.string().url()).optional(),
  linkedin: z.string().url().optional(),
  website: z.string().url().optional(),
  status: z
    .enum(['new', 'in_review', 'shortlisted', 'declined', 'won', 'contacted'])
    .optional(),
  internalNotes: z.string().optional(),
});

const updateSchema = interactionSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'Update payload must include at least one field',
});

function resolveCollection(category) {
  return resolveExplorerCollection(category);
}

async function ensureRecordExists(collection, recordId) {
  const record = await getRecord(collection, recordId);
  if (!record) {
    const error = new Error('Explorer record not found');
    error.status = 404;
    throw error;
  }
  return record;
}

export async function listExplorerInteractions(req, res, next) {
  try {
    const { category, recordId } = req.params;
    const collection = resolveCollection(category);
    await ensureRecordExists(collection, recordId);
    const interactions = await listInteractions(collection, recordId);
    res.json({ items: interactions });
  } catch (error) {
    next(error);
  }
}

export async function getExplorerInteraction(req, res, next) {
  try {
    const { category, recordId, interactionId } = req.params;
    const collection = resolveCollection(category);
    await ensureRecordExists(collection, recordId);
    const interaction = await getInteraction(collection, recordId, interactionId);
    if (!interaction) {
      return res.status(404).json({ message: 'Interaction not found' });
    }
    return res.json(interaction);
  } catch (error) {
    return next(error);
  }
}

export async function createExplorerInteraction(req, res, next) {
  try {
    const { category, recordId } = req.params;
    const collection = resolveCollection(category);
    await ensureRecordExists(collection, recordId);
    const payload = interactionSchema.parse(req.body ?? {});
    const interaction = await createInteraction(collection, recordId, payload);
    res.status(201).json(interaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', issues: error.issues });
    }
    return next(error);
  }
}

export async function updateExplorerInteraction(req, res, next) {
  try {
    const { category, recordId, interactionId } = req.params;
    const collection = resolveCollection(category);
    await ensureRecordExists(collection, recordId);
    const payload = updateSchema.parse(req.body ?? {});
    const interaction = await updateInteraction(collection, recordId, interactionId, payload);
    if (!interaction) {
      return res.status(404).json({ message: 'Interaction not found' });
    }
    return res.json(interaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', issues: error.issues });
    }
    return next(error);
  }
}

export async function deleteExplorerInteraction(req, res, next) {
  try {
    const { category, recordId, interactionId } = req.params;
    const collection = resolveCollection(category);
    await ensureRecordExists(collection, recordId);
    const deleted = await deleteInteraction(collection, recordId, interactionId);
    if (!deleted) {
      return res.status(404).json({ message: 'Interaction not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export default {
  listExplorerInteractions,
  getExplorerInteraction,
  createExplorerInteraction,
  updateExplorerInteraction,
  deleteExplorerInteraction,
};
