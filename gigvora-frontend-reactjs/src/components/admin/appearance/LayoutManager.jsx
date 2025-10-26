import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  CursorArrowRaysIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const PAGE_OPTIONS = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'auth', label: 'Auth' },
  { value: 'admin', label: 'Admin' },
  { value: 'support', label: 'Support' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const ROLE_OPTIONS = ['admin', 'manager', 'editor', 'viewer'];

const SEGMENT_OPTIONS = ['prospects', 'clients', 'partners', 'internal', 'beta'];

function formatDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offsetMinutes = date.getTimezoneOffset();
  const localTime = new Date(date.getTime() - offsetMinutes * 60000);
  return localTime.toISOString().slice(0, 16);
}

const DEVICE_PREVIEW_OPTIONS = [
  { id: 'desktop', label: 'Desktop', icon: ComputerDesktopIcon, className: 'h-64 w-full rounded-3xl' },
  { id: 'tablet', label: 'Tablet', icon: GlobeAltIcon, className: 'h-64 w-[420px] rounded-[32px]' },
  { id: 'mobile', label: 'Mobile', icon: DevicePhoneMobileIcon, className: 'h-64 w-[280px] rounded-[38px]' },
];

const LAYOUT_TEMPLATES = [
  {
    id: 'conversion-showcase',
    name: 'Conversion showcase',
    persona: 'Prospects',
    description: 'Hero spotlight, proof wall, and decisive CTA loop for high-intent visitors.',
    lift: '+18% projected',
    config: {
      persona: 'prospects',
      sections: [
        {
          id: 'hero-spotlight',
          type: 'hero',
          title: 'Hero spotlight',
          description: 'Full bleed hero with realtime metrics and CTA split test.',
          ctas: [
            { label: 'Book intro call', href: '#contact' },
            { label: 'View credentials', href: '#proof' },
          ],
          widgets: ['metric-glance'],
        },
        {
          id: 'social-proof',
          type: 'proof',
          title: 'Social proof carousel',
          description: 'Rotating testimonials and client logos with sentiment scores.',
          ctas: [{ label: 'Read case studies', href: '#case-studies' }],
          widgets: ['testimonial-slider', 'logo-grid'],
        },
        {
          id: 'conversion-ladder',
          type: 'cta',
          title: 'Conversion ladder',
          description: 'Tiered CTA modules for immediate booking or asynchronous follow up.',
          ctas: [
            { label: 'Schedule strategy session', href: '#booking' },
            { label: 'Download capability deck', href: '#resources' },
          ],
          widgets: ['lead-capture'],
        },
      ],
    },
  },
  {
    id: 'community-hub',
    name: 'Community hub',
    persona: 'Members',
    description: 'Editorial storytelling, upcoming events, and learning loops.',
    lift: '+12% retention',
    config: {
      persona: 'community',
      sections: [
        {
          id: 'story-feed',
          type: 'content',
          title: 'Story feed',
          description: 'Curated playlists anchored by creator spotlights.',
          ctas: [{ label: 'Explore series', href: '#series' }],
          widgets: ['content-feed'],
        },
        {
          id: 'event-radar',
          type: 'events',
          title: 'Event radar',
          description: 'Live workshops, AMAs, and meetups with RSVP tracking.',
          ctas: [{ label: 'Save your seat', href: '#events' }],
          widgets: ['event-list'],
        },
        {
          id: 'learning-paths',
          type: 'learning',
          title: 'Learning paths',
          description: 'Modular certification journeys and progress trackers.',
          ctas: [{ label: 'Start course', href: '#academy' }],
          widgets: ['progress-meter'],
        },
      ],
    },
  },
  {
    id: 'product-launch',
    name: 'Product launch',
    persona: 'Clients & partners',
    description: 'Roadmap teasers, feature walk-throughs, and upgrade prompts.',
    lift: '+9% upsell',
    config: {
      persona: 'clients',
      sections: [
        {
          id: 'release-notes',
          type: 'updates',
          title: 'Latest release notes',
          description: 'Animated changelog with status badges and timeline.',
          ctas: [{ label: 'View full changelog', href: '#releases' }],
          widgets: ['changelog'],
        },
        {
          id: 'feature-tour',
          type: 'feature',
          title: 'Feature tour',
          description: 'Side-by-side comparisons and micro-demo overlays.',
          ctas: [{ label: 'Launch interactive tour', href: '#tour' }],
          widgets: ['video-tour'],
        },
        {
          id: 'upgrade-path',
          type: 'pricing',
          title: 'Upgrade path',
          description: 'Plan comparison, ROI calculator, and concierge CTA.',
          ctas: [{ label: 'Chat with success team', href: '#contact' }],
          widgets: ['pricing-table'],
        },
      ],
    },
  },
];

