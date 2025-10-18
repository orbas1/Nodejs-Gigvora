import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import TimelineShell from './timeline/TimelineShell.jsx';
import EventBoard from './timeline/EventBoard.jsx';
import PostStudio from './timeline/PostStudio.jsx';
import AnalyticsPanel from './timeline/AnalyticsPanel.jsx';
import EventDrawer from './timeline/EventDrawer.jsx';
import PostDrawer from './timeline/PostDrawer.jsx';
import MetricDrawer from './timeline/MetricDrawer.jsx';
import {
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  createTimelinePost,
  updateTimelinePost,
  deleteTimelinePost,
  changeTimelinePostStatus,
  recordTimelinePostMetrics,
} from '../../services/companyTimeline.js';

const VIEWS = [
  { id: 'events', label: 'Events' },
  { id: 'posts', label: 'Posts' },
  { id: 'stats', label: 'Stats' },
];

function formatSummaryValue(value, fallback = '0') {
  if (value == null || Number.isNaN(Number(value))) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric.toLocaleString();
}

export default function TimelineManagementSection({
  id,
  className,
  workspaceId,
  lookbackDays,
  data,
  onRefresh,
}) {
  const location = useLocation();
  const timeline = data ?? {};
  const events = timeline.events?.items ?? [];
  const eventCounts = timeline.events?.statusCounts ?? {};
  const upcomingEvents = timeline.events?.upcoming ?? [];
  const overdueEvents = timeline.events?.overdue ?? [];
  const posts = timeline.posts?.items ?? [];
  const postCounts = timeline.posts?.statusCounts ?? {};
  const tagFrequency = timeline.posts?.tagFrequency ?? {};
  const analytics = timeline.analytics ?? {};
  const totals = analytics.totals ?? {};

  const [view, setView] = useState('events');
  const [eventDrawer, setEventDrawer] = useState({ open: false, mode: 'create', record: null });
  const [postDrawer, setPostDrawer] = useState({ open: false, mode: 'create', record: null });
  const [metricDrawer, setMetricDrawer] = useState({ open: false, mode: 'create', post: null });
  const [eventSaving, setEventSaving] = useState(false);
  const [postSaving, setPostSaving] = useState(false);
  const [metricSaving, setMetricSaving] = useState(false);
  const [eventError, setEventError] = useState(null);
  const [postError, setPostError] = useState(null);
  const [metricError, setMetricError] = useState(null);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash === 'posts') {
      setView('posts');
    } else if (hash === 'analytics' || hash === 'stats') {
      setView('stats');
    } else if (hash === 'events') {
      setView('events');
    }
  }, [location.hash]);

  const workspaceReady = workspaceId != null && `${workspaceId}`.length > 0;

  const summary = useMemo(() => {
    const engagementRate = totals.engagementRate != null ? `${Number(totals.engagementRate).toFixed(1)}%` : '0%';
    return [
      { id: 'events', label: 'Events', value: formatSummaryValue(events.length) },
      { id: 'posts', label: 'Live posts', value: formatSummaryValue(postCounts.published ?? 0) },
      { id: 'engagement', label: 'Engagement', value: engagementRate },
    ];
  }, [events.length, postCounts.published, totals.engagementRate]);

  const handleRefresh = async () => {
    if (typeof onRefresh === 'function') {
      await onRefresh({ force: true });
    }
  };

  const openEventDrawer = (record = null) => {
    setEventError(null);
    setEventDrawer({ open: true, mode: record ? 'edit' : 'create', record });
  };

  const closeEventDrawer = () => {
    setEventDrawer({ open: false, mode: 'create', record: null });
    setEventError(null);
  };

  const submitEvent = async (payload) => {
    if (!workspaceReady) {
      setEventError('Select a workspace before saving.');
      return;
    }
    setEventSaving(true);
    try {
      if (eventDrawer.mode === 'edit' && eventDrawer.record?.id) {
        await updateTimelineEvent(eventDrawer.record.id, { workspaceId, ...payload });
      } else {
        await createTimelineEvent({ workspaceId, ...payload });
      }
      closeEventDrawer();
      await handleRefresh();
    } catch (error) {
      setEventError(error?.body?.message ?? error.message ?? 'Unable to save event.');
    } finally {
      setEventSaving(false);
    }
  };

  const deleteEvent = async (record) => {
    if (!workspaceReady) {
      setEventError('Select a workspace before deleting.');
      return;
    }
    if (!window.confirm('Delete this event? This cannot be undone.')) {
      return;
    }
    try {
      await deleteTimelineEvent(record.id, { workspaceId });
      if (eventDrawer.open && eventDrawer.record?.id === record.id) {
        closeEventDrawer();
      }
      await handleRefresh();
    } catch (error) {
      setEventError(error?.body?.message ?? error.message ?? 'Unable to delete event.');
    }
  };

  const openPostDrawer = (record = null) => {
    setPostError(null);
    setPostDrawer({ open: true, mode: record ? 'edit' : 'create', record });
  };

  const closePostDrawer = () => {
    setPostDrawer({ open: false, mode: 'create', record: null });
    setPostError(null);
  };

  const submitPost = async (payload) => {
    if (!workspaceReady) {
      setPostError('Select a workspace before saving.');
      return;
    }
    setPostSaving(true);
    try {
      if (postDrawer.mode === 'edit' && postDrawer.record?.id) {
        await updateTimelinePost(postDrawer.record.id, { workspaceId, ...payload });
      } else {
        await createTimelinePost({ workspaceId, ...payload });
      }
      closePostDrawer();
      await handleRefresh();
    } catch (error) {
      setPostError(error?.body?.message ?? error.message ?? 'Unable to save post.');
    } finally {
      setPostSaving(false);
    }
  };

  const deletePost = async (record) => {
    if (!workspaceReady) {
      setPostError('Select a workspace before deleting.');
      return;
    }
    if (!window.confirm('Delete this post? This cannot be undone.')) {
      return;
    }
    try {
      await deleteTimelinePost(record.id, { workspaceId });
      if (postDrawer.open && postDrawer.record?.id === record.id) {
        closePostDrawer();
      }
      await handleRefresh();
    } catch (error) {
      setPostError(error?.body?.message ?? error.message ?? 'Unable to delete post.');
    }
  };

  const changePostStatus = async (record, status) => {
    if (!workspaceReady) {
      setPostError('Select a workspace before updating status.');
      return;
    }
    try {
      await changeTimelinePostStatus(record.id, { workspaceId, status });
      await handleRefresh();
    } catch (error) {
      setPostError(error?.body?.message ?? error.message ?? 'Unable to update status.');
    }
  };

  const openMetricDrawer = (record) => {
    setMetricError(null);
    setMetricDrawer({ open: true, mode: 'create', post: record });
  };

  const closeMetricDrawer = () => {
    setMetricDrawer({ open: false, mode: 'create', post: null });
    setMetricError(null);
  };

  const submitMetric = async (payload) => {
    if (!workspaceReady) {
      setMetricError('Select a workspace before saving.');
      return;
    }
    if (!metricDrawer.post?.id) {
      setMetricError('Choose a post to record metrics.');
      return;
    }
    setMetricSaving(true);
    try {
      await recordTimelinePostMetrics(metricDrawer.post.id, { workspaceId, ...payload });
      closeMetricDrawer();
      await handleRefresh();
    } catch (error) {
      setMetricError(error?.body?.message ?? error.message ?? 'Unable to save metrics.');
    } finally {
      setMetricSaving(false);
    }
  };

  const actions = (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={!workspaceReady}
      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      Refresh
    </button>
  );

  return (
    <section id={id} className={className}>
      <TimelineShell view={view} onViewChange={setView} views={VIEWS} summary={summary} actions={actions}>
        {view === 'events' ? (
          workspaceReady ? (
            <div className="space-y-4">
              {eventError ? (
                <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {eventError}
                </p>
              ) : null}
              <EventBoard
                events={events}
                upcoming={upcomingEvents}
                overdue={overdueEvents}
                statusCounts={eventCounts}
                onNew={() => openEventDrawer()}
                onOpen={(record) => openEventDrawer(record)}
                onDelete={deleteEvent}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
              Choose a workspace to manage events.
            </div>
          )
        ) : null}

        {view === 'posts' ? (
          workspaceReady ? (
            <div className="space-y-4">
              {postError ? (
                <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {postError}
                </p>
              ) : null}
              <PostStudio
                posts={posts}
                statusCounts={postCounts}
                tagFrequency={tagFrequency}
                onNew={() => openPostDrawer()}
                onOpen={(record) => openPostDrawer(record)}
                onDelete={deletePost}
                onStatusChange={changePostStatus}
                onRecordMetrics={openMetricDrawer}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
              Choose a workspace to write posts.
            </div>
          )
        ) : null}

        {view === 'stats' ? (
          workspaceReady ? (
            <AnalyticsPanel analytics={analytics} lookbackDays={lookbackDays} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
              Choose a workspace to view stats.
            </div>
          )
        ) : null}
      </TimelineShell>

      <EventDrawer
        open={eventDrawer.open}
        mode={eventDrawer.mode}
        initialValue={eventDrawer.record}
        saving={eventSaving}
        error={eventError}
        onClose={closeEventDrawer}
        onSubmit={submitEvent}
      />

      <PostDrawer
        open={postDrawer.open}
        mode={postDrawer.mode}
        initialValue={postDrawer.record}
        saving={postSaving}
        error={postError}
        onClose={closePostDrawer}
        onSubmit={submitPost}
      />

      <MetricDrawer
        open={metricDrawer.open}
        mode={metricDrawer.mode}
        initialValue={metricDrawer.post?.metricsSummary?.series?.[0] ?? null}
        saving={metricSaving}
        error={metricError}
        onClose={closeMetricDrawer}
        onSubmit={submitMetric}
      />
    </section>
  );
}

TimelineManagementSection.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lookbackDays: PropTypes.number,
  data: PropTypes.object,
  onRefresh: PropTypes.func,
};

TimelineManagementSection.defaultProps = {
  id: undefined,
  className: '',
  workspaceId: null,
  lookbackDays: 30,
  data: null,
  onRefresh: null,
};
