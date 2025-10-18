import {
  getVolunteeringWorkspace,
  createApplication,
  updateApplication,
  deleteApplication,
  createResponse,
  updateResponse,
  deleteResponse,
  createContract,
  updateContract,
  deleteContract,
  createSpend,
  updateSpend,
  deleteSpend,
} from '../services/volunteeringService.js';
import { ValidationError } from '../utils/errors.js';

function parseId(value, fieldName) {
  if (value == null || value === '') {
    throw new ValidationError(`${fieldName} is required.`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

export async function workspace(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.query.freelancerId, 'freelancerId');
  const payload = await getVolunteeringWorkspace(freelancerId);
  res.json(payload);
}

export async function storeApplication(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const application = await createApplication(freelancerId, req.body ?? {});
  res.status(201).json(application);
}

export async function patchApplication(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const applicationId = parseId(req.params.applicationId, 'applicationId');
  const application = await updateApplication(freelancerId, applicationId, req.body ?? {});
  res.json(application);
}

export async function destroyApplication(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const applicationId = parseId(req.params.applicationId, 'applicationId');
  const result = await deleteApplication(freelancerId, applicationId);
  res.json(result);
}

export async function storeResponse(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const applicationId = parseId(req.params.applicationId ?? req.body?.applicationId, 'applicationId');
  const response = await createResponse(freelancerId, applicationId, req.body ?? {});
  res.status(201).json(response);
}

export async function patchResponse(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const responseId = parseId(req.params.responseId, 'responseId');
  const response = await updateResponse(freelancerId, responseId, req.body ?? {});
  res.json(response);
}

export async function destroyResponse(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const responseId = parseId(req.params.responseId, 'responseId');
  const result = await deleteResponse(freelancerId, responseId);
  res.json(result);
}

export async function storeContract(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const contract = await createContract(freelancerId, req.body ?? {});
  res.status(201).json(contract);
}

export async function patchContract(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const contractId = parseId(req.params.contractId, 'contractId');
  const contract = await updateContract(freelancerId, contractId, req.body ?? {});
  res.json(contract);
}

export async function destroyContract(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const contractId = parseId(req.params.contractId, 'contractId');
  const result = await deleteContract(freelancerId, contractId);
  res.json(result);
}

export async function storeSpend(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const contractId = parseId(req.params.contractId ?? req.body?.contractId, 'contractId');
  const spend = await createSpend(freelancerId, contractId, req.body ?? {});
  res.status(201).json(spend);
}

export async function patchSpend(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const spendId = parseId(req.params.spendId, 'spendId');
  const spend = await updateSpend(freelancerId, spendId, req.body ?? {});
  res.json(spend);
}

export async function destroySpend(req, res) {
  const freelancerId = parseId(req.params.freelancerId ?? req.body?.freelancerId, 'freelancerId');
  const spendId = parseId(req.params.spendId, 'spendId');
  const result = await deleteSpend(freelancerId, spendId);
  res.json(result);
}

export default {
  workspace,
  storeApplication,
  patchApplication,
  destroyApplication,
  storeResponse,
  patchResponse,
  destroyResponse,
  storeContract,
  patchContract,
  destroyContract,
  storeSpend,
  patchSpend,
  destroySpend,
};
