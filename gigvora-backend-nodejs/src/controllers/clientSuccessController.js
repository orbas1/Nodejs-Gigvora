import {
  getFreelancerAutomationOverview,
  createPlaybook,
  updatePlaybook as updatePlaybookService,
  enrollClientInPlaybook,
  recordReferral,
  createAffiliateLink,
} from '../services/clientSuccessService.js';

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}

export async function overview(req, res) {
  const { freelancerId } = req.params;
  const overviewData = await getFreelancerAutomationOverview(toNumber(freelancerId));
  res.json(overviewData);
}

export async function storePlaybook(req, res) {
  const { freelancerId } = req.params;
  const playbook = await createPlaybook(toNumber(freelancerId), req.body ?? {});
  res.status(201).json(playbook);
}

export async function updatePlaybook(req, res) {
  const { freelancerId, playbookId } = req.params;
  const updated = await updatePlaybookService(toNumber(playbookId), toNumber(freelancerId), req.body ?? {});
  res.json(updated);
}

export async function enroll(req, res) {
  const { freelancerId, playbookId } = req.params;
  const enrollment = await enrollClientInPlaybook(toNumber(playbookId), toNumber(freelancerId), req.body ?? {});
  res.status(201).json(enrollment);
}

export async function storeReferral(req, res) {
  const { freelancerId, gigId } = req.params;
  const referral = await recordReferral(toNumber(freelancerId), {
    ...req.body,
    gigId: gigId ?? req.body?.gigId,
  });
  res.status(201).json(referral);
}

export async function storeAffiliateLink(req, res) {
  const { freelancerId, gigId } = req.params;
  const link = await createAffiliateLink(toNumber(freelancerId), {
    ...req.body,
    gigId: gigId ?? req.body?.gigId,
  });
  res.status(201).json(link);
}

export default {
  overview,
  storePlaybook,
  updatePlaybook,
  enroll,
  storeReferral,
  storeAffiliateLink,
};
