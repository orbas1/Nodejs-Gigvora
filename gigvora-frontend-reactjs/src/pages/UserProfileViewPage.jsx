import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import useSession from '../hooks/useSession.js';
import { fetchUser, updateUserAccount } from '../services/user.js';
import { fetchProfile } from '../services/profile.js';
import { listCreationStudioItems } from '../services/creationStudio.js';
import useUserTimeline from '../hooks/useUserTimeline.js';

function buildRoleBadges(user) {
  const badges = new Set();
  if (!user) {
    return [];
  }
  (user.memberships ?? user.roles ?? []).forEach((role) => {
    if (typeof role === 'string' && role.trim()) {
      badges.add(role.trim().toLowerCase());
    }
  });
  if (user.type) {
    badges.add(`${user.type}`.toLowerCase());
  }
  return Array.from(badges);
}

export default function UserProfileViewPage() {
  const { userId } = useParams();
  const { session } = useSession();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState({ headline: '', location: '', bio: '' });
  const [creations, setCreations] = useState([]);
  const [creationsLoading, setCreationsLoading] = useState(false);
  const [creationsError, setCreationsError] = useState(null);

  const resolvedUserId = useMemo(() => {
    if (!userId || userId === 'me') {
      return session?.userId ?? session?.id ?? null;
    }
    return userId;
  }, [session?.id, session?.userId, userId]);

  const isSelf = useMemo(
    () => String(session?.userId ?? session?.id ?? '') === String(resolvedUserId ?? ''),
    [session?.id, session?.userId, resolvedUserId],
  );
  const isAdmin = useMemo(
    () => (session?.memberships ?? []).some((membership) => `${membership}`.toLowerCase() === 'admin'),
    [session?.memberships],
  );
  const canEdit = isSelf || isAdmin;

  useEffect(() => {
    if (!resolvedUserId) {
      setLoading(false);
      setError(new Error('User id missing.'));
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchUser(resolvedUserId, { signal: controller.signal })
      .then((userResponse) => {
        setUser(userResponse);
        const nextForm = {
          headline:
            userResponse?.headline ?? userResponse?.title ?? userResponse?.Profile?.headline ?? formState.headline ?? '',
          location: userResponse?.location ?? userResponse?.Profile?.location ?? formState.location ?? '',
          bio: userResponse?.bio ?? userResponse?.Profile?.bio ?? '',
        };
        setFormState(nextForm);
        const profileId = userResponse?.profileId ?? userResponse?.Profile?.id;
        if (!profileId) {
          setProfile(null);
          return null;
        }
        return fetchProfile(profileId, { signal: controller.signal })
          .then((profileResponse) => {
            setProfile(profileResponse);
            setFormState((current) => ({
              ...current,
              headline: profileResponse?.headline ?? current.headline,
              location: profileResponse?.location ?? current.location,
              bio: profileResponse?.bio ?? current.bio,
            }));
            return null;
          })
          .catch((profileError) => {
            if (profileError?.name === 'AbortError') {
              return null;
            }
            setProfile(null);
            return null;
          });
      })
      .catch((err) => {
        if (err?.name === 'AbortError') {
          return;
        }
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [resolvedUserId]);

  const loadCreations = useCallback(() => {
    if (!resolvedUserId) {
      return;
    }
    const controller = new AbortController();
    setCreationsLoading(true);
    setCreationsError(null);
    listCreationStudioItems(
      {
        ownerId: resolvedUserId,
        limit: 6,
        status: 'published',
        sort: '-publishedAt',
      },
      { signal: controller.signal },
    )
      .then((response) => {
        setCreations(response?.items ?? response ?? []);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') {
          return;
        }
        setCreationsError(err);
      })
      .finally(() => {
        setCreationsLoading(false);
      });
    return () => controller.abort();
  }, [resolvedUserId]);

  useEffect(() => {
    const abort = loadCreations();
    return () => {
      if (typeof abort === 'function') {
        abort();
      }
    };
  }, [loadCreations]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!canEdit || !resolvedUserId) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        headline: formState.headline,
        location: formState.location,
        bio: formState.bio,
        profile: {
          headline: formState.headline,
          location: formState.location,
          bio: formState.bio,
        },
      };
      const updated = await updateUserAccount(resolvedUserId, payload);
      setUser((current) => ({ ...current, ...updated }));
      setSaving(false);
    } catch (err) {
      setSaving(false);
      setError(err);
    }
  };

  const roleBadges = useMemo(() => buildRoleBadges(user), [user]);

  const {
    posts,
    timelineEntries,
    analytics,
    loading: timelineLoading,
    error: timelineError,
    refresh: refreshTimeline,
    workspace,
  } = useUserTimeline({ userId: resolvedUserId, enabled: Boolean(resolvedUserId) });

  const [timelineView, setTimelineView] = useState('plan');
  const sortedEntries = useMemo(() => {
    if (!Array.isArray(timelineEntries)) {
      return [];
    }
    return [...timelineEntries].sort((a, b) => {
      const aTime = a.startAt ? new Date(a.startAt).getTime() : 0;
      const bTime = b.startAt ? new Date(b.startAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [timelineEntries]);

  const sortedPosts = useMemo(() => {
    if (!Array.isArray(posts)) {
      return [];
    }
    return [...posts].sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [posts]);

  const timelineTotals = useMemo(() => {
    const totals = analytics?.totals ?? analytics?.metrics ?? {};
    return [
      { label: 'Impressions', value: totals.impressions ?? totals.views ?? 0 },
      { label: 'Clicks', value: totals.clicks ?? 0 },
      { label: 'Comments', value: totals.comments ?? 0 },
      { label: 'Reactions', value: totals.reactions ?? 0 },
      { label: 'Saves', value: totals.saves ?? 0 },
      { label: 'Shares', value: totals.shares ?? 0 },
    ];
  }, [analytics]);

  let timelineContent;
  if (timelineLoading && !sortedEntries.length && !sortedPosts.length) {
    timelineContent = (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
        ))}
      </div>
    );
  } else if (timelineView === 'plan') {
    timelineContent = (
      <div className="grid gap-4 lg:grid-cols-2">
        {sortedEntries.slice(0, 6).map((entry) => (
          <article key={entry.id} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{entry.entryType ?? 'Milestone'}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{entry.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{entry.description ?? 'Programme milestone in motion.'}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{entry.channel ?? 'Workspace'}</span>
              <span>
                {entry.startAt ? new Date(entry.startAt).toLocaleString() : 'TBC'}
                {entry.endAt ? ` → ${new Date(entry.endAt).toLocaleString()}` : ''}
              </span>
            </div>
          </article>
        ))}
        {sortedEntries.length === 0 && !timelineLoading ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
            No timeline entries yet. Follow to stay notified of new milestones.
          </div>
        ) : null}
      </div>
    );
  } else if (timelineView === 'posts') {
    timelineContent = (
      <div className="grid gap-4 lg:grid-cols-2">
        {sortedPosts.slice(0, 6).map((post) => (
          <article key={post.id} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{post.status ?? 'Draft'}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{post.title ?? post.summary ?? 'Community update'}</h3>
              <p className="mt-2 text-sm text-slate-600">{post.summary ?? post.content}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{post.visibility ?? 'connections'}</span>
              {post.publishedAt ? <span>{new Date(post.publishedAt).toLocaleString()}</span> : null}
            </div>
          </article>
        ))}
        {sortedPosts.length === 0 && !timelineLoading ? (
          <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
            No published posts yet.
          </div>
        ) : null}
      </div>
    );
  } else {
    timelineContent = (
      <div className="grid gap-4 sm:grid-cols-3">
        {timelineTotals.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-slate-200 bg-white/90 p-6 text-center shadow-soft">
            <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white via-white to-slate-50 pb-24">
      <div className="mx-auto max-w-7xl px-6 pt-16">
        <PageHeader
          eyebrow="Member profile"
          title={user?.name ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Gigvora member'}
          description={formState.headline || profile?.headline || 'Full-stack professional active across the Gigvora community.'}
          meta={roleBadges.length ? roleBadges.join(' • ') : undefined}
          actions={
            <div className="flex flex-wrap gap-3">
              <Link
                to="/feed"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                View live feed
              </Link>
              <Link
                to="/inbox"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                Message
              </Link>
            </div>
          }
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <div className="flex items-center gap-4">
                <UserAvatar
                  name={user?.name ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`}
                  seed={profile?.avatarSeed ?? user?.avatarSeed ?? user?.email}
                  className="h-16 w-16"
                />
                <div>
                  <p className="text-lg font-semibold text-slate-900">{user?.name ?? 'Member'}</p>
                  <p className="text-sm text-slate-500">{formState.location || profile?.location || 'Available worldwide'}</p>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm text-slate-600">
                <p>{profile?.bio ?? formState.bio ?? 'A valued member of the Gigvora network.'}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {roleBadges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <DataStatus
                loading={loading}
                error={error}
                lastUpdated={null}
                fromCache={false}
                onRefresh={() => {
      if (resolvedUserId) {
        fetchUser(resolvedUserId)
                      .then((updatedUser) => setUser(updatedUser))
                      .catch((err) => setError(err));
                  }
                }}
                statusLabel="Profile data"
              />
              <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
                <fieldset disabled={!canEdit} className="space-y-4">
                  <div>
                    <label htmlFor="profile-headline" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Headline
                    </label>
                    <input
                      id="profile-headline"
                      type="text"
                      value={formState.headline}
                      onChange={(event) => setFormState((current) => ({ ...current, headline: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-location" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Location
                    </label>
                    <input
                      id="profile-location"
                      type="text"
                      value={formState.location}
                      onChange={(event) => setFormState((current) => ({ ...current, location: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-bio" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Bio
                    </label>
                    <textarea
                      id="profile-bio"
                      value={formState.bio}
                      onChange={(event) => setFormState((current) => ({ ...current, bio: event.target.value }))}
                      className="mt-2 h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none"
                    />
                  </div>
                  {canEdit ? (
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save profile'}
                    </button>
                  ) : (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Request access to edit this profile
                    </p>
                  )}
                </fieldset>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Published opportunities</h2>
                  <p className="text-sm text-slate-600">Live gigs, projects, and programmes launched by this member.</p>
                </div>
                <Link
                  to="/creation-studio"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                >
                  Open Creation Studio
                </Link>
              </div>
              <DataStatus
                loading={creationsLoading}
                error={creationsError}
                onRefresh={loadCreations}
                lastUpdated={null}
                fromCache={false}
                statusLabel="Marketplace feed"
              />
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {creations.length === 0 && !creationsLoading ? (
                  <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
                    No published opportunities yet. Check back soon!
                  </div>
                ) : null}
                {creations.map((item) => (
                  <article key={item.id ?? item.slug} className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{item.type}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{item.summary ?? item.description}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>{item.status ?? 'draft'}</span>
                      {item.publishedAt ? <span>{new Date(item.publishedAt).toLocaleString()}</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Client & community timeline</h2>
                  <p className="text-sm text-slate-600">
                    Review scheduled milestones, published updates, and engagement metrics for this member.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTimelineView('plan')}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      timelineView === 'plan'
                        ? 'bg-accent text-white shadow-soft'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                    }`}
                  >
                    Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineView('posts')}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      timelineView === 'posts'
                        ? 'bg-accent text-white shadow-soft'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineView('metrics')}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      timelineView === 'metrics'
                        ? 'bg-accent text-white shadow-soft'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                    }`}
                  >
                    Metrics
                  </button>
                </div>
              </div>
              <DataStatus
                loading={timelineLoading}
                error={timelineError}
                onRefresh={() => refreshTimeline({ force: true })}
                statusLabel="Timeline data"
                lastUpdated={null}
                fromCache={false}
              />
              <div className="mt-6">{timelineContent}</div>
              <div className="mt-6 grid gap-4 text-xs text-slate-500 sm:grid-cols-3">
                <div>Auto-share: {workspace?.autoShareToFeed ? 'Enabled' : 'Disabled'}</div>
                <div>Cadence goal: {workspace?.cadenceGoal ?? '—'} updates / week</div>
                <div>Distribution: {(workspace?.distributionChannels ?? []).join(', ') || 'Workspace only'}</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
