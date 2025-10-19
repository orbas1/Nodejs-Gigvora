import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../../SectionShell.jsx';

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

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

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

function firstName(profile) {
  if (!profile?.name) {
    return 'there';
  }
  return profile.name.split(' ')[0] || profile.name;
}

export default function OverviewSection({ overview, loading, error, onRefresh, onSave, saving }) {
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
  }, [openPanel, updateFormErrors]);

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

  const handleMetricsSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;

    const errors = {};

    const followerCountInput = metricsDraft.followerCount?.trim?.() ?? '';
    let followerCountValue;
    if (!followerCountInput) {
      errors['metrics.followerCount'] = 'Followers is required.';
    } else {
      const parsed = Number.parseInt(followerCountInput, 10);
      if (Number.isNaN(parsed)) {
        errors['metrics.followerCount'] = 'Followers must be a whole number.';
      } else if (parsed < 0) {
        errors['metrics.followerCount'] = 'Followers cannot be negative.';
      } else if (parsed > 10_000_000) {
        errors['metrics.followerCount'] = 'Followers cannot exceed 10,000,000.';
      } else {
        followerCountValue = parsed;
      }
    }

    const followerGoalInput = metricsDraft.followerGoal?.trim?.() ?? '';
    let followerGoalValue;
    if (followerGoalInput) {
      const parsed = Number.parseInt(followerGoalInput, 10);
      if (Number.isNaN(parsed)) {
        errors['metrics.followerGoal'] = 'Follower goal must be a whole number.';
      } else if (parsed < 0) {
        errors['metrics.followerGoal'] = 'Follower goal cannot be negative.';
      } else if (parsed > 10_000_000) {
        errors['metrics.followerGoal'] = 'Follower goal cannot exceed 10,000,000.';
      } else {
        followerGoalValue = parsed;
      }
    }

    const trustScoreInput = metricsDraft.trustScore?.trim?.() ?? '';
    let trustScoreValue = null;
    if (trustScoreInput) {
      const parsed = Number(trustScoreInput);
      if (Number.isNaN(parsed)) {
        errors['metrics.trustScore'] = 'Trust score must be a number.';
      } else if (parsed < 0 || parsed > 100) {
        errors['metrics.trustScore'] = 'Trust score must be between 0 and 100.';
      } else {
        trustScoreValue = parsed;
      }
    }

    const trustScoreChangeInput = metricsDraft.trustScoreChange?.trim?.() ?? '';
    let trustScoreChangeValue = null;
    if (trustScoreChangeInput) {
      const parsed = Number(trustScoreChangeInput);
      if (Number.isNaN(parsed)) {
        errors['metrics.trustScoreChange'] = 'Trust score change must be a number.';
      } else if (parsed < -100 || parsed > 100) {
        errors['metrics.trustScoreChange'] = 'Trust score change must be between -100 and 100.';
      } else {
        trustScoreChangeValue = parsed;
      }
    }

    const ratingInput = metricsDraft.rating?.trim?.() ?? '';
    let ratingValue = null;
    if (ratingInput) {
      const parsed = Number(ratingInput);
      if (Number.isNaN(parsed)) {
        errors['metrics.rating'] = 'Rating must be a number.';
      } else if (parsed < 0 || parsed > 5) {
        errors['metrics.rating'] = 'Rating must be between 0 and 5.';
      } else {
        ratingValue = parsed;
      }
    }

    const ratingCountInput = metricsDraft.ratingCount?.trim?.() ?? '';
    let ratingCountValue;
    if (ratingCountInput) {
      const parsed = Number.parseInt(ratingCountInput, 10);
      if (Number.isNaN(parsed)) {
        errors['metrics.ratingCount'] = 'Rating count must be a whole number.';
      } else if (parsed < 0) {
        errors['metrics.ratingCount'] = 'Rating count cannot be negative.';
      } else if (parsed > 10_000_000) {
        errors['metrics.ratingCount'] = 'Rating count cannot exceed 10,000,000.';
      } else {
        ratingCountValue = parsed;
      }
    }

    if (Object.keys(errors).length) {
      updateFormErrors(METRIC_FIELD_KEYS, errors);
      setStatusMessage({ type: 'error', text: Object.values(errors)[0] });
      return;
    }

    updateFormErrors(METRIC_FIELD_KEYS);

    try {
      const payload = {
        followerCount: followerCountValue,
        trustScore: trustScoreValue,
        trustScoreChange: trustScoreChangeValue,
        rating: ratingValue,
      };

      if (followerGoalValue !== undefined) {
        payload.followerGoal = followerGoalValue;
      }

      if (ratingCountValue !== undefined) {
        payload.ratingCount = ratingCountValue;
      }

      await onSave(payload);
      setStatusMessage({ type: 'success', text: 'Metrics updated.' });
      setOpenPanel(null);
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

    const errors = {};
    const locationName = weatherDraft.locationName?.trim?.() ?? '';
    const latitudeInput = weatherDraft.latitude?.trim?.() ?? '';
    const longitudeInput = weatherDraft.longitude?.trim?.() ?? '';
    const hasLatitude = Boolean(latitudeInput);
    const hasLongitude = Boolean(longitudeInput);

    let latitudeValue = null;
    let longitudeValue = null;

    if (hasLatitude !== hasLongitude) {
      const message = 'Latitude and longitude must both be provided.';
      errors['weather.latitude'] = message;
      errors['weather.longitude'] = message;
    } else if (hasLatitude && hasLongitude) {
      const parsedLatitude = Number(latitudeInput);
      const parsedLongitude = Number(longitudeInput);

      if (Number.isNaN(parsedLatitude)) {
        errors['weather.latitude'] = 'Latitude must be a number.';
      } else if (parsedLatitude < -90 || parsedLatitude > 90) {
        errors['weather.latitude'] = 'Latitude must be between -90 and 90.';
      } else {
        latitudeValue = parsedLatitude;
      }

      if (Number.isNaN(parsedLongitude)) {
        errors['weather.longitude'] = 'Longitude must be a number.';
      } else if (parsedLongitude < -180 || parsedLongitude > 180) {
        errors['weather.longitude'] = 'Longitude must be between -180 and 180.';
      } else {
        longitudeValue = parsedLongitude;
      }
    }

    if (Object.keys(errors).length) {
      updateFormErrors(WEATHER_FIELD_KEYS, errors);
      setStatusMessage({ type: 'error', text: Object.values(errors)[0] });
      return;
    }

    updateFormErrors(WEATHER_FIELD_KEYS);

    try {
      await onSave({
        weather: {
          locationName: locationName || null,
          latitude: latitudeValue,
          longitude: longitudeValue,
          units: weatherDraft.units === 'imperial' ? 'imperial' : 'metric',
        },
      });
      setStatusMessage({ type: 'success', text: 'Weather preferences saved.' });
      setOpenPanel(null);
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
      id: editingWorkstreamId || createId(),
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
      id: editingScheduleId || createId(),
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

  const handleRelationshipSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) return;

    const errors = {};
    const retentionScoreInput = relationshipDraft.retentionScore?.trim?.() ?? '';
    let retentionScoreValue = null;
    if (retentionScoreInput) {
      const parsed = Number(retentionScoreInput);
      if (Number.isNaN(parsed)) {
        errors['relationship.retentionScore'] = 'Retention score must be a number.';
      } else if (parsed < 0 || parsed > 100) {
        errors['relationship.retentionScore'] = 'Retention score must be between 0 and 100.';
      } else {
        retentionScoreValue = parsed;
      }
    }

    const advocatesInput = relationshipDraft.advocacyInProgress?.trim?.() ?? '';
    let advocatesValue = null;
    if (advocatesInput) {
      const parsed = Number.parseInt(advocatesInput, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        errors['relationship.advocacyInProgress'] = 'Active advocates must be zero or more.';
      } else {
        advocatesValue = parsed;
      }
    }

    if (Object.keys(errors).length) {
      updateFormErrors(RELATIONSHIP_FIELD_KEYS, errors);
      setStatusMessage({ type: 'error', text: Object.values(errors)[0] });
      return;
    }

    updateFormErrors(RELATIONSHIP_FIELD_KEYS);

    try {
      await onSave({
        relationshipHealth: {
          retentionScore: retentionScoreValue,
          retentionStatus: relationshipDraft.retentionStatus?.trim() || null,
          retentionNotes: relationshipDraft.retentionNotes?.trim() || null,
          advocacyInProgress: advocatesValue,
          advocacyNotes: relationshipDraft.advocacyNotes?.trim() || null,
        },
      });
      setStatusMessage({ type: 'success', text: 'Client health updated.' });
      setOpenPanel(null);
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
                    Summary
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
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {statusMessage.text}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error.message ?? 'Unable to load overview data.'}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
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
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-slate-700">
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
            className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
      {renderMetricsDialog()}
      {renderWeatherDialog()}
      {renderWorkstreamDialog()}
      {renderScheduleDialog()}
      {renderRelationshipDialog()}
    </SectionShell>
  );

}
