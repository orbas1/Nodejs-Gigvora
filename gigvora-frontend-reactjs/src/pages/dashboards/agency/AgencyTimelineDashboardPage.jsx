import { useCallback, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import useAgencyTimeline from '../../../hooks/useAgencyTimeline.js';
import {
  fetchAgencyTimelinePost,
  createAgencyTimelinePost,
  updateAgencyTimelinePost,
  updateAgencyTimelinePostStatus,
  deleteAgencyTimelinePost,
  fetchAgencyTimelinePostAnalytics,
} from '../../../services/agencyTimeline.js';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../../constants/agencyDashboardMenu.js';
import TimelineSummarySection from './sections/TimelineSummarySection.jsx';
import TimelineBoardSection from './sections/TimelineBoardSection.jsx';
import TimelinePostComposer from './sections/TimelinePostComposer.jsx';
import TimelineInsightsDrawer from './sections/TimelineInsightsDrawer.jsx';

const AVAILABLE_CHANNELS = ['gigvora_feed', 'email', 'slack', 'client_portal', 'social'];
const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user'];

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function buildProfile(displayName, summary) {
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    name: displayName,
    role: 'Timeline',
    initials: initials || 'AG',
    status: summary?.topChannel ? `Top ${summary.topChannel.channel}` : 'Plan posts and cadence',
    badges: summary?.lookbackDays ? [`${summary.lookbackDays}-day`] : ['Timeline'],
    metrics: [
      { label: 'Posts', value: summary?.totalPosts ?? 0 },
      { label: 'Queued', value: summary?.scheduledCount ?? 0 },
      { label: 'Eng%', value: formatPercent(summary?.averageEngagementRate) },
    ],
  };
}

export default function AgencyTimelineDashboardPage() {
  const { session } = useSession();
  const displayName = session?.name || session?.firstName || 'Agency team';

  const [lookbackDays, setLookbackDays] = useState(90);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerPost, setComposerPost] = useState(null);
  const [composerError, setComposerError] = useState(null);
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const timeline = useAgencyTimeline({ lookbackDays });

  const profile = useMemo(() => buildProfile(displayName, timeline.data?.summary), [displayName, timeline.data?.summary]);

  const handleLookbackChange = useCallback((event) => {
    setLookbackDays(Number(event.target.value));
  }, []);

  const handleRefresh = useCallback(() => {
    timeline.refresh({ force: true });
  }, [timeline]);

  const handleOpenInsights = useCallback(() => {
    setInsightsOpen(true);
  }, []);

  const handleCloseInsights = useCallback(() => {
    setInsightsOpen(false);
    setSelectedAnalytics(null);
  }, [setSelectedAnalytics]);

  const openComposer = useCallback(
    async (post) => {
      setComposerError(null);
      if (post?.id) {
        try {
          const full = await fetchAgencyTimelinePost(post.id);
          setComposerPost({ id: post.id, ...full.post });
        } catch (error) {
          setComposerError(error?.body?.message || error.message);
          setComposerPost({ id: post.id, ...post });
        }
      } else {
        setComposerPost(null);
      }
      setComposerOpen(true);
    },
    [],
  );

  const handleComposerClose = useCallback(() => {
    if (composerSubmitting) return;
    setComposerOpen(false);
    setComposerPost(null);
    setComposerError(null);
  }, [composerSubmitting]);

  const handleComposerSubmit = useCallback(
    async (payload) => {
      setComposerSubmitting(true);
      setComposerError(null);
      try {
        if (composerPost?.id) {
          await updateAgencyTimelinePost(composerPost.id, payload);
        } else {
          await createAgencyTimelinePost(payload);
        }
        setComposerOpen(false);
        setComposerPost(null);
        await timeline.refresh({ force: true });
      } catch (error) {
        setComposerError(error?.body?.message || error.message);
      } finally {
        setComposerSubmitting(false);
      }
    },
    [composerPost, timeline],
  );

  const handleStatusChange = useCallback(
    async (post, options = {}) => {
      if (options.status === 'scheduled') {
        await openComposer({ ...post, status: 'scheduled' });
        return;
      }
      if (options.status === 'draft') {
        await openComposer({ ...post, status: 'draft' });
        return;
      }
      setStatusUpdating(true);
      try {
        await updateAgencyTimelinePostStatus(post.id, { status: options.status ?? 'published' });
        await timeline.refresh({ force: true });
      } catch (error) {
        setComposerError(error?.body?.message || error.message);
      } finally {
        setStatusUpdating(false);
      }
    },
    [openComposer, timeline],
  );

  const handleArchive = useCallback(
    async (post) => {
      setStatusUpdating(true);
      try {
        await deleteAgencyTimelinePost(post.id);
        await timeline.refresh({ force: true });
      } catch (error) {
        setComposerError(error?.body?.message || error.message);
      } finally {
        setStatusUpdating(false);
      }
    },
    [timeline],
  );

  const handleAnalyticsSelect = useCallback(
    async (post) => {
      setAnalyticsLoading(true);
      try {
        const analytics = await fetchAgencyTimelinePostAnalytics(post.id, { lookbackDays });
        setSelectedAnalytics({ post, analytics });
      } catch (error) {
        setSelectedAnalytics({ post, error: error?.body?.message || error.message });
      } finally {
        setAnalyticsLoading(false);
      }
      setInsightsOpen(true);
    },
    [lookbackDays],
  );

  const summaryMetrics = timeline.summaryMetrics;
  const columns = timeline.pipelineColumns;
  const totals = timeline.data?.analytics?.totals ?? {};
  const trend = timeline.trend;
  const channelBreakdown = timeline.channelBreakdown;
  const topPosts = timeline.topPosts;

  return (
    <DashboardLayout
      currentDashboard="agency"
      activeMenuItem="timeline"
      title="Timeline"
      subtitle="Schedule posts and track results."
      description="Compose, launch, and review timeline activity in one view."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      profile={profile}
    >
      <div className="space-y-10">
        <TimelineSummarySection
          metrics={summaryMetrics}
          lookbackDays={lookbackDays}
          onLookbackChange={handleLookbackChange}
          onRefresh={handleRefresh}
          onCreatePost={() => openComposer(null)}
          onOpenInsights={handleOpenInsights}
          refreshing={timeline.loading}
          updatedAt={timeline.lastUpdated}
          metadata={timeline.data?.summary}
        />

        <TimelineBoardSection
          columns={columns}
          onCreate={() => openComposer(null)}
          onEdit={(post) => openComposer(post)}
          onStatusChange={handleStatusChange}
          onViewAnalytics={handleAnalyticsSelect}
          onArchive={handleArchive}
          loading={timeline.loading || statusUpdating}
        />
      </div>

      <TimelinePostComposer
        open={composerOpen}
        initialPost={composerPost}
        availableChannels={AVAILABLE_CHANNELS}
        onClose={handleComposerClose}
        onSubmit={handleComposerSubmit}
        submitting={composerSubmitting}
        errorMessage={composerError}
      />

      <TimelineInsightsDrawer
        open={insightsOpen}
        onClose={handleCloseInsights}
        totals={totals}
        trend={trend}
        channelBreakdown={channelBreakdown}
        topPosts={topPosts}
        onSelectPost={handleAnalyticsSelect}
        loading={timeline.loading || analyticsLoading}
        selectedAnalytics={selectedAnalytics}
        onClearSelected={() => setSelectedAnalytics(null)}
      />
    </DashboardLayout>
  );
}
