import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchFreelancerReputation,
  requestReferenceInvite,
  updateReferenceSettings,
  verifyReference as verifyReferenceRequest,
} from '../services/reputation.js';

const FALLBACK_REFERENCES = [
  {
    id: 'ref-demo-1',
    client: 'Lumina Health',
    relationship: 'Chief Product Officer',
    company: 'Lumina Health',
    quote:
      'Amelia architected our new member experience in six weeks and orchestrated the change with clinical, billing, and product teams seamlessly.',
    rating: 5,
    weight: 'Flagship transformation',
    verified: true,
    status: 'published',
    lastInteractionAt: '2024-04-10T12:00:00.000Z',
    private: false,
  },
  {
    id: 'ref-demo-2',
    client: 'Atlas Robotics',
    relationship: 'VP Product',
    company: 'Atlas Robotics',
    quote:
      'She aligned engineering, design, and commercial leads around a single product vision and delivered the GTM enablement playbook.',
    rating: 4.9,
    weight: 'Growth enablement',
    verified: true,
    status: 'published',
    lastInteractionAt: '2024-04-06T15:30:00.000Z',
    private: false,
  },
  {
    id: 'ref-demo-3',
    client: 'Northwind Bank',
    relationship: 'Director of CX',
    company: 'Northwind Bank',
    quote:
      'Discovery cadence, insight synthesis, and stakeholder facilitation were handled impeccably. We now have a roadmap our regulators support.',
    rating: 4.8,
    weight: 'Regulatory programme',
    verified: false,
    status: 'pending_verification',
    lastInteractionAt: '2024-04-14T09:45:00.000Z',
    private: true,
  },
  {
    id: 'ref-demo-4',
    client: 'Finley Capital',
    relationship: 'Managing Partner',
    company: 'Finley Capital',
    quote:
      'Investor memo and product market exploration sprints were tight, data-backed, and produced two validated venture theses in record time.',
    rating: 4.7,
    weight: 'Venture diligence',
    verified: false,
    status: 'awaiting_feedback',
    lastInteractionAt: '2024-04-16T17:10:00.000Z',
    private: false,
  },
];

const FALLBACK_SETTINGS = {
  allowPrivate: true,
  showBadges: true,
  autoShareToFeed: true,
  autoRequest: false,
  escalateConcerns: true,
};

const FALLBACK_INSIGHTS = {
  invitesSent: 18,
  responseRate: 0.82,
  lastSyncAt: '2024-04-16T18:00:00.000Z',
};

const DEFAULT_SETTINGS = {
  allowPrivate: true,
  showBadges: true,
  autoShareToFeed: false,
  autoRequest: false,
  escalateConcerns: true,
};

function normalizeReference(reference, index) {
  if (!reference || typeof reference !== 'object') {
    return null;
  }
  const fallbackId = `reference-${index + 1}`;
  const parsed = {
    id: `${reference.id ?? reference.referenceId ?? fallbackId}`,
    client: (reference.client ?? reference.clientName ?? reference.reviewer ?? '').toString(),
    relationship: (reference.relationship ?? reference.role ?? '').toString(),
    company: (reference.company ?? reference.organisation ?? reference.companyName ?? '').toString(),
    quote: (reference.quote ?? reference.testimonial ?? reference.comment ?? '').toString(),
    rating: Number.parseFloat(reference.rating ?? reference.score ?? reference.nps ?? 0) || null,
    weight: reference.weight ?? reference.impact ?? null,
    verified: Boolean(reference.verified ?? reference.isVerified ?? reference.status === 'verified'),
    status: (reference.status ?? (reference.published ? 'published' : null) ?? 'draft').toString(),
    lastInteractionAt: reference.lastInteractionAt ?? reference.lastInteractedAt ?? reference.updatedAt ?? null,
    private: Boolean(reference.private ?? reference.isPrivate ?? false),
    email: reference.email ?? reference.contactEmail ?? null,
    phone: reference.phone ?? reference.contactPhone ?? null,
  };

  if (!parsed.quote && reference.snippet) {
    parsed.quote = reference.snippet;
  }

  return parsed;
}

