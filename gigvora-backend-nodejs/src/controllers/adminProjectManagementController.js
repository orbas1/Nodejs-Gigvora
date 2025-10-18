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

export async function overview(req, res) {
  const snapshot = await getProjectPortfolioSnapshot(req.query ?? {});
  res.json(snapshot);
}

export async function summary(req, res) {
  const snapshot = await getProjectPortfolioSummary();
  res.json(snapshot);
}

export async function show(req, res) {
  const { projectId } = req.params;
  const detail = await getProjectDetail(Number(projectId));
  res.json(detail);
}

export async function store(req, res) {
  const result = await createProject(req.body ?? {});
  res.status(201).json(result);
}

export async function update(req, res) {
  const { projectId } = req.params;
  const result = await updateProject(Number(projectId), req.body ?? {});
  res.json(result);
}

export async function updateWorkspace(req, res) {
  const { projectId } = req.params;
  const result = await updateProjectWorkspace(Number(projectId), req.body ?? {});
  res.json(result);
}

export async function storeMilestone(req, res) {
  const { projectId } = req.params;
  const result = await createProjectMilestone(Number(projectId), req.body ?? {});
  res.status(201).json(result);
}

export async function updateMilestone(req, res) {
  const { projectId, milestoneId } = req.params;
  const result = await updateProjectMilestone(Number(projectId), Number(milestoneId), req.body ?? {});
  res.json(result);
}

export async function destroyMilestone(req, res) {
  const { projectId, milestoneId } = req.params;
  const result = await deleteProjectMilestone(Number(projectId), Number(milestoneId));
  res.json(result);
}

export async function storeCollaborator(req, res) {
  const { projectId } = req.params;
  const result = await createProjectCollaborator(Number(projectId), req.body ?? {});
  res.status(201).json(result);
}

export async function updateCollaborator(req, res) {
  const { projectId, collaboratorId } = req.params;
  const result = await updateProjectCollaborator(Number(projectId), Number(collaboratorId), req.body ?? {});
  res.json(result);
}

export async function destroyCollaborator(req, res) {
  const { projectId, collaboratorId } = req.params;
  const result = await deleteProjectCollaborator(Number(projectId), Number(collaboratorId));
  res.json(result);
}

export async function storeIntegration(req, res) {
  const { projectId } = req.params;
  const result = await createProjectIntegration(Number(projectId), req.body ?? {});
  res.status(201).json(result);
}

export async function updateIntegration(req, res) {
  const { projectId, integrationId } = req.params;
  const result = await updateProjectIntegration(Number(projectId), Number(integrationId), req.body ?? {});
  res.json(result);
}

export async function destroyIntegration(req, res) {
  const { projectId, integrationId } = req.params;
  const result = await deleteProjectIntegration(Number(projectId), Number(integrationId));
  res.json(result);
}

export async function storeAsset(req, res) {
  const { projectId } = req.params;
  const result = await createProjectAsset(Number(projectId), req.body ?? {});
  res.status(201).json(result);
}

export async function destroyAsset(req, res) {
  const { projectId, assetId } = req.params;
  const result = await deleteProjectAsset(Number(projectId), Number(assetId));
  res.json(result);
}

export async function storeRetrospective(req, res) {
  const { projectId } = req.params;
  const result = await createProjectRetrospective(Number(projectId), req.body ?? {});
  res.status(201).json(result);
}

export default {
  overview,
  summary,
  show,
  store,
  update,
  updateWorkspace,
  storeMilestone,
  updateMilestone,
  destroyMilestone,
  storeCollaborator,
  updateCollaborator,
  destroyCollaborator,
  storeIntegration,
  updateIntegration,
  destroyIntegration,
  storeAsset,
  destroyAsset,
  storeRetrospective,
};
