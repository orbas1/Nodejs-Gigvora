import UserAvatar from '../../UserAvatar.jsx';

function TagList({ label, items }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  const hasItems = list.length > 0;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {hasItems ? (
        <div className="flex flex-wrap gap-2">
          {list.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">—</p>
      )}
    </div>
  );
}

function normalisePolicy(value, fallback = 'open') {
  if (!value) {
    return fallback;
  }
  return `${value}`.replace(/_/g, ' ');
}

function safeString(value) {
  if (value == null || value === '') {
    return null;
  }
  return value;
}

export default function AgencyProfileOverview({
  overview,
  preferences,
  followers,
  connections,
  onEdit,
  onFollowers,
  onConnections,
}) {
  const name = overview?.agencyProfile?.agencyName || overview?.name || '—';
  const tagline = safeString(overview?.agencyProfile?.tagline || overview?.headline);
  const summary = safeString(overview?.agencyProfile?.summary || overview?.bio);
  const services = overview?.agencyProfile?.services ?? [];
  const industries = overview?.agencyProfile?.industries ?? [];
  const clients = overview?.agencyProfile?.clients ?? [];
  const awards = overview?.agencyProfile?.awards ?? [];
  const contactName = safeString(overview?.agencyProfile?.primaryContactName || overview?.name);
  const contactEmail = safeString(overview?.agencyProfile?.primaryContactEmail || overview?.email);
  const contactPhone = safeString(overview?.agencyProfile?.primaryContactPhone);
  const location = safeString(overview?.agencyProfile?.location || overview?.location);
  const teamSize = overview?.agencyProfile?.teamSize ? `${overview.agencyProfile.teamSize}` : null;
  const foundedYear = safeString(overview?.agencyProfile?.foundedYear);
  const followerTotal =
    followers?.pagination?.total ?? followers?.items?.length ?? overview?.metrics?.followersCount ?? overview?.followersCount ?? 0;
  const connectionTotal =
    connections?.summary?.accepted ?? overview?.metrics?.connectionsCount ?? overview?.connectionsCount ?? 0;
  const followerPolicyText = normalisePolicy(preferences?.followerPolicy);
  const connectionPolicyText = normalisePolicy(preferences?.connectionPolicy, 'manual review');
  const completion =
    overview?.metrics?.profileCompletion != null && !Number.isNaN(Number(overview.metrics.profileCompletion))
      ? `${Math.round(Number(overview.metrics.profileCompletion) * 100)}%`
      : '—';

  const metrics = [
    { id: 'followers', label: 'Followers', value: followerTotal },
    { id: 'connections', label: 'Links', value: connectionTotal },
    { id: 'completion', label: 'Completion', value: completion },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <UserAvatar
              name={name}
              imageUrl={overview?.agencyProfile?.avatarUrl || preferences?.avatarUrl || null}
              seed={overview?.avatarSeed}
              size="lg"
            />
            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-slate-900">{name}</h2>
                {tagline ? <p className="text-sm text-slate-600">{tagline}</p> : null}
              </div>
              {summary ? <p className="max-w-2xl text-sm text-slate-500">{summary}</p> : null}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {location ? <span>{location}</span> : null}
                {teamSize ? <span>{teamSize} specialists</span> : null}
                {foundedYear ? <span>Est. {foundedYear}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onEdit?.()}
                  className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onFollowers?.()}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Followers
                </button>
                <button
                  type="button"
                  onClick={() => onConnections?.()}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Links
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TagList label="Services" items={services} />
            <TagList label="Industries" items={industries} />
            <TagList label="Clients" items={clients} />
            <TagList label="Awards" items={awards} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-semibold text-slate-900">{contactName || '—'}</p>
                {contactEmail ? <p>{contactEmail}</p> : <p>—</p>}
                {contactPhone ? <p>{contactPhone}</p> : <p>—</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policies</p>
              <div className="mt-2 space-y-1">
                <p>Followers: {followerPolicyText}</p>
                <p>Links: {connectionPolicyText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
