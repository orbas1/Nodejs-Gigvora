import { apiClient } from './apiClient.js';

function normaliseStatus(value) {
  if (!value) return undefined;
  const normalised = `${value}`.trim().toLowerCase();
  if (normalised === 'all') {
    return undefined;
  }
  return normalised;
}

function normaliseCategory(value) {
  if (!value) return undefined;
  const normalised = `${value}`.trim().toLowerCase();
  if (normalised === 'all') {
    return undefined;
  }
  return normalised;
}

export async function fetchUserNotifications(userId, { status, category, page, pageSize, signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to fetch notifications.');
  }

  const params = {
    status: normaliseStatus(status),
    category: normaliseCategory(category),
    page,
    pageSize,
  };

  return apiClient.get(`/users/${userId}/notifications`, { params, signal });
}

export async function createUserNotification(userId, payload, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to create a notification.');
  }

  return apiClient.post(`/users/${userId}/notifications`, payload, { signal });
}

export async function updateUserNotification(userId, notificationId, action, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to update a notification.');
  }
  if (!notificationId) {
    throw new Error('notificationId is required to update a notification.');
  }

  return apiClient.patch(`/users/${userId}/notifications/${notificationId}`, { action }, { signal });
}

export async function markAllNotificationsAsRead(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to mark notifications as read.');
  }

  return apiClient.post(`/users/${userId}/notifications/mark-all-read`, {}, { signal });
}

export async function fetchNotificationPreferences(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to load notification preferences.');
  }

  return apiClient.get(`/users/${userId}/notifications/preferences`, { signal });
}

export async function updateNotificationPreferences(userId, payload, { signal } = {}) {
  if (!userId) {
    throw new Error('userId is required to update notification preferences.');
  }

  return apiClient.put(`/users/${userId}/notifications/preferences`, payload, { signal });
}

export default {
  fetchUserNotifications,
  createUserNotification,
  updateUserNotification,
  markAllNotificationsAsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
};
