import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  LinkIcon,
  PhotoIcon,
  UserGroupIcon,
  UsersIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import {
  deleteFollower,
  saveFollower,
  updateConnection,
  updateProfileDetails,
  uploadProfileAvatar,
} from '../../../services/profileHub.js';
import ProfileEditor from '../../ProfileEditor.jsx';
import UserAvatar from '../../UserAvatar.jsx';
import ProfileHubNav from './ProfileHubNav.jsx';
import ProfileHubInfoPanel from './ProfileHubInfoPanel.jsx';
import ProfileHubPhotoPanel from './ProfileHubPhotoPanel.jsx';
import ProfileHubLinksPanel from './ProfileHubLinksPanel.jsx';
import ProfileHubFollowersPanel from './ProfileHubFollowersPanel.jsx';
import ProfileHubConnectionsPanel from './ProfileHubConnectionsPanel.jsx';
import ProfileHubFollowerDialog from './ProfileHubFollowerDialog.jsx';
import ProfileHubConnectionDialog from './ProfileHubConnectionDialog.jsx';

function buildProfileDraft(profileOverview, profileHub) {
  const settings = profileHub?.settings ?? {};
  const profile = profileOverview ?? {};
  const socialLinks = Array.isArray(settings.socialLinks) ? settings.socialLinks : [];
  return {
    headline: profile.headline ?? profile.missionStatement ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    timezone: profile.timezone ?? '',
    missionStatement: profile.missionStatement ?? '',
    profileVisibility: settings.profileVisibility ?? profile.profileVisibility ?? 'members',
    networkVisibility: settings.networkVisibility ?? profile.networkVisibility ?? 'connections',
    followersVisibility: settings.followersVisibility ?? profile.followersVisibility ?? 'connections',
    socialLinks: socialLinks.map((link, index) => ({
      id: link.id ?? `link-${index + 1}`,
      label: link.label ?? '',
      url: link.url ?? '',
      description: link.description ?? '',
    })),
    avatarUrlInput: '',
  };
}

function parseTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.slice(0, 60));
}

function cloneDraft(draft) {
  return JSON.parse(JSON.stringify(draft ?? {}));
}

function normalizeDraft(draft) {
  if (!draft) {
    return null;
  }

  return {
    headline: draft.headline?.trim() ?? '',
    bio: draft.bio?.trim() ?? '',
    missionStatement: draft.missionStatement?.trim() ?? '',
    location: draft.location?.trim() ?? '',
    timezone: draft.timezone?.trim() ?? '',
    profileVisibility: draft.profileVisibility ?? 'members',
    networkVisibility: draft.networkVisibility ?? 'connections',
    followersVisibility: draft.followersVisibility ?? 'connections',
    socialLinks: Array.isArray(draft.socialLinks)
      ? draft.socialLinks.map((link, index) => ({
          id: link.id ?? `link-${index + 1}`,
          label: link.label?.trim() ?? '',
          url: link.url?.trim() ?? '',
          description: link.description?.trim() ?? '',
        }))
      : [],
  };
}

function draftsEqual(a, b) {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return JSON.stringify(normalizeDraft(a)) === JSON.stringify(normalizeDraft(b));
}

function mergeDraft(previous, patch) {
  const next = cloneDraft(previous ?? buildProfileDraft({}, {}));
  if (!patch) {
    return next;
  }

  const keys = [
    'headline',
    'bio',
    'missionStatement',
    'location',
    'timezone',
    'profileVisibility',
    'networkVisibility',
    'followersVisibility',
  ];

  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      next[key] = patch[key] ?? '';
    }
  });

  if (Array.isArray(patch.socialLinks)) {
    next.socialLinks = patch.socialLinks.map((link, index) => ({
      id: link.id ?? next.socialLinks?.[index]?.id ?? `link-${index + 1}`,
      label: link.label ?? '',
      url: link.url ?? '',
      description: link.description ?? '',
    }));
  }

  return next;
}

