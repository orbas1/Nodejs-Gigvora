
import { listCompanyInboxLabels,
  createCompanyInboxLabel,
  updateCompanyInboxLabel,
  deleteCompanyInboxLabel,
  getCompanyInboxOverview,
  listCompanyInboxThreads,
  getCompanyInboxThread,
  setCompanyThreadLabels,
  listCompanyInboxMembers,
} from '../services/companyInboxService.js';
import { ValidationError } from '../utils/errors.js';

function parseArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function resolveActorId(req) {
  const candidates = [req.user?.id, req.body?.actorId, req.body?.userId, req.query?.actorId, req.query?.userId];
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

export async function overview(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query;
  const payload = {
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: lookbackDays ? Number(lookbackDays) : undefined,
  };
  const data = await getCompanyInboxOverview(payload);
  res.json(data);
}

export async function listThreads(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays, page, pageSize } = req.query;
  const filters = {
    channelTypes: parseArray(req.query.channelTypes),
    states: parseArray(req.query.states),
    labelIds: parseArray(req.query.labelIds).map((value) => Number(value)).filter(Number.isFinite),
    supportStatuses: parseArray(req.query.supportStatuses),
    search: req.query.search ?? undefined,
    unreadOnly: String(req.query.unreadOnly ?? '').toLowerCase() === 'true',
  };

  const result = await listCompanyInboxThreads({
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: lookbackDays ? Number(lookbackDays) : undefined,
    filters,
    pagination: {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    },
  });

  res.json(result);
}

export async function threadDetail(req, res) {
  const { threadId } = req.params;
  const { workspaceId, workspaceSlug } = req.query;
  const payload = {
    threadId: Number(threadId),
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceSlug: workspaceSlug ?? undefined,
  };
  const data = await getCompanyInboxThread(payload);
  res.json(data);
}

export async function updateThreadLabels(req, res) {
  const { threadId } = req.params;
  const { workspaceId, workspaceSlug } = req.query;
  const labelIds = Array.isArray(req.body.labelIds) ? req.body.labelIds : parseArray(req.body.labelIds);
  const actorId = resolveActorId(req);
  const data = await setCompanyThreadLabels({
    threadId: Number(threadId),
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceSlug: workspaceSlug ?? undefined,
    labelIds,
    actorId,
  });
  res.json(data);
}

export async function listLabels(req, res) {
  const { workspaceId, workspaceSlug, search } = req.query;
  const labels = await listCompanyInboxLabels({
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceSlug: workspaceSlug ?? undefined,
    search: search ?? undefined,
  });
  res.json(labels);
}

export async function createLabel(req, res) {
  const { workspaceId, workspaceSlug } = req.query;
  const { name, color, description, metadata } = req.body ?? {};
  if (!name || !name.trim()) {
    throw new ValidationError('name is required');
  }
  const label = await createCompanyInboxLabel({
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceSlug: workspaceSlug ?? undefined,
    name,
    color,
    description,
    metadata,
    createdBy: resolveActorId(req),
  });
  res.status(201).json(label);
}

export async function updateLabel(req, res) {
  const { labelId } = req.params;
  const { workspaceId, workspaceSlug } = req.query;
  const { name, color, description, metadata } = req.body ?? {};
  const label = await updateCompanyInboxLabel(Number(labelId), {
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceSlug: workspaceSlug ?? undefined,
    name,
    color,
    description,
    metadata,
  });
  res.json(label);
}

export async function deleteLabel(req, res) {
  const { labelId } = req.params;
  const { workspaceId, workspaceSlug } = req.query;
  const removed = await deleteCompanyInboxLabel(Number(labelId), {
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceSlug: workspaceSlug ?? undefined,
  });
  if (removed) {
    res.status(204).send();
  } else {
    res.json({ removed });
  }
}

export async function members(req, res) {
  const { workspaceId, workspaceSlug } = req.query;
  const data = await listCompanyInboxMembers({
    workspaceId: workspaceId ? Number(workspaceId) : undefined,
    workspaceSlug: workspaceSlug ?? undefined,
  });
  res.json(data);
}

export default {
  overview,
  listThreads,
  threadDetail,
  updateThreadLabels,
  listLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  members,
};
