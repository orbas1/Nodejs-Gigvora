import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createAgendaItem,
  createAsset,
  createBudgetItem,
  createChecklistItem,
  createEvent,
  createGuest,
  createTask,
  deleteAgendaItem,
  deleteAsset,
  deleteBudgetItem,
  deleteChecklistItem,
  deleteEvent,
  deleteGuest,
  deleteTask,
  updateAgendaItem,
  updateAsset,
  updateBudgetItem,
  updateChecklistItem,
  updateEvent,
  updateGuest,
  updateTask,
} from '../../services/eventManagement.js';

const DEFAULT_OVERVIEW = {
  events: 0,
  active: 0,
  upcoming: 0,
  completed: 0,
  cancelled: 0,
  archived: 0,
  tasksTotal: 0,
  tasksCompleted: 0,
  guestsInvited: 0,
  guestsConfirmed: 0,
  guestsCheckedIn: 0,
  budgetPlanned: 0,
  budgetActual: 0,
  budgetVariance: 0,
  tasksCompletionRate: 0,
  checklistCompletionRate: 0,
  nextEvent: null,
  lastUpdatedAt: null,
  upcomingEvents: [],
};

function normalizeEvents(data) {
  if (!data) return [];
  if (Array.isArray(data.events)) {
    return data.events;
  }
  if (Array.isArray(data?.overview?.upcomingEvents)) {
    return data.overview.upcomingEvents;
  }
  return [];
}

