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

function parsePositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function parseWorkspaceId(req) {
  const candidate = req.query.workspaceId ?? req.body.workspaceId ?? req.params.workspaceId;
  if (candidate == null) {
    throw new ValidationError('workspaceId is required and must be a positive integer.');
  }
  return parsePositiveInteger(candidate, 'workspaceId');
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
  const pageId = parsePositiveInteger(req.params.pageId, 'pageId');
  const page = await getCompanyPage({ workspaceId, pageId });
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
  const pageId = parsePositiveInteger(req.params.pageId, 'pageId');
  const actorId = req.user?.id ?? null;
  const page = await updateCompanyPage({ workspaceId, pageId, actorId, ...req.body });
  res.json({ page });
}

export async function updateSections(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const pageId = parsePositiveInteger(req.params.pageId, 'pageId');
  const actorId = req.user?.id ?? null;
  const sections = Array.isArray(req.body.sections) ? req.body.sections : [];
  const page = await replacePageSections({ workspaceId, pageId, sections, actorId });
  res.json({ page });
}

export async function updateCollaboratorsHandler(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const pageId = parsePositiveInteger(req.params.pageId, 'pageId');
  const actorId = req.user?.id ?? null;
  const page = await replacePageCollaborators({
    workspaceId,
    pageId,
    collaborators: Array.isArray(req.body.collaborators) ? req.body.collaborators : [],
    actorId,
  });
  res.json({ page });
}

export async function publish(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const pageId = parsePositiveInteger(req.params.pageId, 'pageId');
  const actorId = req.user?.id ?? null;
  const page = await publishCompanyPage({ workspaceId, pageId, actorId });
  res.json({ page });
}

export async function archive(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const pageId = parsePositiveInteger(req.params.pageId, 'pageId');
  const actorId = req.user?.id ?? null;
  await archiveCompanyPage({ workspaceId, pageId, actorId });
  res.status(204).send();
}

export async function destroy(req, res) {
  const workspaceId = parseWorkspaceId(req);
  const pageId = parsePositiveInteger(req.params.pageId, 'pageId');
  await deleteCompanyPage({ workspaceId, pageId });
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
