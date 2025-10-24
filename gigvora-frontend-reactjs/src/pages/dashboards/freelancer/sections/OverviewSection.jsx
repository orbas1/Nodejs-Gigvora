import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  LinkIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhotoIcon,
  PaperAirplaneIcon,
  PlayCircleIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import useAutoSave from '../../../../hooks/useAutoSave.js';
import { trackDashboardEvent } from '../../../../utils/analytics.js';
import classNames from '../../../../utils/classNames.js';
import randomId from '../../../../utils/randomId.js';
import {
  validateMetricsDraft,
  validateWeatherDraft,
  validateRelationshipDraft,
  validateHighlightDraft,
} from '../../../../utils/dashboard/freelancerOverviewValidation.js';

const TONE_STYLES = {
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
  blue: 'border-blue-200 bg-blue-50 text-blue-600',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  amber: 'border-amber-200 bg-amber-50 text-amber-600',
  rose: 'border-rose-200 bg-rose-50 text-rose-600',
  violet: 'border-violet-200 bg-violet-50 text-violet-600',
};

const TONE_OPTIONS = [
  { value: 'slate', label: 'Slate' },
  { value: 'blue', label: 'Blue' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'amber', label: 'Amber' },
  { value: 'rose', label: 'Rose' },
  { value: 'violet', label: 'Violet' },
];

const SCHEDULE_TYPES = ['Meeting', 'Workshop', 'Intro call', 'Deep work', 'Client update'];

const METRIC_FIELD_KEYS = [
  'metrics.followerCount',
  'metrics.followerGoal',
  'metrics.trustScore',
  'metrics.trustScoreChange',
  'metrics.rating',
  'metrics.ratingCount',
];

const WEATHER_FIELD_KEYS = ['weather.latitude', 'weather.longitude'];
const RELATIONSHIP_FIELD_KEYS = [
  'relationship.retentionScore',
  'relationship.advocacyInProgress',
];
const HIGHLIGHT_FIELD_KEYS = [
  'highlight.title',
  'highlight.summary',
  'highlight.mediaUrl',
  'highlight.ctaUrl',
  'highlight.publishedAt',
];

const HIGHLIGHT_TYPES = [
  { value: 'update', label: 'Update' },
  { value: 'video', label: 'Video' },
  { value: 'article', label: 'Article' },
  { value: 'gallery', label: 'Gallery' },
];

function formatTemperature(weather) {
  if (!weather || weather.temperature == null) {
    return '—';
  }
  const unit = weather.units === 'imperial' ? '°F' : '°C';
  return `${weather.temperature}${unit}`;
}

function initialWorkstreamDraft() {
  return {
    id: '',
    label: '',
    status: '',
    dueDateLabel: '',
    tone: 'blue',
    link: '',
  };
}

function initialScheduleDraft() {
  return {
    id: '',
    label: '',
    type: 'Meeting',
    tone: 'slate',
    startsAt: '',
    link: '',
  };
}

function initialHighlightDraft() {
  return {
    id: '',
    title: '',
    summary: '',
    type: 'update',
    mediaUrl: '',
    ctaLabel: '',
    ctaUrl: '',
    publishedAt: '',
  };
}

function highlightTone(type) {
  switch (type) {
    case 'video':
      return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'article':
      return 'bg-violet-50 text-violet-600 border-violet-200';
    case 'gallery':
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    default:
      return 'bg-blue-50 text-blue-600 border-blue-200';
  }
}

function buildMetricDisplay(profile) {
  if (!profile) {
    return [];
  }
  return [
    {
      label: 'Followers',
      value: profile.followerCount != null ? profile.followerCount.toLocaleString() : '—',
      hint: profile.followerGoal ? `${profile.followerGoal.toLocaleString()} goal` : null,
    },
    {
      label: 'Trust score',
      value: profile.trustScore != null ? `${Math.round(profile.trustScore)} / 100` : '—',
      hint:
        profile.trustScoreChange != null
          ? `${profile.trustScoreChange > 0 ? '+' : ''}${profile.trustScoreChange.toFixed(1)} vs last month`
          : null,
    },
    {
      label: 'Rating',
      value: profile.rating != null ? `${profile.rating.toFixed(1)} / 5` : '—',
      hint: profile.ratingCount ? `${profile.ratingCount} reviews` : null,
    },
    {
      label: 'Upcoming',
      value: profile.upcomingCount != null ? profile.upcomingCount : '—',
      hint:
        profile.upcomingCount != null
          ? profile.upcomingCount === 1
            ? 'One commitment left today'
            : `${profile.upcomingCount} commitments scheduled`
          : null,
    },
  ];
}

function formatScheduleTime(value, timezone) {
  if (!value) {
    return null;
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone || undefined,
    }).format(date);
  } catch (error) {
    return value;
  }
}

function formatHighlightTimestamp(value) {
  if (!value) {
    return null;
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    return null;
  }
}

function firstName(profile) {
  if (!profile?.name) {
    return 'there';
  }
  return profile.name.split(' ')[0] || profile.name;
}

