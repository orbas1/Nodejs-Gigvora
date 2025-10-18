import {
  ChartPieIcon,
  UserGroupIcon,
  GlobeAltIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../../UserAvatar.jsx';

function QuickRow({ icon: Icon, label, value, href }) {
  if (!value) {
    return null;
  }

  const content = href ? (
    <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline">
      {value}
    </a>
  ) : (
    <span className="text-sm text-slate-700">{value}</span>
  );

  return (
    <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2">
      <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        {content}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, helper, actionLabel, onAction }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
        </div>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="self-start rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default function CompanyProfileOverview({
  profile,
  metrics,
  onEdit,
  onMedia,
  onOpenFans,
  onOpenNetwork,
}) {
  if (!profile) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center text-sm text-slate-500">
        Complete your company profile to unlock the workspace overview.
      </div>
    );
  }

  const socialLinks = Array.isArray(profile.socialLinks) ? profile.socialLinks.filter((link) => link?.url) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <UserAvatar
                name={profile.companyName}
                imageUrl={profile.logoUrl}
                seed={profile.companyName}
                className="h-20 w-20 rounded-3xl border border-slate-200 bg-white object-cover shadow-sm"
              />
              {onMedia ? (
                <button
                  type="button"
                  onClick={onMedia}
                  className="absolute -bottom-2 -right-2 inline-flex items-center justify-center rounded-full border border-blue-100 bg-blue-600 p-2 text-white shadow"
                  aria-label="Update logo"
                >
                  <PhotoIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{profile.companyName}</h1>
              {profile.tagline ? <p className="mt-1 text-base text-slate-600">{profile.tagline}</p> : null}
              {profile.locationDetails?.formattedAddress ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{profile.locationDetails.formattedAddress}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex gap-3">
            {profile.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
              >
                Visit
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
              </button>
            ) : null}
          </div>
        </div>

        {profile.description ? (
          <p className="text-sm leading-6 text-slate-700">{profile.description}</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <QuickRow icon={GlobeAltIcon} label="Website" value={profile.website} href={profile.website} />
          <QuickRow icon={EnvelopeIcon} label="Email" value={profile.contactEmail} href={`mailto:${profile.contactEmail}`} />
          <QuickRow icon={PhoneIcon} label="Phone" value={profile.contactPhone} href={`tel:${profile.contactPhone}`} />
        </div>

        {socialLinks.length ? (
          <div className="flex flex-wrap gap-2">
            {socialLinks.map((link, index) => (
              <a
                key={`${link.url}-${index}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-accent hover:text-accent"
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                <span>{link.label || link.url}</span>
              </a>
            ))}
          </div>
        ) : null}
      </section>

      <aside className="space-y-4">
        <MetricCard
          icon={UserGroupIcon}
          label="Fans"
          value={metrics.followersTotal?.toLocaleString?.() ?? metrics.followersTotal}
          helper={`${metrics.followersActive?.toLocaleString?.() ?? metrics.followersActive} active`}
          actionLabel="Open fans"
          onAction={onOpenFans}
        />
        <MetricCard
          icon={ChartPieIcon}
          label="Network"
          value={metrics.connectionsTotal?.toLocaleString?.() ?? metrics.connectionsTotal}
          helper={`${metrics.connectionsPending?.toLocaleString?.() ?? metrics.connectionsPending} pending`}
          actionLabel="Open network"
          onAction={onOpenNetwork}
        />
      </aside>
    </div>
  );
}
