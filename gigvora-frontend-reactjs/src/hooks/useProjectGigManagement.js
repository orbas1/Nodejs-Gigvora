import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchProjectGigManagement,
  createProject as createProjectRequest,
  updateProject as updateProjectRequest,
  addProjectAsset as addProjectAssetRequest,
  updateProjectAsset as updateProjectAssetRequest,
  deleteProjectAsset as deleteProjectAssetRequest,
  updateWorkspace as updateWorkspaceRequest,
  archiveProject as archiveProjectRequest,
  restoreProject as restoreProjectRequest,
  createGigOrder as createGigOrderRequest,
  updateGigOrder as updateGigOrderRequest,
  createProjectBid as createProjectBidRequest,
  updateProjectBid as updateProjectBidRequest,
  sendProjectInvitation as sendProjectInvitationRequest,
  updateProjectInvitation as updateProjectInvitationRequest,
  updateAutoMatchSettings as updateAutoMatchSettingsRequest,
  createAutoMatch as createAutoMatchRequest,
  updateAutoMatch as updateAutoMatchRequest,
  createProjectReview as createProjectReviewRequest,
  createEscrowTransaction as createEscrowTransactionRequest,
  updateEscrowSettings as updateEscrowSettingsRequest,
  addGigTimelineEvent as addGigTimelineEventRequest,
  postGigOrderMessage as postGigOrderMessageRequest,
  createGigEscrowCheckpoint as createGigEscrowCheckpointRequest,
  updateGigEscrowCheckpoint as updateGigEscrowCheckpointRequest,
  createProjectMilestone as createProjectMilestoneRequest,
  updateProjectMilestone as updateProjectMilestoneRequest,
  deleteProjectMilestone as deleteProjectMilestoneRequest,
  createProjectCollaborator as createProjectCollaboratorRequest,
  updateProjectCollaborator as updateProjectCollaboratorRequest,
  deleteProjectCollaborator as deleteProjectCollaboratorRequest,
  createGigTimelineEvent as createGigTimelineEventRequest,
  updateGigTimelineEvent as updateGigTimelineEventRequest,
  createGigSubmission as createGigSubmissionRequest,
  updateGigSubmission as updateGigSubmissionRequest,
  postGigChatMessage as postGigChatMessageRequest,
} from '../services/projectGigManagement.js';

const DEFAULT_PERMISSION_ERROR = 'You do not have permission to manage this project workspace.';

function collectPermissionTokens(candidate, bucket) {
  if (!candidate) {
    return;
  }

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim().toLowerCase();
    if (trimmed) {
      bucket.add(trimmed);
    }
    return;
  }

  if (typeof candidate === 'boolean') {
    return;
  }

  if (Array.isArray(candidate)) {
    candidate.forEach((entry) => collectPermissionTokens(entry, bucket));
    return;
  }

  if (typeof candidate === 'object') {
    Object.entries(candidate).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          bucket.add(key.trim().toLowerCase());
        }
        return;
      }
      collectPermissionTokens(value, bucket);
    });
  }
}

function canManageWorkspace(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return false;
  }

  if (snapshot.access?.canManage === true || snapshot.permissions?.canManage === true) {
    return true;
  }

  const tokens = new Set();
  collectPermissionTokens(snapshot.permissions, tokens);
  collectPermissionTokens(snapshot.access?.permissions, tokens);
  collectPermissionTokens(snapshot.roles, tokens);

  const privilegedTokens = [
    'manage',
    'manage_projects',
    'projects.manage',
    'project.manage',
    'workspace.manage',
    'gig.manage',
    'admin',
    'owner',
  ];

  return privilegedTokens.some((token) => tokens.has(token));
}

const DEFAULT_STATE = { data: null, loading: false, error: null };

