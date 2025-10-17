import {
  getProjectGigManagementOverview,
  createProject,
  addProjectAsset,
  updateProjectWorkspace,
  createGigOrder,
  updateGigOrder,
} from '../services/projectGigManagementWorkflowService.js';
import { ensureManageAccess, ensureViewAccess, parseOwnerId } from '../utils/projectAccess.js';

export async function overview(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureViewAccess(req, ownerId);
  const snapshot = await getProjectGigManagementOverview(ownerId);
  res.json({ ...snapshot, access });
}

async function withDashboardRefresh(ownerId, access, resolver) {
  const result = await resolver();
  const snapshot = await getProjectGigManagementOverview(ownerId);
  return { result, snapshot: { ...snapshot, access } };
}

export async function storeProject(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => createProject(ownerId, req.body));
  res.status(201).json({ project: result, dashboard: snapshot });
}

export async function storeAsset(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    addProjectAsset(ownerId, projectId, req.body),
  );
  res.status(201).json({ asset: result, dashboard: snapshot });
}

export async function patchWorkspace(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const projectId = Number.parseInt(req.params?.projectId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateProjectWorkspace(ownerId, projectId, req.body),
  );
  res.json({ workspace: result, dashboard: snapshot });
}

export async function storeGigOrder(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () => createGigOrder(ownerId, req.body));
  res.status(201).json({ order: result, dashboard: snapshot });
}

export async function patchGigOrder(req, res) {
  const ownerId = parseOwnerId(req);
  const access = ensureManageAccess(req, ownerId);
  const orderId = Number.parseInt(req.params?.orderId, 10);
  const { result, snapshot } = await withDashboardRefresh(ownerId, access, () =>
    updateGigOrder(ownerId, orderId, req.body),
  );
  res.json({ order: result, dashboard: snapshot });
}

export default {
  overview,
  storeProject,
  storeAsset,
  patchWorkspace,
  storeGigOrder,
  patchGigOrder,
};
