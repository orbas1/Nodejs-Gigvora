import { getAgencyDashboard } from '../services/agencyDashboardService.js';
import {
  getAgencyProfileManagement,
  updateAgencyProfileBasics,
  createAgencyProfileMedia,
  updateAgencyProfileMedia,
  deleteAgencyProfileMedia,
  createAgencyProfileSkill,
  updateAgencyProfileSkill,
  deleteAgencyProfileSkill,
  createAgencyProfileCredential,
  updateAgencyProfileCredential,
  deleteAgencyProfileCredential,
  createAgencyProfileExperience,
  updateAgencyProfileExperience,
  deleteAgencyProfileExperience,
  createAgencyProfileWorkforceSegment,
  updateAgencyProfileWorkforceSegment,
  deleteAgencyProfileWorkforceSegment,
} from '../services/agencyProfileService.js';
import {
  updateAgencyProfileBasicsSchema,
  createAgencyProfileMediaSchema,
  updateAgencyProfileMediaSchema,
  createAgencyProfileSkillSchema,
  updateAgencyProfileSkillSchema,
  createAgencyProfileCredentialSchema,
  updateAgencyProfileCredentialSchema,
  createAgencyProfileExperienceSchema,
  updateAgencyProfileExperienceSchema,
  createAgencyProfileWorkforceSegmentSchema,
  updateAgencyProfileWorkforceSegmentSchema,
} from '../validation/schemas/agencySchemas.js';
import { ValidationError } from '../utils/errors.js';

function parseNumber(value) {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseIdentifier(value, label = 'id') {
  if (value == null) {
    throw new ValidationError(`Missing ${label}.`);
  }
  const parsed = Number.parseInt(`${value}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`Invalid ${label}.`);
  }
  return parsed;
}

function resolveActorContext(req) {
  return {
    actorId: req.user?.id ?? null,
    actorRoles: Array.isArray(req.user?.roles) ? req.user.roles : [],
  };
}

export async function dashboard(req, res) {
  const { workspaceId, workspaceSlug, lookbackDays } = req.query ?? {};
  const actorId = req.user?.id ?? null;
  const actorRole = req.user?.type ?? null;

  const payload = {
    workspaceId: parseNumber(workspaceId),
    workspaceSlug: workspaceSlug ?? undefined,
    lookbackDays: parseNumber(lookbackDays),
  };

  const result = await getAgencyDashboard(payload, { actorId, actorRole });
  res.json(result);
}

export async function profile(req, res) {
  const context = resolveActorContext(req);
  const result = await getAgencyProfileManagement({}, context);
  res.json(result);
}

export async function updateProfile(req, res) {
  const context = resolveActorContext(req);
  const payload = updateAgencyProfileBasicsSchema.parse(req.body ?? {});
  const result = await updateAgencyProfileBasics(context.actorId, payload);
  res.json(result);
}

export async function createMedia(req, res) {
  const context = resolveActorContext(req);
  const payload = createAgencyProfileMediaSchema.parse(req.body ?? {});
  const result = await createAgencyProfileMedia(context.actorId, payload);
  res.status(201).json(result);
}

export async function updateMedia(req, res) {
  const context = resolveActorContext(req);
  const mediaId = parseIdentifier(req.params?.mediaId, 'mediaId');
  const payload = updateAgencyProfileMediaSchema.parse(req.body ?? {});
  const result = await updateAgencyProfileMedia(context.actorId, mediaId, payload);
  res.json(result);
}

export async function deleteMedia(req, res) {
  const context = resolveActorContext(req);
  const mediaId = parseIdentifier(req.params?.mediaId, 'mediaId');
  await deleteAgencyProfileMedia(context.actorId, mediaId);
  res.status(204).end();
}

export async function createSkill(req, res) {
  const context = resolveActorContext(req);
  const payload = createAgencyProfileSkillSchema.parse(req.body ?? {});
  const result = await createAgencyProfileSkill(context.actorId, payload);
  res.status(201).json(result);
}

export async function updateSkill(req, res) {
  const context = resolveActorContext(req);
  const skillId = parseIdentifier(req.params?.skillId, 'skillId');
  const payload = updateAgencyProfileSkillSchema.parse(req.body ?? {});
  const result = await updateAgencyProfileSkill(context.actorId, skillId, payload);
  res.json(result);
}

export async function deleteSkill(req, res) {
  const context = resolveActorContext(req);
  const skillId = parseIdentifier(req.params?.skillId, 'skillId');
  await deleteAgencyProfileSkill(context.actorId, skillId);
  res.status(204).end();
}

export async function createCredential(req, res) {
  const context = resolveActorContext(req);
  const payload = createAgencyProfileCredentialSchema.parse(req.body ?? {});
  const result = await createAgencyProfileCredential(context.actorId, payload);
  res.status(201).json(result);
}

export async function updateCredential(req, res) {
  const context = resolveActorContext(req);
  const credentialId = parseIdentifier(req.params?.credentialId, 'credentialId');
  const payload = updateAgencyProfileCredentialSchema.parse(req.body ?? {});
  const result = await updateAgencyProfileCredential(context.actorId, credentialId, payload);
  res.json(result);
}

export async function deleteCredential(req, res) {
  const context = resolveActorContext(req);
  const credentialId = parseIdentifier(req.params?.credentialId, 'credentialId');
  await deleteAgencyProfileCredential(context.actorId, credentialId);
  res.status(204).end();
}

export async function createExperience(req, res) {
  const context = resolveActorContext(req);
  const payload = createAgencyProfileExperienceSchema.parse(req.body ?? {});
  const result = await createAgencyProfileExperience(context.actorId, payload);
  res.status(201).json(result);
}

export async function updateExperience(req, res) {
  const context = resolveActorContext(req);
  const experienceId = parseIdentifier(req.params?.experienceId, 'experienceId');
  const payload = updateAgencyProfileExperienceSchema.parse(req.body ?? {});
  const result = await updateAgencyProfileExperience(context.actorId, experienceId, payload);
  res.json(result);
}

export async function deleteExperience(req, res) {
  const context = resolveActorContext(req);
  const experienceId = parseIdentifier(req.params?.experienceId, 'experienceId');
  await deleteAgencyProfileExperience(context.actorId, experienceId);
  res.status(204).end();
}

export async function createWorkforceSegment(req, res) {
  const context = resolveActorContext(req);
  const payload = createAgencyProfileWorkforceSegmentSchema.parse(req.body ?? {});
  const result = await createAgencyProfileWorkforceSegment(context.actorId, payload);
  res.status(201).json(result);
}

export async function updateWorkforceSegment(req, res) {
  const context = resolveActorContext(req);
  const segmentId = parseIdentifier(req.params?.segmentId, 'segmentId');
  const payload = updateAgencyProfileWorkforceSegmentSchema.parse(req.body ?? {});
  const result = await updateAgencyProfileWorkforceSegment(context.actorId, segmentId, payload);
  res.json(result);
}

export async function deleteWorkforceSegment(req, res) {
  const context = resolveActorContext(req);
  const segmentId = parseIdentifier(req.params?.segmentId, 'segmentId');
  await deleteAgencyProfileWorkforceSegment(context.actorId, segmentId);
  res.status(204).end();
}

export default {
  dashboard,
  profile,
  updateProfile,
  createMedia,
  updateMedia,
  deleteMedia,
  createSkill,
  updateSkill,
  deleteSkill,
  createCredential,
  updateCredential,
  deleteCredential,
  createExperience,
  updateExperience,
  deleteExperience,
  createWorkforceSegment,
  updateWorkforceSegment,
  deleteWorkforceSegment,
};

