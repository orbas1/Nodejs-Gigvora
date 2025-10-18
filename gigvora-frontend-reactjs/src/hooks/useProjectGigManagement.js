import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchProjectGigManagement,
  createProject,
  updateProject,
  addProjectAsset,
  updateProjectAsset,
  deleteProjectAsset,
  updateWorkspace,
  archiveProject,
  restoreProject,
  createGigOrder,
  updateGigOrder as updateGigOrderRequest,
  updateGigOrder,
  createProjectBid,
  updateProjectBid,
  sendProjectInvitation,
  updateProjectInvitation,
  updateAutoMatchSettings,
  createAutoMatch,
  updateAutoMatch,
  createProjectReview,
  createEscrowTransaction,
  updateEscrowSettings,
  addGigTimelineEvent,
  postGigOrderMessage,
  createGigEscrowCheckpoint,
  updateGigEscrowCheckpoint,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  createProjectCollaborator,
  updateProjectCollaborator,
  deleteProjectCollaborator,
  createGigTimelineEvent,
  updateGigTimelineEvent,
  createGigSubmission,
  updateGigSubmission,
  postGigChatMessage,
} from '../services/projectGigManagement.js';

export default function useProjectGigManagement(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchProjectGigManagement(userId);
      setData(snapshot);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      load();
    }
  }, [userId, load]);

  const actions = useMemo(() => ({
    async createProject(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to create project workspaces.');
      }
      const response = await createProject(userId, payload);
      await load();
      return response;
    },
    async updateProject(projectId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update this project.');
      }
      await updateProject(userId, projectId, payload);
      await load();
    },
    async addAsset(projectId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update this project workspace.');
      }
      const response = await addProjectAsset(userId, projectId, payload);
      await load();
      return response;
    },
    async updateAsset(projectId, assetId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update this project asset.');
      }
      await updateProjectAsset(userId, projectId, assetId, payload);
      await load();
    },
    async deleteAsset(projectId, assetId) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to delete this project asset.');
      }
      await deleteProjectAsset(userId, projectId, assetId);
      await load();
    },
    async updateWorkspace(projectId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update this project workspace.');
      }
      const response = await updateWorkspace(userId, projectId, payload);
      await load();
      return response;
    },
    async createMilestone(projectId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage project milestones.');
      }
      await createProjectMilestone(userId, projectId, payload);
      await load();
    },
    async updateMilestone(projectId, milestoneId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage project milestones.');
      }
      await updateProjectMilestone(userId, projectId, milestoneId, payload);
      await load();
    },
    async deleteMilestone(projectId, milestoneId) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage project milestones.');
      }
      await deleteProjectMilestone(userId, projectId, milestoneId);
      await load();
    },
    async createCollaborator(projectId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage project collaborators.');
      }
      await createProjectCollaborator(userId, projectId, payload);
      await load();
    },
    async updateCollaborator(projectId, collaboratorId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage project collaborators.');
      }
      await updateProjectCollaborator(userId, projectId, collaboratorId, payload);
      await load();
    },
    async deleteCollaborator(projectId, collaboratorId) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage project collaborators.');
      }
      await deleteProjectCollaborator(userId, projectId, collaboratorId);
      await load();
    },
    async archiveProject(projectId, payload = {}) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to archive this project.');
      }
      await archiveProject(userId, projectId, payload);
      await load();
    },
    async restoreProject(projectId, payload = {}) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to restore this project.');
      }
      await restoreProject(userId, projectId, payload);
      await load();
    },
    async createGigOrder(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig orders.');
      }
      const response = await createGigOrder(userId, payload);
      await load();
      return response;
    },
    async updateGigOrder(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig orders.');
      }
      await updateGigOrderRequest(userId, orderId, payload);
      const response = await updateGigOrder(userId, orderId, payload);
      await load();
      return response;
    },
    async createGigTimelineEvent(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig timelines.');
      }
      await createGigTimelineEvent(userId, orderId, payload);
      await load();
    },
    async updateGigTimelineEvent(orderId, eventId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig timelines.');
      }
      await updateGigTimelineEvent(userId, orderId, eventId, payload);
      await load();
    },
    async createGigSubmission(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to log gig submissions.');
      }
      await createGigSubmission(userId, orderId, payload);
      await load();
    },
    async updateGigSubmission(orderId, submissionId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update gig submissions.');
      }
      await updateGigSubmission(userId, orderId, submissionId, payload);
      await load();
    },
    async postGigChatMessage(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to post in-gig chat messages.');
      }
      await postGigChatMessage(userId, orderId, payload);
      await load();
    },
    async addTimelineEvent(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to log gig timeline events.');
      }
      await addGigTimelineEvent(userId, orderId, payload);
      await load();
    },
    async postGigMessage(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to message within gig orders.');
      }
      await postGigOrderMessage(userId, orderId, payload);
      await load();
    },
    async createEscrowCheckpoint(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage escrow checkpoints.');
      }
      await createGigEscrowCheckpoint(userId, orderId, payload);
      await load();
    },
    async updateEscrowCheckpoint(orderId, checkpointId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage escrow checkpoints.');
      }
      await updateGigEscrowCheckpoint(userId, orderId, checkpointId, payload);
      await load();
    },
    async createProjectBid(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage project bids.');
      }
      await createProjectBid(userId, payload);
      await load();
    },
    async updateProjectBid(bidId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage project bids.');
      }
      await updateProjectBid(userId, bidId, payload);
      await load();
    },
    async sendProjectInvitation(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to send invitations.');
      }
      await sendProjectInvitation(userId, payload);
      await load();
    },
    async updateProjectInvitation(invitationId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage invitations.');
      }
      await updateProjectInvitation(userId, invitationId, payload);
      await load();
    },
    async updateAutoMatchSettings(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update auto-match settings.');
      }
      await updateAutoMatchSettings(userId, payload);
      await load();
    },
    async createAutoMatch(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to capture auto-match candidates.');
      }
      await createAutoMatch(userId, payload);
      await load();
    },
    async updateAutoMatch(matchId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update auto-match candidates.');
      }
      await updateAutoMatch(userId, matchId, payload);
      await load();
    },
    async createProjectReview(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to submit reviews.');
      }
      await createProjectReview(userId, payload);
      await load();
    },
    async createEscrowTransaction(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to adjust escrow.');
      }
      await createEscrowTransaction(userId, payload);
      await load();
    },
    async updateEscrowSettings(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update escrow settings.');
      }
      await updateEscrowSettings(userId, payload);
      await load();
    },
  }), [data?.access?.canManage, userId, load]);

  return { data, loading, error, actions, reload: load };
}
