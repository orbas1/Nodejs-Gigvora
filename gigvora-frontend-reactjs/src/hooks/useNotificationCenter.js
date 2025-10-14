import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  generateMessageAlerts,
  generateNotificationStream,
} from '../services/engagementService.js';

const NOTIFICATION_STORAGE_KEY = 'gigvora:notifications:read:v1';
const MESSAGE_STORAGE_KEY = 'gigvora:messages:read:v1';

function loadStoredIds(key) {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to parse stored ids', error);
    return [];
  }
}

function persistIds(key, ids) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch (error) {
    console.warn('Unable to persist ids', error);
  }
}

export default function useNotificationCenter(session, { feedPosts = [] } = {}) {
  const [readNotificationIds, setReadNotificationIds] = useState(() => loadStoredIds(NOTIFICATION_STORAGE_KEY));
  const [readMessageIds, setReadMessageIds] = useState(() => loadStoredIds(MESSAGE_STORAGE_KEY));

  useEffect(() => {
    persistIds(NOTIFICATION_STORAGE_KEY, readNotificationIds);
  }, [readNotificationIds]);

  useEffect(() => {
    persistIds(MESSAGE_STORAGE_KEY, readMessageIds);
  }, [readMessageIds]);

  const notifications = useMemo(() => {
    const readSet = new Set(readNotificationIds);
    return generateNotificationStream({ session, feedPosts }).map((notification) => ({
      ...notification,
      read: readSet.has(notification.id),
    }));
  }, [session, feedPosts, readNotificationIds]);

  const unreadNotificationCount = useMemo(
    () => notifications.reduce((count, notification) => (notification.read ? count : count + 1), 0),
    [notifications],
  );

  const messageThreads = useMemo(() => {
    const readSet = new Set(readMessageIds);
    return generateMessageAlerts(session).map((thread) => {
      const isRead = readSet.has(thread.id) || thread.unread === false;
      return {
        ...thread,
        read: isRead,
        unread: !isRead,
      };
    });
  }, [session, readMessageIds]);

  const unreadMessageCount = useMemo(
    () => messageThreads.reduce((count, thread) => (thread.unread ? count + 1 : count), 0),
    [messageThreads],
  );

  const markNotificationAsRead = useCallback((id) => {
    setReadNotificationIds((previous) => {
      if (previous.includes(id)) {
        return previous;
      }
      return [...previous, id];
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setReadNotificationIds((previous) => Array.from(new Set([...previous, ...notifications.map((notification) => notification.id)])));
  }, [notifications]);

  const markThreadAsRead = useCallback((id) => {
    setReadMessageIds((previous) => {
      if (previous.includes(id)) {
        return previous;
      }
      return [...previous, id];
    });
  }, []);

  const markAllThreadsAsRead = useCallback(() => {
    setReadMessageIds((previous) => Array.from(new Set([...previous, ...messageThreads.map((thread) => thread.id)])));
  }, [messageThreads]);

  return {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    messageThreads,
    unreadMessageCount,
    markThreadAsRead,
    markAllThreadsAsRead,
  };
}