export default function useEventManagementController({ data, userId, onRefresh }) {
  const [localData, setLocalData] = useState(() => data ?? null);
  const [selectedEventId, setSelectedEventId] = useState(() => data?.events?.[0]?.id ?? null);
  const [wizardState, setWizardState] = useState({ open: false, mode: 'create', initialValues: null });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', actionLabel: 'Delete', onConfirm: null });

  useEffect(() => {
    setLocalData(data ?? null);
    if (data?.events?.length) {
      setSelectedEventId((current) => {
        if (current && data.events.some((event) => event.id === current)) {
          return current;
        }
        return data.events[0].id;
      });
    }
  }, [data]);

  const overview = useMemo(() => localData?.overview ?? DEFAULT_OVERVIEW, [localData]);
  const events = useMemo(() => normalizeEvents(localData), [localData]);
  const permissions = useMemo(
    () => localData?.permissions ?? { canManage: true, allowedRoles: [] },
    [localData?.permissions],
  );
  const canManage = permissions?.canManage !== false;
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) ?? null, [events, selectedEventId]);

  const applyEventUpdate = useCallback(
    (updatedEvent) => {
      if (!updatedEvent) {
        return;
      }
      setLocalData((current) => {
        if (!current) {
          return {
            overview: DEFAULT_OVERVIEW,
            events: [updatedEvent],
            permissions,
          };
        }
        const nextEvents = Array.isArray(current.events) ? [...current.events] : [];
        const index = nextEvents.findIndex((event) => event.id === updatedEvent.id);
        if (index >= 0) {
          nextEvents.splice(index, 1, updatedEvent);
        } else {
          nextEvents.unshift(updatedEvent);
        }
        return { ...current, events: nextEvents };
      });
      setSelectedEventId(updatedEvent.id);
    },
    [permissions],
  );

  const removeEventFromState = useCallback((eventId) => {
    if (!eventId) return;
    setLocalData((current) => {
      if (!current) return current;
      const nextEvents = (current.events ?? []).filter((event) => event.id !== eventId);
      return { ...current, events: nextEvents };
    });
    setSelectedEventId((currentId) => {
      if (currentId === eventId) {
        return events.filter((event) => event.id !== eventId)[0]?.id ?? null;
      }
      return currentId;
    });
  }, [events]);

  const handleFeedback = useCallback((message, tone = 'success') => {
    if (!message) return;
    setFeedback({ message, tone });
    setError(null);
  }, []);

  const handleError = useCallback((message) => {
    setError(message ?? 'Something went wrong. Please try again.');
    setFeedback(null);
  }, []);

  const closeFeedback = useCallback(() => setFeedback(null), []);
  const closeError = useCallback(() => setError(null), []);

  const runWithSpinner = useCallback(async (operation) => {
    setBusy(true);
    try {
      return await operation();
    } finally {
      setBusy(false);
    }
  }, []);

  const mutateEvent = useCallback(
    async (operation, { successMessage } = {}) => {
      if (!selectedEvent || !userId) {
        return false;
      }
      return runWithSpinner(async () => {
        try {
          const updatedEvent = await operation();
          if (updatedEvent) {
            applyEventUpdate(updatedEvent);
          } else {
            await onRefresh?.();
          }
          handleFeedback(successMessage ?? 'Saved');
          return true;
        } catch (err) {
          const message = err?.response?.data?.message ?? err?.message ?? 'Unable to complete action';
          handleError(message);
          return false;
        }
      });
    },
    [applyEventUpdate, handleError, handleFeedback, onRefresh, runWithSpinner, selectedEvent, userId],
  );

  const openCreateWizard = useCallback((initialValues = null) => {
    setWizardState({ open: true, mode: 'create', initialValues });
  }, []);

  const openEditWizard = useCallback(
    (eventToEdit = null) => {
      const target = eventToEdit ?? selectedEvent;
      if (!target) return;
      setWizardState({ open: true, mode: 'edit', initialValues: target });
    },
    [selectedEvent],
  );

  const closeWizard = useCallback(() => {
    setWizardState({ open: false, mode: 'create', initialValues: null });
  }, []);

  const saveEvent = useCallback(
    async (payload) => {
      if (!userId) return false;
      return runWithSpinner(async () => {
        try {
          let updatedEvent;
          if (wizardState.mode === 'edit' && selectedEvent) {
            updatedEvent = await updateEvent(userId, selectedEvent.id, payload);
            handleFeedback('Event updated');
          } else {
            updatedEvent = await createEvent(userId, payload);
            handleFeedback('Event created');
          }
          applyEventUpdate(updatedEvent);
          await onRefresh?.();
          closeWizard();
          return true;
        } catch (err) {
          const message = err?.response?.data?.message ?? err?.message ?? 'Unable to save event';
          handleError(message);
          return false;
        }
      });
    },
    [applyEventUpdate, closeWizard, handleError, handleFeedback, onRefresh, runWithSpinner, selectedEvent, userId, wizardState.mode],
  );

  const requestDeleteEvent = useCallback(() => {
    if (!selectedEvent || !canManage) return;
    setConfirmState({
      open: true,
      title: 'Remove event',
      message: 'This event and its data will be moved out of your workspace.',
      actionLabel: 'Delete',
      onConfirm: async () => {
        if (!userId) return false;
        return runWithSpinner(async () => {
          try {
            await deleteEvent(userId, selectedEvent.id);
            removeEventFromState(selectedEvent.id);
            handleFeedback('Event removed');
            await onRefresh?.();
            return true;
          } catch (err) {
            handleError(err?.response?.data?.message ?? err?.message ?? 'Unable to delete event');
            return false;
          }
        });
      },
    });
  }, [canManage, handleError, handleFeedback, onRefresh, removeEventFromState, runWithSpinner, selectedEvent, userId]);

  const closeConfirm = useCallback(() => {
    setConfirmState({ open: false, title: '', message: '', actionLabel: 'Delete', onConfirm: null });
  }, []);

  const confirmAction = useCallback(async () => {
    if (!confirmState.onConfirm) {
      closeConfirm();
      return;
    }
    const result = await confirmState.onConfirm();
    if (result !== false) {
      closeConfirm();
    }
  }, [closeConfirm, confirmState]);

  const taskApi = useMemo(() => ({
    create: (eventId, values) => createTask(userId, eventId, values),
    update: (eventId, itemId, values) => updateTask(userId, eventId, itemId, values),
    remove: (eventId, itemId) => deleteTask(userId, eventId, itemId),
  }), [userId]);

  const guestApi = useMemo(() => ({
    create: (eventId, values) => createGuest(userId, eventId, values),
    update: (eventId, itemId, values) => updateGuest(userId, eventId, itemId, values),
    remove: (eventId, itemId) => deleteGuest(userId, eventId, itemId),
  }), [userId]);

  const budgetApi = useMemo(() => ({
    create: (eventId, values) => createBudgetItem(userId, eventId, values),
    update: (eventId, itemId, values) => updateBudgetItem(userId, eventId, itemId, values),
    remove: (eventId, itemId) => deleteBudgetItem(userId, eventId, itemId),
  }), [userId]);

  const agendaApi = useMemo(() => ({
    create: (eventId, values) => createAgendaItem(userId, eventId, values),
    update: (eventId, itemId, values) => updateAgendaItem(userId, eventId, itemId, values),
    remove: (eventId, itemId) => deleteAgendaItem(userId, eventId, itemId),
  }), [userId]);

  const assetApi = useMemo(() => ({
    create: (eventId, values) => createAsset(userId, eventId, values),
    update: (eventId, itemId, values) => updateAsset(userId, eventId, itemId, values),
    remove: (eventId, itemId) => deleteAsset(userId, eventId, itemId),
  }), [userId]);

  const checklistApi = useMemo(() => ({
    create: (eventId, values) => createChecklistItem(userId, eventId, values),
    update: (eventId, itemId, values) => updateChecklistItem(userId, eventId, itemId, values),
    remove: (eventId, itemId) => deleteChecklistItem(userId, eventId, itemId),
  }), [userId]);

  return {
    overview,
    events,
    permissions,
    canManage,
    selectedEvent,
    selectEvent: setSelectedEventId,
    wizardState,
    openCreateWizard,
    openEditWizard,
    closeWizard,
    saveEvent,
    requestDeleteEvent,
    confirmState,
    confirmAction,
    closeConfirm,
    busy,
    feedback,
    error,
    closeFeedback,
    closeError,
    mutateEvent,
    taskApi,
    guestApi,
    budgetApi,
    agendaApi,
    assetApi,
    checklistApi,
  };
}

