import { useState } from 'react';
import SectionShell from '../../SectionShell.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerTimeline from '../../../../hooks/useFreelancerTimeline.js';
import TimelineToolbar from './TimelineToolbar.jsx';
import TimelinePlanView from './TimelinePlanView.jsx';
import TimelinePostsView from './TimelinePostsView.jsx';
import TimelineMetricsView from './TimelineMetricsView.jsx';
import TimelineEntryDrawer from './TimelineEntryDrawer.jsx';
import TimelinePostDrawer from './TimelinePostDrawer.jsx';
import TimelineSettingsDrawer from './TimelineSettingsDrawer.jsx';

export default function TimelineManagementSection() {
  const { session } = useSession();
  const role = (session?.activeRole ?? session?.role ?? session?.workspace?.role ?? '').toString().toLowerCase();
  const memberships = Array.isArray(session?.memberships)
    ? session.memberships.map((membership) => membership.toString().toLowerCase())
    : [];
  const workspaceType = (session?.workspace?.type ?? '').toString().toLowerCase();
  const hasAccess =
    role.includes('freelancer') ||
    role.includes('admin') ||
    memberships.some((membership) => membership.includes('freelancer')) ||
    workspaceType.includes('freelancer');

  const freelancerId =
    session?.freelancerId ??
    session?.profileId ??
    session?.primaryProfileId ??
    session?.userId ??
    session?.id ??
    null;

  const {
    workspace,
    posts,
    timelineEntries,
    analytics,
    loading,
    error,
    fromCache,
    lastUpdated,
    savingSettings,
    savingPost,
    savingEntry,
    savingMetrics,
    refresh,
    saveSettings,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    recordMetrics,
    createEntry,
    updateEntry,
    deleteEntry,
    isNetworkEnabled,
  } = useFreelancerTimeline({ freelancerId, enabled: hasAccess });

  const [activeView, setActiveView] = useState('plan');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [entryDrawer, setEntryDrawer] = useState({ open: false, mode: 'create', entry: null });
  const [postDrawer, setPostDrawer] = useState({ open: false, mode: 'create', post: null });

  const timezone = workspace?.timezone ?? 'UTC';

  const openEntryCreate = () => setEntryDrawer({ open: true, mode: 'create', entry: null });
  const openEntryEdit = (entry) => setEntryDrawer({ open: true, mode: 'edit', entry });
  const closeEntryDrawer = () => setEntryDrawer((state) => ({ ...state, open: false }));

  const openPostCreate = () => setPostDrawer({ open: true, mode: 'create', post: null });
  const openPostEdit = (post, mode = 'edit') => setPostDrawer({ open: true, mode, post });
  const closePostDrawer = () => setPostDrawer((state) => ({ ...state, open: false }));

  const handleSaveEntry = async (payload, entryId) => {
    if (entryId) {
      await updateEntry(entryId, payload);
    } else {
      await createEntry(payload);
    }
    closeEntryDrawer();
  };

  const handleDeleteEntry = async (entry) => {
    if (!entry?.id) {
      return;
    }
    await deleteEntry(entry.id);
    closeEntryDrawer();
  };

  const handleSavePost = async (payload, postId) => {
    if (postId) {
      await updatePost(postId, payload);
    } else {
      await createPost(payload);
    }
    closePostDrawer();
  };

  const handleDeletePost = async (post) => {
    if (!post?.id) {
      return;
    }
    await deletePost(post.id);
    closePostDrawer();
  };

  const handlePublishPost = async (post) => {
    if (!post?.id) {
      return;
    }
    await publishPost(post.id, {});
  };

  const handleRecordMetrics = async (postId, payload) => {
    if (!postId) {
      return;
    }
    await recordMetrics(postId, payload);
  };

  const handleSaveSettings = async (payload) => {
    await saveSettings(payload);
    setSettingsOpen(false);
  };

  let content;
  if (!hasAccess) {
    content = (
      <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-8 text-center text-sm font-semibold text-slate-500">
        Timeline tools are limited for your profile.
      </div>
    );
  } else if (loading && !timelineEntries?.length && !posts?.length) {
    content = (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
    );
  } else if (activeView === 'plan') {
    content = (
      <TimelinePlanView
        entries={timelineEntries}
        timezone={timezone}
        onCreateEntry={openEntryCreate}
        onOpenEntry={openEntryEdit}
      />
    );
  } else if (activeView === 'posts') {
    content = (
      <TimelinePostsView
        posts={posts}
        onCreatePost={openPostCreate}
        onOpenPost={openPostEdit}
        onPublish={handlePublishPost}
        onDeletePost={handleDeletePost}
      />
    );
  } else {
    content = <TimelineMetricsView analytics={analytics} />;
  }

  return (
    <SectionShell id="timeline-management" title="Timeline" description="Plan updates, publish posts, track performance.">
      <TimelineToolbar
        activeView={activeView}
        onChange={setActiveView}
        onOpenSettings={() => setSettingsOpen(true)}
        onRefresh={() => refresh({ force: true })}
        refreshing={loading}
      />
      <DataStatus
        loading={loading}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        error={error}
        onRefresh={() => refresh({ force: true })}
        statusLabel={isNetworkEnabled ? 'Live data' : 'Workspace demo'}
      />
      {content}
      <TimelineEntryDrawer
        open={entryDrawer.open}
        mode={entryDrawer.mode}
        entry={entryDrawer.entry}
        posts={posts}
        onClose={closeEntryDrawer}
        onSubmit={handleSaveEntry}
        onDelete={handleDeleteEntry}
        saving={savingEntry}
      />
      <TimelinePostDrawer
        open={postDrawer.open}
        mode={postDrawer.mode}
        post={postDrawer.post}
        onClose={closePostDrawer}
        onSubmit={handleSavePost}
        onDelete={handleDeletePost}
        onPublish={handlePublishPost}
        onRecordMetrics={handleRecordMetrics}
        savingPost={savingPost}
        savingMetrics={savingMetrics}
      />
      <TimelineSettingsDrawer
        open={settingsOpen}
        workspace={workspace}
        onClose={() => setSettingsOpen(false)}
        onSubmit={handleSaveSettings}
        saving={savingSettings}
      />
    </SectionShell>
  );
}
