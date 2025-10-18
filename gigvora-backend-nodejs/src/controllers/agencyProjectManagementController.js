import {
  listAgencyProjects,
  createAgencyProject,
  updateAgencyProject,
  updateProjectAutoMatchSettings,
  upsertProjectAutoMatchFreelancer,
  updateProjectAutoMatchFreelancer,
} from '../services/agencyProjectManagementService.js';
import { AuthorizationError } from '../utils/errors.js';

function parseId(value) {
  if (value == null) {
    return undefined;
  }
  const numeric = Number.parseInt(`${value}`, 10);
  return Number.isFinite(numeric) ? numeric : undefined;
}

export async function getProjectManagement(req, res) {
  const ownerId = parseId(req.user?.id);
  if (!ownerId) {
    throw new AuthorizationError('Agency access required.');
  }
  const result = await listAgencyProjects(ownerId);
  res.json(result);
}

export async function createProject(req, res) {
  const ownerId = parseId(req.user?.id);
  if (!ownerId) {
    throw new AuthorizationError('Agency access required.');
  }
  const actorId = parseId(req.user?.id);
  const project = await createAgencyProject(ownerId, req.body, { actorId });
  res.status(201).json(project);
}

export async function updateProject(req, res) {
  const ownerId = parseId(req.user?.id);
  if (!ownerId) {
    throw new AuthorizationError('Agency access required.');
  }
  const actorId = parseId(req.user?.id);
  const projectId = parseId(req.params.projectId);
  const project = await updateAgencyProject(ownerId, projectId, req.body, { actorId });
  res.json(project);
}

export async function updateAutoMatchSettings(req, res) {
  const ownerId = parseId(req.user?.id);
  if (!ownerId) {
    throw new AuthorizationError('Agency access required.');
  }
  const actorId = parseId(req.user?.id);
  const projectId = parseId(req.params.projectId);
  const project = await updateProjectAutoMatchSettings(ownerId, projectId, req.body, { actorId });
  res.json(project);
}

export async function addOrUpdateAutoMatchFreelancer(req, res) {
  const ownerId = parseId(req.user?.id);
  if (!ownerId) {
    throw new AuthorizationError('Agency access required.');
  }
  const projectId = parseId(req.params.projectId);
  const entry = await upsertProjectAutoMatchFreelancer(ownerId, projectId, req.body);
  res.status(201).json(entry);
}

export async function updateAutoMatchFreelancer(req, res) {
  const ownerId = parseId(req.user?.id);
  if (!ownerId) {
    throw new AuthorizationError('Agency access required.');
  }
  const projectId = parseId(req.params.projectId);
  const entryId = parseId(req.params.freelancerEntryId);
  const entry = await updateProjectAutoMatchFreelancer(ownerId, projectId, entryId, req.body);
  res.json(entry);
}

export default {
  getProjectManagement,
  createProject,
  updateProject,
  updateAutoMatchSettings,
  addOrUpdateAutoMatchFreelancer,
  updateAutoMatchFreelancer,
};
