import {
  approveTwoFactorEnrollment,
  createTwoFactorPolicy,
  deleteTwoFactorPolicy,
  getAdminTwoFactorOverview,
  issueTwoFactorBypass,
  revokeTwoFactorEnrollment,
  updateTwoFactorBypassStatus,
  updateTwoFactorPolicy,
} from '../services/adminTwoFactorService.js';

function resolveActorId(req) {
  return req?.user?.id ?? null;
}

export async function fetchOverview(req, res) {
  const { lookbackDays } = req.query ?? {};
  const overview = await getAdminTwoFactorOverview({ lookbackDays });
  res.json(overview);
}

export async function createPolicy(req, res) {
  const actorId = resolveActorId(req);
  const policy = await createTwoFactorPolicy(req.body ?? {}, { actorId });
  res.status(201).json(policy);
}

export async function updatePolicy(req, res) {
  const actorId = resolveActorId(req);
  const { policyId } = req.params ?? {};
  const policy = await updateTwoFactorPolicy(policyId, req.body ?? {}, { actorId });
  res.json(policy);
}

export async function removePolicy(req, res) {
  const actorId = resolveActorId(req);
  const { policyId } = req.params ?? {};
  const result = await deleteTwoFactorPolicy(policyId, { actorId });
  res.json(result);
}

export async function createBypass(req, res) {
  const actorId = resolveActorId(req);
  const bypass = await issueTwoFactorBypass(req.body ?? {}, { actorId });
  res.status(201).json(bypass);
}

export async function updateBypass(req, res) {
  const actorId = resolveActorId(req);
  const { bypassId } = req.params ?? {};
  const bypass = await updateTwoFactorBypassStatus(bypassId, req.body ?? {}, { actorId });
  res.json(bypass);
}

export async function approveEnrollment(req, res) {
  const actorId = resolveActorId(req);
  const { enrollmentId } = req.params ?? {};
  const enrollment = await approveTwoFactorEnrollment(enrollmentId, req.body ?? {}, { actorId });
  res.json(enrollment);
}

export async function revokeEnrollment(req, res) {
  const actorId = resolveActorId(req);
  const { enrollmentId } = req.params ?? {};
  const enrollment = await revokeTwoFactorEnrollment(enrollmentId, req.body ?? {}, { actorId });
  res.json(enrollment);
}

export default {
  fetchOverview,
  createPolicy,
  updatePolicy,
  removePolicy,
  createBypass,
  updateBypass,
  approveEnrollment,
  revokeEnrollment,
};
