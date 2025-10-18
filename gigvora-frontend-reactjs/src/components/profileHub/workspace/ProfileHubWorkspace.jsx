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
    setProfileDraft(buildProfileDraft(profileOverview, profileHub));
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

  const activePanel = PANELS.find((panel) => panel.id === activePanelId) ?? PANELS[0];

  const handleDraftChange = (key, value) => {
    setProfileDraft((previous) => ({ ...previous, [key]: value }));
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
