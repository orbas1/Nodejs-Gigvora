import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createAdminTimeline,
  updateAdminTimeline,
  deleteAdminTimeline,
  fetchAdminTimelines,
  fetchAdminTimeline,
  createAdminTimelineEvent,
  updateAdminTimelineEvent,
  deleteAdminTimelineEvent,
  reorderAdminTimelineEvents,
} from '../../../../services/adminTimelines.js';
import WorkspaceHeader from './WorkspaceHeader.jsx';
import TimelineList from './TimelineList.jsx';
import TimelineDetail from './TimelineDetail.jsx';
import TimelineDrawer from './TimelineDrawer.jsx';
import EventDrawer from './EventDrawer.jsx';
import EventPreviewDialog from './EventPreviewDialog.jsx';
import {
  eventFormToPayload,
  eventToForm,
  timelineFormToPayload,
  timelineToForm,
} from './timelineUtils.js';

function AlertBar({ alert, onDismiss }) {
  if (!alert) {
    return null;
  }
  const tone = alert.type === 'error' ? 'rose' : 'emerald';
  const borderClass = tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return (
    <div className={`flex items-center justify-between rounded-3xl border px-5 py-3 text-sm font-medium ${borderClass}`}>
      <span>{alert.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:bg-white"
      >
        Close
      </button>
    </div>
  );
}

export default function TimelineWorkspace() {
  const [filters, setFilters] = useState({ query: '', status: '', visibility: '' });
  const [timelines, setTimelines] = useState([]);
  const [activeTimelineId, setActiveTimelineId] = useState(null);
  const activeTimelineIdRef = useRef(null);
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState(null);
  const [timelineDrawer, setTimelineDrawer] = useState({ open: false, mode: 'create', value: null });
  const [eventDrawer, setEventDrawer] = useState({ open: false, mode: 'create', value: null });
  const [preview, setPreview] = useState({ open: false, event: null });

  useEffect(() => {
    activeTimelineIdRef.current = activeTimelineId;
  }, [activeTimelineId]);

  const loadTimeline = useCallback(async (timelineId, { skipSelectUpdate = false } = {}) => {
    if (!timelineId) {
      return;
    }
    setLoadingTimeline(true);
    try {
      const timeline = await fetchAdminTimeline(timelineId);
      if (!skipSelectUpdate) {
        setActiveTimelineId(timeline.id);
      }
      setActiveTimeline(timeline);
      setEvents(Array.isArray(timeline.events) ? timeline.events : []);
    } catch (error) {
      setAlert({ type: 'error', message: error?.message ?? 'Unable to load timeline' });
    } finally {
      setLoadingTimeline(false);
    }
  }, []);

  const loadTimelines = useCallback(
    async ({ selectId } = {}) => {
      setLoadingList(true);
      try {
        const response = await fetchAdminTimelines({
          search: filters.query || undefined,
          status: filters.status || undefined,
          visibility: filters.visibility || undefined,
        });
        const results = Array.isArray(response?.results) ? response.results : Array.isArray(response) ? response : [];
        setTimelines(results);
        let nextId = selectId ?? activeTimelineIdRef.current ?? null;
        if (nextId && !results.some((timeline) => timeline.id === nextId)) {
          nextId = results[0]?.id ?? null;
        }
        if (!nextId && results.length) {
          nextId = results[0].id;
        }
        if (nextId) {
          setActiveTimelineId(nextId);
          await loadTimeline(nextId, { skipSelectUpdate: true });
        } else {
          setActiveTimelineId(null);
          setActiveTimeline(null);
          setEvents([]);
        }
      } catch (error) {
        setAlert({ type: 'error', message: error?.message ?? 'Unable to load timelines' });
      } finally {
        setLoadingList(false);
      }
    },
    [filters.query, filters.status, filters.visibility, loadTimeline],
  );

  useEffect(() => {
    loadTimelines();
  }, [loadTimelines]);

  const stats = useMemo(() => {
    const total = timelines.length;
    const activeCount = timelines.filter((timeline) => timeline.status === 'active').length;
    const draftCount = timelines.filter((timeline) => timeline.status === 'draft').length;
    const now = Date.now();
    const upcoming = events.filter((event) => {
      const candidate = event.startDate ?? event.dueDate ?? event.endDate;
      if (!candidate) return false;
      const parsed = new Date(candidate);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed.getTime() >= now;
    }).length;
    return {
      total,
      active: activeCount,
      draft: draftCount,
      upcoming,
    };
  }, [events, timelines]);

  const handleSelectTimeline = useCallback(
    (timelineId) => {
      if (!timelineId) {
        return;
      }
      setActiveTimelineId(timelineId);
      loadTimeline(timelineId, { skipSelectUpdate: true });
    },
    [loadTimeline],
  );

  const handleCreateTimeline = useCallback(() => {
    setTimelineDrawer({ open: true, mode: 'create', value: timelineToForm(null) });
  }, []);

  const handleEditTimeline = useCallback((timeline) => {
    setTimelineDrawer({ open: true, mode: 'edit', value: timelineToForm(timeline) });
  }, []);

  const handleCloseTimelineDrawer = useCallback(() => {
    setTimelineDrawer((current) => ({ ...current, open: false }));
  }, []);

  const handleSaveTimeline = useCallback(
    async (form) => {
      setBusy(true);
      try {
        const payload = timelineFormToPayload(form);
        if (form.id) {
          await updateAdminTimeline(form.id, payload);
          setAlert({ type: 'success', message: 'Timeline updated' });
          await loadTimelines({ selectId: form.id });
        } else {
          const created = await createAdminTimeline(payload);
          const newId = created?.id ?? null;
          setAlert({ type: 'success', message: 'Timeline created' });
          await loadTimelines({ selectId: newId });
        }
        setTimelineDrawer((current) => ({ ...current, open: false }));
      } catch (error) {
        setAlert({ type: 'error', message: error?.message ?? 'Unable to save timeline' });
      } finally {
        setBusy(false);
      }
    },
    [loadTimelines],
  );

  const handleDeleteTimeline = useCallback(
    async (timelineId) => {
      if (!timelineId) {
        return;
      }
      setBusy(true);
      try {
        await deleteAdminTimeline(timelineId);
        setAlert({ type: 'success', message: 'Timeline removed' });
        if (activeTimelineIdRef.current === timelineId) {
          setActiveTimeline(null);
          setEvents([]);
        }
        await loadTimelines({ selectId: null });
      } catch (error) {
        setAlert({ type: 'error', message: error?.message ?? 'Unable to delete timeline' });
      } finally {
        setBusy(false);
      }
    },
    [loadTimelines],
  );

  const handleCreateEvent = useCallback(() => {
    setEventDrawer({ open: true, mode: 'create', value: eventToForm(null) });
  }, []);

  const handleEditEvent = useCallback((event) => {
    setEventDrawer({ open: true, mode: 'edit', value: eventToForm(event) });
  }, []);

  const handleCloseEventDrawer = useCallback(() => {
    setEventDrawer((current) => ({ ...current, open: false }));
  }, []);

  const handleSaveEvent = useCallback(
    async (form) => {
      if (!activeTimelineIdRef.current) {
        return;
      }
      setBusy(true);
      try {
        const payload = eventFormToPayload(form);
        if (form.id) {
          await updateAdminTimelineEvent(activeTimelineIdRef.current, form.id, payload);
          setAlert({ type: 'success', message: 'Event updated' });
        } else {
          await createAdminTimelineEvent(activeTimelineIdRef.current, payload);
          setAlert({ type: 'success', message: 'Event added' });
        }
        await loadTimeline(activeTimelineIdRef.current, { skipSelectUpdate: true });
        setEventDrawer((current) => ({ ...current, open: false }));
      } catch (error) {
        setAlert({ type: 'error', message: error?.message ?? 'Unable to save event' });
      } finally {
        setBusy(false);
      }
    },
    [loadTimeline],
  );

  const handleDeleteEvent = useCallback(
    async (eventId) => {
      if (!activeTimelineIdRef.current || !eventId) {
        return;
      }
      setBusy(true);
      try {
        await deleteAdminTimelineEvent(activeTimelineIdRef.current, eventId);
        setAlert({ type: 'success', message: 'Event removed' });
        await loadTimeline(activeTimelineIdRef.current, { skipSelectUpdate: true });
      } catch (error) {
        setAlert({ type: 'error', message: error?.message ?? 'Unable to delete event' });
      } finally {
        setBusy(false);
      }
    },
    [loadTimeline],
  );

  const handleReorderEvent = useCallback(
    async (eventId, direction) => {
      if (!activeTimelineIdRef.current || !eventId) {
        return;
      }
      const currentEvents = events;
      const index = currentEvents.findIndex((event) => event.id === eventId);
      if (index === -1) {
        return;
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentEvents.length) {
        return;
      }
      const nextOrder = [...currentEvents];
      [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
      setEvents(nextOrder);
      setBusy(true);
      try {
        await reorderAdminTimelineEvents(activeTimelineIdRef.current, nextOrder.map((event) => event.id));
        setAlert({ type: 'success', message: 'Order updated' });
        await loadTimeline(activeTimelineIdRef.current, { skipSelectUpdate: true });
      } catch (error) {
        setAlert({ type: 'error', message: error?.message ?? 'Unable to update order' });
        await loadTimeline(activeTimelineIdRef.current, { skipSelectUpdate: true });
      } finally {
        setBusy(false);
      }
    },
    [events, loadTimeline],
  );

  const handlePreviewEvent = useCallback((event) => {
    setPreview({ open: true, event });
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreview({ open: false, event: null });
  }, []);

  return (
    <div className="flex flex-col gap-6 py-6">
      <AlertBar alert={alert} onDismiss={() => setAlert(null)} />
      <WorkspaceHeader
        stats={stats}
        loading={loadingList || loadingTimeline}
        onCreate={handleCreateTimeline}
        onRefresh={() => loadTimelines({ selectId: activeTimelineIdRef.current })}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr] xl:grid-cols-[360px,1fr]">
        <TimelineList
          timelines={timelines}
          selectedTimelineId={activeTimelineId}
          onSelect={handleSelectTimeline}
          filters={filters}
          onFiltersChange={setFilters}
          loading={loadingList}
        />
        <TimelineDetail
          timeline={activeTimeline}
          events={events}
          loading={loadingTimeline}
          busy={busy}
          onEditTimeline={handleEditTimeline}
          onDeleteTimeline={handleDeleteTimeline}
          onAddEvent={handleCreateEvent}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          onReorderEvent={handleReorderEvent}
          onPreviewEvent={handlePreviewEvent}
        />
      </div>

      <TimelineDrawer
        open={timelineDrawer.open}
        mode={timelineDrawer.mode}
        initialValue={timelineDrawer.value}
        onClose={handleCloseTimelineDrawer}
        onSubmit={handleSaveTimeline}
        busy={busy}
      />

      <EventDrawer
        open={eventDrawer.open}
        mode={eventDrawer.mode}
        initialValue={eventDrawer.value}
        onClose={handleCloseEventDrawer}
        onSubmit={handleSaveEvent}
        busy={busy}
      />

      <EventPreviewDialog event={preview.event} open={preview.open} onClose={handleClosePreview} />
    </div>
  );
}
