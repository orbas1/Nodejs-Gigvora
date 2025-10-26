import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchFreelancerCalendarEvents,
  createFreelancerCalendarEvent,
  updateFreelancerCalendarEvent,
  deleteFreelancerCalendarEvent,
  downloadFreelancerCalendarEventInvite,
} from '../services/freelancerCalendar.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOOKBACK_DAYS = 14;
const DEFAULT_LOOKAHEAD_DAYS = 90;

function computeRange({ startDate, endDate, lookbackDays, lookaheadDays } = {}) {
  const now = new Date();
  const lookback = Number.isFinite(Number(lookbackDays)) ? Math.max(Number(lookbackDays), 0) : DEFAULT_LOOKBACK_DAYS;
  const lookahead = Number.isFinite(Number(lookaheadDays)) ? Math.max(Number(lookaheadDays), 1) : DEFAULT_LOOKAHEAD_DAYS;

  const start = startDate ? new Date(startDate) : new Date(now.getTime() - lookback * DAY_IN_MS);
  const end = endDate ? new Date(endDate) : new Date(now.getTime() + lookahead * DAY_IN_MS);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return computeRange();
  }

  if (start.getTime() > end.getTime()) {
    return { start: end, end: start, lookbackDays: lookback, lookaheadDays: lookahead };
  }

  return { start, end, lookbackDays: lookback, lookaheadDays: lookahead };
}

function sortEvents(events) {
  return [...events].sort((first, second) => {
    const firstTime = first?.startsAt ? new Date(first.startsAt).getTime() : 0;
    const secondTime = second?.startsAt ? new Date(second.startsAt).getTime() : 0;
    if (firstTime === secondTime) {
      return (first?.id ?? 0) - (second?.id ?? 0);
    }
    return firstTime - secondTime;
  });
}

function computeMetrics(events, range) {
  const now = new Date();
  const typeCounts = {};
  const statusCounts = {};
  let nextEvent = null;
  let upcomingCount = 0;
  let pastCount = 0;
  let overdueCount = 0;

  events.forEach((event) => {
    const typeKey = event.eventType ?? 'other';
    typeCounts[typeKey] = (typeCounts[typeKey] ?? 0) + 1;
    const statusKey = event.status ?? 'confirmed';
    statusCounts[statusKey] = (statusCounts[statusKey] ?? 0) + 1;

    const startTime = event.startsAt ? new Date(event.startsAt).getTime() : null;
    if (startTime == null) {
      return;
    }
    if (startTime >= now.getTime()) {
      upcomingCount += 1;
      if (!nextEvent || startTime < new Date(nextEvent.startsAt).getTime()) {
        nextEvent = event;
      }
    } else {
      pastCount += 1;
      if (!['completed', 'cancelled'].includes(statusKey)) {
        overdueCount += 1;
      }
    }
  });

  return {
    total: events.length,
    upcomingCount,
    pastCount,
    overdueCount,
    typeCounts,
    statusCounts,
    nextEvent,
    range: {
      start: range?.start ? range.start.toISOString() : null,
      end: range?.end ? range.end.toISOString() : null,
    },
  };
}