function normalizeSettings(rawSettings) {
  if (!rawSettings || typeof rawSettings !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    allowPrivate: Boolean(
      rawSettings.allowPrivate ?? rawSettings.allowPrivateReferences ?? rawSettings.privateReferences ?? DEFAULT_SETTINGS.allowPrivate,
    ),
    showBadges: Boolean(
      rawSettings.showBadges ?? rawSettings.displayBadges ?? rawSettings.showcaseBadges ?? DEFAULT_SETTINGS.showBadges,
    ),
    autoShareToFeed: Boolean(
      rawSettings.autoShareToFeed ?? rawSettings.feedCrossPosting ?? rawSettings.enableFeedSharing ?? DEFAULT_SETTINGS.autoShareToFeed,
    ),
    autoRequest: Boolean(
      rawSettings.autoRequest ?? rawSettings.requestAutomation ?? rawSettings.enableAutoRequest ?? DEFAULT_SETTINGS.autoRequest,
    ),
    escalateConcerns: Boolean(
      rawSettings.escalateConcerns ?? rawSettings.routeConcernsToSupport ?? DEFAULT_SETTINGS.escalateConcerns,
    ),
  };
}

function coerceDate(value) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function formatPercentage(value) {
  if (value == null) {
    return '—';
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return `${Math.round(numeric * 100)}%`;
}

export function useFreelancerReferences({ freelancerId, enabled = true } = {}) {
  const safeId = freelancerId ?? 'demo-freelancer';
  const isNetworkEnabled = Boolean(freelancerId);

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!isNetworkEnabled) {
        return {
          references: FALLBACK_REFERENCES,
          settings: FALLBACK_SETTINGS,
          insights: FALLBACK_INSIGHTS,
        };
      }

      const payload = await fetchFreelancerReputation(freelancerId, {
        signal,
        includeDrafts: true,
        limitTestimonials: 40,
      });

      if (payload && typeof payload === 'object') {
        return payload;
      }

      return { references: [], settings: DEFAULT_SETTINGS, insights: {} };
    },
    [freelancerId, isNetworkEnabled],
  );

  const resourceState = useCachedResource(`freelancer:references:${safeId}`, fetcher, {
    enabled,
    dependencies: [safeId],
    ttl: 1000 * 45,
  });

  const { refresh } = resourceState;

  const rawReferences = useMemo(() => {
    if (!resourceState.data) {
      return FALLBACK_REFERENCES;
    }
    if (Array.isArray(resourceState.data.references)) {
      return resourceState.data.references;
    }
    if (Array.isArray(resourceState.data.testimonials)) {
      return resourceState.data.testimonials;
    }
    if (Array.isArray(resourceState.data.items)) {
      return resourceState.data.items;
    }
    return FALLBACK_REFERENCES;
  }, [resourceState.data]);

  const normalizedReferences = useMemo(() => {
    return rawReferences
      .map((reference, index) => normalizeReference(reference, index))
      .filter(Boolean)
      .sort((a, b) => {
        const dateA = coerceDate(a.lastInteractionAt) ?? new Date(0);
        const dateB = coerceDate(b.lastInteractionAt) ?? new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [rawReferences]);

  const publishedReferences = useMemo(
    () => normalizedReferences.filter((reference) => reference.status === 'published'),
    [normalizedReferences],
  );

  const pendingReferences = useMemo(
    () => normalizedReferences.filter((reference) => reference.status !== 'published'),
    [normalizedReferences],
  );

  const verifiedCount = useMemo(
    () => normalizedReferences.filter((reference) => reference.verified).length,
    [normalizedReferences],
  );

  const averageScore = useMemo(() => {
    const scores = normalizedReferences
      .map((reference) => Number.parseFloat(reference.rating))
      .filter((score) => Number.isFinite(score));
    if (!scores.length) {
      return null;
    }
    const sum = scores.reduce((total, value) => total + value, 0);
    return Number((sum / scores.length).toFixed(2));
  }, [normalizedReferences]);

  const insights = useMemo(() => {
    const rawInsights = resourceState.data?.insights ?? resourceState.data?.metrics ?? {};
    const invitesSent = rawInsights.invitesSent ?? rawInsights.totalInvites ?? FALLBACK_INSIGHTS.invitesSent;
    const responseRate = rawInsights.responseRate ?? rawInsights.inviteResponseRate ?? FALLBACK_INSIGHTS.responseRate;
    const lastSync = coerceDate(rawInsights.lastSyncAt ?? rawInsights.syncedAt ?? resourceState.lastUpdated) ??
      coerceDate(FALLBACK_INSIGHTS.lastSyncAt);

    return {
      invitesSent,
      responseRate,
      lastSync,
    };
  }, [resourceState.data, resourceState.lastUpdated]);

  const compliance = useMemo(() => {
    const total = normalizedReferences.length;
    const privateReferences = normalizedReferences.filter((reference) => reference.private).length;
    return {
      verifiedRatio: total ? verifiedCount / total : 0,
      privateReferences,
      total,
    };
  }, [normalizedReferences, verifiedCount]);

  const timeline = useMemo(() => {
    return normalizedReferences.slice(0, 8).map((reference) => {
      const interactionDate = coerceDate(reference.lastInteractionAt);
      const statusLabel = reference.status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      return {
        id: reference.id,
        title: `${reference.client}${reference.company ? ` • ${reference.company}` : ''}`,
        status: statusLabel,
        interactionDate,
        verified: reference.verified,
      };
    });
  }, [normalizedReferences]);

  const settingsRef = useRef(DEFAULT_SETTINGS);
  const [settingsState, setSettingsState] = useState({
    data: DEFAULT_SETTINGS,
    saving: false,
    error: null,
  });

  useEffect(() => {
    const nextSettings = normalizeSettings(
      resourceState.data?.referenceSettings ??
        resourceState.data?.settings ??
        resourceState.data?.preferences,
    );
    settingsRef.current = nextSettings;
    setSettingsState((previous) => ({ ...previous, data: nextSettings, error: null }));
  }, [resourceState.data]);

  const persistSettings = useCallback(
    async (nextSettings) => {
      if (!isNetworkEnabled) {
        return Promise.resolve();
      }
      return updateReferenceSettings(freelancerId, nextSettings);
    },
    [freelancerId, isNetworkEnabled],
  );

  const updateSettingsState = useCallback(
    async (patch) => {
      const previous = settingsRef.current;
      const next = { ...previous, ...patch };
      settingsRef.current = next;
      setSettingsState({ data: next, saving: true, error: null });
      try {
        await persistSettings(next);
        setSettingsState({ data: next, saving: false, error: null });
      } catch (error) {
        settingsRef.current = previous;
        setSettingsState({ data: previous, saving: false, error });
        throw error;
      }
    },
    [persistSettings],
  );

  const requestReference = useCallback(
    async ({ clientName, email, relationship, message }) => {
      const payload = {
        clientName: clientName?.trim(),
        email: email?.trim(),
        relationship: relationship?.trim(),
        message: message?.trim(),
      };

      if (!payload.clientName) {
        throw new Error('Client name is required.');
      }
      if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        throw new Error('Please provide a valid email address.');
      }

      if (isNetworkEnabled) {
        await requestReferenceInvite(freelancerId, payload);
      }

      await refresh({ force: true });
    },
    [freelancerId, isNetworkEnabled, refresh],
  );

  const verifyReference = useCallback(
    async (referenceId) => {
      if (!referenceId) {
        throw new Error('Reference id is required to verify a reference.');
      }

      if (isNetworkEnabled) {
        await verifyReferenceRequest(freelancerId, referenceId);
      }

      await refresh({ force: true });
    },
    [freelancerId, isNetworkEnabled, refresh],
  );

  const summary = useMemo(() => {
    return [
      {
        label: 'Published references',
        value: publishedReferences.length,
        hint: `${verifiedCount} verified`,
      },
      {
        label: 'Pending actions',
        value: pendingReferences.length,
        hint: pendingReferences.length ? 'Follow-ups required' : 'All up to date',
      },
      {
        label: 'Average rating',
        value: averageScore ? `${averageScore.toFixed(1)} / 5` : '—',
        hint: formatPercentage(insights.responseRate) + ' response rate',
      },
      {
        label: 'Invites sent',
        value: insights.invitesSent,
        hint: insights.lastSync ? `Synced ${insights.lastSync.toLocaleDateString()}` : 'Awaiting sync',
      },
    ];
  }, [averageScore, insights, pendingReferences.length, publishedReferences.length, verifiedCount]);

  return {
    ...resourceState,
    references: normalizedReferences,
    publishedReferences,
    pendingReferences,
    summary,
    insights,
    compliance,
    timeline,
    settings: settingsState.data,
    settingsSaving: settingsState.saving,
    settingsError: settingsState.error,
    updateSettings: updateSettingsState,
    requestReference,
    verifyReference,
  };
}

export default useFreelancerReferences;
