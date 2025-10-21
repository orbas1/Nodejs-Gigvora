import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchGigOrderDetail,
  createGigTimelineEvent,
  createGigSubmission,
  updateGigSubmission as updateGigSubmissionRequest,
  postGigChatMessage,
  acknowledgeGigChatMessage,
} from '../services/projectGigManagement.js';

const MANAGE_ORDER_ERROR = 'You do not have permission to manage this gig order.';

function collectPermissionFlags(candidate, bucket) {
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
    candidate.forEach((entry) => collectPermissionFlags(entry, bucket));
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
      collectPermissionFlags(value, bucket);
    });
  }
}

function deriveCanManageOrder(order) {
  if (!order || typeof order !== 'object') {
    return false;
  }

  if (order.access?.canManage === true || order.permissions?.canManage === true) {
    return true;
  }

  const flags = new Set();
  collectPermissionFlags(order.permissions, flags);
  collectPermissionFlags(order.access?.permissions, flags);
  collectPermissionFlags(order.roles, flags);

  const privilegedFlags = [
    'manage',
    'manage_order',
    'manage_orders',
    'gig.manage',
    'gig_order.manage',
    'orders.manage',
    'project.manage',
    'workspace.manage',
    'admin',
    'owner',
  ];

  return privilegedFlags.some((flag) => flags.has(flag));
}

export default function useGigOrderDetail(userId, orderId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(false);

  const canManageOrder = useMemo(() => deriveCanManageOrder(data), [data]);

  const load = useCallback(async () => {
    if (!userId || !orderId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchGigOrderDetail(userId, orderId);
      const order = response?.order ?? null;
      setData(order);
      if (order && !deriveCanManageOrder(order)) {
        setError(new Error(MANAGE_ORDER_ERROR));
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load gig order detail.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const ensureContext = useCallback(() => {
    if (!userId || !orderId) {
      throw new Error('Select a gig order before performing workspace actions.');
    }
  }, [orderId, userId]);

  const ensureManagePermission = useCallback(() => {
    if (!canManageOrder) {
      throw new Error(MANAGE_ORDER_ERROR);
    }
  }, [canManageOrder]);

  const actions = useMemo(
    () => ({
      async addTimelineEvent(payload) {
        ensureContext();
        ensureManagePermission();
        setPendingAction(true);
        try {
          const response = await createGigTimelineEvent(userId, orderId, payload);
          setData(response?.order ?? null);
          return response?.event ?? null;
        } finally {
          setPendingAction(false);
        }
      },
      async createSubmission(payload) {
        ensureContext();
        ensureManagePermission();
        setPendingAction(true);
        try {
          const response = await createGigSubmission(userId, orderId, payload);
          setData(response?.order ?? null);
          return response?.submission ?? null;
        } finally {
          setPendingAction(false);
        }
      },
      async updateSubmission(submissionId, payload) {
        ensureContext();
        ensureManagePermission();
        setPendingAction(true);
        try {
          const response = await updateGigSubmissionRequest(userId, orderId, submissionId, payload);
          setData(response?.order ?? null);
          return response?.submission ?? null;
        } finally {
          setPendingAction(false);
        }
      },
      async sendMessage(payload) {
        ensureContext();
        ensureManagePermission();
        setPendingAction(true);
        try {
          const response = await postGigChatMessage(userId, orderId, payload);
          setData(response?.order ?? null);
          return response?.message ?? null;
        } finally {
          setPendingAction(false);
        }
      },
      async acknowledgeMessage(messageId) {
        ensureContext();
        ensureManagePermission();
        setPendingAction(true);
        try {
          const response = await acknowledgeGigChatMessage(userId, orderId, messageId);
          setData(response?.order ?? null);
          return response?.message ?? null;
        } finally {
          setPendingAction(false);
        }
      },
    }),
    [acknowledgeGigChatMessage, ensureContext, ensureManagePermission, orderId, userId],
  );

  return { data, loading, error, actions, refresh: load, pendingAction, canManageOrder };
}
