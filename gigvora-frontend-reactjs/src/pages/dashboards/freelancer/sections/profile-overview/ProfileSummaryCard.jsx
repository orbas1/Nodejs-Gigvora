import { MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

function initialsFromProfile(profile) {
  const name = profile?.fullName || '';
  if (!name.trim()) {
    return (profile?.avatar?.initials || 'GV').slice(0, 2).toUpperCase();
  }
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

export default function ProfileSummaryCard({
  profile,
  onEdit,
  onRequestAvatar,
  avatarUploading,
  onShowFollowers,
  onShowConnections,
}) {
  const stats = profile?.stats ?? {};
  const availability = profile?.availability ?? {};
  const availabilityLabel =
    availability.status === 'available'
      ? 'Open'
      : availability.status === 'unavailable'
      ? 'Away'
      : availability.status === 'on_leave'
      ? 'Leave'
      : 'Limited';

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={onRequestAvatar}
            className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-700 transition hover:border-slate-300"
            disabled={avatarUploading}
          >
            {profile?.avatar?.url ? (
              <img src={profile.avatar.url} alt={profile.fullName || 'Profile avatar'} className="h-full w-full object-cover" />
            ) : (
              initialsFromProfile(profile)
            )}
            <span className="absolute bottom-2 left-2 right-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-center text-xs font-semibold text-white">
              {avatarUploading ? 'Uploading…' : 'Change'}
            </span>
          </button>
          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-2xl font-semibold text-slate-900">{profile?.fullName || 'Your name'}</p>
                {profile?.headline ? (
                  <p className="text-sm text-slate-500">{profile.headline}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {profile?.locationDetails?.summary || profile?.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {profile.locationDetails?.summary || profile.location}
                </span>
              ) : null}
              {profile?.timezone ? (
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {profile.timezone}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                {availabilityLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="grid w-full max-w-xs grid-cols-3 gap-2 text-center text-xs font-medium text-slate-600 sm:max-w-none sm:grid-cols-3">
          <button
            type="button"
            onClick={onShowFollowers}
            className="group rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-slate-300 hover:bg-white"
          >
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Followers</p>
            <p className="text-lg font-semibold text-slate-900">{stats.followerCount ?? 0}</p>
          </button>
          <button
            type="button"
            onClick={onShowConnections}
            className="group rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-slate-300 hover:bg-white"
          >
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Connections</p>
            <p className="text-lg font-semibold text-slate-900">{stats.connectionCount ?? 0}</p>
          </button>
          <button
            type="button"
            onClick={onShowConnections}
            className="group rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-slate-300 hover:bg-white"
          >
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Pending</p>
            <p className="text-lg font-semibold text-amber-600">{stats.pendingConnections ?? 0}</p>
          </button>
        </div>
      </div>
    </div>
  );
}
