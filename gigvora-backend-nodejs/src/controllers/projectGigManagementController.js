import {
  getProjectGigManagementOverview,
  createProject,
  addProjectAsset,
  updateProjectWorkspace,
  createGigOrder,
  updateGigOrder,
} from '../services/projectGigManagementWorkflowService.js';
import { resolveRequestUserId } from '../utils/requestContext.js';

export async function overview(req, res) {
  const ownerId = Number.parseInt(req.params.userId ?? req.params.id ?? req.user?.id, 10);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.json(snapshot);
}

export async function storeProject(req, res) {
  const ownerId =
    Number.parseInt(req.params.userId ?? req.params.id ?? req.user?.id ?? resolveRequestUserId(req), 10) || null;
  const project = await createProject(ownerId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.status(201).json({ project, dashboard: snapshot });
}

export async function storeAsset(req, res) {
  const ownerId =
    Number.parseInt(req.params.userId ?? req.params.id ?? req.user?.id ?? resolveRequestUserId(req), 10) || null;
  const asset = await addProjectAsset(ownerId, req.params.projectId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.status(201).json({ asset, dashboard: snapshot });
}

export async function patchWorkspace(req, res) {
  const ownerId =
    Number.parseInt(req.params.userId ?? req.params.id ?? req.user?.id ?? resolveRequestUserId(req), 10) || null;
  const workspace = await updateProjectWorkspace(ownerId, req.params.projectId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.json({ workspace, dashboard: snapshot });
}

export async function storeGigOrder(req, res) {
  const ownerId =
    Number.parseInt(req.params.userId ?? req.params.id ?? req.user?.id ?? resolveRequestUserId(req), 10) || null;
  const order = await createGigOrder(ownerId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.status(201).json({ order, dashboard: snapshot });
}

export async function patchGigOrder(req, res) {
  const ownerId =
    Number.parseInt(req.params.userId ?? req.params.id ?? req.user?.id ?? resolveRequestUserId(req), 10) || null;
  const order = await updateGigOrder(ownerId, req.params.orderId, req.body);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.json({ order, dashboard: snapshot });
}

export default {
  overview,
  storeProject,
  storeAsset,
  patchWorkspace,
  storeGigOrder,
  patchGigOrder,
};
