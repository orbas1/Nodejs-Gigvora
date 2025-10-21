import * as service from '../services/adminJobApplicationService.js';
import logger from '../utils/logger.js';
import { extractAdminActor, coercePositiveInteger } from '../utils/adminRequestContext.js';

function buildServiceActor(req) {
  const actor = extractAdminActor(req);
  const name = actor.actorName || actor.descriptor || 'Admin';
  return { actor, serviceActor: { id: actor.actorId ?? null, name } };
}

export async function listJobApplications(req, res) {
  const result = await service.listJobApplications(req.query ?? {});
  res.json(result);
}

export async function getJobApplication(req, res) {
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const result = await service.getJobApplication(applicationId);
  res.json(result);
}

export async function createJobApplication(req, res) {
  const { actor, serviceActor } = buildServiceActor(req);
  const result = await service.createJobApplication(req.body ?? {}, serviceActor);
  logger.info({ actor: actor.reference, applicationId: result?.id }, 'Admin job application created');
  res.status(201).json(result);
}

export async function updateJobApplication(req, res) {
  const { actor, serviceActor } = buildServiceActor(req);
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const result = await service.updateJobApplication(applicationId, req.body ?? {}, serviceActor);
  logger.info({ actor: actor.reference, applicationId }, 'Admin job application updated');
  res.json(result);
}

export async function deleteJobApplication(req, res) {
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  await service.deleteJobApplication(applicationId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, applicationId }, 'Admin job application deleted');
  res.status(204).send();
}

export async function createJobApplicationNote(req, res) {
  const { actor, serviceActor } = buildServiceActor(req);
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const note = await service.createJobApplicationNote(applicationId, req.body ?? {}, serviceActor);
  logger.info({ actor: actor.reference, applicationId, noteId: note?.id }, 'Admin job application note created');
  res.status(201).json(note);
}

export async function updateJobApplicationNote(req, res) {
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const noteId = coercePositiveInteger(req.params?.noteId, 'noteId');
  const note = await service.updateJobApplicationNote(applicationId, noteId, req.body ?? {});
  res.json(note);
}

export async function deleteJobApplicationNote(req, res) {
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const noteId = coercePositiveInteger(req.params?.noteId, 'noteId');
  await service.deleteJobApplicationNote(applicationId, noteId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, applicationId, noteId }, 'Admin job application note deleted');
  res.status(204).send();
}

export async function createJobApplicationInterview(req, res) {
  const { actor, serviceActor } = buildServiceActor(req);
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const interview = await service.createJobApplicationInterview(applicationId, req.body ?? {}, serviceActor);
  logger.info({ actor: actor.reference, applicationId, interviewId: interview?.id }, 'Admin job application interview created');
  res.status(201).json(interview);
}

export async function updateJobApplicationInterview(req, res) {
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const interviewId = coercePositiveInteger(req.params?.interviewId, 'interviewId');
  const interview = await service.updateJobApplicationInterview(applicationId, interviewId, req.body ?? {});
  res.json(interview);
}

export async function deleteJobApplicationInterview(req, res) {
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const interviewId = coercePositiveInteger(req.params?.interviewId, 'interviewId');
  await service.deleteJobApplicationInterview(applicationId, interviewId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, applicationId, interviewId }, 'Admin job application interview deleted');
  res.status(204).send();
}

export async function createJobApplicationDocument(req, res) {
  const { actor, serviceActor } = buildServiceActor(req);
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const document = await service.createJobApplicationDocument(applicationId, req.body ?? {}, serviceActor);
  logger.info({ actor: actor.reference, applicationId, documentId: document?.id }, 'Admin job application document created');
  res.status(201).json(document);
}

export async function updateJobApplicationDocument(req, res) {
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const documentId = coercePositiveInteger(req.params?.documentId, 'documentId');
  const document = await service.updateJobApplicationDocument(applicationId, documentId, req.body ?? {});
  res.json(document);
}

export async function deleteJobApplicationDocument(req, res) {
  const applicationId = coercePositiveInteger(req.params?.applicationId, 'applicationId');
  const documentId = coercePositiveInteger(req.params?.documentId, 'documentId');
  await service.deleteJobApplicationDocument(applicationId, documentId);
  const actor = extractAdminActor(req);
  logger.info({ actor: actor.reference, applicationId, documentId }, 'Admin job application document deleted');
  res.status(204).send();
}

export default {
  listJobApplications,
  getJobApplication,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  createJobApplicationNote,
  updateJobApplicationNote,
  deleteJobApplicationNote,
  createJobApplicationInterview,
  updateJobApplicationInterview,
  deleteJobApplicationInterview,
  createJobApplicationDocument,
  updateJobApplicationDocument,
  deleteJobApplicationDocument,
};