const SECTION_LIBRARY = [
  {
    id: 'hero-spotlight',
    title: 'Hero spotlight',
    description: 'Full-width hero with realtime KPI badge and dual CTAs.',
    template: LAYOUT_TEMPLATES[0].config.sections[0],
  },
  {
    id: 'proof-rail',
    title: 'Proof rail',
    description: 'Testimonials, client logos, and quantified outcomes.',
    template: LAYOUT_TEMPLATES[0].config.sections[1],
  },
  {
    id: 'event-radar',
    title: 'Event radar',
    description: 'Upcoming events with RSVP conversion tracking.',
    template: LAYOUT_TEMPLATES[1].config.sections[1],
  },
  {
    id: 'learning-paths',
    title: 'Learning paths',
    description: 'Modular curriculum cards with completion metrics.',
    template: LAYOUT_TEMPLATES[1].config.sections[2],
  },
  {
    id: 'upgrade-path',
    title: 'Upgrade path',
    description: 'Pricing comparison with ROI calculator widget.',
    template: LAYOUT_TEMPLATES[2].config.sections[2],
  },
];

function buildLayoutDraft(layout) {
  return {
    id: layout?.id ?? '',
    name: layout?.name ?? '',
    slug: layout?.slug ?? '',
    page: layout?.page ?? 'marketing',
    status: layout?.status ?? 'draft',
    themeId: layout?.themeId ?? '',
    version: layout?.version ?? 1,
    allowedRoles: Array.isArray(layout?.allowedRoles) ? layout.allowedRoles : [],
    config: stringifyConfig(layout?.config ?? { sections: [] }),
    releaseNotes: layout?.releaseNotes ?? '',
    audienceSegments: Array.isArray(layout?.audienceSegments) ? layout.audienceSegments : [],
    experimentKey: layout?.experimentKey ?? '',
    scheduledLaunch: formatDateTimeLocal(layout?.scheduledLaunch),
    analytics: {
      conversionLift: layout?.analytics?.conversionLift ?? null,
      sampleSize: layout?.analytics?.sampleSize ?? null,
    },
  };
}

function stringifyConfig(config) {
  return JSON.stringify(config ?? { sections: [] }, null, 2);
}

function cloneSection(section) {
  if (typeof structuredClone === 'function') {
    return structuredClone(section);
  }
  return JSON.parse(JSON.stringify(section));
}

