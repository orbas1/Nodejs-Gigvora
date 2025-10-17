import {
  createAvailabilityEntry,
  createGigDelegation,
  createPayDelegation,
  createProjectDelegation,
  createWorkforceMember,
  deleteAvailabilityEntry,
  deleteCapacitySnapshot,
  deleteGigDelegation,
  deletePayDelegation,
  deleteProjectDelegation,
  deleteWorkforceMember,
  getWorkforceDashboard,
  listAvailabilityEntries,
  listCapacitySnapshots,
  listGigDelegations,
  listMembers,
  listPayDelegations,
  listProjectDelegations,
  recordCapacitySnapshot,
  updateAvailabilityEntry,
  updateCapacitySnapshot,
  updateGigDelegation,
  updatePayDelegation,
  updateProjectDelegation,
  updateWorkforceMember,
} from '../services/agencyWorkforceService.js';

function parseId(value) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function dashboard(req, res) {
  const { workspaceId } = req.query;
  const payload = { workspaceId: parseId(workspaceId) ?? null };
  const data = await getWorkforceDashboard(payload);
  res.json(data);
}

export async function indexMembers(req, res) {
  const { workspaceId, status } = req.query;
  const members = await listMembers({ workspaceId: parseId(workspaceId), status });
  res.json({ data: members });
}

export async function storeMember(req, res) {
  const record = await createWorkforceMember(req.body);
  res.status(201).json(record);
}

export async function updateMember(req, res) {
  const { memberId } = req.params;
  const { workspaceId } = req.body;
  const record = await updateWorkforceMember(memberId, req.body, { workspaceId: parseId(workspaceId) });
  res.json(record);
}

export async function destroyMember(req, res) {
  const { memberId } = req.params;
  const { workspaceId } = req.query;
  await deleteWorkforceMember(memberId, { workspaceId: parseId(workspaceId) });
  res.status(204).send();
}

export async function indexPayDelegations(req, res) {
  const { workspaceId, status } = req.query;
  const delegations = await listPayDelegations({ workspaceId: parseId(workspaceId), status });
  res.json({ data: delegations });
}

export async function storePayDelegation(req, res) {
  const record = await createPayDelegation(req.body);
  res.status(201).json(record);
}

export async function updatePayDelegationRecord(req, res) {
  const { delegationId } = req.params;
  const { workspaceId } = req.body;
  const record = await updatePayDelegation(delegationId, req.body, { workspaceId: parseId(workspaceId) });
  res.json(record);
}

export async function destroyPayDelegation(req, res) {
  const { delegationId } = req.params;
  const { workspaceId } = req.query;
  await deletePayDelegation(delegationId, { workspaceId: parseId(workspaceId) });
  res.status(204).send();
}

export async function indexProjectDelegations(req, res) {
  const { workspaceId, status } = req.query;
  const delegations = await listProjectDelegations({ workspaceId: parseId(workspaceId), status });
  res.json({ data: delegations });
}

export async function storeProjectDelegation(req, res) {
  const record = await createProjectDelegation(req.body);
  res.status(201).json(record);
}

export async function updateProjectDelegationRecord(req, res) {
  const { delegationId } = req.params;
  const { workspaceId } = req.body;
  const record = await updateProjectDelegation(delegationId, req.body, { workspaceId: parseId(workspaceId) });
  res.json(record);
}

export async function destroyProjectDelegation(req, res) {
  const { delegationId } = req.params;
  const { workspaceId } = req.query;
  await deleteProjectDelegation(delegationId, { workspaceId: parseId(workspaceId) });
  res.status(204).send();
}

export async function indexGigDelegations(req, res) {
  const { workspaceId, status } = req.query;
  const delegations = await listGigDelegations({ workspaceId: parseId(workspaceId), status });
  res.json({ data: delegations });
}

export async function storeGigDelegation(req, res) {
  const record = await createGigDelegation(req.body);
  res.status(201).json(record);
}

export async function updateGigDelegationRecord(req, res) {
  const { delegationId } = req.params;
  const { workspaceId } = req.body;
  const record = await updateGigDelegation(delegationId, req.body, { workspaceId: parseId(workspaceId) });
  res.json(record);
}

export async function destroyGigDelegation(req, res) {
  const { delegationId } = req.params;
  const { workspaceId } = req.query;
  await deleteGigDelegation(delegationId, { workspaceId: parseId(workspaceId) });
  res.status(204).send();
}

export async function indexCapacitySnapshots(req, res) {
  const { workspaceId } = req.query;
  const snapshots = await listCapacitySnapshots({ workspaceId: parseId(workspaceId) });
  res.json({ data: snapshots });
}

export async function storeCapacitySnapshot(req, res) {
  const record = await recordCapacitySnapshot(req.body);
  res.status(201).json(record);
}

export async function updateCapacitySnapshotRecord(req, res) {
  const { snapshotId } = req.params;
  const { workspaceId } = req.body;
  const record = await updateCapacitySnapshot(snapshotId, req.body, { workspaceId: parseId(workspaceId) });
  res.json(record);
}

export async function destroyCapacitySnapshot(req, res) {
  const { snapshotId } = req.params;
  const { workspaceId } = req.query;
  await deleteCapacitySnapshot(snapshotId, { workspaceId: parseId(workspaceId) });
  res.status(204).send();
}

export async function indexAvailabilityEntries(req, res) {
  const { workspaceId, memberId } = req.query;
  const entries = await listAvailabilityEntries({
    workspaceId: parseId(workspaceId),
    memberId: parseId(memberId),
  });
  res.json({ data: entries });
}

export async function storeAvailabilityEntry(req, res) {
  const record = await createAvailabilityEntry(req.body);
  res.status(201).json(record);
}

export async function updateAvailabilityEntryRecord(req, res) {
  const { entryId } = req.params;
  const { workspaceId } = req.body;
  const record = await updateAvailabilityEntry(entryId, req.body, { workspaceId: parseId(workspaceId) });
  res.json(record);
}

export async function destroyAvailabilityEntry(req, res) {
  const { entryId } = req.params;
  const { workspaceId } = req.query;
  await deleteAvailabilityEntry(entryId, { workspaceId: parseId(workspaceId) });
  res.status(204).send();
}

export default {
  dashboard,
  indexMembers,
  storeMember,
  updateMember,
  destroyMember,
  indexPayDelegations,
  storePayDelegation,
  updatePayDelegationRecord,
  destroyPayDelegation,
  indexProjectDelegations,
  storeProjectDelegation,
  updateProjectDelegationRecord,
  destroyProjectDelegation,
  indexGigDelegations,
  storeGigDelegation,
  updateGigDelegationRecord,
  destroyGigDelegation,
  indexCapacitySnapshots,
  storeCapacitySnapshot,
  updateCapacitySnapshotRecord,
  destroyCapacitySnapshot,
  indexAvailabilityEntries,
  storeAvailabilityEntry,
  updateAvailabilityEntryRecord,
  destroyAvailabilityEntry,
};
