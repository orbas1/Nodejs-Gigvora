import {
  listAgencyProjects,
  createAgencyProject,
  updateAgencyProject,
  updateProjectAutoMatchSettings,
  upsertProjectAutoMatchFreelancer,
  updateProjectAutoMatchFreelancer,
} from '../services/agencyProjectManagementService.js';
import {
  buildAgencyActorContext,
  ensurePlainObject,
  normalisePagination,
  toBoolean,
  toOptionalEnum,
  toOptionalString,
  toPositiveInteger,
} from '../utils/controllerUtils.js';
import { PROJECT_STATUSES } from '../models/projectGigManagementModels.js';

const LIFECYCLE_STATES = new Set(['open', 'closed']);

function normaliseListFilters(req) {
  const lifecycleState = toOptionalEnum(req.query?.lifecycleState, LIFECYCLE_STATES, {
    fieldName: 'lifecycleState',
  });
  const status = toOptionalEnum(req.query?.status, new Set(PROJECT_STATUSES), {
    fieldName: 'status',
  });
  const search = toOptionalString(req.query?.search, {
    fieldName: 'search',
    maxLength: 140,
  });
  const autoMatchEnabled = req.query?.autoMatchEnabled == null
    ? undefined
    : toBoolean(req.query?.autoMatchEnabled, { defaultValue: undefined });

  return {
    lifecycleState,
    status,
    search,
    autoMatchEnabled,
  };
}

export async function getProjectManagement(req, res) {
  const actor = buildAgencyActorContext(req);
  const pagination = normalisePagination(req.query, { defaultPageSize: 10, maxPageSize: 50 });
  const filters = normaliseListFilters(req);
  const result = await listAgencyProjects(actor.actorId, { pagination, filters });
  res.json(result);
}

export async function createProject(req, res) {
  const actor = buildAgencyActorContext(req);
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const project = await createAgencyProject(actor.actorId, payload, { actorId: actor.actorId });
  res.status(201).json(project);
}

export async function updateProject(req, res) {
  const actor = buildAgencyActorContext(req);
  const projectId = toPositiveInteger(req.params?.projectId, { fieldName: 'projectId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const project = await updateAgencyProject(actor.actorId, projectId, payload, { actorId: actor.actorId });
  res.json(project);
}

export async function updateAutoMatchSettings(req, res) {
  const actor = buildAgencyActorContext(req);
  const projectId = toPositiveInteger(req.params?.projectId, { fieldName: 'projectId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const project = await updateProjectAutoMatchSettings(actor.actorId, projectId, payload, {
    actorId: actor.actorId,
  });
  res.json(project);
}

export async function addOrUpdateAutoMatchFreelancer(req, res) {
  const actor = buildAgencyActorContext(req);
  const projectId = toPositiveInteger(req.params?.projectId, { fieldName: 'projectId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const entry = await upsertProjectAutoMatchFreelancer(actor.actorId, projectId, payload, {
    actorId: actor.actorId,
  });
  res.status(201).json(entry);
}

export async function updateAutoMatchFreelancer(req, res) {
  const actor = buildAgencyActorContext(req);
  const projectId = toPositiveInteger(req.params?.projectId, { fieldName: 'projectId' });
  const entryId = toPositiveInteger(req.params?.freelancerEntryId, { fieldName: 'freelancerEntryId' });
  const payload = ensurePlainObject(req.body ?? {}, 'body');
  const entry = await updateProjectAutoMatchFreelancer(actor.actorId, projectId, entryId, payload, {
    actorId: actor.actorId,
  });
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