function calculateProfileCompleteness(draft) {
  const requirements = [
    { key: 'headline', label: 'headline', complete: Boolean(draft?.headline?.trim()) },
    { key: 'missionStatement', label: 'mission statement', complete: Boolean(draft?.missionStatement?.trim()) },
    { key: 'bio', label: 'bio', complete: Boolean(draft?.bio?.trim()) },
    { key: 'location', label: 'location', complete: Boolean(draft?.location?.trim()) },
    { key: 'timezone', label: 'timezone', complete: Boolean(draft?.timezone?.trim()) },
    {
      key: 'socialLinks',
      label: 'lead link',
      complete: Array.isArray(draft?.socialLinks)
        ? draft.socialLinks.some((link) => Boolean(link?.url?.trim()))
        : false,
    },
  ];

  const completed = requirements.filter((item) => item.complete).length;
  const total = requirements.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const missing = requirements.filter((item) => !item.complete).map((item) => item.label);

  return { completed, total, percent, missing };
}

function formatList(values) {
  if (!values?.length) {
    return '';
  }
  if (values.length === 1) {
    return values[0];
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function formatCompactNumber(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (Math.abs(numeric) >= 1000) {
      return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(numeric);
    }
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(numeric);
  }
  return value ?? '0';
}

function safeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

const PANELS = [
  { id: 'info', label: 'Info', icon: UserIcon },
  { id: 'photo', label: 'Photo', icon: PhotoIcon },
  { id: 'links', label: 'Links', icon: LinkIcon },
  { id: 'followers', label: 'Followers', icon: UserGroupIcon },
  { id: 'connections', label: 'Connections', icon: UsersIcon },
];

export default function ProfileHubWorkspace({ userId, profileOverview, profileHub, onRefresh }) {
  const [activePanelId, setActivePanelId] = useState('info');
  const [focusedPanelId, setFocusedPanelId] = useState(null);
  const [profileDraft, setProfileDraft] = useState(() => buildProfileDraft(profileOverview, profileHub));
  const [profileBaseline, setProfileBaseline] = useState(() => cloneDraft(buildProfileDraft(profileOverview, profileHub)));
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [followers, setFollowers] = useState(profileHub?.followers?.items ?? []);
  const [connections, setConnections] = useState(profileHub?.connections?.items ?? []);
  const [pendingConnections, setPendingConnections] = useState(profileHub?.connections?.pending ?? []);
  const [addFollowerForm, setAddFollowerForm] = useState({ identifier: '', displayName: '', tags: '', notes: '' });
  const [savingFollowerId, setSavingFollowerId] = useState(null);
  const [updatingConnectionId, setUpdatingConnectionId] = useState(null);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [followerEditor, setFollowerEditor] = useState(null);
  const [connectionEditor, setConnectionEditor] = useState(null);
  const fileInputRef = useRef(null);

  const profileLink = profileOverview?.profileId ? `/profile/${profileOverview.profileId}` : null;

  useEffect(() => {
    const nextDraft = buildProfileDraft(profileOverview, profileHub);
    setProfileDraft(nextDraft);
    setProfileBaseline(cloneDraft(nextDraft));
  }, [profileOverview, profileHub]);

  useEffect(() => {
    setFollowers(profileHub?.followers?.items ?? []);
    setConnections(profileHub?.connections?.items ?? []);
    setPendingConnections(profileHub?.connections?.pending ?? []);
  }, [profileHub]);

  useEffect(() => {
    if (!feedbackMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setFeedbackMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [feedbackMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setErrorMessage(''), 5000);
    return () => clearTimeout(timeout);
  }, [errorMessage]);

  const followerStats = useMemo(() => {
    return followers.reduce(
      (accumulator, follower) => {
        accumulator.total += 1;
        if (follower.status === 'active') accumulator.active += 1;
        if (follower.status === 'muted') accumulator.muted += 1;
        if (follower.status === 'blocked') accumulator.blocked += 1;
        return accumulator;
      },
      { total: 0, active: 0, muted: 0, blocked: 0 },
    );
  }, [followers]);

  const workspace = profileHub?.workspace ?? {};
  const workspaceMetrics = workspace.metrics ?? {};
  const workspaceHighlights = Array.isArray(workspace.highlights) ? workspace.highlights : [];
  const workspaceActions = Array.isArray(workspace.actions) ? workspace.actions : [];
  const pinnedCampaigns = Array.isArray(workspace.pinnedCampaigns) ? workspace.pinnedCampaigns : [];
  const cadenceGoal = workspace.cadenceGoal ?? null;
  const workspaceTimezone = workspace.timezone ?? profileDraft?.timezone ?? profileOverview?.timezone ?? '';
  const completeness = useMemo(() => calculateProfileCompleteness(profileDraft), [profileDraft]);
  const completenessBarWidth = completeness.percent > 0 ? Math.min(100, completeness.percent) : 6;
  const hasUnsavedChanges = useMemo(
    () => !draftsEqual(profileDraft, profileBaseline),
    [profileDraft, profileBaseline],
  );

  const favouriteConnectionsCount = useMemo(
    () => connections.filter((connection) => connection.favourite).length,
    [connections],
  );

  const metricCards = useMemo(() => {
    const followerTotal = workspaceMetrics.followers ?? profileHub?.followers?.total ?? followerStats.total ?? followers.length;
    const activeFollowerTotal = workspaceMetrics.activeFollowers ?? followerStats.active ?? 0;
    const connectionTotal = workspaceMetrics.connections ?? connections.length;
    const favouriteTotal = workspaceMetrics.favouriteConnections ?? favouriteConnectionsCount;
    const timelinePublished = safeNumber(workspaceMetrics.timelinePublished ?? profileHub?.experienceTimeline?.analytics?.totals?.published);
    const portfolioPublished = safeNumber(
      workspaceMetrics.portfolioPublished ?? profileHub?.portfolio?.summary?.published,
    );
    const engagementRate = workspaceMetrics.engagementRate ?? null;

    const cards = [
      {
        id: 'followers',
        label: 'Followers',
        value: formatCompactNumber(followerTotal),
        subLabel: `${formatCompactNumber(activeFollowerTotal)} active audience`,
      },
      {
        id: 'connections',
        label: 'Connections',
        value: formatCompactNumber(connectionTotal),
        subLabel: `${formatCompactNumber(favouriteTotal)} favourites`,
      },
    ];

    const contentTotal = timelinePublished + portfolioPublished;
    if (contentTotal > 0 || engagementRate) {
      const parts = [];
      if (timelinePublished > 0 || portfolioPublished > 0) {
        parts.push(
          `${formatCompactNumber(timelinePublished)} timeline • ${formatCompactNumber(portfolioPublished)} portfolio`,
        );
      }
      if (engagementRate) {
        parts.push(`${engagementRate} engagement rate`);
      }
      cards.push({
        id: 'content',
        label: 'Published stories',
        value: formatCompactNumber(contentTotal),
        subLabel: parts.join(' • ') || 'Ready to publish',
      });
    }

    return cards;
  }, [
    workspaceMetrics.followers,
    workspaceMetrics.activeFollowers,
    workspaceMetrics.connections,
    workspaceMetrics.favouriteConnections,
    workspaceMetrics.timelinePublished,
    workspaceMetrics.portfolioPublished,
    workspaceMetrics.engagementRate,
    profileHub?.followers?.total,
    profileHub?.experienceTimeline?.analytics?.totals?.published,
    profileHub?.portfolio?.summary?.published,
    followers.length,
    followerStats.total,
    followerStats.active,
    connections,
    favouriteConnectionsCount,
  ]);

  const activePanel = PANELS.find((panel) => panel.id === activePanelId) ?? PANELS[0];

  const handleDraftChange = (key, value) => {
    setProfileDraft((previous) => ({ ...previous, [key]: value }));
  };

  const handleDiscardDraft = () => {
    setProfileDraft(cloneDraft(profileBaseline));
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setErrorMessage('');
    try {
      const payload = {
        headline: profileDraft.headline,
        bio: profileDraft.bio,
        missionStatement: profileDraft.missionStatement,
        location: profileDraft.location,
        timezone: profileDraft.timezone,
        profileVisibility: profileDraft.profileVisibility,
        networkVisibility: profileDraft.networkVisibility,
        followersVisibility: profileDraft.followersVisibility,
        socialLinks: profileDraft.socialLinks.map((link) => ({
          label: link.label,
          url: link.url,
          description: link.description,
        })),
      };
      await updateProfileDetails(userId, payload);
      setFeedbackMessage('Profile saved');
      setProfileBaseline(cloneDraft(profileDraft));
      onRefresh?.();
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to save profile details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setSavingAvatar(true);
    setErrorMessage('');
    try {
      await uploadProfileAvatar(userId, { file });
      setFeedbackMessage('Photo updated');
      onRefresh?.();
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to upload photo.');
    } finally {
      setSavingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarUrlApply = async () => {
    if (!profileDraft.avatarUrlInput) {
      return;
    }
    setSavingAvatar(true);
    setErrorMessage('');
    try {
      await uploadProfileAvatar(userId, { avatarUrl: profileDraft.avatarUrlInput });
      setFeedbackMessage('Photo updated');
      setProfileDraft((previous) => ({ ...previous, avatarUrlInput: '' }));
      setProfileBaseline((previous) => {
        const snapshot = cloneDraft(previous);
        snapshot.avatarUrlInput = '';
        return snapshot;
      });
      onRefresh?.();
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to update photo.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleFollowerAdd = async () => {
    if (!addFollowerForm.identifier?.trim()) {
      return;
    }
    setSavingFollowerId('new');
    setErrorMessage('');
    try {
      const payload = {
        followerId: addFollowerForm.identifier.match(/^[0-9]+$/) ? Number(addFollowerForm.identifier) : undefined,
        followerEmail: addFollowerForm.identifier.includes('@') ? addFollowerForm.identifier : undefined,
        displayName: addFollowerForm.displayName,
        tags: parseTags(addFollowerForm.tags),
        notes: addFollowerForm.notes,
      };
      const record = await saveFollower(userId, payload);
      setFollowers((previous) => {
        const existingIndex = previous.findIndex((item) => item.followerId === record.followerId);
        if (existingIndex >= 0) {
          const copy = previous.slice();
          copy[existingIndex] = record;
          return copy;
        }
        return [record, ...previous];
      });
      setAddFollowerForm({ identifier: '', displayName: '', tags: '', notes: '' });
      setFeedbackMessage('Follower added');
      onRefresh?.();
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to add follower.');
    } finally {
      setSavingFollowerId(null);
    }
  };

  const handleFollowerSave = async (payload) => {
    setSavingFollowerId(payload.followerId);
    setErrorMessage('');
    try {
      const record = await saveFollower(userId, {
        followerId: payload.followerId,
        status: payload.status,
        displayName: payload.displayName,
        tags: parseTags(payload.tags ?? ''),
        notes: payload.notes,
        notificationsEnabled: payload.notificationsEnabled,
        lastInteractedAt: payload.lastInteractedAt,
      });
      setFollowers((previous) => {
        const index = previous.findIndex((item) => item.followerId === record.followerId);
        if (index >= 0) {
          const copy = previous.slice();
          copy[index] = record;
          return copy;
        }
        return previous;
      });
      setFollowerEditor(null);
      setFeedbackMessage('Follower updated');
      onRefresh?.();
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to update follower.');
    } finally {
      setSavingFollowerId(null);
    }
  };

  const handleFollowerRemove = async (followerId) => {
    setSavingFollowerId(followerId);
    setErrorMessage('');
    try {
      await deleteFollower(userId, followerId);
      setFollowers((previous) => previous.filter((item) => item.followerId !== followerId));
      setFollowerEditor((previous) => (previous?.followerId === followerId ? null : previous));
      setFeedbackMessage('Follower removed');
      onRefresh?.();
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to remove follower.');
    } finally {
      setSavingFollowerId(null);
    }
  };

  const handleConnectionSave = async (payload) => {
    setUpdatingConnectionId(payload.connectionId);
    setErrorMessage('');
    try {
      const record = await updateConnection(userId, payload.connectionId, {
        relationshipTag: payload.relationshipTag,
        notes: payload.notes,
        favourite: payload.favourite,
        visibility: payload.visibility,
        lastInteractedAt: payload.lastInteractedAt,
      });
      setConnections((previous) => {
        const index = previous.findIndex((item) => item.id === record.id);
        if (index >= 0) {
          const copy = previous.slice();
          copy[index] = record;
          return copy;
        }
        return previous;
      });
      setConnectionEditor(null);
      setFeedbackMessage('Connection updated');
      onRefresh?.();
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to update connection.');
    } finally {
      setUpdatingConnectionId(null);
    }
  };

  const handleFavouriteToggle = async (connection) => {
    await handleConnectionSave({
      connectionId: connection.id,
      relationshipTag: connection.relationshipTag,
      notes: connection.notes,
      favourite: !connection.favourite,
      visibility: connection.visibility,
      lastInteractedAt: connection.lastInteractedAt,
    });
  };

  const renderPanel = (panelId, variant = 'default') => {
    switch (panelId) {
      case 'info':
        return (
          <ProfileHubInfoPanel
            draft={profileDraft}
            onChange={handleDraftChange}
            onSave={handleProfileSave}
            saving={savingProfile}
            onOpenAdvanced={() => setShowAdvancedEditor(true)}
            layout={variant}
          />
        );
      case 'photo':
        return (
          <ProfileHubPhotoPanel
            profile={profileOverview}
            avatarUrlDraft={profileDraft.avatarUrlInput}
            onAvatarDraftChange={(value) => handleDraftChange('avatarUrlInput', value)}
            onSelectFile={handleAvatarFileChange}
            onApplyUrl={handleAvatarUrlApply}
            saving={savingAvatar}
            fileInputRef={fileInputRef}
          />
        );
      case 'links':
        return (
          <div className="flex flex-col gap-4">
            <ProfileHubLinksPanel
              links={profileDraft.socialLinks}
              onChange={(links) => handleDraftChange('socialLinks', links)}
              disabled={savingProfile}
              layout={variant}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={savingProfile}
                className="inline-flex items-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save links
              </button>
            </div>
          </div>
        );
      case 'followers':
        return (
          <ProfileHubFollowersPanel
            stats={followerStats}
            followers={followers}
            addForm={addFollowerForm}
            onChangeAddForm={setAddFollowerForm}
            onAdd={handleFollowerAdd}
            onOpenFollower={setFollowerEditor}
            onRemove={handleFollowerRemove}
            busyId={savingFollowerId}
            layout={variant}
          />
        );
      case 'connections':
        return (
          <ProfileHubConnectionsPanel
            connections={connections}
            pending={pendingConnections}
            onOpenConnection={setConnectionEditor}
            onToggleFavourite={handleFavouriteToggle}
            busyId={updatingConnectionId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section
      id="profile-hub"
      className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur"
    >
      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Profile health</p>
              <h2 className="text-lg font-semibold text-slate-900">Profile completeness</h2>
              <p className="mt-1 text-sm text-slate-600">
                {completeness.percent >= 100
                  ? 'Your profile is showcase ready.'
                  : `Complete ${formatList(completeness.missing)} to reach 100%.`}
              </p>
            </div>
            <span className="rounded-3xl bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
              {Math.min(100, completeness.percent)}% ready
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100" role="presentation">
            <div
              className="h-2 rounded-full bg-accent transition-all"
              style={{ width: `${completenessBarWidth}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completeness.percent}
              aria-label="Profile completeness"
            />
          </div>
          {(cadenceGoal || workspaceTimezone) && (
            <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              {cadenceGoal ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cadence</dt>
                  <dd className="mt-1">{cadenceGoal}</dd>
                </div>
              ) : null}
              {workspaceTimezone ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Timezone</dt>
                  <dd className="mt-1">{workspaceTimezone}</dd>
                </div>
              ) : null}
            </dl>
          )}
          {workspaceHighlights.length ? (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white/80 p-4">
              <h3 className="text-sm font-semibold text-slate-700">Highlights</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {workspaceHighlights.slice(0, 3).map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {workspaceActions.length ? (
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
              <h3 className="text-sm font-semibold text-amber-700">Next actions</h3>
              <ul className="mt-2 space-y-2 text-sm text-amber-700">
                {workspaceActions.slice(0, 3).map((action) => (
                  <li key={action} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {pinnedCampaigns.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {pinnedCampaigns.slice(0, 4).map((campaign) => (
                <span
                  key={campaign.id ?? campaign.name ?? campaign.title ?? campaign}
                  className="inline-flex items-center rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white shadow-sm"
                >
                  {campaign.name ?? campaign.title ?? campaign}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {metricCards.map((card) => (
            <div
              key={card.id}
              className="rounded-4xl border border-slate-200 bg-gradient-to-br from-white/95 to-slate-50/80 p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
              {card.subLabel ? <p className="mt-1 text-sm text-slate-500">{card.subLabel}</p> : null}
            </div>
          ))}
        </div>
      </div>

      {hasUnsavedChanges ? (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50/90 px-4 py-3 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <span className="font-semibold">Unsaved changes</span>
            <span className="hidden sm:inline">Save your edits to keep your profile current.</span>
          </div>
          <div className="mt-3 flex gap-2 sm:mt-0">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="inline-flex items-center rounded-2xl border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              Reset draft
            </button>
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="inline-flex items-center rounded-2xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save now
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[220px,minmax(0,1fr)]">
        <div className="space-y-4">
          <ProfileHubNav panels={PANELS} activePanelId={activePanelId} onSelect={setActivePanelId} />
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-sm">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={profileOverview?.name}
                imageUrl={profileOverview?.avatarUrl}
                seed={profileOverview?.avatarSeed ?? profileOverview?.name}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">{profileOverview?.name ?? 'Profile'}</p>
                <p className="truncate text-sm text-slate-500">{profileOverview?.headline ?? 'Set your headline'}</p>
                <p className="truncate text-xs text-slate-400">{profileOverview?.location}</p>
              </div>
            </div>
            {profileLink ? (
              <a
                href={profileLink}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
              >
                View profile <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
        <div className="space-y-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-800">
              {activePanel.icon ? <activePanel.icon className="h-5 w-5 text-accent" /> : null}
              <h2 className="text-xl font-semibold">{activePanel.label}</h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFocusedPanelId(activePanel.id)}
                className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-accent hover:text-accent"
              >
                Full view
              </button>
            </div>
          </header>

          {feedbackMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {feedbackMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            {renderPanel(activePanel.id)}
          </div>
        </div>
      </div>

      <Transition.Root show={focusedPanelId != null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setFocusedPanelId(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto p-6">
            <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="w-full rounded-4xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {PANELS.find((panel) => panel.id === focusedPanelId)?.label ?? 'Panel'}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={() => setFocusedPanelId(null)}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent hover:text-accent"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-6">
                    {focusedPanelId ? renderPanel(focusedPanelId, 'modal') : null}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <ProfileHubFollowerDialog
        open={Boolean(followerEditor)}
        follower={followerEditor}
        onClose={() => setFollowerEditor(null)}
        onSave={handleFollowerSave}
        onDelete={handleFollowerRemove}
        saving={savingFollowerId != null}
      />

      <ProfileHubConnectionDialog
        open={Boolean(connectionEditor)}
        connection={connectionEditor}
        onClose={() => setConnectionEditor(null)}
        onSave={handleConnectionSave}
        saving={updatingConnectionId != null}
      />

      <ProfileEditor
        open={showAdvancedEditor}
        profile={profileOverview}
        saving={savingProfile}
        onClose={() => setShowAdvancedEditor(false)}
        onSave={async (payload) => {
          setSavingProfile(true);
          setErrorMessage('');
          try {
            await updateProfileDetails(userId, payload);
      setFeedbackMessage('Profile updated');
      setShowAdvancedEditor(false);
      setProfileDraft((previous) => {
        const next = mergeDraft(previous, payload);
        setProfileBaseline(cloneDraft(next));
        return next;
      });
      onRefresh?.();
    } catch (error) {
      setErrorMessage(error.message ?? 'Unable to save profile.');
          } finally {
            setSavingProfile(false);
          }
        }}
      />
    </section>
  );
}

const followerShape = PropTypes.shape({
  followerId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  status: PropTypes.string,
  displayName: PropTypes.string,
  tags: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  notes: PropTypes.string,
  notificationsEnabled: PropTypes.bool,
  lastInteractedAt: PropTypes.string,
  summary: PropTypes.shape({
    name: PropTypes.string,
    headline: PropTypes.string,
    userType: PropTypes.string,
    avatarUrl: PropTypes.string,
    avatarSeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
});

const connectionShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  relationshipTag: PropTypes.string,
  notes: PropTypes.string,
  favourite: PropTypes.bool,
  visibility: PropTypes.string,
  lastInteractedAt: PropTypes.string,
  counterpart: PropTypes.shape({
    name: PropTypes.string,
    headline: PropTypes.string,
    userType: PropTypes.string,
    avatarUrl: PropTypes.string,
    avatarSeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
});

ProfileHubWorkspace.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  profileOverview: PropTypes.shape({
    profileId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    headline: PropTypes.string,
    missionStatement: PropTypes.string,
    bio: PropTypes.string,
    location: PropTypes.string,
    timezone: PropTypes.string,
    avatarUrl: PropTypes.string,
    avatarSeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  profileHub: PropTypes.shape({
    settings: PropTypes.shape({
      socialLinks: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          label: PropTypes.string,
          url: PropTypes.string,
          description: PropTypes.string,
        }),
      ),
    }),
    followers: PropTypes.shape({
      items: PropTypes.arrayOf(followerShape),
    }),
    connections: PropTypes.shape({
      items: PropTypes.arrayOf(connectionShape),
      pending: PropTypes.arrayOf(PropTypes.any),
    }),
  }),
  onRefresh: PropTypes.func,
};

ProfileHubWorkspace.defaultProps = {
  profileOverview: undefined,
  profileHub: undefined,
  onRefresh: undefined,
};
