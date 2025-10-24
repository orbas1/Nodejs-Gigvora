import {
  getFreelancerOperationsHq,
  requestFreelancerOperationsMembership,
  updateFreelancerOperationsMembership,
  acknowledgeFreelancerOperationsNotice,
  syncFreelancerOperationsHq,
} from '../services/freelancerOperationsService.js';

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
}

export async function operationsHq(req, res) {
  const { freelancerId } = req.params;
  const { fresh } = req.query ?? {};
  const payload = await getFreelancerOperationsHq(freelancerId, {
    bypassCache: parseBoolean(fresh),
  });
  res.json(payload);
}

export async function requestMembership(req, res) {
  const { freelancerId, membershipId } = req.params;
  const membership = await requestFreelancerOperationsMembership(freelancerId, membershipId, req.body ?? {});
  res.status(201).json(membership);
}

export async function updateMembership(req, res) {
  const { freelancerId, membershipId } = req.params;
  const membership = await updateFreelancerOperationsMembership(freelancerId, membershipId, req.body ?? {});
  res.json(membership);
}

export async function acknowledgeNotice(req, res) {
  const { freelancerId, noticeId } = req.params;
  const notice = await acknowledgeFreelancerOperationsNotice(freelancerId, noticeId);
  res.json(notice);
}

export async function syncOperations(req, res) {
  const { freelancerId } = req.params;
  const payload = await syncFreelancerOperationsHq(freelancerId);
  res.json(payload);
}

export default {
  operationsHq,
  requestMembership,
  updateMembership,
  acknowledgeNotice,
  syncOperations,
};
