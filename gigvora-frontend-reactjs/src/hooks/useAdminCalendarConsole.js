import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAdminCalendarConsole,
  createAdminCalendarAccount,
  updateAdminCalendarAccount,
  deleteAdminCalendarAccount,
  updateAdminCalendarAvailability,
  createAdminCalendarTemplate,
  updateAdminCalendarTemplate,
  deleteAdminCalendarTemplate,
  createAdminCalendarEvent,
  updateAdminCalendarEvent,
  deleteAdminCalendarEvent,
} from '../services/adminCalendar.js';

const EMPTY_SNAPSHOT = Object.freeze({
  accounts: [],
  templates: [],
  events: [],
  availability: {},
  metrics: {},
});

export default function useAdminCalendarConsole() {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setRefreshTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadConsole() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchAdminCalendarConsole();
        if (!cancelled) {
          setSnapshot({ ...EMPTY_SNAPSHOT, ...(data ?? {}) });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Unable to load calendar.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadConsole();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const accounts = useMemo(() => snapshot.accounts ?? [], [snapshot.accounts]);
  const templates = useMemo(() => snapshot.templates ?? [], [snapshot.templates]);
  const events = useMemo(() => snapshot.events ?? [], [snapshot.events]);
  const availabilityByAccount = useMemo(
    () => snapshot.availability ?? {},
    [snapshot.availability],
  );

  const metrics = useMemo(() => {
    const defaults = {
      accounts: { total: 0, connected: 0, needsAttention: 0 },
      templates: { total: 0, active: 0 },
      events: { total: 0, upcoming: 0, published: 0 },
    };
    return { ...defaults, ...(snapshot.metrics ?? {}) };
  }, [snapshot.metrics]);

  const withBusyState = useCallback(
    async (operation) => {
      setBusy(true);
      try {
        const result = await operation();
        refresh();
        return result;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  const actions = useMemo(() => ({
    saveAccount: (accountId, payload) =>
      withBusyState(async () => {
        if (accountId) {
          return updateAdminCalendarAccount(accountId, payload);
        }
        return createAdminCalendarAccount(payload);
      }),
    removeAccount: (accountId) =>
      withBusyState(async () => deleteAdminCalendarAccount(accountId)),
    saveAvailability: (accountId, payload) =>
      withBusyState(async () => updateAdminCalendarAvailability(accountId, payload)),
    saveTemplate: (templateId, payload) =>
      withBusyState(async () => {
        if (templateId) {
          return updateAdminCalendarTemplate(templateId, payload);
        }
        return createAdminCalendarTemplate(payload);
      }),
    removeTemplate: (templateId) =>
      withBusyState(async () => deleteAdminCalendarTemplate(templateId)),
    saveEvent: (eventId, payload) =>
      withBusyState(async () => {
        if (eventId) {
          return updateAdminCalendarEvent(eventId, payload);
        }
        return createAdminCalendarEvent(payload);
      }),
    removeEvent: (eventId) =>
      withBusyState(async () => deleteAdminCalendarEvent(eventId)),
  }), [withBusyState]);

  useEffect(() => {
    if (!message) {
      return () => undefined;
    }
    if (process.env.NODE_ENV === 'test') {
      return () => undefined;
    }
    const timeout = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timeout);
  }, [message]);

  return {
    loading,
    busy,
    error,
    setError,
    message,
    setMessage,
    metrics,
    accounts,
    templates,
    events,
    availabilityByAccount,
    refresh,
    actions,
  };
}
