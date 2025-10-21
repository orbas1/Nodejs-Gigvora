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

function resolveOwnerId(req) {
  const candidates = [
    req.params?.ownerId,
    req.params?.userId,
    req.body?.ownerId,
    req.query?.ownerId,
    req.user?.id,
  ];
  for (const candidate of candidates) {
    if (candidate == null) {
      continue;
    }
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function getActorId(req) {
  if (req.user?.id == null) {
    return null;
  }
  const parsed = Number.parseInt(req.user.id, 10);
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
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to load the job application workspace.');
  }
  const payload = await getJobApplicationWorkspace(ownerId, {
    actorId: getActorId(req),
    limit: parseOptionalPositiveInteger(req.query?.limit, 'limit'),
  });
  res.json(payload);
}

export async function storeApplication(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a job application.');
  }
  const application = await createJobApplication(ownerId, req.body ?? {}, { actorId: getActorId(req) });
  res.status(201).json(application);
}

export async function updateApplication(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update a job application.');
  }
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const application = await updateJobApplication(ownerId, applicationId, req.body ?? {}, { actorId: getActorId(req) });
  res.json(application);
}

export async function removeApplication(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to archive a job application.');
  }
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const result = await archiveJobApplication(ownerId, applicationId, { actorId: getActorId(req) });
  res.json(result);
}

export async function storeInterview(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create an interview.');
  }
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const interview = await createJobApplicationInterview(ownerId, applicationId, req.body ?? {}, {
    actorId: getActorId(req),
  });
  res.status(201).json(interview);
}

export async function updateInterview(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update an interview.');
  }
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const interviewId = parseRequiredPositiveInteger(req.params?.interviewId, 'interviewId');
  const interview = await updateJobApplicationInterview(ownerId, applicationId, interviewId, req.body ?? {}, {
    actorId: getActorId(req),
  });
  res.json(interview);
}

export async function destroyInterview(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to delete an interview.');
  }
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const interviewId = parseRequiredPositiveInteger(req.params?.interviewId, 'interviewId');
  const result = await deleteJobApplicationInterview(ownerId, applicationId, interviewId, {
    actorId: getActorId(req),
  });
  res.json(result);
}

export async function storeFavourite(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to create a favourite.');
  }
  const favourite = await createJobApplicationFavourite(ownerId, req.body ?? {}, { actorId: getActorId(req) });
  res.status(201).json(favourite);
}

export async function updateFavourite(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update a favourite.');
  }
  const favouriteId = parseRequiredPositiveInteger(req.params?.favouriteId, 'favouriteId');
  const favourite = await updateJobApplicationFavourite(ownerId, favouriteId, req.body ?? {}, {
    actorId: getActorId(req),
  });
  res.json(favourite);
}

export async function destroyFavourite(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to delete a favourite.');
  }
  const favouriteId = parseRequiredPositiveInteger(req.params?.favouriteId, 'favouriteId');
  const result = await deleteJobApplicationFavourite(ownerId, favouriteId, { actorId: getActorId(req) });
  res.json(result);
}

export async function storeResponse(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to log a response.');
  }
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const responseRecord = await createJobApplicationResponse(ownerId, applicationId, req.body ?? {}, {
    actorId: getActorId(req),
  });
  res.status(201).json(responseRecord);
}

export async function updateResponse(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to update a response.');
  }
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const responseId = parseRequiredPositiveInteger(req.params?.responseId, 'responseId');
  const responseRecord = await updateJobApplicationResponse(ownerId, applicationId, responseId, req.body ?? {}, {
    actorId: getActorId(req),
  });
  res.json(responseRecord);
}

export async function destroyResponse(req, res) {
  const ownerId = resolveOwnerId(req);
  if (!ownerId) {
    throw new ValidationError('ownerId is required to delete a response.');
  }
  const applicationId = parseRequiredPositiveInteger(req.params?.applicationId, 'applicationId');
  const responseId = parseRequiredPositiveInteger(req.params?.responseId, 'responseId');
  const result = await deleteJobApplicationResponse(ownerId, applicationId, responseId, {
    actorId: getActorId(req),
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