export default function useFreelancerCalendar({
  freelancerId,
  enabled = true,
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
  lookaheadDays = DEFAULT_LOOKAHEAD_DAYS,
} = {}) {
  const [events, setEvents] = useState(() => []);
  const [range, setRange] = useState(() => computeRange({ lookbackDays, lookaheadDays }));
  const [filters, setFilters] = useState({ types: undefined, statuses: undefined });
  const [metrics, setMetrics] = useState(() => computeMetrics([], computeRange({ lookbackDays, lookaheadDays })));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(
    async (overrides = {}) => {
      if (!enabled) {
        return { events: [], fromServer: false };
      }

      const nextRange = computeRange({
        startDate: overrides.startDate ?? overrides.start ?? range.start,
        endDate: overrides.endDate ?? overrides.end ?? range.end,
        lookbackDays: overrides.lookbackDays ?? range.lookbackDays,
        lookaheadDays: overrides.lookaheadDays ?? range.lookaheadDays,
      });

      const nextFilters = {
        types: overrides.types ?? overrides.type ?? filters.types,
        statuses: overrides.statuses ?? overrides.status ?? filters.statuses,
      };

      if (!freelancerId) {
        setRange(nextRange);
        setFilters(nextFilters);
        setEvents([]);
        setMetrics(computeMetrics([], nextRange));
        setLastUpdated(null);
        setError(null);
        return { events: [], metrics: null, fromServer: false };
      }

      setLoading(true);
      try {
        const response = await fetchFreelancerCalendarEvents(freelancerId, {
          startDate: nextRange.start,
          endDate: nextRange.end,
          types: nextFilters.types,
          statuses: nextFilters.statuses,
          lookbackDays: nextRange.lookbackDays,
          lookaheadDays: nextRange.lookaheadDays,
          limit: overrides.limit,
        });

        const receivedEvents = Array.isArray(response?.events) ? sortEvents(response.events) : [];
        setEvents(receivedEvents);
        const computedMetrics = response?.metrics && typeof response.metrics === 'object'
          ? {
              ...response.metrics,
              range: response.metrics.range ?? {
                start: nextRange.start.toISOString(),
                end: nextRange.end.toISOString(),
              },
            }
          : computeMetrics(receivedEvents, nextRange);
        setMetrics(computedMetrics);
        setRange(nextRange);
        setFilters(nextFilters);
        setError(null);
        setLastUpdated(new Date());
        return { events: receivedEvents, metrics: response?.metrics ?? null, fromServer: true };
      } catch (err) {
        setError(err);
        setRange(nextRange);
        setFilters(nextFilters);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, freelancerId, filters, range],
  );

  useEffect(() => {
    const nextRange = computeRange({ lookbackDays, lookaheadDays });
    setRange(nextRange);
  }, [lookbackDays, lookaheadDays]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    refresh().catch(() => {});
  }, [enabled, freelancerId, refresh]);

  const createEvent = useCallback(
    async (payload, options = {}) => {
      if (!freelancerId) {
        throw new Error('freelancerId is required to create calendar events.');
      }
      const event = await createFreelancerCalendarEvent(freelancerId, payload, options);
      setEvents((current) => {
        const next = sortEvents([...current, event]);
        setMetrics(computeMetrics(next, range));
        setLastUpdated(new Date());
        return next;
      });
      return event;
    },
    [freelancerId, range],
  );

  const updateEvent = useCallback(
    async (eventId, payload, options = {}) => {
      if (!freelancerId) {
        throw new Error('freelancerId is required to update calendar events.');
      }
      const updated = await updateFreelancerCalendarEvent(freelancerId, eventId, payload, options);
      setEvents((current) => {
        const next = sortEvents(current.map((event) => (event.id === updated.id ? updated : event)));
        setMetrics(computeMetrics(next, range));
        setLastUpdated(new Date());
        return next;
      });
      return updated;
    },
    [freelancerId, range],
  );

  const deleteEvent = useCallback(
    async (eventId, options = {}) => {
      if (!freelancerId) {
        throw new Error('freelancerId is required to delete calendar events.');
      }
      await deleteFreelancerCalendarEvent(freelancerId, eventId, options);
      setEvents((current) => {
        const next = current.filter((event) => event.id !== eventId);
        setMetrics(computeMetrics(next, range));
        setLastUpdated(new Date());
        return next;
      });
      return true;
    },
    [freelancerId, range],
  );

  const downloadEventInvite = useCallback(
    async (eventId, options = {}) => {
      if (!freelancerId) {
        throw new Error('freelancerId is required to export calendar events.');
      }
      return downloadFreelancerCalendarEventInvite(freelancerId, eventId, options);
    },
    [freelancerId],
  );

  const state = useMemo(
    () => ({
      events,
      metrics,
      filters,
      range,
      loading,
      error,
      lastUpdated,
    }),
    [events, metrics, filters, range, loading, error, lastUpdated],
  );

  return {
    ...state,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
    downloadEventInvite,
    setFilters,
    setRange,
  };
}
