import { useRef, useState, useCallback } from 'react';
import SectionShell from '../SectionShell.jsx';
import {
  ProfileSummaryCard,
  AvailabilityCard,
  SkillCard,
  NetworkPreviewCard,
  ConnectionsCard,
  ProfileInfoDrawer,
  AvailabilityDrawer,
  SkillManagerDrawer,
  ConnectionsDialog,
  FollowersDialog,
  ExperienceCard,
  ExperienceDrawer,
} from './profile-overview/index.js';

function toNumber(value, fallback = null) {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function has(changes, key) {
  return Object.prototype.hasOwnProperty.call(changes, key);
}

function buildPayload(profile, changes = {}) {
  const availability = profile?.availability ?? {};
  const nextAvailability = {
    status: changes.availabilityStatus ?? availability.status ?? 'limited',
    hoursPerWeek: has(changes, 'hoursPerWeek')
      ? toNumber(changes.hoursPerWeek, null)
      : availability.hoursPerWeek ?? null,
    openToRemote: has(changes, 'openToRemote')
      ? Boolean(changes.openToRemote)
      : Boolean(availability.openToRemote ?? true),
    notes: has(changes, 'availabilityNotes') ? changes.availabilityNotes ?? '' : availability.notes ?? '',
  };

  const hourlyRate = has(changes, 'hourlyRate')
    ? toNumber(changes.hourlyRate, null)
    : profile?.hourlyRate != null
    ? profile.hourlyRate
    : null;

  const payload = {
    firstName: changes.firstName ?? profile?.firstName ?? '',
    lastName: changes.lastName ?? profile?.lastName ?? '',
    headline: changes.headline ?? profile?.headline ?? '',
    bio: changes.bio ?? profile?.bio ?? '',
    missionStatement: changes.missionStatement ?? profile?.missionStatement ?? '',
    location: changes.location ?? profile?.location ?? '',
    timezone: changes.timezone ?? profile?.timezone ?? '',
    title: changes.title ?? profile?.title ?? profile?.headline ?? '',
    hourlyRate,
    availability: nextAvailability,
    skillTags: changes.skills ?? profile?.skills ?? [],
  };

  if (has(changes, 'experience')) {
    payload.experience = Array.isArray(changes.experience)
      ? changes.experience
      : profile?.experience ?? [];
  }

  return payload;
}

export default function ProfileOverviewSection({
  overview,
  loading,
  saving,
  avatarUploading,
  connectionSaving,
  error,
  onRefresh,
  onSave,
  onUploadAvatar,
  onCreateConnection,
  onUpdateConnection,
  onDeleteConnection,
}) {
  const profile = overview?.profile ?? {};
  const availability = profile?.availability ?? {};
  const followerSource = profile?.followers ?? {};
  const followers = followerSource.items ?? followerSource.preview ?? [];
  const connections = profile?.connections ?? {};
  const stats = profile?.stats ?? {};
  const experience = profile?.experience ?? [];

  const [infoOpen, setInfoOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);

  const fileInputRef = useRef(null);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(
    async (event) => {
      const [file] = event.target.files ?? [];
      if (file && onUploadAvatar) {
        await onUploadAvatar(file);
      }
    },
    [onUploadAvatar],
  );

  const handleSave = useCallback(
    async (changes) => {
      if (!onSave) {
        return;
      }
      const payload = buildPayload(profile, changes);
      await onSave(payload);
    },
    [onSave, profile],
  );

  const handleSaveAvailability = useCallback(
    async (changes) => {
      await handleSave(changes);
      setAvailabilityOpen(false);
    },
    [handleSave],
  );

  const handleSaveSkills = useCallback(
    async (changes) => {
      await handleSave(changes);
      setSkillsOpen(false);
    },
    [handleSave],
  );

  const handleSaveInfo = useCallback(
    async (changes) => {
      await handleSave(changes);
      setInfoOpen(false);
    },
    [handleSave],
  );

  const handleSaveExperience = useCallback(
    async (changes) => {
      await handleSave(changes);
      setExperienceOpen(false);
    },
    [handleSave],
  );

  return (
    <SectionShell
      id="profile"
      title="Profile"
      description={null}
      actions={[
        <button
          key="refresh"
          type="button"
          onClick={() => onRefresh?.({ fresh: true })}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
          disabled={loading}
        >
          Refresh
        </button>,
      ]}
    >
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error?.message ?? 'Unable to sync profile.'}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <ProfileSummaryCard
            profile={profile}
            avatarUploading={avatarUploading}
            onEdit={() => setInfoOpen(true)}
            onRequestAvatar={handleAvatarClick}
            onShowFollowers={() => setFollowersOpen(true)}
            onShowConnections={() => setConnectionsOpen(true)}
            onShowPending={() => setConnectionsOpen(true)}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <AvailabilityCard
              availability={availability}
              hourlyRate={profile?.hourlyRate}
              onManage={() => setAvailabilityOpen(true)}
            />
            <SkillCard skills={profile?.skills ?? []} onManage={() => setSkillsOpen(true)} />
          </div>

          <ExperienceCard experience={experience} onManage={() => setExperienceOpen(true)} />
        </div>

        <div className="space-y-6">
          <NetworkPreviewCard followers={followers} onOpenFollowers={() => setFollowersOpen(true)} />
          <ConnectionsCard connections={connections} onOpen={() => setConnectionsOpen(true)} />
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Stats</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Live</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-500">
              <div>
                <dt className="uppercase tracking-wide">Followers</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{stats.followerCount ?? 0}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide">Connections</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">{stats.connectionCount ?? 0}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide">Pending</dt>
                <dd className="mt-1 text-lg font-semibold text-amber-600">{stats.pendingConnections ?? 0}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wide">Availability</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900">
                  {availability?.status ? availability.status.replace('_', ' ') : 'limited'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      <ProfileInfoDrawer
        open={infoOpen}
        profile={profile}
        onClose={() => setInfoOpen(false)}
        onSave={handleSaveInfo}
        saving={saving}
      />
      <AvailabilityDrawer
        open={availabilityOpen}
        availability={availability}
        hourlyRate={profile?.hourlyRate}
        onClose={() => setAvailabilityOpen(false)}
        onSave={handleSaveAvailability}
        saving={saving}
      />
      <SkillManagerDrawer
        open={skillsOpen}
        skills={profile?.skills ?? []}
        onClose={() => setSkillsOpen(false)}
        onSave={handleSaveSkills}
        saving={saving}
      />
      <ExperienceDrawer
        open={experienceOpen}
        experience={experience}
        onClose={() => setExperienceOpen(false)}
        onSave={handleSaveExperience}
        saving={saving}
      />
      <ConnectionsDialog
        open={connectionsOpen}
        connections={connections}
        onClose={() => setConnectionsOpen(false)}
        onCreate={onCreateConnection}
        onUpdate={onUpdateConnection}
        onDelete={onDeleteConnection}
        saving={connectionSaving}
      />
      <FollowersDialog open={followersOpen} followers={followers} onClose={() => setFollowersOpen(false)} />
    </SectionShell>
  );
}
