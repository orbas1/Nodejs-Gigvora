import {
  getJobApplicationWorkspace,
  createJobApplication,
  updateJobApplication,
  archiveJobApplication,
  createJobApplicationInterview,
  updateJobApplicationInterview,
  deleteJobApplicationInterview,
  createJobApplicationFavourite,
  updateJobApplicationFavourite,
  deleteJobApplicationFavourite,
  createJobApplicationResponse,
  updateJobApplicationResponse,
  deleteJobApplicationResponse,
} from '../services/jobApplicationService.js';
import { ValidationError } from '../utils/errors.js';
import { resolveRequestUserId } from '../utils/requestContext.js';
import { requireOwnerIdFromRequest, resolveOwnerIdFromRequest } from '../utils/ownerResolver.js';

function resolveActorId(req) {
  const actorId = resolveRequestUserId(req);
  const parsed = Number.parseInt(actorId, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseRequiredPositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

function parseOptionalPositiveInteger(value, fieldName) {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
}

export async function workspace(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to load the job application workspace.');
  const payload = await getJobApplicationWorkspace(ownerId, {
    actorId: resolveActorId(req),
    limit: parseOptionalPositiveInteger(req.query?.limit, 'limit'),
    cursor: req.query?.cursor ? `${req.query.cursor}` : undefined,
  });
  res.json(payload);
}

export async function storeApplication(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to create a job application.');
  const application = await createJobApplication(ownerId, req.body ?? {}, { actorId: resolveActorId(req) });
  res.status(201).json(application);
}

export async function updateApplication(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to update a job application.');
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const application = await updateJobApplication(ownerId, applicationId, req.body ?? {}, {
    actorId: resolveActorId(req),
  });
  res.json(application);
}

export async function removeApplication(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to archive a job application.');
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const result = await archiveJobApplication(ownerId, applicationId, { actorId: resolveActorId(req) });
  res.json(result);
}

export async function storeInterview(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to create an interview.');
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const interview = await createJobApplicationInterview(ownerId, applicationId, req.body ?? {}, {
    actorId: resolveActorId(req),
  });
  res.status(201).json(interview);
}

export async function updateInterview(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to update an interview.');
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const interviewId = parseRequiredPositiveInteger(req.params?.interviewId, 'interviewId');
  const interview = await updateJobApplicationInterview(ownerId, applicationId, interviewId, req.body ?? {}, {
    actorId: resolveActorId(req),
  });
  res.json(interview);
}

export async function destroyInterview(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to delete an interview.');
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const interviewId = parseRequiredPositiveInteger(req.params?.interviewId, 'interviewId');
  const result = await deleteJobApplicationInterview(ownerId, applicationId, interviewId, {
    actorId: resolveActorId(req),
  });
  res.json(result);
}

export async function storeFavourite(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to create a favourite.');
  const favourite = await createJobApplicationFavourite(ownerId, req.body ?? {}, {
    actorId: resolveActorId(req),
  });
  res.status(201).json(favourite);
}

export async function updateFavourite(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to update a favourite.');
  const favouriteId = parseRequiredPositiveInteger(req.params?.favouriteId, 'favouriteId');
  const favourite = await updateJobApplicationFavourite(ownerId, favouriteId, req.body ?? {}, {
    actorId: resolveActorId(req),
  });
  res.json(favourite);
}

export async function destroyFavourite(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to delete a favourite.');
  const favouriteId = parseRequiredPositiveInteger(req.params?.favouriteId, 'favouriteId');
  const result = await deleteJobApplicationFavourite(ownerId, favouriteId, { actorId: resolveActorId(req) });
  res.json(result);
}

export async function storeResponse(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to log a response.');
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const responseRecord = await createJobApplicationResponse(ownerId, applicationId, req.body ?? {}, {
    actorId: resolveActorId(req),
  });
  res.status(201).json(responseRecord);
}

export async function updateResponse(req, res) {
  const ownerId = requireOwnerIdFromRequest(req, 'ownerId is required to update a response.');
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const responseId = parseRequiredPositiveInteger(req.params?.responseId, 'responseId');
  const responseRecord = await updateJobApplicationResponse(ownerId, applicationId, responseId, req.body ?? {}, {
    actorId: resolveActorId(req),
  });
  res.json(responseRecord);
}

export async function destroyResponse(req, res) {
  const ownerId = resolveOwnerIdFromRequest(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to delete a response.');
  }
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const responseId = parseRequiredPositiveInteger(req.params?.responseId, 'responseId');
  const result = await deleteJobApplicationResponse(ownerId, applicationId, responseId, {
    actorId: resolveActorId(req),
  });
  res.json(result);
}

export default {
  workspace,
  storeApplication,
  updateApplication,
  removeApplication,
  storeInterview,
  updateInterview,
  destroyInterview,
  storeFavourite,
  updateFavourite,
  destroyFavourite,
  storeResponse,
  updateResponse,
  destroyResponse,
};
