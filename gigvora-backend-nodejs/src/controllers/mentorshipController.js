import { AuthorizationError, ValidationError } from '../utils/errors.js';
import { resolveRequestUserId } from '../utils/requestContext.js';
import {
  getMentorDashboard,
  updateMentorAvailability,
  updateMentorPackages,
  submitMentorProfile,
} from '../services/mentorshipService.js';

function resolveMentorId(req) {
  const explicitId = req.params?.mentorId ?? req.query?.mentorId ?? req.body?.mentorId;
  const inferredId = explicitId ?? resolveRequestUserId(req);
  if (!inferredId) {
    throw new ValidationError('mentorId is required.');
  }
  return inferredId;
}

function normaliseRoles(rolesCandidate) {
  if (!rolesCandidate) {
    return [];
  }
  if (Array.isArray(rolesCandidate)) {
    return rolesCandidate.map((role) => `${role}`.toLowerCase());
  }
  return `${rolesCandidate}`
    .split(/[;,\s]+/)
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);
}

function ensureMentorRole(req) {
  const potentialSources = [
    req.user?.roles,
    req.user?.role,
    req.headers?.['x-workspace-roles'],
    req.headers?.['x-user-role'],
    req.headers?.['x-role'],
  ];

  const roles = potentialSources.flatMap(normaliseRoles).filter(Boolean);
  if (!roles.includes('mentor') && !roles.includes('admin')) {
    throw new AuthorizationError('Mentor access required.');
  }
}

export function dashboard(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const lookbackDays = req.query?.lookbackDays;
  const dashboard = getMentorDashboard(mentorId, { lookbackDays });
  res.json(dashboard);
}

export function saveAvailability(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { slots } = req.body ?? {};
  const availability = updateMentorAvailability(mentorId, slots ?? []);
  res.json({ availability });
}

export function savePackages(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const { packages } = req.body ?? {};
  const savedPackages = updateMentorPackages(mentorId, packages ?? []);
  res.json({ packages: savedPackages });
}

export function saveProfile(req, res) {
  ensureMentorRole(req);
  const mentorId = resolveMentorId(req);
  const profile = submitMentorProfile(mentorId, req.body ?? {});
  res.status(201).json({ profile });
}

export default {
  dashboard,
  saveAvailability,
  savePackages,
  saveProfile,
};
