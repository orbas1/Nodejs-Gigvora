import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchProjectGigManagement,
  createProject,
  addProjectAsset,
  updateWorkspace,
  createGigOrder,
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
      await createProject(userId, payload);
      await load();
    },
    async addAsset(projectId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update this project workspace.');
      }
      await addProjectAsset(userId, projectId, payload);
      await load();
    },
    async updateWorkspace(projectId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update this project workspace.');
      }
      await updateWorkspace(userId, projectId, payload);
      await load();
    },
    async createGigOrder(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig orders.');
      }
      await createGigOrder(userId, payload);
      await load();
    },
    async updateGigOrder(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig orders.');
      }
      await updateGigOrder(userId, orderId, payload);
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