function LayoutWizard({ open, onClose, onSubmit, initialLayout, themes, saving }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => buildLayoutDraft(initialLayout));
  const [error, setError] = useState('');
  const [previewDevice, setPreviewDevice] = useState('desktop');

  const parsedConfig = useMemo(() => {
    try {
      return JSON.parse(draft.config || '{}');
    } catch (parseError) {
      return null;
    }
  }, [draft.config]);

  const previewSections = useMemo(() => {
    if (!parsedConfig || !Array.isArray(parsedConfig.sections)) {
      return [];
    }
    return parsedConfig.sections.slice(0, 6);
  }, [parsedConfig]);

  const previewStats = useMemo(() => {
    const sectionCount = previewSections.length;
    const ctaCount = previewSections.reduce(
      (count, section) => count + (Array.isArray(section?.ctas) ? section.ctas.length : 0),
      0,
    );
    const widgetCount = previewSections.reduce(
      (count, section) => count + (Array.isArray(section?.widgets) ? section.widgets.length : 0),
      0,
    );
    return { sectionCount, ctaCount, widgetCount };
  }, [previewSections]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(buildLayoutDraft(initialLayout));
    setStep(0);
    setError('');
    setPreviewDevice('desktop');
  }, [initialLayout, open]);

  const applyConfig = (config) => {
    setDraft((current) => ({ ...current, config: stringifyConfig(config) }));
  };

  const handleApplyTemplate = (template) => {
    setDraft((current) => ({
      ...current,
      name: current.name || template.name,
      slug: current.slug || template.id,
      page: current.page || 'marketing',
      releaseNotes: current.releaseNotes || `${template.name} baseline ready for QA review.`,
      config: stringifyConfig(template.config),
    }));
    setStep(1);
    setError('');
  };

  const handleAddSection = (libraryItem) => {
    if (!parsedConfig) {
      setError('Provide valid JSON before adding sections from the library.');
      return;
    }
    const existingSections = Array.isArray(parsedConfig.sections) ? [...parsedConfig.sections] : [];
    const cloned = cloneSection(libraryItem.template);
    cloned.id = `${libraryItem.id}-${Date.now()}`;
    const nextConfig = { ...parsedConfig, sections: [...existingSections, cloned] };
    setError('');
    applyConfig(nextConfig);
  };

  const handleReorderSection = (index, direction) => {
    if (!parsedConfig?.sections || !Array.isArray(parsedConfig.sections)) {
      return;
    }
    const sections = [...parsedConfig.sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) {
      return;
    }
    const [moved] = sections.splice(index, 1);
    sections.splice(targetIndex, 0, moved);
    const nextConfig = { ...parsedConfig, sections };
    applyConfig(nextConfig);
  };

  const handleRemoveSection = (index) => {
    if (!parsedConfig?.sections || !Array.isArray(parsedConfig.sections)) {
      return;
    }
    const nextConfig = {
      ...parsedConfig,
      sections: parsedConfig.sections.filter((_, sectionIndex) => sectionIndex !== index),
    };
    applyConfig(nextConfig);
  };

  const toggleRole = (role) => {
    setDraft((current) => {
      const currentRoles = current.allowedRoles ?? [];
      if (currentRoles.includes(role)) {
        return { ...current, allowedRoles: currentRoles.filter((item) => item !== role) };
      }
      return { ...current, allowedRoles: [...currentRoles, role] };
    });
  };

  const toggleSegment = (segment) => {
    setDraft((current) => {
      const currentSegments = Array.isArray(current.audienceSegments) ? current.audienceSegments : [];
      if (currentSegments.includes(segment)) {
        return { ...current, audienceSegments: currentSegments.filter((item) => item !== segment) };
      }
      return { ...current, audienceSegments: [...currentSegments, segment] };
    });
  };

  const handleNext = () => {
    if (!draft.name || !draft.slug) {
      setError('Name and key are required.');
      return;
    }
    setError('');
    setStep(1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!parsedConfig) {
      setError('Layout config must be valid JSON.');
      return;
    }
    let scheduledLaunchIso = null;
    if (draft.scheduledLaunch) {
      const scheduledDate = new Date(draft.scheduledLaunch);
      if (Number.isNaN(scheduledDate.getTime())) {
        setError('Target launch must be a valid date and time.');
        return;
      }
      scheduledLaunchIso = scheduledDate.toISOString();
    }

    setError('');
    onSubmit({
      ...draft,
      config: parsedConfig,
      version: Number(draft.version) || 1,
      scheduledLaunch: scheduledLaunchIso,
      analytics: {
        conversionLift:
          draft.analytics?.conversionLift === null || draft.analytics?.conversionLift === ''
            ? null
            : Number(draft.analytics.conversionLift),
        sampleSize:
          draft.analytics?.sampleSize === null || draft.analytics?.sampleSize === ''
            ? null
            : Number(draft.analytics.sampleSize),
      },
    });
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={saving ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6 p-8">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      {draft.id ? 'Edit layout' : 'New layout'}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <span className={`rounded-full px-3 py-1 ${step === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      Details
                    </span>
                    <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      Layout JSON
                    </span>
                  </div>

                  {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

                  {step === 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Name</span>
                        <input
                          type="text"
                          required
                          value={draft.name}
                          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Key</span>
                        <input
                          type="text"
                          required
                          value={draft.slug}
                          onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Page</span>
                        <select
                          value={draft.page}
                          onChange={(event) => setDraft((current) => ({ ...current, page: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          {PAGE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Theme</span>
                        <select
                          value={draft.themeId}
                          onChange={(event) => setDraft((current) => ({ ...current, themeId: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          <option value="">None</option>
                          {themes.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                              {theme.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Status</span>
                        <select
                          value={draft.status}
                          onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Version</span>
                        <input
                          type="number"
                          min="1"
                          value={draft.version}
                          onChange={(event) => setDraft((current) => ({ ...current, version: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Experiment key</span>
                        <input
                          type="text"
                          value={draft.experimentKey}
                          onChange={(event) => setDraft((current) => ({ ...current, experimentKey: event.target.value }))}
                          placeholder="homepage.hero.v3"
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Target launch</span>
                        <input
                          type="datetime-local"
                          value={draft.scheduledLaunch || ''}
                          onChange={(event) => setDraft((current) => ({ ...current, scheduledLaunch: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <label className="space-y-2 sm:col-span-2">
                        <span className="text-sm font-medium text-slate-700">Release notes</span>
                        <textarea
                          rows={3}
                          value={draft.releaseNotes}
                          onChange={(event) => setDraft((current) => ({ ...current, releaseNotes: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-slate-700">Roles</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {ROLE_OPTIONS.map((role) => {
                              const active = draft.allowedRoles.includes(role);
                              return (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => toggleRole(role)}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                    active
                                      ? 'border-sky-500 bg-sky-100 text-sky-700'
                                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                  }`}
                                >
                                  {role}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">Audience segments</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {SEGMENT_OPTIONS.map((segment) => {
                              const active = draft.audienceSegments.includes(segment);
                              return (
                                <button
                                  key={segment}
                                  type="button"
                                  onClick={() => toggleSegment(segment)}
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                                    active
                                      ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                  }`}
                                >
                                  {segment}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="sm:col-span-2 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Persona templates</p>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                            New
                          </span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          {LAYOUT_TEMPLATES.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => handleApplyTemplate(template)}
                              disabled={saving}
                              className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <span className="text-sm font-semibold text-slate-900">{template.name}</span>
                              <span className="text-xs text-slate-500">{template.description}</span>
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                {template.persona} • {template.lift}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Projected conversion lift (%)</span>
                          <input
                            type="number"
                            step="0.1"
                            value={draft.analytics?.conversionLift ?? ''}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                analytics: {
                                  ...current.analytics,
                                  conversionLift: event.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Sample size</span>
                          <input
                            type="number"
                            min="0"
                            value={draft.analytics?.sampleSize ?? ''}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                analytics: {
                                  ...current.analytics,
                                  sampleSize: event.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Layout config</span>
                        <textarea
                          rows={14}
                          value={draft.config}
                          onChange={(event) => setDraft((current) => ({ ...current, config: event.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </label>
                      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience preview</p>
                          <div className="flex gap-2">
                            {DEVICE_PREVIEW_OPTIONS.map((option) => {
                              const Icon = option.icon;
                              const isActive = previewDevice === option.id;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => setPreviewDevice(option.id)}
                                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                                    isActive
                                      ? 'border-slate-900 bg-slate-900 text-white'
                                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {parsedConfig ? null : (
                          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-600">
                            Provide valid JSON to unlock the interactive preview and quality checks.
                          </p>
                        )}
                        <div className="flex w-full justify-center">
                          {(() => {
                            const deviceConfig =
                              DEVICE_PREVIEW_OPTIONS.find((option) => option.id === previewDevice) ?? DEVICE_PREVIEW_OPTIONS[0];
                            return (
                              <div
                                className={`${deviceConfig.className} overflow-hidden border border-slate-200 bg-white shadow-lg`}
                              >
                                <div className="bg-slate-900 p-4 text-white">
                                  <p className="text-sm font-semibold">{draft.name || 'Untitled layout'}</p>
                                  <p className="text-xs text-white/70">{draft.page} • {draft.status}</p>
                                </div>
                                <div className="flex flex-col gap-3 p-4">
                                  {previewSections.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                                      Define sections in your JSON to preview the layout structure.
                                    </div>
                                  ) : (
                                    previewSections.map((section, index) => (
                                      <div
                                        key={section?.id ?? `${section?.type ?? 'section'}-${index}`}
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                                      >
                                        <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                          <div className="flex flex-col">
                                            <span>{section?.title ?? section?.type ?? `Section ${index + 1}`}</span>
                                            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                              {section?.type ?? 'custom'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                              {(section?.ctas?.length ?? 0)} CTA{(section?.ctas?.length ?? 0) === 1 ? '' : 's'}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleReorderSection(index, -1)}
                                              disabled={index === 0}
                                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                                              aria-label="Move section up"
                                            >
                                              <ArrowUpIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleReorderSection(index, 1)}
                                              disabled={index === previewSections.length - 1}
                                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                                              aria-label="Move section down"
                                            >
                                              <ArrowDownIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveSection(index)}
                                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-red-500 hover:border-red-200 hover:bg-red-50"
                                              aria-label="Remove section"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                        {section?.description ? (
                                          <p className="mt-2 text-xs text-slate-500">{section.description}</p>
                                        ) : null}
                                        {section?.widgets?.length ? (
                                          <p className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">
                                            Widgets: {section.widgets.join(', ')}
                                          </p>
                                        ) : null}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quality checks</p>
                          <ul className="mt-2 space-y-1">
                            <li className="flex items-center justify-between">
                              <span>Sections configured</span>
                              <span className="font-semibold text-slate-900">{previewStats.sectionCount}</span>
                            </li>
                            <li className="flex items-center justify-between">
                              <span>Calls to action</span>
                              <span className="font-semibold text-slate-900">{previewStats.ctaCount}</span>
                            </li>
                            <li className="flex items-center justify-between">
                              <span>Widgets & embeds</span>
                              <span className="font-semibold text-slate-900">{previewStats.widgetCount}</span>
                            </li>
                            <li className="flex items-center justify-between">
                              <span>Projected lift</span>
                              <span className="font-semibold text-emerald-600">
                                {draft.analytics?.conversionLift ? `${draft.analytics.conversionLift}%` : '—'}
                              </span>
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section library</p>
                          <div className="space-y-2">
                            {SECTION_LIBRARY.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleAddSection(item)}
                                disabled={!parsedConfig}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                                <span className="mt-1 block text-[11px] text-slate-500">{item.description}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={step === 0 ? onClose : () => setStep(0)}
                      disabled={saving}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    >
                      {step === 0 ? 'Cancel' : 'Back'}
                    </button>
                    {step === 0 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                      >
                        <CursorArrowRaysIcon className="h-4 w-4" />
                        <span>Next</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:cursor-wait disabled:bg-sky-400"
                      >
                        {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function LayoutRow({ layout, onEdit, onPublish, onRemove, disabled }) {
  const scheduleLabel = (() => {
    if (!layout.scheduledLaunch) {
      return null;
    }
    const date = new Date(layout.scheduledLaunch);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  })();

  const conversionLiftLabel = Number.isFinite(Number(layout.analytics?.conversionLift))
    ? `${Number(layout.analytics.conversionLift).toFixed(1)}%`
    : null;

  return (
    <tr className="border-b border-slate-100 last:border-none">
      <td className="px-4 py-4">
        <div className="font-semibold text-slate-900">{layout.name}</div>
        <div className="text-xs text-slate-500">{layout.slug}</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {Array.isArray(layout.audienceSegments) && layout.audienceSegments.length ? (
            layout.audienceSegments.map((segment) => (
              <span
                key={segment}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
              >
                {segment}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">All visitors</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">{layout.page}</td>
      <td className="px-4 py-4 text-sm text-slate-600">
        <div className="font-medium text-slate-700">{layout.status}</div>
        {scheduleLabel ? <div className="text-xs text-slate-400">Launch {scheduleLabel}</div> : null}
      </td>
      <td className="px-4 py-4 text-sm text-slate-600">v{layout.version}</td>
      <td className="px-4 py-4 text-sm text-slate-600">
        <div>{layout.theme?.name ?? '—'}</div>
        {conversionLiftLabel ? (
          <div className="text-xs text-emerald-600">Lift {conversionLiftLabel}</div>
        ) : null}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(layout)}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
          >
            <PencilSquareIcon className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onPublish(layout)}
            disabled={disabled || layout.status === 'published'}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50"
          >
            <CheckCircleIcon className="h-4 w-4" />
            <span>Publish</span>
          </button>
          <button
            type="button"
            onClick={() => onRemove(layout)}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600 hover:border-red-300 hover:text-red-700 disabled:opacity-50"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function LayoutManager({
  layouts = [],
  themes = [],
  isLoading,
  onCreateLayout,
  onUpdateLayout,
  onPublishLayout,
  onDeleteLayout,
  onNotify,
}) {
  const [open, setOpen] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pageFilter, setPageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');

  const layoutMetrics = useMemo(() => {
    if (!layouts?.length) {
      return {
        published: 0,
        draft: 0,
        avgVersion: '1.0',
        avgLift: '—',
        upcomingLabel: 'No launches scheduled',
        segmentCoverage: { covered: 0, percentage: 0, uncovered: [...SEGMENT_OPTIONS] },
      };
    }
    const published = layouts.filter((layout) => layout.status === 'published').length;
    const draft = layouts.filter((layout) => layout.status === 'draft').length;
    const avgVersionValue =
      layouts.reduce((total, layout) => total + (Number(layout.version) || 0), 0) / layouts.length;
    const lifts = layouts
      .map((layout) => Number(layout.analytics?.conversionLift))
      .filter((value) => Number.isFinite(value));
    const avgLift = lifts.length ? `${(lifts.reduce((sum, value) => sum + value, 0) / lifts.length).toFixed(1)}%` : '—';
    const upcomingDate = layouts
      .map((layout) => {
        if (!layout.scheduledLaunch) {
          return null;
        }
        const date = new Date(layout.scheduledLaunch);
        return Number.isNaN(date.getTime()) ? null : date;
      })
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const upcomingLabel = upcomingDate
      ? upcomingDate.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No launches scheduled';
    const coveredSegments = new Set();
    layouts.forEach((layout) => {
      (layout.audienceSegments ?? []).forEach((segment) => {
        if (SEGMENT_OPTIONS.includes(segment)) {
          coveredSegments.add(segment);
        }
      });
    });
    const segmentCoverage = {
      covered: coveredSegments.size,
      percentage: SEGMENT_OPTIONS.length
        ? Math.round((coveredSegments.size / SEGMENT_OPTIONS.length) * 100)
        : 0,
      uncovered: SEGMENT_OPTIONS.filter((segment) => !coveredSegments.has(segment)),
    };
    return {
      published,
      draft,
      avgVersion: avgVersionValue.toFixed(1),
      avgLift,
      upcomingLabel,
      segmentCoverage,
    };
  }, [layouts]);

  const filteredLayouts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return layouts
      .filter((layout) => (pageFilter === 'all' ? true : layout.page === pageFilter))
      .filter((layout) => (statusFilter === 'all' ? true : layout.status === statusFilter))
      .filter((layout) => {
        if (!normalizedQuery) {
          return true;
        }
        const haystack = `${layout.name ?? ''} ${layout.slug ?? ''}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
  }, [layouts, pageFilter, statusFilter, query]);

  const handleOpenCreate = () => {
    setSelectedLayout(null);
    setOpen(true);
  };

  const handleOpenEdit = (layout) => {
    setSelectedLayout(layout);
    setOpen(true);
  };

  const handleSubmit = async (draft) => {
    setSaving(true);
    try {
      if (draft.id) {
        const payload = { ...draft };
        delete payload.id;
        await onUpdateLayout(selectedLayout.id, payload);
        onNotify?.('Layout saved', 'success');
      } else {
        await onCreateLayout(draft);
        onNotify?.('Layout created', 'success');
      }
      setOpen(false);
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to save layout', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (layout) => {
    try {
      await onPublishLayout(layout.id, { releaseNotes: layout.releaseNotes ?? '' });
      onNotify?.('Layout published', 'success');
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to publish layout', 'error');
    }
  };

  const handleDelete = async (layout) => {
    if (!window.confirm(`Delete layout ${layout.name}?`)) {
      return;
    }
    try {
      await onDeleteLayout(layout.id);
      onNotify?.('Layout removed', 'success');
    } catch (error) {
      onNotify?.(error?.message ?? 'Unable to delete layout', 'error');
    }
  };

  return (
    <section id="view-layouts" className="space-y-6 rounded-4xl border border-slate-200 bg-slate-50/80 p-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Published experiences</p>
              <p className="text-xl font-semibold text-slate-900">{layoutMetrics.published}</p>
              <p className="text-xs text-emerald-600">Avg lift {layoutMetrics.avgLift}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <ArrowPathIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft iterations</p>
              <p className="text-xl font-semibold text-slate-900">{layoutMetrics.draft}</p>
              <p className="text-xs text-slate-500">Keep at least one iteration per persona</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <ChartBarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average version</p>
              <p className="text-xl font-semibold text-slate-900">{layoutMetrics.avgVersion}</p>
              <p className="text-xs text-slate-500">Versions track design QA history</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <ClockIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next launch</p>
              <p className="text-xl font-semibold text-slate-900">{layoutMetrics.upcomingLabel}</p>
              <p className="text-xs text-slate-500">Coordinate comms and QA before go-live</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <CursorArrowRaysIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Segment coverage</p>
              <p className="text-xl font-semibold text-slate-900">{layoutMetrics.segmentCoverage.percentage}%</p>
              <p className="text-xs text-slate-500">
                {layoutMetrics.segmentCoverage.uncovered.length
                  ? `Missing ${layoutMetrics.segmentCoverage.uncovered.join(', ')}`
                  : 'All core segments active'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Layouts</h2>
          <p className="text-sm text-slate-500">Define presets for each page surface.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search layouts"
              aria-label="Search layouts"
              className="w-48 rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-600 shadow-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <select
            value={pageFilter}
            onChange={(event) => setPageFilter(event.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All</option>
            {PAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading layouts…</div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Page</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Version</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Theme</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLayouts.map((layout) => (
              <LayoutRow
                key={layout.id}
                layout={layout}
                onEdit={handleOpenEdit}
                onPublish={handlePublish}
                onRemove={handleDelete}
                disabled={saving}
              />
            ))}
          </tbody>
        </table>
        {filteredLayouts.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">No layouts yet</div>
        ) : null}
      </div>

      <LayoutWizard
        open={open}
        onClose={() => (saving ? null : setOpen(false))}
        onSubmit={handleSubmit}
        initialLayout={selectedLayout}
        themes={themes}
        saving={saving}
      />
    </section>
  );
}
