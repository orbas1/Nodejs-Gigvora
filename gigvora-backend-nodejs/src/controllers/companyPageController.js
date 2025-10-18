import {
  listCompanyPages,
  getCompanyPage,
  createCompanyPage,
  updateCompanyPage,
  replacePageSections,
  replacePageCollaborators,
  publishCompanyPage,
  archiveCompanyPage,
  deleteCompanyPage,
} from '../services/companyPageService.js';
import { ValidationError } from '../utils/errors.js';

function parseWorkspaceId(req) {
  const candidate = req.query.workspaceId ?? req.body.workspaceId;
  const workspaceId = Number.parseInt(candidate, 10);
  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    throw new ValidationError('workspaceId is required and must be a positive integer.');
  }
  return workspaceId;
}

function parsePagination(req) {
  const limit = req.query.limit != null ? Number.parseInt(req.query.limit, 10) : undefined;
  const offset = req.query.offset != null ? Number.parseInt(req.query.offset, 10) : undefined;
  return {
    limit: Number.isInteger(limit) && limit > 0 ? limit : 20,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
  };
}

export async function index(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const { limit, offset } = parsePagination(req);
  const { status, visibility, search } = req.query;

  const payload = await listCompanyPages({ workspaceId, status, visibility, search, limit, offset });
  res.json(payload);
}

export async function show(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const { pageId } = req.params;
  const page = await getCompanyPage({ workspaceId, pageId: Number(pageId) });
  res.json({ page });
}

export async function create(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const actorId = req.user?.id ?? null;
  const page = await createCompanyPage({ workspaceId, actorId, ...req.body });
  res.status(201).json({ page });
}

export async function update(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const { pageId } = req.params;
  const actorId = req.user?.id ?? null;
  const page = await updateCompanyPage({ workspaceId, pageId: Number(pageId), actorId, ...req.body });
  res.json({ page });
}

export async function updateSections(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const { pageId } = req.params;
  const actorId = req.user?.id ?? null;
  const page = await replacePageSections({ workspaceId, pageId: Number(pageId), sections: req.body.sections ?? [], actorId });
  res.json({ page });
}

export async function updateCollaboratorsHandler(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const { pageId } = req.params;
  const actorId = req.user?.id ?? null;
  const page = await replacePageCollaborators({
    workspaceId,
    pageId: Number(pageId),
    collaborators: req.body.collaborators ?? [],
    actorId,
  });
  res.json({ page });
}

export async function publish(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const { pageId } = req.params;
  const actorId = req.user?.id ?? null;
  const page = await publishCompanyPage({ workspaceId, pageId: Number(pageId), actorId });
  res.json({ page });
}

export async function archive(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const { pageId } = req.params;
  const actorId = req.user?.id ?? null;
  await archiveCompanyPage({ workspaceId, pageId: Number(pageId), actorId });
  res.status(204).send();
}

export async function destroy(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const { pageId } = req.params;
  await deleteCompanyPage({ workspaceId, pageId: Number(pageId) });
  res.status(204).send();
}

export default {
  index,
  show,
  create,
  update,
  updateSections,
  updateCollaborators: updateCollaboratorsHandler,
  publish,
  archive,
  destroy,
};