export default function OverviewSection({
  overview,
  loading,
  error,
  onRefresh,
  onSave,
  saving,
  autosaveEnabled = false,
}) {
  const profile = overview?.profile ?? null;
  const currentDate = overview?.currentDate ?? null;
  const weather = overview?.weather ?? null;
  const weatherSettings = overview?.weatherSettings ?? weather?.settings ?? null;
  const relationship = overview?.relationshipHealth ?? null;
  const profileAvatar = profile?.avatarUrl || 'https://avatar.vercel.sh/freelancer.svg?text=GF';
  const greetingName = firstName(profile);

  const [openPanel, setOpenPanel] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [profileDraft, setProfileDraft] = useState({ headline: '', summary: '', avatarUrl: '', timezone: '' });
  const [metricsDraft, setMetricsDraft] = useState({
    followerCount: '',
    followerGoal: '',
    trustScore: '',
    trustScoreChange: '',
    rating: '',
    ratingCount: '',
  });
  const [weatherDraft, setWeatherDraft] = useState({
    locationName: '',
    latitude: '',
    longitude: '',
    units: 'metric',
  });
  const [highlightItems, setHighlightItems] = useState([]);
  const [highlightDraft, setHighlightDraft] = useState(initialHighlightDraft());
  const [editingHighlightId, setEditingHighlightId] = useState(null);
  const [workstreamItems, setWorkstreamItems] = useState([]);
  const [workstreamDraft, setWorkstreamDraft] = useState(initialWorkstreamDraft());
  const [editingWorkstreamId, setEditingWorkstreamId] = useState(null);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [scheduleDraft, setScheduleDraft] = useState(initialScheduleDraft());
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [relationshipDraft, setRelationshipDraft] = useState({
    retentionScore: '',
    retentionStatus: '',
    retentionNotes: '',
    advocacyInProgress: '',
    advocacyNotes: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  const resetWorkstreamDraft = useCallback(() => {
    setWorkstreamDraft(initialWorkstreamDraft());
    setEditingWorkstreamId(null);
  }, []);

  const resetScheduleDraft = useCallback(() => {
    setScheduleDraft(initialScheduleDraft());
    setEditingScheduleId(null);
  }, []);

  const resetHighlightDraft = useCallback(() => {
    setHighlightDraft(initialHighlightDraft());
    setEditingHighlightId(null);
  }, []);

  const updateFormErrors = useCallback((fieldKeys, fieldErrors = null) => {
    setValidationErrors((previous) => {
      const next = { ...previous };
      fieldKeys.forEach((key) => {
        delete next[key];
      });
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([key, message]) => {
          if (message) {
            next[key] = message;
          }
        });
      }
      return next;
    });
  }, []);

  const fieldControlTone = (fieldKey) =>
    validationErrors[fieldKey]
      ? 'border-rose-300 focus:border-rose-300 focus:ring-rose-200'
      : 'border-slate-200 focus:border-blue-300 focus:ring-blue-200';

  const renderFieldError = (fieldKey) => {
    const message = validationErrors[fieldKey];
    return message ? <p className="mt-1 text-xs text-rose-600">{message}</p> : null;
  };

  const closePanel = useCallback(() => {
    setOpenPanel(null);
  }, []);

  useEffect(() => {
    if (!profile) {
      setProfileDraft({ headline: '', summary: '', avatarUrl: '', timezone: '' });
      setMetricsDraft({
        followerCount: '',
        followerGoal: '',
        trustScore: '',
        trustScoreChange: '',
        rating: '',
        ratingCount: '',
      });
      return;
    }
    setProfileDraft({
      headline: profile.headline ?? '',
      summary: profile.summary ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      timezone: currentDate?.timezone ?? '',
    });
    setMetricsDraft({
      followerCount: profile.followerCount != null ? String(profile.followerCount) : '',
      followerGoal: profile.followerGoal != null ? String(profile.followerGoal) : '',
      trustScore: profile.trustScore != null ? String(profile.trustScore) : '',
      trustScoreChange: profile.trustScoreChange != null ? String(profile.trustScoreChange) : '',
      rating: profile.rating != null ? String(profile.rating) : '',
      ratingCount: profile.ratingCount != null ? String(profile.ratingCount) : '',
    });
  }, [profile, currentDate?.timezone]);

  useEffect(() => {
    if (!weatherSettings) {
      setWeatherDraft({ locationName: '', latitude: '', longitude: '', units: 'metric' });
      return;
    }
    setWeatherDraft({
      locationName: weatherSettings.locationName ?? '',
      latitude: weatherSettings.latitude != null ? String(weatherSettings.latitude) : '',
      longitude: weatherSettings.longitude != null ? String(weatherSettings.longitude) : '',
      units: weatherSettings.units ?? 'metric',
    });
  }, [weatherSettings]);

  useEffect(() => {
    setWorkstreamItems(Array.isArray(overview?.workstreams) ? overview.workstreams : []);
    resetWorkstreamDraft();
  }, [overview?.workstreams, resetWorkstreamDraft]);

  useEffect(() => {
    setScheduleItems(Array.isArray(overview?.upcomingSchedule) ? overview.upcomingSchedule : []);
    resetScheduleDraft();
  }, [overview?.upcomingSchedule, resetScheduleDraft]);

  useEffect(() => {
    setHighlightItems(Array.isArray(overview?.highlights) ? overview.highlights : []);
    resetHighlightDraft();
  }, [overview?.highlights, resetHighlightDraft]);

  useEffect(() => {
    setRelationshipDraft({
      retentionScore:
        relationship?.retentionScore != null && Number.isFinite(Number(relationship.retentionScore))
          ? String(relationship.retentionScore)
          : '',
      retentionStatus: relationship?.retentionStatus ?? '',
      retentionNotes: relationship?.retentionNotes ?? '',
      advocacyInProgress:
        relationship?.advocacyInProgress != null && Number.isFinite(Number(relationship.advocacyInProgress))
          ? String(relationship.advocacyInProgress)
          : '',
      advocacyNotes: relationship?.advocacyNotes ?? '',
    });
  }, [relationship]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timer = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (openPanel !== 'metrics') {
      updateFormErrors(METRIC_FIELD_KEYS);
    }
    if (openPanel !== 'weather') {
      updateFormErrors(WEATHER_FIELD_KEYS);
    }
    if (openPanel !== 'relationship') {
      updateFormErrors(RELATIONSHIP_FIELD_KEYS);
    }
    if (openPanel !== 'highlight') {
      updateFormErrors(HIGHLIGHT_FIELD_KEYS);
    }
  }, [openPanel, updateFormErrors]);

  useAutoSave(profileDraft, {
    enabled: autosaveEnabled && openPanel === 'profile' && !saving,
    delay: 1800,
    isDirty: () => {
      if (!profile) {
        return Boolean(profileDraft.headline || profileDraft.summary || profileDraft.avatarUrl || profileDraft.timezone);
      }
      return (
        (profileDraft.headline ?? '') !== (profile.headline ?? '') ||
        (profileDraft.summary ?? '') !== (profile.summary ?? '') ||
        (profileDraft.avatarUrl ?? '') !== (profile.avatarUrl ?? '') ||
        (profileDraft.timezone ?? '') !== (currentDate?.timezone ?? '')
      );
    },
    onSave: async () => {
      if (!onSave) {
        return;
      }
      try {
        await onSave({
          headline: profileDraft.headline?.trim?.() ? profileDraft.headline.trim() : null,
          summary: profileDraft.summary?.trim?.() ? profileDraft.summary.trim() : null,
          avatarUrl: profileDraft.avatarUrl?.trim?.() ?? '',
          timezone: profileDraft.timezone?.trim?.() ? profileDraft.timezone.trim() : null,
        });
        if (openPanel === 'profile') {
          setStatusMessage({ type: 'success', text: 'Profile autosaved.' });
        }
        trackDashboardEvent('freelancer.overview.autosave', { scope: 'profile' });
      } catch (autoError) {
        setStatusMessage({
          type: 'error',
          text:
            autoError instanceof Error
              ? autoError.message
              : 'Unable to autosave profile changes. Please retry.',
        });
      }
    },
  });

  const metricCards = useMemo(() => {
    return buildMetricDisplay({
      ...profile,
      upcomingCount: scheduleItems.length,
    });
  }, [profile, scheduleItems.length]);

  const retentionScoreValue = useMemo(() => {
    const value = Number(relationship?.retentionScore ?? 0);
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : null;
  }, [relationship?.retentionScore]);

  const dateLabel = useMemo(() => {
    if (currentDate?.formatted) {
      return currentDate.formatted;
    }
    if (currentDate?.iso) {
      try {
        return new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(new Date(currentDate.iso));
      } catch (error) {
        return 'Today';
      }
    }
    return 'Today';
  }, [currentDate]);

  const timezoneLabel = currentDate?.timezone ?? profileDraft.timezone ?? 'Set timezone';

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;
    try {
      await onSave({
        headline: profileDraft.headline?.trim?.() ? profileDraft.headline.trim() : null,
        summary: profileDraft.summary?.trim?.() ? profileDraft.summary.trim() : null,
        avatarUrl: profileDraft.avatarUrl?.trim?.() ? profileDraft.avatarUrl.trim() : '',
        timezone: profileDraft.timezone?.trim?.() ? profileDraft.timezone.trim() : null,
      });
      setStatusMessage({ type: 'success', text: 'Profile updated.' });
      setOpenPanel(null);
    } catch (submitError) {
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to update profile.',
      });
    }
  };

  const handleGenerateSummary = useCallback(() => {
    const metrics = overview?.metrics ?? {};
    const workstreams = overview?.workstreams ?? [];
    const highlights = overview?.highlights ?? [];
    const topHighlight = highlights[0]?.title ? `Latest win: ${highlights[0].title}.` : '';
    const activeLanes = workstreams.length ? `${workstreams.length} active workstreams` : 'mission-critical programmes';
    const revenue = metrics.earnings?.monthToDate ?? metrics.earnings ?? null;
    const revenueFragment = revenue != null ? `Driving ${revenue.toLocaleString()} in monthly earnings while maintaining ` : '';
    const trust = metrics.trustScore != null ? `a trust score of ${Math.round(metrics.trustScore)}` : 'trusted relationships';
    const generated = `${revenueFragment}${trust} across ${activeLanes}. ${topHighlight}`.trim();
    setProfileDraft((previous) => ({ ...previous, summary: generated }));
    trackDashboardEvent('freelancer.overview.summary.ai', {
      hasRevenue: revenue != null,
      workstreams: workstreams.length,
      highlights: highlights.length,
    });
  }, [overview?.highlights, overview?.metrics, overview?.workstreams]);

  const handleMetricsSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;
    const { errors: validation, payload } = validateMetricsDraft(metricsDraft);
    if (Object.keys(validation).length) {
      updateFormErrors(METRIC_FIELD_KEYS, validation);
      setStatusMessage({ type: 'error', text: Object.values(validation)[0] });
      return;
    }

    updateFormErrors(METRIC_FIELD_KEYS);

    try {
      await onSave(payload);
      setStatusMessage({ type: 'success', text: 'Metrics updated.' });
      setOpenPanel(null);
      trackDashboardEvent('freelancer.overview.metrics.updated', payload);
    } catch (submitError) {
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to update metrics.',
      });
    }
  };

  const handleWeatherSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;
    const { errors: validation, payload } = validateWeatherDraft(weatherDraft);
    if (Object.keys(validation).length) {
      updateFormErrors(WEATHER_FIELD_KEYS, validation);
      setStatusMessage({ type: 'error', text: Object.values(validation)[0] });
      return;
    }

    updateFormErrors(WEATHER_FIELD_KEYS);

    try {
      await onSave({ weather: payload });
      setStatusMessage({ type: 'success', text: 'Weather preferences saved.' });
      setOpenPanel(null);
      trackDashboardEvent('freelancer.overview.weather.updated', payload);
    } catch (submitError) {
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to update weather preferences.',
      });
    }
  };

  const handleWorkstreamEdit = (item) => {
    setWorkstreamDraft({
      id: item.id,
      label: item.label ?? '',
      status: item.status ?? '',
      dueDateLabel: item.dueDateLabel ?? '',
      tone: item.tone ?? 'blue',
      link: item.link ?? '',
    });
    setEditingWorkstreamId(item.id);
    setOpenPanel('workstream');
  };

  const handleWorkstreamSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;
    const draft = {
      id: editingWorkstreamId || randomId('workstream'),
      label: workstreamDraft.label.trim() || 'Untitled lane',
      status: workstreamDraft.status?.trim() || '',
      dueDateLabel: workstreamDraft.dueDateLabel?.trim() || '',
      tone: workstreamDraft.tone || 'blue',
      link: workstreamDraft.link?.trim() || null,
    };
    const previous = workstreamItems;
    const updated = editingWorkstreamId
      ? workstreamItems.map((item) => (item.id === editingWorkstreamId ? draft : item))
      : [...workstreamItems, draft];
    setWorkstreamItems(updated);
    try {
      await onSave({ workstreams: updated });
      setStatusMessage({ type: 'success', text: 'Work lanes updated.' });
      setOpenPanel(null);
    } catch (submitError) {
      setWorkstreamItems(previous);
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to update work lanes.',
      });
    }
  };

  const handleWorkstreamDelete = async (targetId) => {
    if (!onSave) return;
    const previous = workstreamItems;
    const updated = workstreamItems.filter((item) => item.id !== targetId);
    setWorkstreamItems(updated);
    try {
      await onSave({ workstreams: updated });
      setStatusMessage({ type: 'success', text: 'Work lane removed.' });
      setOpenPanel(null);
    } catch (submitError) {
      setWorkstreamItems(previous);
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to remove work lane.',
      });
    }
  };

  const handleScheduleEdit = (item) => {
    setScheduleDraft({
      id: item.id,
      label: item.label ?? '',
      type: item.type ?? 'Meeting',
      tone: item.tone ?? 'slate',
      startsAt: item.startsAt ?? '',
      link: item.link ?? '',
    });
    setEditingScheduleId(item.id);
    setOpenPanel('schedule');
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;
    const draft = {
      id: editingScheduleId || randomId('schedule'),
      label: scheduleDraft.label.trim() || 'Untitled event',
      type: scheduleDraft.type?.trim() || 'Session',
      tone: scheduleDraft.tone || 'slate',
      startsAt: scheduleDraft.startsAt?.trim() || null,
      link: scheduleDraft.link?.trim() || null,
    };
    const previous = scheduleItems;
    const updated = editingScheduleId
      ? scheduleItems.map((item) => (item.id === editingScheduleId ? draft : item))
      : [...scheduleItems, draft];
    setScheduleItems(updated);
    try {
      await onSave({ upcomingSchedule: updated });
      setStatusMessage({ type: 'success', text: 'Schedule updated.' });
      setOpenPanel(null);
    } catch (submitError) {
      setScheduleItems(previous);
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to update schedule.',
      });
    }
  };

  const handleScheduleDelete = async (targetId) => {
    if (!onSave) return;
    const previous = scheduleItems;
    const updated = scheduleItems.filter((item) => item.id !== targetId);
    setScheduleItems(updated);
    try {
      await onSave({ upcomingSchedule: updated });
      setStatusMessage({ type: 'success', text: 'Schedule entry removed.' });
      setOpenPanel(null);
    } catch (submitError) {
      setScheduleItems(previous);
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to remove schedule entry.',
      });
    }
  };

  const handleHighlightEdit = (item) => {
    setHighlightDraft({
      id: item.id,
      title: item.title ?? '',
      summary: item.summary ?? '',
      type: item.type ?? 'update',
      mediaUrl: item.mediaUrl ?? '',
      ctaLabel: item.ctaLabel ?? '',
      ctaUrl: item.ctaUrl ?? '',
      publishedAt: item.publishedAt ? item.publishedAt.slice(0, 16) : '',
    });
    setEditingHighlightId(item.id);
    setOpenPanel('highlight');
  };

  const handleHighlightSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;

    const { errors: validation, payload } = validateHighlightDraft(highlightDraft);
    if (Object.keys(validation).length) {
      updateFormErrors(HIGHLIGHT_FIELD_KEYS, validation);
      const [[, firstMessage]] = Object.entries(validation);
      setStatusMessage({ type: 'error', text: firstMessage });
      return;
    }

    updateFormErrors(HIGHLIGHT_FIELD_KEYS);

    const nextHighlight = {
      id: editingHighlightId || randomId('highlight'),
      ...payload,
    };

    const previous = highlightItems;
    const updated = editingHighlightId
      ? highlightItems.map((item) => (item.id === editingHighlightId ? nextHighlight : item))
      : [...highlightItems, nextHighlight];

    setHighlightItems(updated);

    try {
      await onSave({ highlights: updated });
      setStatusMessage({ type: 'success', text: 'Showcase updated.' });
      setOpenPanel(null);
      resetHighlightDraft();
      trackDashboardEvent('freelancer.overview.highlight.updated', { id: nextHighlight.id, type: nextHighlight.type });
    } catch (submitError) {
      setHighlightItems(previous);
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to update highlight.',
      });
    }
  };

  const handleHighlightDelete = async (targetId) => {
    if (!onSave) return;
    const previous = highlightItems;
    const updated = highlightItems.filter((item) => item.id !== targetId);
    setHighlightItems(updated);
    try {
      await onSave({ highlights: updated });
      setStatusMessage({ type: 'success', text: 'Highlight removed.' });
      setOpenPanel(null);
      resetHighlightDraft();
    } catch (submitError) {
      setHighlightItems(previous);
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to remove highlight.',
      });
    }
  };

  const handleRelationshipSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;
    const { errors: validation, payload } = validateRelationshipDraft(relationshipDraft);
    if (Object.keys(validation).length) {
      updateFormErrors(RELATIONSHIP_FIELD_KEYS, validation);
      setStatusMessage({ type: 'error', text: Object.values(validation)[0] });
      return;
    }

    updateFormErrors(RELATIONSHIP_FIELD_KEYS);

    try {
      await onSave({ relationshipHealth: payload });
      setStatusMessage({ type: 'success', text: 'Client health updated.' });
      setOpenPanel(null);
      trackDashboardEvent('freelancer.overview.relationship.updated', payload);
    } catch (submitError) {
      setStatusMessage({
        type: 'error',
        text: submitError instanceof Error ? submitError.message : 'Unable to update client health.',
      });
    }
  };

  const renderProfileDialog = () => (
    <Transition.Root show={openPanel === 'profile'} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closePanel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Profile</Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">Refresh your greeting, summary, and avatar.</p>
                <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
                  <label className="block text-sm font-medium text-slate-700">
                    Headline
                    <input
                      type="text"
                      value={profileDraft.headline}
                      onChange={(event) => setProfileDraft((prev) => ({ ...prev, headline: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Product strategist"
                      disabled={saving}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    <div className="flex items-center justify-between">
                      <span>Summary</span>
                      <button
                        type="button"
                        onClick={handleGenerateSummary}
                        className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                        disabled={saving}
                      >
                        Generate with mission AI
                      </button>
                    </div>
                    <textarea
                      value={profileDraft.summary}
                      onChange={(event) => setProfileDraft((prev) => ({ ...prev, summary: event.target.value }))}
                      className="mt-1 h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="One-liner about your focus."
                      disabled={saving}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Avatar URL
                    <input
                      type="url"
                      value={profileDraft.avatarUrl}
                      onChange={(event) => setProfileDraft((prev) => ({ ...prev, avatarUrl: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="https://images.example.com/avatar.jpg"
                      disabled={saving}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Timezone
                    <input
                      type="text"
                      value={profileDraft.timezone}
                      onChange={(event) => setProfileDraft((prev) => ({ ...prev, timezone: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="America/New_York"
                      disabled={saving}
                    />
                  </label>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closePanel}
                      className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );

  const renderHighlightDialog = () => (
    <Transition.Root show={openPanel === 'highlight'} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closePanel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {editingHighlightId ? 'Edit highlight' : 'New highlight'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">
                  Celebrate a milestone, feature a resource, or share a video spotlight.
                </p>
                <form className="mt-6 space-y-4" onSubmit={handleHighlightSubmit}>
                  <label className="block text-sm font-medium text-slate-700">
                    Title
                    <input
                      type="text"
                      value={highlightDraft.title}
                      onChange={(event) => setHighlightDraft((prev) => ({ ...prev, title: event.target.value }))}
                      className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('highlight.title')}`}
                      placeholder="Secured a multi-year retainer"
                      disabled={saving}
                    />
                    {renderFieldError('highlight.title')}
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Summary
                    <textarea
                      value={highlightDraft.summary}
                      onChange={(event) => setHighlightDraft((prev) => ({ ...prev, summary: event.target.value }))}
                      className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('highlight.summary')}`}
                      rows={4}
                      placeholder="Outline the impact and outcome for your client."
                      disabled={saving}
                    />
                    {renderFieldError('highlight.summary')}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Type
                      <select
                        value={highlightDraft.type}
                        onChange={(event) => setHighlightDraft((prev) => ({ ...prev, type: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        disabled={saving}
                      >
                        {HIGHLIGHT_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Published
                      <input
                        type="datetime-local"
                        value={highlightDraft.publishedAt ?? ''}
                        onChange={(event) => setHighlightDraft((prev) => ({ ...prev, publishedAt: event.target.value }))}
                        className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('highlight.publishedAt')}`}
                        disabled={saving}
                      />
                      {renderFieldError('highlight.publishedAt')}
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-slate-700">
                    Media URL
                    <input
                      type="url"
                      value={highlightDraft.mediaUrl}
                      onChange={(event) => setHighlightDraft((prev) => ({ ...prev, mediaUrl: event.target.value }))}
                      className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('highlight.mediaUrl')}`}
                      placeholder="https://video.example.com/showcase"
                      disabled={saving}
                    />
                    {renderFieldError('highlight.mediaUrl')}
                  </label>
                  <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
                    <label className="block text-sm font-medium text-slate-700">
                      Button label
                      <input
                        type="text"
                        value={highlightDraft.ctaLabel}
                        onChange={(event) => setHighlightDraft((prev) => ({ ...prev, ctaLabel: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="View case study"
                        disabled={saving}
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Button link
                      <input
                        type="url"
                        value={highlightDraft.ctaUrl}
                        onChange={(event) => setHighlightDraft((prev) => ({ ...prev, ctaUrl: event.target.value }))}
                        className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('highlight.ctaUrl')}`}
                        placeholder="https://portfolio.example.com/case-study"
                        disabled={saving}
                      />
                      {renderFieldError('highlight.ctaUrl')}
                    </label>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-between gap-3">
                    {editingHighlightId ? (
                      <button
                        type="button"
                        onClick={() => handleHighlightDelete(editingHighlightId)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closePanel}
                        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save highlight
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );

  const renderMetricsDialog = () => (
    <Transition.Root show={openPanel === 'metrics'} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closePanel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Metrics</Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">Tune the numbers powering your cards.</p>
                <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleMetricsSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Followers</label>
                    <input
                      type="number"
                      value={metricsDraft.followerCount}
                      onChange={(event) => setMetricsDraft((prev) => ({ ...prev, followerCount: event.target.value }))}
                      className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('metrics.followerCount')}`}
                      placeholder="1200"
                      disabled={saving}
                    />
                    {renderFieldError('metrics.followerCount')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Follower goal</label>
                    <input
                      type="number"
                      value={metricsDraft.followerGoal}
                      onChange={(event) => setMetricsDraft((prev) => ({ ...prev, followerGoal: event.target.value }))}
                      className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('metrics.followerGoal')}`}
                      placeholder="2000"
                      disabled={saving}
                    />
                    {renderFieldError('metrics.followerGoal')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Trust score</label>
                    <input
                      type="number"
                      value={metricsDraft.trustScore}
                      onChange={(event) => setMetricsDraft((prev) => ({ ...prev, trustScore: event.target.value }))}
                      className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('metrics.trustScore')}`}
                      placeholder="90"
                      disabled={saving}
                    />
                    {renderFieldError('metrics.trustScore')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Trust delta</label>
                    <input
                      type="number"
                      value={metricsDraft.trustScoreChange}
                      onChange={(event) => setMetricsDraft((prev) => ({ ...prev, trustScoreChange: event.target.value }))}
                      className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('metrics.trustScoreChange')}`}
                      placeholder="2.5"
                      disabled={saving}
                    />
                    {renderFieldError('metrics.trustScoreChange')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      value={metricsDraft.rating}
                      onChange={(event) => setMetricsDraft((prev) => ({ ...prev, rating: event.target.value }))}
                      className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('metrics.rating')}`}
                      placeholder="4.9"
                      disabled={saving}
                    />
                    {renderFieldError('metrics.rating')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Reviews</label>
                    <input
                      type="number"
                      value={metricsDraft.ratingCount}
                      onChange={(event) => setMetricsDraft((prev) => ({ ...prev, ratingCount: event.target.value }))}
                      className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('metrics.ratingCount')}`}
                      placeholder="42"
                      disabled={saving}
                    />
                    {renderFieldError('metrics.ratingCount')}
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closePanel}
                      className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save metrics
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );

  const renderWeatherDialog = () => (
    <Transition.Root show={openPanel === 'weather'} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closePanel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Weather</Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">Set the coordinates for your weather snapshot.</p>
                <form className="mt-6 space-y-4" onSubmit={handleWeatherSubmit}>
                  <label className="block text-sm font-medium text-slate-700">
                    Location
                    <input
                      type="text"
                      value={weatherDraft.locationName}
                      onChange={(event) => setWeatherDraft((prev) => ({ ...prev, locationName: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Brooklyn, NY"
                      disabled={saving}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={weatherDraft.latitude}
                        onChange={(event) => setWeatherDraft((prev) => ({ ...prev, latitude: event.target.value }))}
                        className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('weather.latitude')}`}
                        placeholder="40.7128"
                        disabled={saving}
                      />
                      {renderFieldError('weather.latitude')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={weatherDraft.longitude}
                        onChange={(event) => setWeatherDraft((prev) => ({ ...prev, longitude: event.target.value }))}
                        className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('weather.longitude')}`}
                        placeholder="-73.935242"
                        disabled={saving}
                      />
                      {renderFieldError('weather.longitude')}
                    </div>
                  </div>
                  <label className="block text-sm font-medium text-slate-700">
                    Units
                    <select
                      value={weatherDraft.units}
                      onChange={(event) => setWeatherDraft((prev) => ({ ...prev, units: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      disabled={saving}
                    >
                      <option value="metric">Metric (°C)</option>
                      <option value="imperial">Imperial (°F)</option>
                    </select>
                  </label>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closePanel}
                      className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save weather
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );

  const renderWorkstreamDialog = () => (
    <Transition.Root show={openPanel === 'workstream'} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closePanel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {editingWorkstreamId ? 'Edit work lane' : 'New work lane'}
                </Dialog.Title>
                <form className="mt-6 space-y-4" onSubmit={handleWorkstreamSubmit}>
                  <label className="block text-sm font-medium text-slate-700">
                    Name
                    <input
                      type="text"
                      value={workstreamDraft.label}
                      onChange={(event) => setWorkstreamDraft((prev) => ({ ...prev, label: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Deliver design"
                      disabled={saving}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                    <input
                      type="text"
                      value={workstreamDraft.status}
                      onChange={(event) => setWorkstreamDraft((prev) => ({ ...prev, status: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="In review"
                      disabled={saving}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Due label
                      <input
                        type="text"
                        value={workstreamDraft.dueDateLabel}
                        onChange={(event) => setWorkstreamDraft((prev) => ({ ...prev, dueDateLabel: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Due Friday"
                        disabled={saving}
                      />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Accent
                      <select
                        value={workstreamDraft.tone}
                        onChange={(event) => setWorkstreamDraft((prev) => ({ ...prev, tone: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        disabled={saving}
                      >
                        {TONE_OPTIONS.map((tone) => (
                          <option key={tone.value} value={tone.value}>
                            {tone.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-slate-700">
                    Link (optional)
                    <input
                      type="url"
                      value={workstreamDraft.link}
                      onChange={(event) => setWorkstreamDraft((prev) => ({ ...prev, link: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="https://docs.example.com"
                      disabled={saving}
                    />
                  </label>
                  <div className="mt-6 flex flex-wrap justify-between gap-3">
                    {editingWorkstreamId ? (
                      <button
                        type="button"
                        onClick={() => handleWorkstreamDelete(editingWorkstreamId)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closePanel}
                        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save lane
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );

  const renderScheduleDialog = () => (
    <Transition.Root show={openPanel === 'schedule'} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closePanel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {editingScheduleId ? 'Edit event' : 'New event'}
                </Dialog.Title>
                <form className="mt-6 space-y-4" onSubmit={handleScheduleSubmit}>
                  <label className="block text-sm font-medium text-slate-700">
                    Title
                    <input
                      type="text"
                      value={scheduleDraft.label}
                      onChange={(event) => setScheduleDraft((prev) => ({ ...prev, label: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Client sync"
                      disabled={saving}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Type
                      <select
                        value={scheduleDraft.type}
                        onChange={(event) => setScheduleDraft((prev) => ({ ...prev, type: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        disabled={saving}
                      >
                        {SCHEDULE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Accent
                      <select
                        value={scheduleDraft.tone}
                        onChange={(event) => setScheduleDraft((prev) => ({ ...prev, tone: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        disabled={saving}
                      >
                        {TONE_OPTIONS.map((tone) => (
                          <option key={tone.value} value={tone.value}>
                            {tone.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-slate-700">
                    Starts at
                    <input
                      type="datetime-local"
                      value={scheduleDraft.startsAt ?? ''}
                      onChange={(event) => setScheduleDraft((prev) => ({ ...prev, startsAt: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      disabled={saving}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Link (optional)
                    <input
                      type="url"
                      value={scheduleDraft.link}
                      onChange={(event) => setScheduleDraft((prev) => ({ ...prev, link: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="https://meet.example.com"
                      disabled={saving}
                    />
                  </label>
                  <div className="mt-6 flex flex-wrap justify-between gap-3">
                    {editingScheduleId ? (
                      <button
                        type="button"
                        onClick={() => handleScheduleDelete(editingScheduleId)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closePanel}
                        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save event
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );

  const renderRelationshipDialog = () => (
    <Transition.Root show={openPanel === 'relationship'} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closePanel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Client health</Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">Keep your relationship telemetry current.</p>
                <form className="mt-6 space-y-4" onSubmit={handleRelationshipSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Retention score</label>
                      <input
                        type="number"
                        value={relationshipDraft.retentionScore}
                        onChange={(event) => setRelationshipDraft((prev) => ({ ...prev, retentionScore: event.target.value }))}
                        className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('relationship.retentionScore')}`}
                        placeholder="82"
                        disabled={saving}
                      />
                      {renderFieldError('relationship.retentionScore')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Active advocates</label>
                      <input
                        type="number"
                        value={relationshipDraft.advocacyInProgress}
                        onChange={(event) =>
                          setRelationshipDraft((prev) => ({ ...prev, advocacyInProgress: event.target.value }))
                        }
                        className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ${fieldControlTone('relationship.advocacyInProgress')}`}
                        placeholder="3"
                        disabled={saving}
                      />
                      {renderFieldError('relationship.advocacyInProgress')}
                    </div>
                  </div>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                    <input
                      type="text"
                      value={relationshipDraft.retentionStatus}
                      onChange={(event) => setRelationshipDraft((prev) => ({ ...prev, retentionStatus: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Steady"
                      disabled={saving}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Retention notes
                    <textarea
                      value={relationshipDraft.retentionNotes}
                      onChange={(event) => setRelationshipDraft((prev) => ({ ...prev, retentionNotes: event.target.value }))}
                      className="mt-1 h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Renewal runway, blockers, etc."
                      disabled={saving}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Advocacy notes
                    <textarea
                      value={relationshipDraft.advocacyNotes}
                      onChange={(event) => setRelationshipDraft((prev) => ({ ...prev, advocacyNotes: event.target.value }))}
                      className="mt-1 h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Reference plays, upcoming testimonials."
                      disabled={saving}
                    />
                  </label>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closePanel}
                      className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save health
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );

  const refreshButton = (
    <button
      type="button"
      onClick={() => onRefresh?.()}
      disabled={loading || saving}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <ArrowPathIcon className="h-4 w-4" />
      {loading ? 'Refreshing…' : 'Refresh'}
    </button>
  );

  if (!overview && loading) {
    return (
      <SectionShell id="overview" title="Overview" description="Live snapshot of your workspace." actions={refreshButton}>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Loading your overview…
        </div>
      </SectionShell>
    );
  }

  const retentionLabel =
    retentionScoreValue != null && Number.isFinite(retentionScoreValue)
      ? `${Math.round(retentionScoreValue)}%`
      : '—';

  const weatherLocation = weather?.locationName || weatherSettings?.locationName || 'Set location';
  const weatherCondition = weather?.condition ?? null;

  return (
    <SectionShell id="overview" title="Overview" description="Live snapshot of your workspace." actions={refreshButton}>
      {statusMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            statusMessage.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/70 dark:bg-rose-500/10 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200'
          }`}
        >
          {statusMessage.text}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/70 dark:bg-rose-500/10 dark:text-rose-200">
          {error.message ?? 'Unable to load overview data.'}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,1fr)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative h-20 w-20 shrink-0">
              <img src={profileAvatar} alt={profile?.name ?? 'Freelancer avatar'} className="h-20 w-20 rounded-2xl object-cover" />
              <button
                type="button"
                onClick={() => setOpenPanel('profile')}
                className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{dateLabel}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">Hi {greetingName} 👋</p>
              <p className="mt-1 text-sm text-slate-600">{profile?.headline || 'Add your headline to stay memorable.'}</p>
              <p
                className="mt-3 max-w-2xl text-sm text-slate-500"
                style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}
              >
                {profile?.summary || 'Share a short intro so clients know where you shine.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">Timezone · {timezoneLabel}</span>
                {profile?.location ? <span className="rounded-full bg-slate-100 px-3 py-1">{profile.location}</span> : null}
                <button
                  type="button"
                  onClick={() => setOpenPanel('profile')}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-600 hover:bg-blue-100"
                >
                  Edit profile
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-slate-700 xl:sticky xl:top-6 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Weather</p>
              <button
                type="button"
                onClick={() => setOpenPanel('weather')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Update
              </button>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{formatTemperature(weather)}</p>
            {weatherCondition ? <p className="text-sm text-slate-600">{weatherCondition}</p> : null}
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <MapPinIcon className="h-4 w-4 text-blue-500" />
              {weatherLocation}
            </p>
            {weather?.fetchedAt ? (
              <p className="mt-2 text-xs text-slate-500">
                Updated {new Date(weather.fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <button
            key={metric.label}
            type="button"
            onClick={() => setOpenPanel('metrics')}
            className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow dark:border-slate-700 dark:bg-slate-900/60"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
            {metric.hint ? <p className="mt-2 text-xs text-slate-500">{metric.hint}</p> : null}
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
              Adjust
              <PencilSquareIcon className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Highlights</h3>
              <button
                type="button"
                onClick={() => {
                  resetHighlightDraft();
                  setOpenPanel('highlight');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add highlight
              </button>
            </div>
            {highlightItems.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {highlightItems.map((item) => {
                  const Icon = item.type === 'video' ? PlayCircleIcon : item.type === 'gallery' ? PhotoIcon : LinkIcon;
                  const publishedLabel = formatHighlightTimestamp(item.publishedAt);
                  return (
                    <div
                      key={item.id ?? item.title ?? item.summary}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleHighlightEdit(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleHighlightEdit(item);
                        }
                      }}
                      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-slate-700 dark:bg-slate-900/50"
                    >
                      <div className={`flex items-start gap-3 rounded-2xl border p-4 ${highlightTone(item.type)}`}>
                        <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {item.title || 'Untitled highlight'}
                          </p>
                          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">
                            {item.summary || 'Add a quick summary to share the win.'}
                          </p>
                          {publishedLabel ? (
                            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Published {publishedLabel}
                            </p>
                          ) : null}
                          {item.ctaLabel ? (
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                              {item.ctaLabel}
                              <LinkIcon className="h-3.5 w-3.5" />
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {item.mediaUrl ? (
                        <p className="mt-3 truncate text-[11px] text-slate-400 group-hover:text-slate-500">{item.mediaUrl}</p>
                      ) : null}
                      {item.mediaUrl ? (
                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner dark:border-slate-700 dark:bg-slate-900/40">
                          <div
                            className={`h-32 w-full ${item.type === 'video' ? 'bg-slate-900/80 text-center text-xs font-semibold text-white/80' : ''}`}
                            style={item.type === 'video' ? undefined : { backgroundImage: `url(${item.mediaUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                          >
                            {item.type === 'video' ? 'Video preview ready once opened.' : null}
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Tap to edit</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            const shareUrl = `/feed/new?source=highlight-${item.id ?? 'preview'}`;
                            if (typeof window !== 'undefined') {
                              window.open(shareUrl, '_blank', 'noopener,noreferrer');
                            }
                            trackDashboardEvent('freelancer.overview.highlight.share', { id: item.id, type: item.type });
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                        >
                          Share to feed
                          <PaperAirplaneIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">
                Curate wins, testimonials, or launches to greet clients when they land here.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Work lanes</h3>
              <button
                type="button"
                onClick={() => {
                  resetWorkstreamDraft();
                  setOpenPanel('workstream');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add lane
              </button>
            </div>
            {workstreamItems.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {workstreamItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleWorkstreamEdit(item)}
                    className={classNames(
                      'rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow',
                      TONE_STYLES[item.tone] ?? TONE_STYLES.slate,
                    )}
                  >
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    {item.status ? <p className="mt-1 text-xs text-slate-600">{item.status}</p> : null}
                    {item.dueDateLabel ? <p className="mt-1 text-xs text-slate-500">Due {item.dueDateLabel}</p> : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">Capture the work you are pushing across the line today.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Today</h3>
              <button
                type="button"
                onClick={() => {
                  resetScheduleDraft();
                  setOpenPanel('schedule');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700"
              >
                <PlusCircleIcon className="h-4 w-4" />
                Add event
              </button>
            </div>
            {scheduleItems.length ? (
              <ul className="mt-5 space-y-3">
                {scheduleItems.map((item) => {
                  const timeLabel = formatScheduleTime(item.startsAt, currentDate?.timezone);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleScheduleEdit(item)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.type}
                            {timeLabel ? ` · ${timeLabel}` : ''}
                          </p>
                        </div>
                        <CalendarDaysIcon className="h-5 w-5 text-slate-400" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-slate-500">No meetings on the books. Drop one in when you schedule it.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Clients</h3>
            <button
              type="button"
              onClick={() => setOpenPanel('relationship')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Update
            </button>
          </div>
          <p className="mt-6 text-4xl font-semibold text-slate-900">{retentionLabel}</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${retentionScoreValue ?? 0}%` }} />
          </div>
          <dl className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Status</dt>
              <dd className="font-medium text-slate-900">{relationship?.retentionStatus || 'Set status'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Active advocates</dt>
              <dd className="font-medium text-slate-900">{relationship?.advocacyInProgress ?? 0}</dd>
            </div>
          </dl>
          {relationship?.advocacyNotes ? (
            <p className="mt-4 text-xs text-slate-500">{relationship.advocacyNotes}</p>
          ) : null}
        </div>
      </div>

      {renderProfileDialog()}
      {renderHighlightDialog()}
      {renderMetricsDialog()}
      {renderWeatherDialog()}
      {renderWorkstreamDialog()}
      {renderScheduleDialog()}
      {renderRelationshipDialog()}
    </SectionShell>
  );

}
