import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import analytics from '../services/analytics.js';
import { formatRelativeTime } from '../utils/date.js';
import useSession from '../hooks/useSession.js';

const FRESHNESS_OPTIONS = [
  { value: '24h', label: 'Updated in 24h' },
  { value: '7d', label: 'Past week' },
  { value: '30d', label: 'Past 30 days' },
  { value: 'all', label: 'All time' },
];

const ACCESS_ALLOWED_ROLES = new Set(['volunteer', 'mentor', 'admin']);

export default function VolunteeringPage() {
  const { session, isAuthenticated } = useSession();
  const membershipSet = useMemo(() => {
    return new Set((session?.memberships ?? []).map((value) => `${value}`.trim().toLowerCase()).filter(Boolean));
  }, [session?.memberships]);
  const hasVolunteerAccess = useMemo(
    () => Array.from(ACCESS_ALLOWED_ROLES).some((role) => membershipSet.has(role)),
    [membershipSet],
  );

  const [query, setQuery] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [freshness, setFreshness] = useState('30d');
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);

  const activeFilters = useMemo(() => {
    const filters = {};
    if (remoteOnly) {
      filters.isRemote = true;
    }
    if (freshness && freshness !== 'all') {
      filters.updatedWithin = freshness;
    }
    if (selectedOrganizations.length) {
      filters.organizations = selectedOrganizations;
    }
    return filters;
  }, [remoteOnly, freshness, selectedOrganizations]);

  const membershipHeaders = useMemo(() => {
    if (!hasVolunteerAccess) {
      return null;
    }
    const memberships = Array.isArray(session?.memberships) ? session.memberships.filter(Boolean) : [];
    const headers = {};
    if (memberships.length) {
      headers['X-Gigvora-Memberships'] = memberships.join(',');
    }
    const activeMembership = session?.activeMembership || session?.primaryDashboard;
    if (activeMembership) {
      headers['X-Gigvora-Active-Membership'] = activeMembership;
    }
    return Object.keys(headers).length ? headers : null;
  }, [hasVolunteerAccess, session?.memberships, session?.activeMembership, session?.primaryDashboard]);

  const {
    data,
    error,
    loading,
    fromCache,
    lastUpdated,
    refresh,
    debouncedQuery,
  } = useOpportunityListing('volunteering', query, {
    pageSize: 25,
    filters: activeFilters,
    headers: membershipHeaders,
    enabled: hasVolunteerAccess,
  });

  const listing = data ?? {};
  const items = useMemo(() => (Array.isArray(listing.items) ? listing.items : []), [listing.items]);

  const organizationOptions = useMemo(() => {
    const unique = new Set();
    items.forEach((role) => {
      if (role?.organization) {
        unique.add(role.organization);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [items]);

  useEffect(() => {
    setSelectedOrganizations((previous) => previous.filter((value) => organizationOptions.includes(value)));
  }, [organizationOptions]);

  const clearFilters = () => {
    setRemoteOnly(false);
    setFreshness('30d');
    setSelectedOrganizations([]);
  };

  const filtersActive = useMemo(
    () => remoteOnly || freshness !== '30d' || selectedOrganizations.length > 0 || Boolean(debouncedQuery),
    [remoteOnly, freshness, selectedOrganizations.length, debouncedQuery],
  );

  const handleVolunteer = (role) => {
    const filterContext = Object.keys(activeFilters).length ? activeFilters : null;
    analytics.track(
      'web_volunteer_cta',
      {
        id: role.id,
        title: role.title,
        organization: role.organization,
        query: debouncedQuery || null,
        filters: filterContext,
      },
      { source: 'web_app' },
    );
  };

  return (
    <section className="relative overflow-hidden py-20">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(191,219,254,0.35),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="absolute -left-24 top-40 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-6">
        <PageHeader
          eyebrow="Volunteering"
          title="Give back to the Gigvora ecosystem"
          description="Share mentorship, open source velocity, and pro bono firepower with missions that deserve world-class execution."
          meta={
            hasVolunteerAccess ? (
              <DataStatus
                loading={loading}
                fromCache={fromCache}
                lastUpdated={lastUpdated}
                onRefresh={() => refresh({ force: true })}
              />
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Volunteer membership required
              </span>
            )
          }
        />

        {!hasVolunteerAccess ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur">
              <h2 className="text-2xl font-semibold text-slate-900">Unlock the volunteer command centre</h2>
              <p className="mt-3 text-sm text-slate-600">
                Gigvora vetting ensures only safeguarded mentors and contributors can access urgent non-profit and civic missions.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span>Priority briefs from climate, education, and social impact partners ready for immediate activation.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-sky-400" aria-hidden="true" />
                  <span>Security-screened collaboration rooms with document vaults, pulse updates, and compliance logging.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-violet-400" aria-hidden="true" />
                  <span>Reciprocal recognition credits that boost your impact profile, feed, and badge inventory.</span>
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <a
                    href="mailto:impact@gigvora.com?subject=Volunteer%20workspace%20access"
                    className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                  >
                    Request access
                  </a>
                ) : (
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                  >
                    Create an account
                  </Link>
                )}
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Sign in instead
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="rounded-3xl border border-accent/30 bg-accentSoft/40 p-8 shadow-lg backdrop-blur">
              <h3 className="text-lg font-semibold text-accentDark">Security-grade mobilisation</h3>
              <p className="mt-3 text-sm text-accentDark/80">
                We keep vulnerable communities safe. Identity, compliance, and safeguarding signals are verified before every
                volunteer is routed into a mission.
              </p>
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-slate-700 shadow-sm">
                  <p className="font-semibold">Zero leaked briefs</p>
                  <p className="mt-1 text-xs text-slate-500">Watermarked docs, secure file vaults, and role-based chat.</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-slate-700 shadow-sm">
                  <p className="font-semibold">Enterprise compliance guardrails</p>
                  <p className="mt-1 text-xs text-slate-500">GDPR, SOC2, and safeguarding workflows embedded end-to-end.</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-slate-700 shadow-sm">
                  <p className="font-semibold">Mobile + web parity</p>
                  <p className="mt-1 text-xs text-slate-500">Seamless hand-off between devices with encrypted sync.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="volunteer-search">
                    Search missions
                  </label>
                  <input
                    id="volunteer-search"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by cause, organization, or skill"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-900 shadow-inner transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="sm:min-w-[180px]">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Freshness</span>
                    <select
                      value={freshness}
                      onChange={(event) => setFreshness(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      {FRESHNESS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:min-w-[180px]">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Availability</span>
                    <button
                      type="button"
                      onClick={() => setRemoteOnly((previous) => !previous)}
                      className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        remoteOnly
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
                      }`}
                    >
                      {remoteOnly ? 'Remote friendly only' : 'Remote + onsite'}
                    </button>
                  </div>
                </div>
              </div>
              {organizationOptions.length ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trusted causes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {organizationOptions.map((organization) => {
                      const selected = selectedOrganizations.includes(organization);
                      return (
                        <button
                          key={organization}
                          type="button"
                          onClick={() =>
                            setSelectedOrganizations((previous) =>
                              selected
                                ? previous.filter((value) => value !== organization)
                                : [...previous, organization].sort((a, b) => a.localeCompare(b)),
                            )
                          }
                          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                            selected
                              ? 'border-sky-300 bg-sky-50 text-sky-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-accent'
                          }`}
                        >
                          {organization}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {filtersActive ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <p>
                    Showing {items.length} {items.length === 1 ? 'mission' : 'missions'}
                    {debouncedQuery ? (
                      <>
                        {' '}
                        <span className="font-semibold text-slate-600">matching “{debouncedQuery}”</span>
                      </>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-1.5 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Unable to load the latest volunteer opportunities. {error.message || 'Please refresh to sync the newest requests.'}
              </div>
            ) : null}

            {loading && !items.length ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-white/90 p-6">
                    <div className="h-3 w-1/4 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-full rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : null}

            {!loading && !items.length ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/90 p-12 text-center text-sm text-slate-500">
                {debouncedQuery
                  ? 'No volunteer roles match your filters. Adjust the filters or try a different cause keyword.'
                  : 'Volunteer opportunities will appear here as partners request trusted support.'}
              </div>
            ) : null}

            <div className="space-y-6">
              {items.map((role) => {
                const focusLabels = Array.isArray(role?.taxonomyLabels) ? role.taxonomyLabels.slice(0, 4) : [];
                const isRemote = Boolean(role?.isRemote);
                const locationLabel = role?.location || (isRemote ? 'Remote friendly' : null);
                return (
                  <article
                    key={role.id}
                    className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-2">
                        {role.organization ? <span className="font-semibold text-slate-600">{role.organization}</span> : null}
                        {locationLabel ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                            {locationLabel}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-slate-400">Updated {formatRelativeTime(role.updatedAt)}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">{role.title}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{role.description}</p>
                    {focusLabels.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {focusLabels.map((label) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-600">Mission ID:</span> {role.id}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleVolunteer(role)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Volunteer now <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
