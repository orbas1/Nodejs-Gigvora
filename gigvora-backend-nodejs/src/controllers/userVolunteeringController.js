import volunteeringManagementService from '../services/volunteeringManagementService.js';

export async function getManagementSnapshot(req, res) {
  const snapshot = await volunteeringManagementService.getUserVolunteeringManagement(req.params.id, {
    bypassCache: req.query.fresh === 'true',
  });
  res.json(snapshot);
}

export async function createApplication(req, res) {
  const application = await volunteeringManagementService.createVolunteerApplication(req.params.id, req.body);
  res.status(201).json(application);
}

export async function updateApplication(req, res) {
  const application = await volunteeringManagementService.updateVolunteerApplication(
    req.params.id,
    req.params.applicationId,
    req.body,
  );
  res.json(application);
}

export async function createResponse(req, res) {
  const response = await volunteeringManagementService.createVolunteerResponse(
    req.params.id,
    req.params.applicationId,
    req.body,
  );
  res.status(201).json(response);
}

export async function updateResponse(req, res) {
  const response = await volunteeringManagementService.updateVolunteerResponse(
    req.params.id,
    req.params.applicationId,
    req.params.responseId,
    req.body,
  );
  res.json(response);
}

export async function deleteResponse(req, res) {
  await volunteeringManagementService.deleteVolunteerResponse(
    req.params.id,
    req.params.applicationId,
    req.params.responseId,
  );
  res.status(204).send();
}

export async function upsertContract(req, res) {
  const contract = await volunteeringManagementService.upsertVolunteerContract(
    req.params.id,
    req.params.applicationId,
    req.body,
  );
  res.json(contract);
}

export async function createSpend(req, res) {
  const spend = await volunteeringManagementService.recordVolunteerSpend(
    req.params.id,
    req.params.applicationId,
    req.body,
  );
  res.status(201).json(spend);
}

export async function updateSpend(req, res) {
  const spend = await volunteeringManagementService.updateVolunteerSpend(
    req.params.id,
    req.params.applicationId,
    req.params.spendId,
    req.body,
  );
  res.json(spend);
}

export async function deleteSpend(req, res) {
  await volunteeringManagementService.deleteVolunteerSpend(
    req.params.id,
    req.params.applicationId,
    req.params.spendId,
  );
  res.status(204).send();
}

export async function createReview(req, res) {
  const review = await volunteeringManagementService.createVolunteerReview(
    req.params.id,
    req.params.applicationId,
    req.body,
  );
  res.status(201).json(review);
}

export async function updateReview(req, res) {
  const review = await volunteeringManagementService.updateVolunteerReview(
    req.params.id,
    req.params.applicationId,
    req.params.reviewId,
    req.body,
  );
  res.json(review);
}

export async function deleteReview(req, res) {
  await volunteeringManagementService.deleteVolunteerReview(
    req.params.id,
    req.params.applicationId,
    req.params.reviewId,
  );
  res.status(204).send();
}

export default {
  getManagementSnapshot,
  createApplication,
  updateApplication,
  createResponse,
  updateResponse,
  deleteResponse,
  upsertContract,
  createSpend,
  updateSpend,
  deleteSpend,
  createReview,
  updateReview,
  deleteReview,
};
