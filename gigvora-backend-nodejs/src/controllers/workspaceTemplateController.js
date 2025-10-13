import {
  listWorkspaceTemplates,
  getWorkspaceTemplateBySlug,
} from '../services/workspaceTemplateService.js';

function parseBoolean(value, fallback = undefined) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const normalised = String(value).toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalised)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalised)) return false;
  return fallback;
}

function parseInteger(value, fallback = undefined) {
  if (value == null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function index(req, res) {
  const {
    category: categorySlug,
    workspaceType,
    industry,
    status,
    visibility,
    includeStages,
    includeResources,
    limit,
  } = req.query ?? {};

  const payload = await listWorkspaceTemplates({
    categorySlug: categorySlug ?? undefined,
    workspaceType: workspaceType ?? undefined,
    industry: industry ?? undefined,
    status: status ?? undefined,
    visibility: visibility ?? undefined,
    includeStages: parseBoolean(includeStages, true),
    includeResources: parseBoolean(includeResources, true),
    limit: parseInteger(limit, undefined),
  });

  res.json(payload);
}

export async function show(req, res) {
  const { slug } = req.params;
  const { includeStages, includeResources, status, visibility } = req.query ?? {};

  const payload = await getWorkspaceTemplateBySlug(slug, {
    includeStages: parseBoolean(includeStages, true),
    includeResources: parseBoolean(includeResources, true),
    status: status ?? undefined,
    visibility: visibility ?? undefined,
  });

  res.json(payload);
}

export default {
  index,
  show,
};
