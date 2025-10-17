import { EnvelopeIcon, MapPinIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function ProfileIdentityCard({
  identityDraft,
  profileDraft,
  onIdentityChange,
  onProfileChange,
  onSubmit,
  saving,
  canEdit,
  isDirty,
  validationErrors = [],
}) {
  const disabled = !canEdit || saving;

  return (
    <section className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">Identity</h3>
        <UserCircleIcon className="h-6 w-6 text-accent" aria-hidden="true" />
      </header>

      {validationErrors.length ? (
        <ul className="space-y-1 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-700">
          {validationErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (disabled || !isDirty) {
            return;
          }
          onSubmit();
        }}
        className="space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">First name</span>
            <input
              type="text"
              value={identityDraft.firstName}
              onChange={(event) => onIdentityChange('firstName', event.target.value)}
              disabled={!canEdit}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last name</span>
            <input
              type="text"
              value={identityDraft.lastName}
              onChange={(event) => onIdentityChange('lastName', event.target.value)}
              disabled={!canEdit}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <EnvelopeIcon className="h-4 w-4" aria-hidden="true" /> Email
            </span>
            <input
              type="email"
              value={identityDraft.email}
              onChange={(event) => onIdentityChange('email', event.target.value)}
              disabled={!canEdit}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <MapPinIcon className="h-4 w-4" aria-hidden="true" /> Account location
            </span>
            <input
              type="text"
              value={identityDraft.location}
              onChange={(event) => onIdentityChange('location', event.target.value)}
              placeholder="City, Country"
              disabled={!canEdit}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred timezone</span>
            <input
              type="text"
              value={identityDraft.timezone}
              onChange={(event) => onIdentityChange('timezone', event.target.value)}
              placeholder="e.g. Europe/London"
              disabled={!canEdit}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Public view</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</span>
              <input
                type="text"
                value={profileDraft.location}
                onChange={(event) => onProfileChange('location', event.target.value)}
                placeholder="Visible publicly"
                disabled={!canEdit}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avatar seed</span>
              <input
                type="text"
                value={profileDraft.avatarSeed}
                onChange={(event) => onProfileChange('avatarSeed', event.target.value)}
                placeholder="Initials or keyword"
                disabled={!canEdit}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={disabled || !isDirty}
            className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save
          </button>
        </div>
      </form>
    </section>
  );
}
