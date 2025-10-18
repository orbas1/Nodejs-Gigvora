import { ArrowPathIcon } from '@heroicons/react/24/outline';

function ProfileRow({ profile, onSelect }) {
  const user = profile.user ?? {};
  const memberships = Array.isArray(user.memberships) ? user.memberships : [];
  const displayName = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const trustScore = profile.trustScore != null ? `${Number(profile.trustScore).toFixed(1)}%` : '—';
  const completion = profile.profileCompletion != null ? `${Number(profile.profileCompletion).toFixed(1)}%` : '—';

  return (
    <tr
      className="cursor-pointer transition hover:bg-blue-50/50"
      onClick={() => onSelect?.(profile)}
    >
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{displayName}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{user.email}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 capitalize">{user.userType ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {memberships.length ? (
          <div className="flex flex-wrap gap-1">
            {memberships.slice(0, 3).map((membership) => (
              <span
                key={membership}
                className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700"
              >
                {membership}
              </span>
            ))}
            {memberships.length > 3 ? (
              <span className="text-xs font-medium text-slate-500">+{memberships.length - 3}</span>
            ) : null}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-slate-600">
        {profile.availabilityStatus ?? '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-800">{trustScore}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-800">{completion}</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
        {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : '—'}
      </td>
    </tr>
  );
}

export default function ProfileList({ profiles, loading, error, onRetry, onSelect }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="h-6 w-1/3 rounded-full bg-slate-100" />
          <div className="grid gap-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-12 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-semibold">We couldn’t load the profile directory.</p>
        <p className="mt-2">{error.message ?? 'Something went wrong. Please try again.'}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 transition hover:border-red-300 hover:bg-red-50"
          >
            <ArrowPathIcon className="h-4 w-4" /> Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">No profiles found</h3>
        <p className="mt-2 text-sm text-slate-600">
          Adjust your filters or create a new profile to populate the directory.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Memberships
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Availability
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trust
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Completion
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {profiles.map((profile) => (
            <ProfileRow key={profile.id} profile={profile} onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
