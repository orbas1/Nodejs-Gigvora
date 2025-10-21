import {
  listConsentPolicies,
  createConsentPolicy,
  createPolicyVersion,
  updateConsentPolicy,
  deleteConsentPolicy,
  getConsentPolicyByCode,
} from '../services/consentService.js';
import { ValidationError } from '../utils/errors.js';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

export async function index(req, res) {
  const policies = await listConsentPolicies({
    audience: req.query?.audience,
    region: req.query?.region,
    includeInactive: req.query?.includeInactive === 'true',
  });
  res.json({ policies });
}

export async function show(req, res) {
  const { policyCode } = req.params;
  const policy = await getConsentPolicyByCode(policyCode, { includeVersions: true });
  res.json(policy.toSummary({ includeVersions: true }));
}

export async function store(req, res) {
  const payload = req.body ?? {};
  const { version = {}, ...policyPayload } = payload;

  const policy = await createConsentPolicy(policyPayload, version, {
    actorId: req.user?.id ? String(req.user.id) : null,
    actorType: 'admin',
  });

  res.status(201).json(policy);
}

export async function update(req, res) {
  const { policyId } = req.params;
  const payload = req.body ?? {};
  const policy = await updateConsentPolicy(parsePositiveInteger(policyId, 'policyId'), payload, {
    actorId: req.user?.id ? String(req.user.id) : null,
  });
  res.json(policy);
}

export async function createVersion(req, res) {
  const { policyId } = req.params;
  const payload = req.body ?? {};
  const version = await createPolicyVersion(parsePositiveInteger(policyId, 'policyId'), payload, {
    actorId: req.user?.id ? String(req.user.id) : null,
  });
  res.status(201).json({
    id: version.id,
    version: version.version,
    effectiveAt: version.effectiveAt,
  });
}

export async function destroy(req, res) {
  const { policyId } = req.params;
  await deleteConsentPolicy(parsePositiveInteger(policyId, 'policyId'), {
    actorId: req.user?.id ? String(req.user.id) : null,
  });
  res.status(204).send();
}

export default {
  index,
  show,
  store,
  update,
  createVersion,
  destroy,
};
