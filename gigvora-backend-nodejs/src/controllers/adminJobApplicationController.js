import * as service from '../services/adminJobApplicationService.js';

function buildActorContext(req) {
  const actorId = req.user?.id ?? null;
  const actorName = req.user?.id ? `Admin #${req.user.id}` : 'Admin';
  return { id: actorId, name: actorName };
}

export async function listJobApplications(req, res) {
  const result = await service.listJobApplications(req.query ?? {});
  res.json(result);
}

export async function getJobApplication(req, res) {
  const { applicationId } = req.params;
  const result = await service.getJobApplication(applicationId);
  res.json(result);
}

export async function createJobApplication(req, res) {
  const actor = buildActorContext(req);
  const result = await service.createJobApplication(req.body ?? {}, actor);
  res.status(201).json(result);
}

export async function updateJobApplication(req, res) {
  const actor = buildActorContext(req);
  const { applicationId } = req.params;
  const result = await service.updateJobApplication(applicationId, req.body ?? {}, actor);
  res.json(result);
}

export async function deleteJobApplication(req, res) {
  const { applicationId } = req.params;
  await service.deleteJobApplication(applicationId);
  res.status(204).send();
}

export async function createJobApplicationNote(req, res) {
  const actor = buildActorContext(req);
  const { applicationId } = req.params;
  const note = await service.createJobApplicationNote(applicationId, req.body ?? {}, actor);
  res.status(201).json(note);
}

export async function updateJobApplicationNote(req, res) {
  const { applicationId, noteId } = req.params;
  const note = await service.updateJobApplicationNote(applicationId, noteId, req.body ?? {});
  res.json(note);
}

export async function deleteJobApplicationNote(req, res) {
  const { applicationId, noteId } = req.params;
  await service.deleteJobApplicationNote(applicationId, noteId);
  res.status(204).send();
}

export async function createJobApplicationInterview(req, res) {
  const actor = buildActorContext(req);
  const { applicationId } = req.params;
  const interview = await service.createJobApplicationInterview(applicationId, req.body ?? {}, actor);
  res.status(201).json(interview);
}

export async function updateJobApplicationInterview(req, res) {
  const { applicationId, interviewId } = req.params;
  const interview = await service.updateJobApplicationInterview(applicationId, interviewId, req.body ?? {});
  res.json(interview);
}

export async function deleteJobApplicationInterview(req, res) {
  const { applicationId, interviewId } = req.params;
  await service.deleteJobApplicationInterview(applicationId, interviewId);
  res.status(204).send();
}

export async function createJobApplicationDocument(req, res) {
  const actor = buildActorContext(req);
  const { applicationId } = req.params;
  const document = await service.createJobApplicationDocument(applicationId, req.body ?? {}, actor);
  res.status(201).json(document);
}

export async function updateJobApplicationDocument(req, res) {
  const { applicationId, documentId } = req.params;
  const document = await service.updateJobApplicationDocument(applicationId, documentId, req.body ?? {});
  res.json(document);
}

export async function deleteJobApplicationDocument(req, res) {
  const { applicationId, documentId } = req.params;
  await service.deleteJobApplicationDocument(applicationId, documentId);
  res.status(204).send();
}
