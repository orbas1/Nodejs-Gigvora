import {
  listFormBlueprints,
  getFormBlueprintByKey,
  validateFormBlueprintField,
} from '../services/formBlueprintService.js';

function parseBoolean(value, fallback = undefined) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const normalised = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalised)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalised)) return false;
  return fallback;
}

function parseArray(value) {
  if (value == null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value;
  }
  const parts = String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

export async function index(req, res) {
  const { status, persona, includeSteps, includeFields, limit } = req.query ?? {};

  const payload = await listFormBlueprints({
    status: parseArray(status),
    persona: parseArray(persona),
    includeSteps: parseBoolean(includeSteps, false),
    includeFields: parseBoolean(includeFields, false),
    limit,
  });

  res.json(payload);
}

export async function show(req, res) {
  const { key } = req.params;
  const { includeSteps, includeFields, status } = req.query ?? {};

  const blueprint = await getFormBlueprintByKey(key, {
    includeSteps: parseBoolean(includeSteps, true),
    includeFields: parseBoolean(includeFields, true),
    status: status ?? undefined,
  });

  if (!blueprint) {
    res.status(404).json({ error: 'Blueprint not found.' });
    return;
  }

  res.json(blueprint);
}

export async function validateField(req, res) {
  const { key } = req.params;
  const { field, value, context } = req.body ?? {};

  const result = await validateFormBlueprintField(key, field, value, context ?? {});
  res.json(result);
}

export default {
  index,
  show,
  validateField,
};
