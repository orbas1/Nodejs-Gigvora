import {
  getProjectPortfolioSnapshot,
  getProjectPortfolioSummary,
  getProjectDetail,
  createProject,
  updateProject,
  updateProjectWorkspace,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  createProjectCollaborator,
  updateProjectCollaborator,
  deleteProjectCollaborator,
  createProjectIntegration,
  updateProjectIntegration,
  deleteProjectIntegration,
  createProjectAsset,
  deleteProjectAsset,
  createProjectRetrospective,
} from '../services/adminProjectManagementService.js';
import { extractAdminActor, stampPayloadWithActor, coercePositiveInteger } from '../utils/adminRequestContext.js';
import logger from '../utils/logger.js';

export async function overview(req, res) {
  const snapshot = await getProjectPortfolioSnapshot(req.query ?? {});
  res.json(snapshot);
}

export async function summary(req, res) {
  const snapshot = await getProjectPortfolioSummary();
  res.json(snapshot);
}

export async function show(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const detail = await getProjectDetail(projectId);
  res.json(detail);
}

export async function store(req, res) {
  const actor = extractAdminActor(req);
  const payload = stampPayloadWithActor(req.body ?? {}, actor, { metadataKey: 'metadata', forceMetadata: true });
  const result = await createProject(payload);
  logger.info({ actor: actor.reference, projectId: result?.id }, 'Admin project created');
  res.status(201).json(result);
}

export async function update(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const actor = extractAdminActor(req);
  const result = await updateProject(
    projectId,
    stampPayloadWithActor(req.body ?? {}, actor, { metadataKey: 'metadata', setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, projectId }, 'Admin project updated');
  res.json(result);
}

export async function updateWorkspace(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const result = await updateProjectWorkspace(projectId, req.body ?? {});
  res.json(result);
}

export async function storeMilestone(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const actor = extractAdminActor(req);
  const result = await createProjectMilestone(
    projectId,
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, projectId, milestoneId: result?.id }, 'Admin project milestone created');
  res.status(201).json(result);
}

export async function updateMilestone(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const milestoneId = coercePositiveInteger(req.params?.milestoneId, 'milestoneId');
  const actor = extractAdminActor(req);
  const result = await updateProjectMilestone(
    projectId,
    milestoneId,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, projectId, milestoneId }, 'Admin project milestone updated');
  res.json(result);
}

export async function destroyMilestone(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const milestoneId = coercePositiveInteger(req.params?.milestoneId, 'milestoneId');
  await deleteProjectMilestone(projectId, milestoneId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, projectId, milestoneId }, 'Admin project milestone deleted');
  res.status(204).send();
}

export async function storeCollaborator(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const actor = extractAdminActor(req);
  const result = await createProjectCollaborator(
    projectId,
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, projectId, collaboratorId: result?.id }, 'Admin project collaborator added');
  res.status(201).json(result);
}

export async function updateCollaborator(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const collaboratorId = coercePositiveInteger(req.params?.collaboratorId, 'collaboratorId');
  const actor = extractAdminActor(req);
  const result = await updateProjectCollaborator(
    projectId,
    collaboratorId,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, projectId, collaboratorId }, 'Admin project collaborator updated');
  res.json(result);
}

export async function destroyCollaborator(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const collaboratorId = coercePositiveInteger(req.params?.collaboratorId, 'collaboratorId');
  await deleteProjectCollaborator(projectId, collaboratorId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, projectId, collaboratorId }, 'Admin project collaborator removed');
  res.status(204).send();
}

export async function storeIntegration(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const actor = extractAdminActor(req);
  const result = await createProjectIntegration(
    projectId,
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, projectId, integrationId: result?.id }, 'Admin project integration created');
  res.status(201).json(result);
}

export async function updateIntegration(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const integrationId = coercePositiveInteger(req.params?.integrationId, 'integrationId');
  const actor = extractAdminActor(req);
  const result = await updateProjectIntegration(
    projectId,
    integrationId,
    stampPayloadWithActor(req.body ?? {}, actor, { setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, projectId, integrationId }, 'Admin project integration updated');
  res.json(result);
}

export async function destroyIntegration(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const integrationId = coercePositiveInteger(req.params?.integrationId, 'integrationId');
  await deleteProjectIntegration(projectId, integrationId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, projectId, integrationId }, 'Admin project integration removed');
  res.status(204).send();
}

export async function storeAsset(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const actor = extractAdminActor(req);
  const result = await createProjectAsset(
    projectId,
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, projectId, assetId: result?.id }, 'Admin project asset created');
  res.status(201).json(result);
}

export async function destroyAsset(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const assetId = coercePositiveInteger(req.params?.assetId, 'assetId');
  await deleteProjectAsset(projectId, assetId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, projectId, assetId }, 'Admin project asset deleted');
  res.status(204).send();
}

export async function storeRetrospective(req, res) {
  const projectId = coercePositiveInteger(req.params?.projectId, 'projectId');
  const actor = extractAdminActor(req);
  const result = await createProjectRetrospective(
    projectId,
    stampPayloadWithActor(req.body ?? {}, actor, { setCreatedBy: true, setUpdatedBy: true }),
  );
  logger.info({ actor: actor.reference, projectId, retrospectiveId: result?.id }, 'Admin project retrospective created');
  res.status(201).json(result);
}

