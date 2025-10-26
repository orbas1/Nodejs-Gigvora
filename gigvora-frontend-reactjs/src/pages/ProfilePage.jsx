import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowPathIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import ProfileEditor from '../components/ProfileEditor.jsx';
import TrustScoreBreakdown from '../components/TrustScoreBreakdown.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import ReputationEngineShowcase from '../components/reputation/ReputationEngineShowcase.jsx';
import { GigvoraAdBanner, GigvoraAdGrid } from '../components/marketing/GigvoraAds.jsx';
import {
  GIGVORA_PROFILE_ADS,
  GIGVORA_PROFILE_BANNER,
} from '../constants/marketing.js';
import { fetchProfile, updateProfile, updateProfileAvailability } from '../services/profile.js';
import { listFollowers, saveFollower, deleteFollower } from '../services/profileHub.js';
import useSession from '../hooks/useSession.js';
import { fetchFreelancerReputation } from '../services/reputation.js';
import { formatAbsolute, formatRelativeTime } from '../utils/date.js';

const AVAILABILITY_OPTIONS = [
  {
    value: 'available',
    label: 'Available',
    description: 'Actively accepting new engagements',
  },
  {
    value: 'limited',
    label: 'Limited',
    description: 'Selective booking with reduced capacity',
  },
  {
    value: 'unavailable',
    label: 'Unavailable',
    description: 'Heads down on current programmes',
  },
  {
    value: 'on_leave',
    label: 'On leave',
    description: 'Temporarily away from project work',
  },
];