export default function useProjectGigManagement(userId, { enabled = true, initialData = null } = {}) {
  const [state, setState] = useState(() => ({
    data: initialData ?? null,
    loading: Boolean(enabled && userId),
    error: null,
  }));

  useEffect(() => {
    if (initialData) {
      setState((current) => ({ ...current, data: initialData }));
    }
  }, [initialData]);

  const load = useCallback(async () => {
    if (!enabled || !userId) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const snapshot = await fetchProjectGigManagement(userId);
      setState((current) => ({ ...current, data: snapshot, error: null, loading: false }));
    } catch (err) {
      setState((current) => ({ ...current, error: err, loading: false }));
    }
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }
    load();
  }, [enabled, userId, load]);

  const { data, loading, error } = state ?? DEFAULT_STATE;
  const canManageWorkspaceFlag = useMemo(() => canManageWorkspace(data), [data]);

  const actions = useMemo(() => {
    const requireUserContext = () => {
      if (!userId) {
        throw new Error('A user context is required to manage project gig workspaces.');
      }
    };
    const guard = (message = DEFAULT_PERMISSION_ERROR) => {
      if (!canManageWorkspaceFlag) {
        throw new Error(message);
      }
    };

    return {
      async createProject(payload) {
        requireUserContext();
        guard('You do not have permission to create project workspaces.');
        const response = await createProjectRequest(userId, payload);
        await load();
        return response;
      },
      async updateProject(projectId, payload) {
        requireUserContext();
        guard('You do not have permission to update this project.');
        await updateProjectRequest(userId, projectId, payload);
        await load();
      },
      async addAsset(projectId, payload) {
        requireUserContext();
        guard('You do not have permission to update this project workspace.');
        const response = await addProjectAssetRequest(userId, projectId, payload);
        await load();
        return response;
      },
      async updateAsset(projectId, assetId, payload) {
        requireUserContext();
        guard('You do not have permission to update this project asset.');
        await updateProjectAssetRequest(userId, projectId, assetId, payload);
        await load();
      },
      async deleteAsset(projectId, assetId) {
        requireUserContext();
        guard('You do not have permission to delete this project asset.');
        await deleteProjectAssetRequest(userId, projectId, assetId);
        await load();
      },
      async updateWorkspace(projectId, payload) {
        requireUserContext();
        guard('You do not have permission to update this project workspace.');
        const response = await updateWorkspaceRequest(userId, projectId, payload);
        await load();
        return response;
      },
      async createMilestone(projectId, payload) {
        requireUserContext();
        guard('You do not have permission to manage project milestones.');
        await createProjectMilestoneRequest(userId, projectId, payload);
        await load();
      },
      async updateMilestone(projectId, milestoneId, payload) {
        requireUserContext();
        guard('You do not have permission to manage project milestones.');
        await updateProjectMilestoneRequest(userId, projectId, milestoneId, payload);
        await load();
      },
      async deleteMilestone(projectId, milestoneId) {
        requireUserContext();
        guard('You do not have permission to manage project milestones.');
        await deleteProjectMilestoneRequest(userId, projectId, milestoneId);
        await load();
      },
      async createCollaborator(projectId, payload) {
        requireUserContext();
        guard('You do not have permission to manage project collaborators.');
        await createProjectCollaboratorRequest(userId, projectId, payload);
        await load();
      },
      async updateCollaborator(projectId, collaboratorId, payload) {
        requireUserContext();
        guard('You do not have permission to manage project collaborators.');
        await updateProjectCollaboratorRequest(userId, projectId, collaboratorId, payload);
        await load();
      },
      async deleteCollaborator(projectId, collaboratorId) {
        requireUserContext();
        guard('You do not have permission to manage project collaborators.');
        await deleteProjectCollaboratorRequest(userId, projectId, collaboratorId);
        await load();
      },
      async archiveProject(projectId, payload = {}) {
        requireUserContext();
        guard('You do not have permission to archive this project.');
        await archiveProjectRequest(userId, projectId, payload);
        await load();
      },
      async restoreProject(projectId, payload = {}) {
        requireUserContext();
        guard('You do not have permission to restore this project.');
        await restoreProjectRequest(userId, projectId, payload);
        await load();
      },
      async createGigOrder(payload) {
        requireUserContext();
        guard('You do not have permission to manage gig orders.');
        const response = await createGigOrderRequest(userId, payload);
        await load();
        return response;
      },
      async updateGigOrder(orderId, payload) {
        requireUserContext();
        guard('You do not have permission to manage gig orders.');
        const response = await updateGigOrderRequest(userId, orderId, payload);
        await load();
        return response;
      },
      async createGigTimelineEvent(orderId, payload) {
        requireUserContext();
        guard('You do not have permission to manage gig timelines.');
        await createGigTimelineEventRequest(userId, orderId, payload);
        await load();
      },
      async updateGigTimelineEvent(orderId, eventId, payload) {
        requireUserContext();
        guard('You do not have permission to manage gig timelines.');
        await updateGigTimelineEventRequest(userId, orderId, eventId, payload);
        await load();
      },
      async createGigSubmission(orderId, payload) {
        requireUserContext();
        guard('You do not have permission to log gig submissions.');
        await createGigSubmissionRequest(userId, orderId, payload);
        await load();
      },
      async updateGigSubmission(orderId, submissionId, payload) {
        requireUserContext();
        guard('You do not have permission to update gig submissions.');
        await updateGigSubmissionRequest(userId, orderId, submissionId, payload);
        await load();
      },
      async postGigChatMessage(orderId, payload) {
        requireUserContext();
        guard('You do not have permission to post in-gig chat messages.');
        await postGigChatMessageRequest(userId, orderId, payload);
        await load();
      },
      async addTimelineEvent(orderId, payload) {
        requireUserContext();
        guard('You do not have permission to log gig timeline events.');
        await addGigTimelineEventRequest(userId, orderId, payload);
        await load();
      },
      async postGigMessage(orderId, payload) {
        requireUserContext();
        guard('You do not have permission to message within gig orders.');
        await postGigOrderMessageRequest(userId, orderId, payload);
        await load();
      },
      async createEscrowCheckpoint(orderId, payload) {
        requireUserContext();
        guard('You do not have permission to manage escrow checkpoints.');
        await createGigEscrowCheckpointRequest(userId, orderId, payload);
        await load();
      },
      async updateEscrowCheckpoint(orderId, checkpointId, payload) {
        requireUserContext();
        guard('You do not have permission to manage escrow checkpoints.');
        await updateGigEscrowCheckpointRequest(userId, orderId, checkpointId, payload);
        await load();
      },
      async createProjectBid(payload) {
        requireUserContext();
        guard('You do not have permission to manage project bids.');
        await createProjectBidRequest(userId, payload);
        await load();
      },
      async updateProjectBid(bidId, payload) {
        requireUserContext();
        guard('You do not have permission to manage project bids.');
        await updateProjectBidRequest(userId, bidId, payload);
        await load();
      },
      async sendProjectInvitation(payload) {
        requireUserContext();
        guard('You do not have permission to send invitations.');
        await sendProjectInvitationRequest(userId, payload);
        await load();
      },
      async updateProjectInvitation(invitationId, payload) {
        requireUserContext();
        guard('You do not have permission to manage invitations.');
        await updateProjectInvitationRequest(userId, invitationId, payload);
        await load();
      },
      async updateAutoMatchSettings(payload) {
        requireUserContext();
        guard('You do not have permission to update auto-match settings.');
        await updateAutoMatchSettingsRequest(userId, payload);
        await load();
      },
      async createAutoMatch(payload) {
        requireUserContext();
        guard('You do not have permission to capture auto-match candidates.');
        await createAutoMatchRequest(userId, payload);
        await load();
      },
      async updateAutoMatch(matchId, payload) {
        requireUserContext();
        guard('You do not have permission to update auto-match candidates.');
        await updateAutoMatchRequest(userId, matchId, payload);
        await load();
      },
      async createProjectReview(payload) {
        requireUserContext();
        guard('You do not have permission to submit reviews.');
        await createProjectReviewRequest(userId, payload);
        await load();
      },
      async createEscrowTransaction(payload) {
        requireUserContext();
        guard('You do not have permission to adjust escrow.');
        await createEscrowTransactionRequest(userId, payload);
        await load();
      },
      async updateEscrowSettings(payload) {
        requireUserContext();
        guard('You do not have permission to update escrow settings.');
        await updateEscrowSettingsRequest(userId, payload);
        await load();
      },
    };
  }, [canManageWorkspaceFlag, load, userId]);

  return { data, loading, error, actions, reload: load, canManageWorkspace: canManageWorkspaceFlag };
}
