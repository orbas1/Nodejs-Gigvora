import {
  getWorkspaceProjectsList,
  getWorkspaceManagementSnapshot,
  createWorkspaceEntity,
  updateWorkspaceEntity,
  deleteWorkspaceEntity,
} from '../services/projectWorkspaceManagementService.js';
import { NotFoundError } from '../utils/errors.js';

function parseNumber(value, fallback = undefined) {
  if (value == null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeEntity(value) {
  if (!value) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

export async function index(req, res) {
  const { projectId } = req.query ?? {};
  const projects = await getWorkspaceProjectsList();
  const numericProjectId = parseNumber(projectId);

  let workspace = null;
  if (numericProjectId) {
    try {
      workspace = await getWorkspaceManagementSnapshot(numericProjectId);
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }
  } else if (projects.length > 0) {
    try {
      workspace = await getWorkspaceManagementSnapshot(projects[0].id);
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }
  }

  res.json({ projects, workspace, selectedProjectId: workspace?.project?.id ?? numericProjectId ?? null });
}

export async function show(req, res) {
  const { projectId } = req.params;
  const snapshot = await getWorkspaceManagementSnapshot(parseNumber(projectId, projectId));
  res.json(snapshot);
}

export async function create(req, res) {
  const { projectId, entity } = req.params;
  const payload = req.body ?? {};
  const result = await createWorkspaceEntity(parseNumber(projectId, projectId), normalizeEntity(entity), payload);
  res.status(201).json(result);
}

export async function update(req, res) {
  const { projectId, entity, recordId } = req.params;
  const payload = req.body ?? {};
  const result = await updateWorkspaceEntity(
    parseNumber(projectId, projectId),
    normalizeEntity(entity),
    recordId ? parseNumber(recordId, recordId) : recordId,
    payload,
  );
  res.json(result);
}

export async function destroy(req, res) {
  const { projectId, entity, recordId } = req.params;
  await deleteWorkspaceEntity(parseNumber(projectId, projectId), normalizeEntity(entity), parseNumber(recordId, recordId));
  res.status(204).send();
}

export default {
  index,
  show,
  create,
  update,
  destroy,
};