function formatStatusLabel(status) {
  if (!status) return '';
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildAvailabilityDraft(availability = {}) {
  return {
    status: availability.status ?? 'limited',
    hoursPerWeek: availability.hoursPerWeek ?? 0,
    openToRemote: availability.openToRemote ?? true,
    focusAreas: Array.isArray(availability.focusAreas) ? availability.focusAreas : [],
  };
}

export default function ProfilePage() {
  const { id } = useParams();
  const { session, isAuthenticated } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityDraft, setAvailabilityDraft] = useState(buildAvailabilityDraft());
  const [reloadToken, setReloadToken] = useState(0);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [reputationState, setReputationState] = useState({
    data: null,
    loading: false,
    error: null,
    fromCache: false,
    lastUpdated: null,
  });
  const [reputationReloadToken, setReputationReloadToken] = useState(0);
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [focusAreaFeedback, setFocusAreaFeedback] = useState({ message: null, tone: 'muted' });
  const [followersState, setFollowersState] = useState({ items: [], loading: false, error: null, lastSynced: null });
  const [followerForm, setFollowerForm] = useState({ name: '', email: '', note: '' });
  const [followerSaving, setFollowerSaving] = useState(false);
  const [followersReloadToken, setFollowersReloadToken] = useState(0);
  const [removingFollowerId, setRemovingFollowerId] = useState(null);

  const membershipSet = useMemo(
    () => new Set(Array.isArray(session?.memberships) ? session.memberships : []),
    [session?.memberships],
  );
  const isAdmin = membershipSet.has('admin');
  const canAccessProfile = useMemo(
    () => ['freelancer', 'agency', 'admin'].some((role) => membershipSet.has(role)),
    [membershipSet],
  );
  const resolvedProfileId = useMemo(() => {
    if (id === 'me') {
      return session?.profileId ?? session?.userId ?? null;
    }
    return id;
  }, [id, session?.profileId, session?.userId]);
  const canManageProfile = useMemo(() => {
    if (!canAccessProfile || !resolvedProfileId) {
      return false;
    }
    if (isAdmin) {
      return true;
    }
    if (session?.profileId) {
      return String(session.profileId) === String(resolvedProfileId);
    }
    return true;
  }, [canAccessProfile, isAdmin, resolvedProfileId, session?.profileId]);

  const resolvedUserAccountId = useMemo(
    () => profile?.userId ?? profile?.ownerId ?? session?.userId ?? null,
    [profile?.ownerId, profile?.userId, session?.userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    if (!isAuthenticated) {
      setLoading(false);
      setProfile(null);
      setError(null);
      return () => controller.abort();
    }
    if (!canAccessProfile) {
      setLoading(false);
      setProfile(null);
      setError(
        'You need an active freelancer or agency membership to manage this profile. Contact support if this seems incorrect.',
      );
      return () => controller.abort();
    }
    if (!resolvedProfileId) {
      setLoading(false);
      setProfile(null);
      setError('We could not determine which profile to open for your account.');
      return () => controller.abort();
    }

    setLoading(true);
    setError(null);

    fetchProfile(resolvedProfileId, { force: reloadToken > 0, signal: controller.signal })
      .then((data) => {
        setProfile(data);
        setAvailabilityDraft(buildAvailabilityDraft(data.availability));
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err?.body?.message ?? err.message ?? 'Unable to load profile overview.');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [canAccessProfile, id, isAuthenticated, reloadToken, resolvedProfileId]);

  useEffect(() => {
    if (!canManageProfile || !resolvedUserAccountId) {
      setFollowersState((state) => ({ ...state, items: [], loading: false }));
      return;
    }
    const controller = new AbortController();
    setFollowersState((state) => ({ ...state, loading: true, error: null }));
    listFollowers(resolvedUserAccountId, { signal: controller.signal })
      .then((response) => {
        const items = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.followers)
          ? response.followers
          : Array.isArray(response)
          ? response
          : [];
        setFollowersState({ items, loading: false, error: null, lastSynced: new Date() });
      })
      .catch((followersError) => {
        if (followersError?.name === 'AbortError') {
          return;
        }
        setFollowersState((state) => ({
          ...state,
          loading: false,
          error: followersError?.body?.message ?? followersError.message ?? 'Unable to load followers.',
        }));
      });
    return () => controller.abort();
  }, [canManageProfile, resolvedUserAccountId, followersReloadToken]);

  const metrics = profile?.metrics ?? {};
  const availability = useMemo(() => profile?.availability ?? {}, [profile]);
  const allowedReputationRoles = useMemo(
    () => new Set(['freelancer', 'agency', 'admin', 'trust']),
    [],
  );
  const hasAuthorizedMembership = useMemo(() => {
    if (!isAuthenticated) {
      return false;
    }
    return (session?.memberships ?? []).some((membership) =>
      allowedReputationRoles.has(membership),
    );
  }, [allowedReputationRoles, isAuthenticated, session?.memberships]);
  const hasValidFreelancerId = useMemo(() => /^\d+$/.test(id ?? ''), [id]);
  const canAccessReputation = isAuthenticated && hasAuthorizedMembership && hasValidFreelancerId;
  const reputationAccessReason = useMemo(() => {
    if (!isAuthenticated) {
      return 'Sign in with a verified freelancer workspace to view live reputation and review controls.';
    }
    if (!hasAuthorizedMembership) {
      return 'Reputation operations are limited to freelancer, agency, trust, or admin workspaces.';
    }
    if (!hasValidFreelancerId) {
      return 'Reputation insights require a numeric freelancer profile identifier.';
    }
    return null;
  }, [hasAuthorizedMembership, hasValidFreelancerId, isAuthenticated]);

  const followerItems = useMemo(
    () => (Array.isArray(followersState.items) ? followersState.items : []),
    [followersState.items],
  );

  const statCards = useMemo(
    () => [
      {
        label: 'Trust score',
        value:
          metrics.trustScore == null
            ? '—'
            : Number(metrics.trustScore).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        helper: 'Reliability rating across engagements',
      },
      {
        label: 'Followers',
        value: (metrics.followersCount ?? 0).toLocaleString(),
        helper: 'Community followers',
      },
      {
        label: 'Connections',
        value: (metrics.connectionsCount ?? 0).toLocaleString(),
        helper: 'Trusted relationships',
      },
      {
        label: 'Profile completion',
        value:
          metrics.profileCompletion == null
            ? '—'
            : `${Number(metrics.profileCompletion).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`,
        helper: 'Sections completed for launch readiness',
      },
    ],
    [metrics.connectionsCount, metrics.followersCount, metrics.profileCompletion, metrics.trustScore],
  );

  const handleAvailabilityChange = useCallback(
    async (changes) => {
      if (!profile || !canManageProfile || !resolvedProfileId) return;
      setSavingAvailability(true);
      setError(null);
      try {
        const payload = { ...changes };
        if (payload.focusAreas) {
          payload.focusAreas = Array.isArray(payload.focusAreas) ? payload.focusAreas : [];
        }
        const updated = await updateProfileAvailability(resolvedProfileId, payload);
        setProfile(updated);
        setAvailabilityDraft(buildAvailabilityDraft(updated.availability));
      } catch (err) {
        setError(err?.body?.message ?? err.message ?? 'Unable to update availability.');
      } finally {
        setSavingAvailability(false);
      }
    },
    [canManageProfile, profile, resolvedProfileId],
  );

  const handleStatusSelect = useCallback(
    (status) => {
      if (!canManageProfile || status === availabilityDraft.status) return;
      handleAvailabilityChange({ availabilityStatus: status });
      setAvailabilityDraft((draft) => ({ ...draft, status }));
    },
    [availabilityDraft.status, canManageProfile, handleAvailabilityChange],
  );

  const handleHoursChange = useCallback((event) => {
    const next = Number(event.target.value);
    setAvailabilityDraft((draft) => ({ ...draft, hoursPerWeek: Number.isFinite(next) ? next : 0 }));
  }, []);

  const handleHoursBlur = useCallback(() => {
    if (!canManageProfile) return;
    const normalized = Math.min(Math.max(Number(availabilityDraft.hoursPerWeek) || 0, 0), 168);
    setAvailabilityDraft((draft) => ({ ...draft, hoursPerWeek: normalized }));
    handleAvailabilityChange({ availableHoursPerWeek: normalized });
  }, [availabilityDraft.hoursPerWeek, canManageProfile, handleAvailabilityChange]);

  const handleRemoteToggle = useCallback(
    (event) => {
      if (!canManageProfile) return;
      const openToRemote = event.target.checked;
      setAvailabilityDraft((draft) => ({ ...draft, openToRemote }));
      handleAvailabilityChange({ openToRemote });
    },
    [canManageProfile, handleAvailabilityChange],
  );

  const handleFocusAreaInputChange = useCallback(
    (event) => {
      setFocusAreaInput(event.target.value);
      if (focusAreaFeedback.message) {
        setFocusAreaFeedback({ message: null, tone: 'muted' });
      }
    },
    [focusAreaFeedback.message],
  );

  const handleFocusAreaAdd = useCallback(() => {
    const value = focusAreaInput.trim();
    if (!value) {
      setFocusAreaFeedback({ message: 'Enter a focus area before adding.', tone: 'negative' });
      return;
    }
    if (availabilityDraft.focusAreas.length >= 8) {
      setFocusAreaFeedback({ message: 'You can highlight up to eight focus areas.', tone: 'negative' });
      return;
    }
    const duplicate = availabilityDraft.focusAreas.some((existing) => existing.toLowerCase() === value.toLowerCase());
    if (duplicate) {
      setFocusAreaFeedback({ message: 'This focus area is already listed.', tone: 'negative' });
      setFocusAreaInput('');
      return;
    }
    const updatedAreas = [...availabilityDraft.focusAreas, value];
    setAvailabilityDraft((draft) => ({ ...draft, focusAreas: updatedAreas }));
    setFocusAreaInput('');
    setFocusAreaFeedback({ message: 'Focus area added and synced.', tone: 'positive' });
    if (canManageProfile) {
      handleAvailabilityChange({ focusAreas: updatedAreas });
    }
  }, [availabilityDraft.focusAreas, canManageProfile, focusAreaInput, handleAvailabilityChange]);

  const handleFocusAreaSubmit = useCallback(
    (event) => {
      event.preventDefault();
      handleFocusAreaAdd();
    },
    [handleFocusAreaAdd],
  );

  const handleFocusAreaRemove = useCallback(
    (area) => {
      const updatedAreas = availabilityDraft.focusAreas.filter((existing) => existing !== area);
      setAvailabilityDraft((draft) => ({ ...draft, focusAreas: updatedAreas }));
      setFocusAreaFeedback({ message: 'Focus area removed.', tone: 'muted' });
      if (canManageProfile) {
        handleAvailabilityChange({ focusAreas: updatedAreas });
      }
    },
    [availabilityDraft.focusAreas, canManageProfile, handleAvailabilityChange],
  );

  const handleFollowerFieldChange = useCallback((field, value) => {
    setFollowerForm((form) => ({ ...form, [field]: value }));
  }, []);

  const handleFollowerSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!canManageProfile || !resolvedUserAccountId) {
        return;
      }
      const email = followerForm.email.trim();
      const name = followerForm.name.trim();
      if (!email) {
        setFollowersState((state) => ({ ...state, error: 'Add an email address to invite a follower.' }));
        return;
      }
      setFollowerSaving(true);
      setFollowersState((state) => ({ ...state, error: null }));
      try {
        const response = await saveFollower(resolvedUserAccountId, {
          email,
          name: name || undefined,
          note: followerForm.note.trim() || undefined,
        });
        const followerRecord = response?.follower ?? response;
        setFollowersState((state) => ({
          ...state,
          items: [
            followerRecord,
            ...state.items.filter(
              (existing) => (existing.id ?? existing.followerId) !== (followerRecord.id ?? followerRecord.followerId),
            ),
          ],
          lastSynced: new Date(),
        }));
        setFollowerForm({ name: '', email: '', note: '' });
      } catch (followersError) {
        setFollowersState((state) => ({
          ...state,
          error: followersError?.body?.message ?? followersError.message ?? 'Unable to add the follower right now.',
        }));
      } finally {
        setFollowerSaving(false);
      }
    },
    [canManageProfile, followerForm.email, followerForm.name, followerForm.note, resolvedUserAccountId],
  );

  const handleFollowerRemove = useCallback(
    async (follower) => {
      if (!canManageProfile || !resolvedUserAccountId) {
        return;
      }
      const followerId = follower?.id ?? follower?.followerId;
      if (!followerId) {
        return;
      }
      setRemovingFollowerId(followerId);
      setFollowersState((state) => ({ ...state, error: null }));
      try {
        await deleteFollower(resolvedUserAccountId, followerId);
        setFollowersState((state) => ({
          ...state,
          items: state.items.filter((existing) => (existing.id ?? existing.followerId) !== followerId),
        }));
      } catch (followersError) {
        setFollowersState((state) => ({
          ...state,
          error: followersError?.body?.message ?? followersError.message ?? 'Unable to remove the follower right now.',
        }));
      } finally {
        setRemovingFollowerId(null);
      }
    },
    [canManageProfile, resolvedUserAccountId],
  );

  const handleFollowersRefresh = useCallback(() => {
    setFollowersReloadToken((token) => token + 1);
  }, []);

  const handleReputationRefresh = useCallback(() => {
    if (!canAccessReputation) {
      return Promise.resolve();
    }
    setReputationReloadToken((token) => token + 1);
    return Promise.resolve();
  }, [canAccessReputation]);

  const handleProfileSave = useCallback(
    async (changes) => {
      if (!canManageProfile || !resolvedProfileId) {
        throw new Error('You do not have permission to update this profile.');
      }
      setSavingProfile(true);
      try {
        const updated = await updateProfile(resolvedProfileId, changes);
        setProfile(updated);
        setAvailabilityDraft(buildAvailabilityDraft(updated.availability));
        setEditorOpen(false);
        return updated;
      } catch (error) {
        throw error;
      } finally {
        setSavingProfile(false);
      }
    },
    [canManageProfile, resolvedProfileId, setAvailabilityDraft, setEditorOpen, setProfile],
  );

  const availabilityInputsDisabled = savingAvailability || !canManageProfile;

  if (!isAuthenticated) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center bg-surfaceMuted px-6">
        <div className="max-w-lg rounded-4xl border border-slate-200 bg-white/90 p-10 text-center shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent/70">Secure profile area</p>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Sign in to access your profile</h1>
          <p className="mt-3 text-sm text-slate-600">
            Profiles contain availability, credential, and roster data. Authenticate with your Gigvora account to continue.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            Go to secure login
          </Link>
        </div>
      </section>
    );
  }

  if (!canAccessProfile) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-white via-white to-surfaceMuted px-6">
        <div className="max-w-xl rounded-4xl border border-amber-200/80 bg-amber-50/90 p-10 text-center shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Access restricted</p>
          <h1 className="mt-3 text-2xl font-bold text-amber-900">Profile workspace required</h1>
          <p className="mt-3 text-sm text-amber-800">
            Only freelancer, agency, or admin workspaces can open the profile cockpit. Switch roles or request access from your organisation admin.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            <Link
              to="/dashboard/user"
              className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-5 py-2 text-amber-700 transition hover:border-amber-400"
            >
              Return to user dashboard
            </Link>
            <a
              href="mailto:support@gigvora.com"
              className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-2 text-white shadow-sm transition hover:bg-amber-700"
            >
              Contact support
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (!resolvedProfileId) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-soft">
          <h1 className="text-lg font-semibold text-slate-900">No profile connected</h1>
          <p className="mt-2 text-sm text-slate-600">
            We couldn’t locate a profile tied to this account. Ask your workspace admin to provision one or reach out to support.
          </p>
        </div>
      </section>
    );
  }
  useEffect(() => {
    if (!canAccessReputation) {
      setReputationState({
        data: null,
        error: reputationAccessReason,
        loading: false,
        fromCache: false,
        lastUpdated: null,
      });
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    setReputationState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    fetchFreelancerReputation(id, { signal: controller.signal })
      .then((payload) => {
        if (!isMounted) {
          return;
        }
        const fromCache = Boolean(
          payload?.meta?.source === 'cache' ||
            payload?.meta?.fromCache === true ||
            payload?.fromCache === true,
        );
        setReputationState({
          data: payload,
          loading: false,
          error: null,
          fromCache,
          lastUpdated: new Date(),
        });
      })
      .catch((fetchError) => {
        if (!isMounted || fetchError?.name === 'AbortError') {
          return;
        }
        setReputationState((previous) => ({
          ...previous,
          loading: false,
          error:
            fetchError?.body?.message ??
            fetchError?.message ??
            'Unable to load reputation overview. Please try again shortly.',
        }));
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [canAccessReputation, id, reputationAccessReason, reputationReloadToken]);

  if (loading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm font-medium text-slate-500">Loading profile…</p>
      </section>
    );
  }

  if (error && !profile) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-lg rounded-3xl border border-red-100 bg-red-50/80 p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-red-800">We couldn&apos;t load this profile</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!profile) {
    return null;
  }

  const impactHighlights = Array.isArray(profile.impactHighlights) ? profile.impactHighlights : [];
  const autoAssignInsights = Array.isArray(profile.autoAssignInsights) ? profile.autoAssignInsights : [];
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const collaborators = Array.isArray(profile.collaborationRoster) ? profile.collaborationRoster : [];
  const groups = Array.isArray(profile.groups) ? profile.groups : [];
  const references = Array.isArray(profile.references) ? profile.references : [];
  const preferredEngagements = Array.isArray(profile.preferredEngagements) ? profile.preferredEngagements : [];
  const statusFlags = Array.isArray(profile.statusFlags) ? profile.statusFlags : [];
  const volunteerBadges = Array.isArray(profile.volunteerBadges) ? profile.volunteerBadges : [];
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const qualifications = Array.isArray(profile.qualifications) ? profile.qualifications : [];
  const portfolioLinks = Array.isArray(profile.portfolioLinks) ? profile.portfolioLinks : [];
  const areasOfFocus = Array.isArray(profile.areasOfFocus) ? profile.areasOfFocus : [];
  const trustBreakdown = Array.isArray(metrics.trustScoreBreakdown) ? metrics.trustScoreBreakdown : [];
  const trustLevel = metrics.trustScoreLevel ?? null;
  const trustReviewDue = metrics.trustScoreRecommendedReviewAt ?? null;

  return (
    <>
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(191,219,254,0.35),_transparent_70%)]" aria-hidden="true" />
        <div className="absolute -left-16 top-32 h-80 w-80 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-24 bottom-32 h-72 w-72 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl space-y-12 px-6">
          <GigvoraAdBanner {...GIGVORA_PROFILE_BANNER} />
          {error ? (
            <div className="rounded-3xl border border-red-100 bg-red-50/80 p-4 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          ) : null}
        <div className="grid items-start gap-10 rounded-4xl border border-slate-200/70 bg-white/80 p-10 shadow-xl backdrop-blur lg:grid-cols-[auto,1fr]">
          <div className="space-y-4 text-center lg:text-left">
            <UserAvatar
              name={profile.name}
              imageUrl={profile.avatarUrl}
              seed={profile.avatarSeed}
              size="lg"
              className="mx-auto lg:mx-0"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">Profile #{id}</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{profile.name}</h1>
              <p className="mt-2 text-base text-slate-600">{profile.headline}</p>
              <p className="mt-2 text-sm text-slate-500">{profile.location}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 lg:justify-start">
              {statusFlags.map((flag) => (
                <span key={flag} className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                  {formatStatusLabel(flag)}
                </span>
              ))}
              {volunteerBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                  {formatStatusLabel(badge)}
                </span>
              ))}
            </div>
            {areasOfFocus.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500 lg:justify-start">
                {areasOfFocus.map((area) => (
                  <span key={area} className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-accent">
                    {area}
                  </span>
                ))}
              </div>
            ) : null}
            {canManageProfile ? (
              <div className="flex justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={() => setEditorOpen(true)}
                  disabled={savingAvailability || savingProfile}
                  className="mt-2 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Edit profile
                </button>
              </div>
            ) : null}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-200/80 bg-surfaceMuted/70 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mission</h2>
              <p className="mt-3 text-sm text-slate-700">{profile.missionStatement ?? profile.bio}</p>
            </article>
            <div className="grid gap-4">
              {impactHighlights.map((highlight) => (
                <article
                  key={`${highlight.title}-${highlight.value}`}
                  className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/60"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{highlight.title}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{highlight.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{highlight.description}</p>
                </article>
              ))}
            </div>
          </div>
          <GigvoraAdGrid ads={GIGVORA_PROFILE_ADS} />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
              <PageHeader
                eyebrow="About"
                title="Trusted marketplace operator"
                description={profile.bio}
              />
              {preferredEngagements.length > 0 ? (
                <p className="mt-4 text-sm text-slate-600">
                  Prefers engagements focused on{' '}
                  <span className="font-semibold text-slate-800">{preferredEngagements.join(', ')}</span> while maintaining
                  inclusive launch criteria.
                </p>
              ) : null}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Experience timeline</h2>
                  <p className="text-sm text-slate-500">Highlighting the pods, programmes, and leadership rotations that shaped this profile.</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  {statCards.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-surfaceMuted/60 px-3 py-2 text-left">
                      <p className="font-semibold text-slate-700">{stat.value}</p>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 space-y-5">
                {experience.map((item, index) => (
                  <article key={`${item.organization}-${index}`} className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{item.organization}</span>
                      <span>
                        {item.startDate ?? '—'}
                        {item.endDate ? ` – ${item.endDate}` : ' – Present'}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">{item.role}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                    {Array.isArray(item.highlights) && item.highlights.length > 0 ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
                        {item.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section
              id="reputation"
              className="rounded-4xl border border-slate-200 bg-white/95 p-8 shadow-soft"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Reputation &amp; reviews</h2>
                  <p className="text-sm text-slate-500">
                    Showcase verified delivery proof, automate testimonial flows, and keep trust signals aligned across every touchpoint.
                  </p>
                </div>
                {reputationState.lastUpdated && reputationState.data ? (
                  <p
                    className="text-xs text-slate-400"
                    title={formatAbsolute(reputationState.lastUpdated)}
                  >
                    Synced {formatRelativeTime(reputationState.lastUpdated)}
                  </p>
                ) : null}
              </div>
              {canAccessReputation ? (
                <div className="mt-8">
                  <ReputationEngineShowcase
                    data={reputationState.data}
                    loading={reputationState.loading}
                    error={reputationState.error}
                    onRefresh={handleReputationRefresh}
                    fromCache={reputationState.fromCache}
                    lastUpdated={reputationState.lastUpdated}
                    freelancerId={id}
                  />
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
                  {reputationAccessReason}
                </div>
              )}
            </section>

            {qualifications.length > 0 ? (
              <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Credentials &amp; qualifications</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Compliance, accreditation, and craft credentials underpinning Experience Launchpad eligibility.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {qualifications.map((qualification, index) => (
                    <article
                      key={`${qualification.title ?? 'qualification'}-${qualification.credentialId ?? index}`}
                      className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {qualification.authority || 'Credential'}
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-slate-900">
                        {qualification.title || 'Untitled credential'}
                      </h3>
                      <div className="mt-2 text-xs text-slate-500">
                        {qualification.year ? <span className="mr-3">Awarded {qualification.year}</span> : null}
                        {qualification.credentialId ? <span>ID: {qualification.credentialId}</span> : null}
                      </div>
                      {qualification.description ? (
                        <p className="mt-2 text-sm text-slate-600">{qualification.description}</p>
                      ) : null}
                      {qualification.credentialUrl ? (
                        <a
                          href={qualification.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center text-sm font-semibold text-accent hover:text-accent/80"
                        >
                          View credential
                          <span aria-hidden="true" className="ml-1">→</span>
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {autoAssignInsights.length > 0 ? (
              <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-accent/10 via-white to-emerald-50 p-8 shadow-soft">
                <h2 className="text-lg font-semibold text-slate-900">Pipeline snapshots</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Transparent queue metrics across auto-assign and curated pods keep stakeholders aligned on throughput and fairness.
                </p>
                <div className="mt-6 space-y-4">
                  {autoAssignInsights.map((insight) => (
                    <article
                      key={`${insight.project}-${insight.status}`}
                      className="flex items-center justify-between rounded-2xl border border-accent/30 bg-white/90 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <UserAvatar name={insight.project} seed={insight.seed ?? insight.project} size="sm" showGlow={false} />
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{insight.project}</h3>
                          <p className="text-xs text-slate-500">{insight.status}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p className="font-semibold text-slate-900">{insight.payout}</p>
                        <p>{insight.countdown ? `ETA ${insight.countdown}` : 'Queue refreshed'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {references.length > 0 ? (
              <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">References & endorsements</h2>
                <ul className="mt-4 space-y-4">
                  {references.map((reference) => (
                    <li key={`${reference.name}-${reference.company}`} className="rounded-2xl border border-slate-200 bg-surfaceMuted/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{reference.name}</p>
                          <p className="text-xs text-slate-500">{reference.relationship ?? reference.company}</p>
                        </div>
                        {reference.verified ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Verified</span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{reference.endorsement}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-8">
            <TrustScoreBreakdown
              score={metrics.trustScore}
              level={trustLevel}
              breakdown={trustBreakdown}
              recommendedReviewAt={trustReviewDue}
            />
            <section className="rounded-3xl border border-accent/40 bg-white/95 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {formatStatusLabel(availabilityDraft.status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Optimise visibility by keeping availability, capacity, and focus areas up-to-date. Changes sync instantly with auto-assign and launchpad cohorts.
              </p>
              <div className="mt-4 grid gap-2">
                {AVAILABILITY_OPTIONS.map((option) => {
                  const isActive = option.value === availabilityDraft.status;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStatusSelect(option.value)}
                      disabled={availabilityInputsDisabled}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isActive
                          ? 'border-accent bg-accent/10 text-slate-900'
                          : 'border-slate-200 bg-surfaceMuted/60 text-slate-600 hover:border-accent/40'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                      </div>
                      {isActive ? (
                        <span className="text-xs font-semibold uppercase tracking-wide text-accent">Active</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hours per week</span>
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={availabilityDraft.hoursPerWeek}
                    onChange={handleHoursChange}
                    onBlur={handleHoursBlur}
                    disabled={availabilityInputsDisabled}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={availabilityDraft.openToRemote}
                    onChange={handleRemoteToggle}
                    disabled={availabilityInputsDisabled}
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent disabled:cursor-not-allowed"
                  />
                  Open to remote-friendly engagements
                </label>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Focus areas</span>
                  <p className="mt-1 text-xs text-slate-500">
                    Spotlight engagements and disciplines you are prioritising. These sync with Launchpad and auto-assign.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availabilityDraft.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                      >
                        {area}
                        {canManageProfile ? (
                          <button
                            type="button"
                            onClick={() => handleFocusAreaRemove(area)}
                            disabled={availabilityInputsDisabled}
                            className="rounded-full bg-white/80 p-1 text-accent transition hover:bg-white"
                          >
                            <XMarkIcon className="h-3 w-3" aria-hidden="true" />
                            <span className="sr-only">Remove {area}</span>
                          </button>
                        ) : null}
                      </span>
                    ))}
                    {!availabilityDraft.focusAreas.length ? (
                      <span className="text-xs text-slate-400">No focus areas listed.</span>
                    ) : null}
                  </div>
                  {canManageProfile ? (
                    <form onSubmit={handleFocusAreaSubmit} className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={focusAreaInput}
                        onChange={handleFocusAreaInputChange}
                        disabled={availabilityInputsDisabled}
                        placeholder="Add a focus area"
                        className="flex-grow rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:bg-slate-100"
                      />
                      <button
                        type="submit"
                        disabled={availabilityInputsDisabled}
                        className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/40"
                      >
                        <PlusIcon className="h-4 w-4" aria-hidden="true" />
                        Add
                      </button>
                    </form>
                  ) : null}
                  {focusAreaFeedback.message ? (
                    <p
                      className={`mt-2 text-xs ${
                        focusAreaFeedback.tone === 'negative'
                          ? 'text-rose-500'
                          : focusAreaFeedback.tone === 'positive'
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {focusAreaFeedback.message}
                    </p>
                  ) : null}
                </div>
                <p className="text-xs text-slate-400">
                  Last updated {availability.lastUpdatedAt ? new Date(availability.lastUpdatedAt).toLocaleString() : 'recently'}
                </p>
                {savingAvailability ? (
                  <p className="text-xs font-medium text-accent">Saving availability…</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Follower access</h2>
                {canManageProfile ? (
                  <button
                    type="button"
                    onClick={handleFollowersRefresh}
                    disabled={followersState.loading}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${followersState.loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                    Refresh
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Manage who receives insider updates, pre-launch briefs, and private drops for this profile.
              </p>
              {followersState.error ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {followersState.error}
                </div>
              ) : null}
              {canManageProfile ? (
                <form onSubmit={handleFollowerSubmit} className="mt-5 grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Name</span>
                      <input
                        type="text"
                        value={followerForm.name}
                        onChange={(event) => handleFollowerFieldChange('name', event.target.value)}
                        placeholder="Optional"
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</span>
                      <input
                        type="email"
                        required
                        value={followerForm.email}
                        onChange={(event) => handleFollowerFieldChange('email', event.target.value)}
                        placeholder="member@company.com"
                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                  </div>
                  <label className="block text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</span>
                    <textarea
                      rows={2}
                      value={followerForm.note}
                      onChange={(event) => handleFollowerFieldChange('note', event.target.value)}
                      placeholder="What should they receive or monitor?"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={followerSaving}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition ${
                        followerSaving ? 'bg-accent/50' : 'bg-accent hover:bg-accentDark'
                      }`}
                    >
                      {followerSaving ? 'Sending…' : 'Invite follower'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Only profile managers can update follower access. Request elevated permissions to make changes.
                </p>
              )}
              <div className="mt-6 space-y-3">
                {followersState.loading && !followerItems.length ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="h-3 w-32 rounded bg-slate-200" />
                        <div className="mt-2 h-3 w-48 rounded bg-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : null}
                {!followersState.loading && !followerItems.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    No followers yet. Add a client, mentor, or teammate to share private updates.
                  </div>
                ) : null}
                {followerItems.map((follower) => {
                  const followerId = follower.id ?? follower.followerId;
                  return (
                    <article
                      key={followerId ?? follower.email ?? follower.name}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-surfaceMuted/70 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{follower.name || follower.email || 'Follower'}</p>
                        <p className="text-xs text-slate-500">{follower.email ?? 'Email pending'}</p>
                        {follower.note ? <p className="mt-1 text-xs text-slate-500">{follower.note}</p> : null}
                      </div>
                      {canManageProfile ? (
                        <button
                          type="button"
                          onClick={() => handleFollowerRemove(follower)}
                          disabled={removingFollowerId === followerId}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingFollowerId === followerId ? 'Removing…' : 'Remove'}
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
              {followersState.lastSynced ? (
                <p className="mt-3 text-xs text-slate-400">Last synced {followersState.lastSynced.toLocaleString()}.</p>
              ) : null}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                {skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-slate-200 bg-surfaceMuted/70 px-3 py-1">
                    {skill}
                  </span>
                ))}
              </div>
              {areasOfFocus.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Focus areas</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                    {areasOfFocus.map((area) => (
                      <span key={area} className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            {portfolioLinks.length > 0 ? (
              <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Portfolio &amp; case studies</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {portfolioLinks.map((link, index) => {
                    const label = link.label || link.url || `Link ${index + 1}`;
                    const hasUrl = Boolean(link.url);
                    return (
                      <li key={`${label}-${index}`} className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 px-4 py-3">
                        {hasUrl ? (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm font-semibold text-accent hover:text-accent/80"
                          >
                            {label}
                            <span aria-hidden="true" className="ml-1">
                              ↗
                            </span>
                          </a>
                        ) : (
                          <span className="text-sm font-semibold text-slate-500">{label}</span>
                        )}
                        {link.description ? <p className="mt-1 text-xs text-slate-500">{link.description}</p> : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Communities & groups</h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {groups.map((group) => (
                  <li key={group.id ?? group.name} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surfaceMuted/60 px-3 py-2">
                    <span>{group.name}</span>
                    <span className="text-xs text-slate-400">{group.role ? formatStatusLabel(group.role) : 'Member'}</span>
                  </li>
                ))}
              </ul>
            </section>

            {collaborators.length > 0 ? (
              <section className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-8 shadow-inner">
                <h2 className="text-lg font-semibold text-emerald-900">Collaboration roster</h2>
                <p className="mt-2 text-xs text-emerald-700">
                  Current pods draw talent from Gigvora agencies, independent strategists, and Launchpad alumni.
                </p>
                <div className="mt-4 space-y-3">
                  {collaborators.map((collaborator) => (
                    <div
                      key={`${collaborator.name}-${collaborator.role}`}
                      className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-white/90 px-3 py-2"
                    >
                      <UserAvatar
                        name={collaborator.name}
                        imageUrl={collaborator.avatarUrl}
                        seed={collaborator.avatarSeed ?? collaborator.name}
                        size="xs"
                        showGlow={false}
                      />
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">{collaborator.name}</p>
                        <p className="text-xs text-emerald-600">{collaborator.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
      </section>
      {canManageProfile ? (
        <ProfileEditor
          open={isEditorOpen}
          profile={profile}
          saving={savingProfile}
          onClose={() => setEditorOpen(false)}
          onSave={handleProfileSave}
        />
      ) : null}
    </>
  );
}
