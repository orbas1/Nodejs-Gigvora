import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  RocketLaunchIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';

const WIZARD_STEPS = [
  { key: 'type', label: 'Creation type' },
  { key: 'basics', label: 'Basics' },
  { key: 'details', label: 'Experience details' },
  { key: 'collaboration', label: 'Collaboration & assets' },
  { key: 'settings', label: 'Policies & automation' },
  { key: 'share', label: 'Publish & share' },
];

function StepLead({ title, tags = [] }) {
  const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {uniqueTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function buildTypeBadges(entry) {
  if (!entry) {
    return [];
  }
  const badges = new Set();
  if (entry.recommendedVisibility) {
    badges.add(titleCase(entry.recommendedVisibility));
  }
  const settings = entry.defaultSettings ?? {};
  if (settings.launchpadOnly) {
    badges.add('Launchpad');
  }
  if (settings.requiresBrief) {
    badges.add('Brief');
  }
  if (settings.allowMentors) {
    badges.add('Mentors');
  }
  if (settings.allowVendors) {
    badges.add('Vendors');
  }
  if (settings.rsvpRequired) {
    badges.add('RSVP');
  }
  if (settings.backgroundChecks) {
    badges.add('Verified');
  }
  if (settings.rituals?.length) {
    badges.add('Rituals');
  }
  if (settings.cohort?.required) {
    badges.add('Cohort');
  }
  if (settings.compensation?.type) {
    badges.add(titleCase(settings.compensation.type));
  }
  if (settings.budget) {
    badges.add('Budget');
  }
  return Array.from(badges).slice(0, 4);
}

function buildInitialState(item) {
  if (!item) {
    return {
      type: null,
      title: '',
      tagline: '',
      summary: '',
      tagsInput: '',
      heroImageUrl: '',
      locationLabel: '',
      locationMode: 'hybrid',
      scheduleStart: '',
      scheduleEnd: '',
      scheduleTimezone: '',
      scheduleCadence: '',
      scheduleRecurrence: '',
      registrationUrl: '',
      streamingUrl: '',
      externalLinksInput: '',
      hostsInput: '',
      mentorsInput: '',
      partnersInput: '',
      deliverablesInput: '',
      requirementsInput: '',
      agendaInput: '',
      shareTargets: [],
      shareMessage: '',
      launchAt: '',
      visibility: 'private',
      status: 'draft',
      capacity: '',
      budgetCurrency: 'USD',
      budgetMin: '',
      budgetMax: '',
      compensationType: 'salary',
      compensationCurrency: 'USD',
      compensationMin: '',
      compensationMax: '',
      allowMentors: false,
      allowVendors: false,
      requiresBrief: false,
      rsvpRequired: false,
      seoOptimised: false,
      launchpadOnly: false,
      allowPublicComments: true,
      autoReminders: true,
      applicationDeadline: '',
    };
  }

  const parseList = (value) => (Array.isArray(value) ? value.join('\n') : value ?? '');
  const parseTags = (value) => (Array.isArray(value) ? value.join(', ') : value ?? '');

  return {
    type: item.type ?? null,
    title: item.title ?? '',
    tagline: item.tagline ?? '',
    summary: item.summary ?? '',
    tagsInput: parseTags(item.tags),
    heroImageUrl: item.heroImageUrl ?? '',
    locationLabel: item.locationLabel ?? '',
    locationMode: item.locationMode ?? 'hybrid',
    scheduleStart: formatDateInput(item.schedule?.startDate ?? item.schedule?.startAt),
    scheduleEnd: formatDateInput(item.schedule?.endDate ?? item.schedule?.endAt),
    scheduleTimezone: item.schedule?.timezone ?? '',
    scheduleCadence: item.schedule?.cadence ?? '',
    scheduleRecurrence: item.schedule?.recurrence ?? '',
    registrationUrl: item.metadata?.registrationUrl ?? '',
    streamingUrl: item.metadata?.streamingUrl ?? '',
    externalLinksInput: parseList(item.metadata?.externalLinks),
    hostsInput: parseList(item.metadata?.hosts),
    mentorsInput: parseList(item.metadata?.mentors),
    partnersInput: parseList(item.metadata?.partners),
    deliverablesInput: parseList(item.metadata?.deliverables),
    requirementsInput: parseList(item.metadata?.requirements),
    agendaInput: parseList(item.metadata?.agenda),
    shareTargets: Array.isArray(item.shareTargets) ? item.shareTargets : [],
    shareMessage: item.shareMessage ?? '',
    launchAt: formatDateInput(item.launchAt),
    visibility: item.visibility ?? 'private',
    status: item.status ?? 'draft',
    capacity: item.settings?.capacity ?? '',
    budgetCurrency: item.settings?.budget?.currency ?? 'USD',
    budgetMin: item.settings?.budget?.minimum ?? '',
    budgetMax: item.settings?.budget?.maximum ?? '',
    compensationType: item.settings?.compensation?.type ?? 'salary',
    compensationCurrency: item.settings?.compensation?.currency ?? 'USD',
    compensationMin: item.settings?.compensation?.minimum ?? '',
    compensationMax: item.settings?.compensation?.maximum ?? '',
    allowMentors: Boolean(item.settings?.allowMentors),
    allowVendors: Boolean(item.settings?.allowVendors),
    requiresBrief: Boolean(item.settings?.requiresBrief),
    rsvpRequired: Boolean(item.settings?.rsvpRequired),
    seoOptimised: Boolean(item.settings?.seoOptimised),
    launchpadOnly: Boolean(item.settings?.launchpadOnly),
    allowPublicComments: item.settings?.allowPublicComments ?? true,
    autoReminders: item.settings?.autoReminders ?? true,
    applicationDeadline: formatDateInput(item.settings?.applicationDeadline),
  };
}

function formatDateInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function parseCommaList(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseMultiline(value) {
  if (!value) {
    return [];
  }
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatShareUrl(item) {
  if (!item?.shareSlug) {
    return null;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/launch/${item.shareSlug}`;
  }
  return `https://gigvora.com/launch/${item.shareSlug}`;
}

function buildStepMap(steps) {
  const map = new Map();
  (Array.isArray(steps) ? steps : []).forEach((step) => {
    map.set(step.stepKey, step);
  });
  return map;
}

function findInitialStepIndex(item) {
  if (!item) {
    return 0;
  }
  const map = buildStepMap(item.steps);
  const nextIndex = WIZARD_STEPS.findIndex((step, index) => {
    if (index === 0) {
      return false;
    }
    const record = map.get(step.key);
    return !record?.completed;
  });
  if (nextIndex === -1) {
    return WIZARD_STEPS.length - 1;
  }
  return Math.max(nextIndex, 1);
}

export default function CreationStudioWizard({
  catalog,
  shareDestinations,
  summary,
  activeItem,
  onCreateDraft,
  onUpdateDraft,
  onSaveStep,
  onShare,
  onSelectItem,
  onArchiveItem,
  onRefresh,
}) {
  const [localItem, setLocalItem] = useState(activeItem ?? null);
  const [formState, setFormState] = useState(() => buildInitialState(activeItem));
  const [activeStepIndex, setActiveStepIndex] = useState(() => findInitialStepIndex(activeItem));
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareState, setShareState] = useState({ saving: false, message: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    setLocalItem(activeItem ?? null);
    setFormState(buildInitialState(activeItem));
    setActiveStepIndex(findInitialStepIndex(activeItem));
    setShareState({ saving: false, message: null });
    setError(null);
  }, [activeItem?.id]);

  const stepMap = useMemo(() => buildStepMap(localItem?.steps), [localItem]);

  const activeStep = WIZARD_STEPS[activeStepIndex] ?? WIZARD_STEPS[0];
  const selectedCatalogEntry = useMemo(
    () => catalog.find((entry) => entry.type === (formState.type ?? localItem?.type)),
    [catalog, formState.type, localItem?.type],
  );

  const handleResetWizard = useCallback(() => {
    setLocalItem(null);
    setFormState(buildInitialState(null));
    setActiveStepIndex(0);
    setShareState({ saving: false, message: null });
    setError(null);
    if (typeof onSelectItem === 'function') {
      onSelectItem(null);
    }
  }, [onSelectItem]);

  const handleTypeSelect = (type) => {
    setFormState((previous) => ({ ...previous, type }));
  };

  const handleStartDraft = async (event) => {
    event.preventDefault();
    if (!formState.type) {
      setError('Select a creation type to continue.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const catalogEntry = catalog.find((entry) => entry.type === formState.type);
      const payload = {
        type: formState.type,
        title: formState.title?.trim() || `${catalogEntry?.label ?? 'Creation'} draft`,
        summary: formState.summary?.trim() || (catalogEntry?.summary?.slice(0, 120) ?? ''),
        tags: parseCommaList(formState.tagsInput),
        visibility: catalogEntry?.recommendedVisibility ?? 'private',
        status: 'draft',
      };
      const created = await onCreateDraft(payload);
      setLocalItem(created);
      setFormState(buildInitialState(created));
      setActiveStepIndex(findInitialStepIndex(created));
      if (typeof onSelectItem === 'function') {
        onSelectItem(created.id);
      }
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      setError(err.message || 'Unable to create draft.');
    } finally {
      setCreating(false);
    }
  };

  const handleFieldChange = (field) => (event) => {
    const value = event?.target?.type === 'checkbox' ? event.target.checked : event?.target?.value ?? event;
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const handleBasicsSubmit = async (event) => {
    event.preventDefault();
    if (!localItem) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: formState.title,
        tagline: formState.tagline,
        summary: formState.summary,
        heroImageUrl: formState.heroImageUrl,
        tags: parseCommaList(formState.tagsInput),
      };
      const updated = await onUpdateDraft(localItem.id, payload);
      setLocalItem(updated);
      await onSaveStep(localItem.id, 'basics', {
        data: payload,
        completed: true,
      });
      setActiveStepIndex((index) => Math.min(index + 1, WIZARD_STEPS.length - 1));
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      setError(err.message || 'Unable to save basics.');
    } finally {
      setSaving(false);
    }
  };

  const handleDetailsSubmit = async (event) => {
    event.preventDefault();
    if (!localItem) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const schedule = {
        ...localItem.schedule,
        startDate: toIso(formState.scheduleStart),
        endDate: toIso(formState.scheduleEnd),
        timezone: formState.scheduleTimezone || null,
        cadence: formState.scheduleCadence || null,
        recurrence: formState.scheduleRecurrence || null,
      };
      const metadata = {
        ...localItem.metadata,
        registrationUrl: formState.registrationUrl || null,
        streamingUrl: formState.streamingUrl || null,
        externalLinks: parseMultiline(formState.externalLinksInput),
        hosts: parseMultiline(formState.hostsInput),
        mentors: parseMultiline(formState.mentorsInput),
        partners: parseMultiline(formState.partnersInput),
        deliverables: parseMultiline(formState.deliverablesInput),
        requirements: parseMultiline(formState.requirementsInput),
        agenda: parseMultiline(formState.agendaInput),
      };
      const settings = {
        ...localItem.settings,
        capacity: formState.capacity ? Number(formState.capacity) : null,
        budget: {
          currency: formState.budgetCurrency || 'USD',
          minimum: formState.budgetMin !== '' ? Number(formState.budgetMin) : null,
          maximum: formState.budgetMax !== '' ? Number(formState.budgetMax) : null,
        },
        compensation: {
          type: formState.compensationType,
          currency: formState.compensationCurrency || 'USD',
          minimum: formState.compensationMin !== '' ? Number(formState.compensationMin) : null,
          maximum: formState.compensationMax !== '' ? Number(formState.compensationMax) : null,
        },
      };
      const payload = {
        locationLabel: formState.locationLabel,
        locationMode: formState.locationMode,
        schedule,
        metadata,
        settings,
      };
      const updated = await onUpdateDraft(localItem.id, payload);
      setLocalItem(updated);
      await onSaveStep(localItem.id, 'details', {
        data: payload,
        completed: true,
      });
      setActiveStepIndex((index) => Math.min(index + 1, WIZARD_STEPS.length - 1));
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      setError(err.message || 'Unable to save experience details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCollaborationSubmit = async (event) => {
    event.preventDefault();
    if (!localItem) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const metadata = {
        ...localItem.metadata,
        hosts: parseMultiline(formState.hostsInput),
        mentors: parseMultiline(formState.mentorsInput),
        partners: parseMultiline(formState.partnersInput),
        deliverables: parseMultiline(formState.deliverablesInput),
        requirements: parseMultiline(formState.requirementsInput),
        agenda: parseMultiline(formState.agendaInput),
        externalLinks: parseMultiline(formState.externalLinksInput),
        registrationUrl: formState.registrationUrl || null,
        streamingUrl: formState.streamingUrl || null,
      };
      const payload = { metadata };
      const updated = await onUpdateDraft(localItem.id, payload);
      setLocalItem(updated);
      await onSaveStep(localItem.id, 'collaboration', {
        data: metadata,
        completed: true,
      });
      setActiveStepIndex((index) => Math.min(index + 1, WIZARD_STEPS.length - 1));
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      setError(err.message || 'Unable to save collaboration details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    if (!localItem) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const settings = {
        ...localItem.settings,
        allowMentors: Boolean(formState.allowMentors),
        allowVendors: Boolean(formState.allowVendors),
        requiresBrief: Boolean(formState.requiresBrief),
        rsvpRequired: Boolean(formState.rsvpRequired),
        seoOptimised: Boolean(formState.seoOptimised),
        launchpadOnly: Boolean(formState.launchpadOnly),
        allowPublicComments: Boolean(formState.allowPublicComments),
        autoReminders: Boolean(formState.autoReminders),
        applicationDeadline: toIso(formState.applicationDeadline),
        capacity: formState.capacity ? Number(formState.capacity) : null,
        budget: {
          currency: formState.budgetCurrency || 'USD',
          minimum: formState.budgetMin !== '' ? Number(formState.budgetMin) : null,
          maximum: formState.budgetMax !== '' ? Number(formState.budgetMax) : null,
        },
        compensation: {
          type: formState.compensationType,
          currency: formState.compensationCurrency || 'USD',
          minimum: formState.compensationMin !== '' ? Number(formState.compensationMin) : null,
          maximum: formState.compensationMax !== '' ? Number(formState.compensationMax) : null,
        },
      };
      const payload = {
        settings,
        visibility: formState.visibility,
        status: formState.status,
      };
      const updated = await onUpdateDraft(localItem.id, payload);
      setLocalItem(updated);
      await onSaveStep(localItem.id, 'settings', {
        data: payload,
        completed: true,
      });
      setActiveStepIndex((index) => Math.min(index + 1, WIZARD_STEPS.length - 1));
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      setError(err.message || 'Unable to update policies and automation.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareSubmit = async (event) => {
    event.preventDefault();
    if (!localItem) {
      return;
    }
    setShareState({ saving: true, message: null });
    setError(null);
    try {
      const payload = {
        targets: formState.shareTargets,
        message: formState.shareMessage,
        visibility: formState.visibility,
        status: formState.status,
        launchAt: toIso(formState.launchAt) ?? new Date().toISOString(),
      };
      const updated = await onShare(localItem.id, payload);
      setLocalItem(updated);
      await onSaveStep(localItem.id, 'share', {
        data: payload,
        completed: true,
      });
      setShareState({ saving: false, message: 'Creation published and share settings saved.' });
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      setShareState({ saving: false, message: null });
      setError(err.message || 'Unable to publish creation.');
    }
  };

  const shareUrl = formatShareUrl(localItem);

  const stepStatus = useMemo(
    () =>
      WIZARD_STEPS.map((step) => ({
        ...step,
        completed: stepMap.get(step.key)?.completed ?? false,
      })),
    [stepMap],
  );

  const canNavigateToStep = (index) => {
    if (index === 0) {
      return true;
    }
    if (!localItem) {
      return false;
    }
    const previousStep = WIZARD_STEPS[index - 1];
    const previousRecord = stepMap.get(previousStep.key);
    return Boolean(previousRecord?.completed || index <= activeStepIndex);
  };

  const handleStepNavigation = (index) => {
    if (!canNavigateToStep(index)) {
      return;
    }
    setActiveStepIndex(index);
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareState((previous) => ({ ...previous, message: 'Share link copied to clipboard.' }));
    } catch (err) {
      setShareState((previous) => ({ ...previous, message: err.message || 'Unable to copy link.' }));
    }
  };

  const renderStepNavigation = () => (
    <ol className="flex flex-wrap gap-2">
      {stepStatus.map((step, index) => {
        const isActive = index === activeStepIndex;
        const isComplete = step.completed;
        const Icon = isComplete ? CheckCircleIcon : Squares2X2Icon;
        return (
          <li key={step.key}>
            <button
              type="button"
              onClick={() => handleStepNavigation(index)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                isActive
                  ? 'border-accent bg-accentSoft/60 text-accent'
                  : isComplete
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : canNavigateToStep(index)
                      ? 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:text-accent'
                      : 'border-slate-200 bg-slate-100 text-slate-400'
              }`}
              disabled={!canNavigateToStep(index)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {step.label}
            </button>
          </li>
        );
      })}
    </ol>
  );

  const renderTypeStep = () => {
    const totalTemplates = Array.isArray(catalog) ? catalog.length : 0;
    return (
      <form className="space-y-6" onSubmit={handleStartDraft}>
        <StepLead title="Choose a template" tags={[`Total ${totalTemplates}`]} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.map((entry) => {
          const selected = formState.type === entry.type;
          const badges = buildTypeBadges(entry);
          return (
            <button
              key={entry.type}
              type="button"
              onClick={() => handleTypeSelect(entry.type)}
              className={`flex h-full flex-col rounded-3xl border p-5 text-left transition ${
                selected ? 'border-accent bg-accentSoft/70 shadow-sm' : 'border-slate-200 bg-white hover:border-accent/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                {selected ? <SparklesIcon className="h-5 w-5 text-accent" aria-hidden="true" /> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={`${entry.type}-${badge}`}
                    className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Working title</span>
          <input
            type="text"
            value={formState.title}
            onChange={handleFieldChange('title')}
            placeholder="e.g. Product growth sprint"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Tags</span>
          <input
            type="text"
            value={formState.tagsInput}
            onChange={handleFieldChange('tagsInput')}
            placeholder="gigs, product, launchpad"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="space-y-2 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">One-line summary</span>
        <textarea
          value={formState.summary}
          onChange={handleFieldChange('summary')}
          rows={3}
          placeholder="Explain the outcome, collaborators, or experience in one paragraph."
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!formState.type || creating}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RocketLaunchIcon className="h-4 w-4" aria-hidden="true" />
          Continue
        </button>
      </div>
      </form>
    );
  };

  const renderBasicsStep = () => (
    <form className="space-y-6" onSubmit={handleBasicsSubmit}>
      <StepLead title="Basics" tags={['Info', 'Media']} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Title</span>
          <input
            type="text"
            required
            value={formState.title}
            onChange={handleFieldChange('title')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Tagline</span>
          <input
            type="text"
            value={formState.tagline}
            onChange={handleFieldChange('tagline')}
            placeholder="Short supporting statement"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="space-y-2 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">Summary</span>
        <textarea
          required
          value={formState.summary}
          onChange={handleFieldChange('summary')}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Tags</span>
          <input
            type="text"
            value={formState.tagsInput}
            onChange={handleFieldChange('tagsInput')}
            placeholder="marketing, mentorship, paid"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Hero image URL</span>
          <input
            type="url"
            value={formState.heroImageUrl}
            onChange={handleFieldChange('heroImageUrl')}
            placeholder="https://"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveStepIndex((index) => Math.max(index - 1, 0))}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save & continue
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const renderDetailsStep = () => (
    <form className="space-y-6" onSubmit={handleDetailsSubmit}>
      <StepLead title="Details" tags={['Schedule', 'Location']} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Location label</span>
          <input
            type="text"
            value={formState.locationLabel}
            onChange={handleFieldChange('locationLabel')}
            placeholder="Hybrid · Remote Europe"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Location mode</span>
          <select
            value={formState.locationMode}
            onChange={handleFieldChange('locationMode')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          >
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="in_person">In person</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Start</span>
          <input
            type="datetime-local"
            value={formState.scheduleStart}
            onChange={handleFieldChange('scheduleStart')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">End</span>
          <input
            type="datetime-local"
            value={formState.scheduleEnd}
            onChange={handleFieldChange('scheduleEnd')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Timezone</span>
          <input
            type="text"
            value={formState.scheduleTimezone}
            onChange={handleFieldChange('scheduleTimezone')}
            placeholder="UTC, PST, CET"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Cadence</span>
          <input
            type="text"
            value={formState.scheduleCadence}
            onChange={handleFieldChange('scheduleCadence')}
            placeholder="Weekly sprints"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Recurrence</span>
          <input
            type="text"
            value={formState.scheduleRecurrence}
            onChange={handleFieldChange('scheduleRecurrence')}
            placeholder="Bi-weekly"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Registration URL</span>
          <input
            type="url"
            value={formState.registrationUrl}
            onChange={handleFieldChange('registrationUrl')}
            placeholder="https://"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Streaming / call URL</span>
          <input
            type="url"
            value={formState.streamingUrl}
            onChange={handleFieldChange('streamingUrl')}
            placeholder="https://"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Capacity</span>
          <input
            type="number"
            min="0"
            value={formState.capacity}
            onChange={handleFieldChange('capacity')}
            placeholder="100"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Budget minimum</span>
          <input
            type="number"
            min="0"
            value={formState.budgetMin}
            onChange={handleFieldChange('budgetMin')}
            placeholder="0"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Budget maximum</span>
          <input
            type="number"
            min="0"
            value={formState.budgetMax}
            onChange={handleFieldChange('budgetMax')}
            placeholder="10000"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Budget currency</span>
          <input
            type="text"
            value={formState.budgetCurrency}
            onChange={handleFieldChange('budgetCurrency')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Compensation minimum</span>
          <input
            type="number"
            value={formState.compensationMin}
            onChange={handleFieldChange('compensationMin')}
            placeholder="50000"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Compensation maximum</span>
          <input
            type="number"
            value={formState.compensationMax}
            onChange={handleFieldChange('compensationMax')}
            placeholder="90000"
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Compensation type</span>
          <select
            value={formState.compensationType}
            onChange={handleFieldChange('compensationType')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          >
            <option value="salary">Salary</option>
            <option value="hourly">Hourly</option>
            <option value="stipend">Stipend</option>
            <option value="volunteer">Volunteer</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Compensation currency</span>
          <input
            type="text"
            value={formState.compensationCurrency}
            onChange={handleFieldChange('compensationCurrency')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveStepIndex((index) => Math.max(index - 1, 0))}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save & continue
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const renderCollaborationStep = () => (
    <form className="space-y-6" onSubmit={handleCollaborationSubmit}>
      <StepLead title="Team" tags={['People', 'Assets']} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Hosts</span>
          <textarea
            value={formState.hostsInput}
            onChange={handleFieldChange('hostsInput')}
            rows={3}
            placeholder="One per line"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Mentors & facilitators</span>
          <textarea
            value={formState.mentorsInput}
            onChange={handleFieldChange('mentorsInput')}
            rows={3}
            placeholder="One per line"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Partners & sponsors</span>
          <textarea
            value={formState.partnersInput}
            onChange={handleFieldChange('partnersInput')}
            rows={3}
            placeholder="One per line"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Deliverables</span>
          <textarea
            value={formState.deliverablesInput}
            onChange={handleFieldChange('deliverablesInput')}
            rows={3}
            placeholder="One per line"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Participant requirements</span>
          <textarea
            value={formState.requirementsInput}
            onChange={handleFieldChange('requirementsInput')}
            rows={3}
            placeholder="One per line"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Agenda / flow</span>
          <textarea
            value={formState.agendaInput}
            onChange={handleFieldChange('agendaInput')}
            rows={3}
            placeholder="One per line"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="space-y-2 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">Reference links</span>
        <textarea
          value={formState.externalLinksInput}
          onChange={handleFieldChange('externalLinksInput')}
          rows={3}
          placeholder="Paste URLs on separate lines"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveStepIndex((index) => Math.max(index - 1, 0))}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save & continue
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const renderSettingsStep = () => (
    <form className="space-y-6" onSubmit={handleSettingsSubmit}>
      <StepLead title="Settings" tags={['Controls', 'Automation']} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" checked={formState.requiresBrief} onChange={handleFieldChange('requiresBrief')} />
          Require a scoped brief
        </label>
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" checked={formState.allowMentors} onChange={handleFieldChange('allowMentors')} />
          Allow mentors & advisors
        </label>
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" checked={formState.allowVendors} onChange={handleFieldChange('allowVendors')} />
          Allow vendor collaboration
        </label>
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" checked={formState.rsvpRequired} onChange={handleFieldChange('rsvpRequired')} />
          Require RSVP / ticketing
        </label>
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" checked={formState.seoOptimised} onChange={handleFieldChange('seoOptimised')} />
          Enable SEO optimisation
        </label>
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" checked={formState.launchpadOnly} onChange={handleFieldChange('launchpadOnly')} />
          Launchpad cohort only
        </label>
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" checked={formState.allowPublicComments} onChange={handleFieldChange('allowPublicComments')} />
          Allow public comments
        </label>
        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" checked={formState.autoReminders} onChange={handleFieldChange('autoReminders')} />
          Enable automatic reminders
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Visibility</span>
          <select
            value={formState.visibility}
            onChange={handleFieldChange('visibility')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          >
            <option value="private">Private</option>
            <option value="connections">Connections</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Status</span>
          <select
            value={formState.status}
            onChange={handleFieldChange('status')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Application deadline</span>
          <input
            type="datetime-local"
            value={formState.applicationDeadline}
            onChange={handleFieldChange('applicationDeadline')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveStepIndex((index) => Math.max(index - 1, 0))}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save & continue
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );

  const renderShareStep = () => (
    <form className="space-y-6" onSubmit={handleShareSubmit}>
      <StepLead title="Share" tags={['Launch', 'Distribution']} />
      <div className="grid gap-3 md:grid-cols-2">
        {shareDestinations.map((destination) => {
          const checked = formState.shareTargets.includes(destination.id);
          return (
            <label
              key={destination.id}
              className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                checked ? 'border-accent bg-accentSoft/70 text-accent' : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  const next = new Set(formState.shareTargets);
                  if (event.target.checked) {
                    next.add(destination.id);
                  } else {
                    next.delete(destination.id);
                  }
                  setFormState((previous) => ({ ...previous, shareTargets: Array.from(next) }));
                }}
              />
              {destination.label}
            </label>
          );
        })}
      </div>
      <label className="space-y-2 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">Launch announcement</span>
        <textarea
          value={formState.shareMessage}
          onChange={handleFieldChange('shareMessage')}
          rows={4}
          placeholder="Tell the community what you are launching and who should join."
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:border-accent focus:outline-none"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Launch at</span>
          <input
            type="datetime-local"
            value={formState.launchAt}
            onChange={handleFieldChange('launchAt')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Status</span>
          <select
            value={formState.status}
            onChange={handleFieldChange('status')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Visibility</span>
          <select
            value={formState.visibility}
            onChange={handleFieldChange('visibility')}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-accent focus:outline-none"
          >
            <option value="private">Private</option>
            <option value="connections">Connections</option>
            <option value="public">Public</option>
          </select>
        </label>
      </div>
      {shareUrl ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Shareable link</p>
          <p className="mt-1 break-all text-xs text-slate-500">{shareUrl}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
            >
              Copy link
            </button>
            <Link
              to={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
            >
              Preview
            </Link>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {shareState.message ? <p className="text-sm text-emerald-600">{shareState.message}</p> : null}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveStepIndex((index) => Math.max(index - 1, 0))}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          type="submit"
          disabled={shareState.saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Publish & share
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-accent">Guided creation studio</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {localItem?.title || selectedCatalogEntry?.label || 'New creation wizard'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Launch projects, gigs, jobs, volunteering missions, networking sessions, groups, pages, ads, blog posts, and events
            with mentor-ready scaffolding, automation policies, and share controls.
          </p>
        </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
          <p>Total creations {summary?.total ?? 0}</p>
          <p>Drafts {summary?.drafts ?? 0} · Published {summary?.published ?? 0}</p>
        </div>
        {localItem ? (
          <button
            type="button"
            onClick={() => onArchiveItem?.(localItem.id)}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
          >
            Archive
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleResetWizard}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/40 hover:text-accent"
          >
            Reset wizard
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-inner">
        {renderStepNavigation()}
        <div className="mt-6">
          {activeStep.key === 'type' && renderTypeStep()}
          {activeStep.key === 'basics' && renderBasicsStep()}
          {activeStep.key === 'details' && renderDetailsStep()}
          {activeStep.key === 'collaboration' && renderCollaborationStep()}
          {activeStep.key === 'settings' && renderSettingsStep()}
          {activeStep.key === 'share' && renderShareStep()}
        </div>
      </div>

      {localItem ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              <span>
                Last updated {localItem.updatedAt ? formatRelativeTime(localItem.updatedAt) : 'just now'} · Status {titleCase(localItem.status)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Share slug</span>
              <code className="rounded bg-white/80 px-2 py-1 text-[11px] text-slate-600">{localItem.shareSlug || 'pending'}</code>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

CreationStudioWizard.propTypes = {
  catalog: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string,
      summary: PropTypes.string,
      recommendedVisibility: PropTypes.string,
    }),
  ),
  shareDestinations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  summary: PropTypes.shape({
    total: PropTypes.number,
    drafts: PropTypes.number,
    published: PropTypes.number,
  }),
  activeItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    title: PropTypes.string,
  }),
  onCreateDraft: PropTypes.func.isRequired,
  onUpdateDraft: PropTypes.func.isRequired,
  onSaveStep: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onSelectItem: PropTypes.func,
  onArchiveItem: PropTypes.func,
  onRefresh: PropTypes.func,
};

CreationStudioWizard.defaultProps = {
  catalog: [],
  shareDestinations: [],
  summary: {},
  activeItem: null,
  onSelectItem: undefined,
  onArchiveItem: undefined,
  onRefresh: undefined,
};

function titleCase(value) {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .split(/[_\s-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
