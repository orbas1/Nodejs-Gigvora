import { ProviderWorkspace, ProviderWorkspaceMember } from '../models/index.js';
import { AuthorizationError, NotFoundError, ValidationError } from './errors.js';
import {
  mergeDefined,
  toOptionalPositiveInteger,
  toOptionalString,
} from './controllerUtils.js';

export function normaliseWorkspaceIdentifiers(source = {}, { required = false } = {}) {
  const workspaceId = toOptionalPositiveInteger(source.workspaceId, {
    fieldName: 'workspaceId',
    required: false,
  });
  const workspaceSlug = toOptionalString(source.workspaceSlug, {
    fieldName: 'workspaceSlug',
    maxLength: 120,
  });

  if (required && !workspaceId && !workspaceSlug) {
    throw new ValidationError('A workspaceId or workspaceSlug must be provided.');
  }

  return mergeDefined({}, { workspaceId, workspaceSlug });
}

export function resolveWorkspaceIdentifiersFromRequest(req = {}, body = {}, { required = false } = {}) {
  const identifiers = {
    workspaceId:
      body.workspaceId ??
      req.query?.workspaceId ??
      req.params?.workspaceId ??
      req.body?.workspaceId ??
      req.params?.workspaceId,
    workspaceSlug:
      body.workspaceSlug ??
      req.query?.workspaceSlug ??
      req.params?.workspaceSlug ??
      req.body?.workspaceSlug ??
      req.params?.workspaceSlug,
  };

  return normaliseWorkspaceIdentifiers(identifiers, { required });
}

export async function resolveWorkspaceForActor(identifiers = {}, actor = {}, { requireMembership = true } = {}) {
  const { workspaceId, workspaceSlug } = normaliseWorkspaceIdentifiers(identifiers, { required: true });

  let workspace = null;
  if (workspaceId) {
    workspace = await ProviderWorkspace.findByPk(workspaceId);
  } else if (workspaceSlug) {
    workspace = await ProviderWorkspace.findOne({ where: { slug: workspaceSlug } });
  }

  if (!workspace) {
    throw new NotFoundError('Workspace could not be found.');
  }

  if (!requireMembership) {
    return { workspace, membership: null };
  }

  const actorId = actor?.actorId;
  const isAdmin = actor?.isAdmin;
  if (!actorId) {
    throw new AuthorizationError('Authentication required.');
  }

  if (isAdmin) {
    return { workspace, membership: null };
  }

  const membership = await ProviderWorkspaceMember.findOne({
    where: {
      workspaceId: workspace.id,
      userId: actorId,
      status: 'active',
    },
  });

  if (!membership) {
    throw new AuthorizationError('You do not have access to this workspace.');
  }

  return { workspace, membership };
}

export default {
  normaliseWorkspaceIdentifiers,
  resolveWorkspaceIdentifiersFromRequest,
  resolveWorkspaceForActor,
};
