import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  RocketLaunchIcon,
  SparklesIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import CreationStudioManager from '../components/creationStudio/CreationStudioManager.jsx';
import useSession from '../hooks/useSession.js';
import DataStatus from '../components/DataStatus.jsx';
import {
  createCreationStudioItem as createCommunityCreationItem,
  publishCreationStudioItem as publishCommunityCreationItem,
  fetchCreationStudioAnalytics,
  sendCreationStudioInvite,
} from '../services/creationStudio.js';
import {
  creationTracks,
  creationStudioStats,
  creationStudioTemplates,
  findCreationTrackByType,
  findCreationPromptById,
  findCreationTemplateById,
  listCreationPromptsForType,
} from '../constants/creationStudio.js';

const INITIAL_QUICK_DRAFT = {
  type: creationTracks[0]?.type ?? 'gig',
  title: '',
  summary: '',
  audience: 'connections',
  autoPublish: false,
  promptId: null,
  templateId: null,
};

const numberFormatter = new Intl.NumberFormat('en-GB', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 1,
});

function formatNumber(value) {
  if (value === undefined || value === null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  if (numeric === 0) {
    return '0';
  }
  return numberFormatter.format(numeric);
}

function formatPercent(value) {
  if (value === undefined || value === null) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return percentFormatter.format(numeric);
}

function normaliseAnalytics(response) {
  const feed = response?.feed ?? {};
  const gigs = response?.gigs ?? {};
  const projects = response?.projects ?? {};
  const mentorship = response?.mentorship ?? {};
  const launchpad = response?.launchpad ?? {};

  return {
    feedConversionRate:
      response?.feedConversionRate ?? feed.conversionRate ?? feed.conversion ?? feed.rate ?? 0,
    gigApplications: response?.gigApplications ?? gigs.applications ?? gigs.attributed ?? 0,
    projectInvites: response?.projectInvites ?? projects.invites ?? projects.responses ?? 0,
    mentorshipBookings: response?.mentorshipBookings ?? mentorship.bookings ?? mentorship.sessions ?? 0,
    launchpadPlacements:
      response?.launchpadPlacements ?? launchpad.placements ?? launchpad.matches ?? 0,
    lastUpdated:
      response?.updatedAt ??
      response?.lastUpdated ??
      response?.refreshedAt ??
      response?.generatedAt ??
      null,
    fromCache: Boolean(response?.fromCache ?? response?.cached ?? response?.isCached),
  };
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`rounded-3xl border p-6 shadow-soft transition hover:-translate-y-0.5 ${tone}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TrackCard({ title, description, icon: Icon, to }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>
      <Link
        to={to}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accentDark"
      >
        Open workspace
        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

export default function CreationStudioWizardPage() {
  const { isAuthenticated } = useSession();
  const [quickDraft, setQuickDraft] = useState(INITIAL_QUICK_DRAFT);
  const [quickState, setQuickState] = useState({ status: 'idle', message: null });
  const [quickProgress, setQuickProgress] = useState(0);
  const [helperNotice, setHelperNotice] = useState(null);
  const [promptTrack, setPromptTrack] = useState(INITIAL_QUICK_DRAFT.type);
  const [inviteForm, setInviteForm] = useState({ email: '', role: '', message: '' });
  const [inviteState, setInviteState] = useState({ status: 'idle', message: null });
  const [analyticsState, setAnalyticsState] = useState({
    status: 'loading',
    data: normaliseAnalytics(),
    error: null,
  });

  const authenticatedCopy = useMemo(
    () =>
      isAuthenticated
        ? 'Manage drafts, publish opportunities, and collaborate with teammates with AI prompts, templates, and analytics in one orchestrated studio.'
        : 'Sign in to orchestrate gigs, projects, and documents with AI prompts, templates, and analytics from one collaborative studio.',
    [isAuthenticated],
  );

  const promptOptions = useMemo(() => listCreationPromptsForType(promptTrack), [promptTrack]);
  const activePrompt = useMemo(() => findCreationPromptById(quickDraft.promptId), [quickDraft.promptId]);
  const activeTemplate = useMemo(
    () => findCreationTemplateById(quickDraft.templateId),
    [quickDraft.templateId],
  );

  const analyticsMetrics = useMemo(() => {
    const data = analyticsState.data ?? normaliseAnalytics();
    return [
      {
        id: 'feed',
        label: 'Feed conversion rate',
        value: formatPercent(data.feedConversionRate),
        description: 'Share of studio launches that convert into live feed highlights.',
      },
      {
        id: 'gigs',
        label: 'Gig applications attributed',
        value: formatNumber(data.gigApplications),
        description: 'Applications generated from gig launches in the last 30 days.',
      },
      {
        id: 'projects',
        label: 'Project invites issued',
        value: formatNumber(data.projectInvites),
        description: 'Invites or brief requests driven by published projects.',
      },
      {
        id: 'mentorship',
        label: 'Mentorship bookings confirmed',
        value: formatNumber(data.mentorshipBookings),
        description: 'Accepted sessions linked to mentorship offerings.',
      },
      {
        id: 'launchpad',
        label: 'Launchpad placements',
        value: formatNumber(data.launchpadPlacements),
        description: 'Student placements secured after launchpad campaigns.',
      },
    ];
  }, [analyticsState.data]);

  const loadAnalytics = useCallback(
    async ({ signal } = {}) => {
      setAnalyticsState((current) => ({ ...current, status: 'loading', error: null }));
      try {
        const response = await fetchCreationStudioAnalytics({}, { signal });
        if (signal?.aborted) {
          return;
        }
        setAnalyticsState({ status: 'success', data: normaliseAnalytics(response), error: null });
      } catch (error) {
        if (signal?.aborted) {
          return;
        }
        setAnalyticsState((current) => ({ ...current, status: 'error', error }));
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadAnalytics({ signal: controller.signal });
    return () => controller.abort();
  }, [loadAnalytics]);

  useEffect(() => {
    if (!helperNotice) {
      return undefined;
    }
    const timeout = setTimeout(() => setHelperNotice(null), 4000);
    return () => clearTimeout(timeout);
  }, [helperNotice]);

  useEffect(() => {
    setPromptTrack(quickDraft.type);
  }, [quickDraft.type]);

  useEffect(() => {
    if (quickState.status === 'saving') {
      setQuickProgress(20);
      const timers = [
        setTimeout(() => setQuickProgress(55), 200),
        setTimeout(() => setQuickProgress(80), 500),
      ];
      return () => {
        timers.forEach((timer) => clearTimeout(timer));
      };
    }
    if (quickState.status === 'success') {
      setQuickProgress(100);
      const timeout = setTimeout(() => setQuickProgress(0), 1200);
      return () => clearTimeout(timeout);
    }
    setQuickProgress(0);
    return undefined;
  }, [quickState.status]);

  const handleQuickLaunch = useCallback(
    async (event) => {
      event.preventDefault();
      if (!quickDraft.title || !quickDraft.summary) {
        setQuickState({ status: 'error', message: 'Add a title and summary to generate your workspace.' });
        return;
      }
      setQuickState({ status: 'saving', message: 'Preparing workspace blueprint…' });
      try {
        const metadata = {
          origin: 'quick-launch',
        };
        if (quickDraft.promptId) {
          metadata.promptsUsed = [quickDraft.promptId];
        }
        if (quickDraft.templateId) {
          metadata.templateApplied = quickDraft.templateId;
        }
        const payload = {
          type: quickDraft.type,
          title: quickDraft.title,
          summary: quickDraft.summary,
          visibility: quickDraft.audience,
          status: 'draft',
          metadata,
        };
        const optimisticId = `optimistic-${Date.now()}`;
        window.dispatchEvent(
          new CustomEvent('creation-studio:refresh', {
            detail: { type: quickDraft.type, id: optimisticId, optimistic: true },
          }),
        );
        const created = await createCommunityCreationItem(payload);
        if (quickDraft.autoPublish && created?.id) {
          await publishCommunityCreationItem(created.id, {});
        }
        window.dispatchEvent(
          new CustomEvent('creation-studio:refresh', { detail: { type: quickDraft.type, id: created?.id } }),
        );
        setQuickState({ status: 'success', message: 'Workspace created. Continue in the manager below to refine details.' });
        setQuickDraft((current) => ({
          ...current,
          title: '',
          summary: '',
          promptId: null,
          templateId: null,
        }));
      } catch (error) {
        setQuickState({
          status: 'error',
          message: error?.body?.message ?? error?.message ?? 'Unable to create the workspace right now.',
        });
      }
    },
    [quickDraft],
  );

  const handlePromptUse = useCallback(
    (prompt) => {
      setQuickDraft((current) => ({
        ...current,
        type: promptTrack,
        title: current.title || prompt.suggestedTitle || current.title,
        summary: prompt.example,
        promptId: prompt.id,
      }));
      setHelperNotice(`Added the “${prompt.title}” prompt to your quick draft.`);
    },
    [promptTrack],
  );

  const handleTemplateApply = useCallback((template) => {
    setQuickDraft((current) => ({
      ...current,
      type: template.type,
      title: template.title,
      summary: template.summary,
      audience: template.audience ?? current.audience,
      templateId: template.id,
    }));
    setPromptTrack(template.type);
    setHelperNotice(`Applied the ${template.title} template. Adjust details before publishing.`);
  }, []);

  const handleClearPrompt = useCallback(() => {
    setQuickDraft((current) => ({ ...current, promptId: null }));
    setHelperNotice('Cleared the AI prompt from your quick draft.');
  }, []);

  const handleClearTemplate = useCallback(() => {
    setQuickDraft((current) => ({ ...current, templateId: null }));
    setHelperNotice('Template removed. Continue refining your custom draft.');
  }, []);

  const handleInviteSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!inviteForm.email) {
        setInviteState({ status: 'error', message: 'Add an email to send a collaboration invite.' });
        return;
      }
      setInviteState({ status: 'saving', message: null });
      try {
        await sendCreationStudioInvite(
          {
            email: inviteForm.email,
            role: inviteForm.role || undefined,
            message: inviteForm.message || undefined,
            preferredTrack: quickDraft.type,
            source: 'creation-studio-wizard',
          },
          {},
        );
        setInviteState({ status: 'success', message: 'Invitation sent. Your collaborator will receive guidance shortly.' });
        setInviteForm({ email: '', role: '', message: '' });
      } catch (error) {
        setInviteState({
          status: 'error',
          message: error?.body?.message ?? error?.message ?? 'Unable to send the invite right now.',
        });
      }
    },
    [inviteForm, quickDraft.type],
  );

  return (
    <div className="bg-gradient-to-b from-white via-white to-slate-50 pb-24">
      <div className="mx-auto max-w-7xl px-6 pt-16">
        <PageHeader
          eyebrow="Creation Studio"
          title="Launch every opportunity with confidence"
          description={authenticatedCopy}
          actions={
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark"
            >
              Create new project
              <RocketLaunchIcon className="h-5 w-5" aria-hidden="true" />
            </Link>
          }
          meta="Autosave • Compliance scoring • Collaboration rooms"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {creationStudioStats.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>

        <section className="mt-16">
          <div className="grid gap-6 lg:grid-cols-2">
            {creationTracks.map((track) => (
              <TrackCard key={track.id} {...track} />
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                Quick launch
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Quick launch an opportunity</h2>
              <p className="text-sm text-slate-600">
                Capture the essentials for a gig, project, mentorship offer, or volunteering mission. We&apos;ll create the
                workspace instantly so you can continue refining details inside the Creation Studio.
              </p>
              {activeTemplate ? (
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    Template applied: {activeTemplate.title}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearTemplate}
                    className="text-xs font-semibold text-accent transition hover:text-accentDark"
                  >
                    Clear template
                  </button>
                </div>
              ) : null}
              {activePrompt ? (
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">
                    AI prompt: {activePrompt.title}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearPrompt}
                    className="text-xs font-semibold text-accent transition hover:text-accentDark"
                  >
                    Clear prompt
                  </button>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-3 text-left lg:items-end lg:text-right">
              {helperNotice ? (
                <p className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  {helperNotice}
                </p>
              ) : null}
              {quickState.status === 'success' ? (
                <p className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Draft saved
                </p>
              ) : null}
            </div>
          </div>

          <form className="mt-8 grid gap-4 lg:grid-cols-12" onSubmit={handleQuickLaunch}>
            {quickProgress > 0 ? (
              <div className="lg:col-span-12">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                  <span
                    className="block h-full bg-gradient-to-r from-accent to-accentDark transition-[width] duration-200"
                    style={{ width: `${Math.min(quickProgress, 100)}%` }}
                  />
                </div>
              </div>
            ) : null}
            <div className="lg:col-span-2">
              <label htmlFor="quick-type" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Opportunity type
              </label>
              <select
                id="quick-type"
                value={quickDraft.type}
                onChange={(event) =>
                  setQuickDraft((current) => ({
                    ...current,
                    type: event.target.value,
                    promptId: null,
                    templateId: null,
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-soft focus:border-accent focus:outline-none"
              >
                {creationTracks.map((track) => (
                  <option key={track.id} value={track.type}>
                    {track.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-4">
              <label htmlFor="quick-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Title
              </label>
              <input
                id="quick-title"
                type="text"
                value={quickDraft.title}
                onChange={(event) => setQuickDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Launch a product marketing squad"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none"
                required
              />
            </div>
            <div className="lg:col-span-4">
              <label htmlFor="quick-summary" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Summary
              </label>
              <textarea
                id="quick-summary"
                value={quickDraft.summary}
                onChange={(event) => setQuickDraft((current) => ({ ...current, summary: event.target.value }))}
                placeholder="Outline deliverables, timelines, or expectations in a few sentences."
                className="mt-2 h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none"
                required
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="quick-audience" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Visibility
              </label>
              <select
                id="quick-audience"
                value={quickDraft.audience}
                onChange={(event) => setQuickDraft((current) => ({ ...current, audience: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-soft focus:border-accent focus:outline-none"
              >
                <option value="connections">Connections</option>
                <option value="community">Community</option>
                <option value="private">Private workspace</option>
              </select>
            </div>
            <div className="lg:col-span-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={quickDraft.autoPublish}
                  onChange={(event) => setQuickDraft((current) => ({ ...current, autoPublish: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                />
                Publish immediately after creating
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center" aria-live="polite">
                {quickState.status === 'saving' && quickState.message ? (
                  <p className="text-sm font-medium text-slate-600">{quickState.message}</p>
                ) : null}
                {quickState.status === 'error' ? (
                  <p className="text-sm font-medium text-rose-600">{quickState.message}</p>
                ) : null}
                {quickState.status === 'success' ? (
                  <p className="text-sm font-medium text-emerald-600">{quickState.message}</p>
                ) : null}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={quickState.status === 'saving'}
                >
                  {quickState.status === 'saving' ? 'Creating workspace…' : 'Create workspace'}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">AI prompt library</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Use curated prompts to shape your summary before refining it with collaborators.
                </p>
              </div>
              <div className="w-full sm:w-auto">
                <label htmlFor="prompt-track" className="sr-only">
                  Choose opportunity type for prompts
                </label>
                <select
                  id="prompt-track"
                  value={promptTrack}
                  onChange={(event) => setPromptTrack(event.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft focus:border-accent focus:outline-none"
                >
                  {creationTracks.map((track) => (
                    <option key={`prompt-${track.id}`} value={track.type}>
                      {track.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {promptOptions.map((prompt) => (
                <div
                  key={prompt.id}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <h4 className="text-base font-semibold text-slate-900">{prompt.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">{prompt.description}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Example output:{' '}
                    <span className="font-medium text-slate-700">{prompt.example}</span>
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handlePromptUse(prompt)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                      Use prompt
                    </button>
                    {quickDraft.promptId === prompt.id ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Selected
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-soft">
            <h3 className="text-xl font-semibold text-slate-900">Template gallery</h3>
            <p className="mt-1 text-sm text-slate-600">
              Apply reusable blueprints with audience defaults, highlight decks, and collaboration rituals baked in.
            </p>
            <div className="mt-6 space-y-4">
              {creationStudioTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{template.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{template.summary}</p>
                      {Array.isArray(template.highlights) && template.highlights.length ? (
                        <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          {template.highlights.map((highlight) => (
                            <li
                              key={`${template.id}-${highlight}`}
                              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1"
                            >
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <RocketLaunchIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTemplateApply(template)}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark"
                    >
                      Apply template
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {quickDraft.templateId === template.id ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                Collaboration invites
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Invite teammates or clients</h2>
              <p className="text-sm text-slate-600">
                Share context-rich invitations so collaborators can review drafts, leave feedback, and co-publish with the right permissions.
              </p>
            </div>
            {inviteState.status === 'success' ? (
              <p className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Invite sent
              </p>
            ) : null}
          </div>

          <form className="mt-8 grid gap-4 lg:grid-cols-12" onSubmit={handleInviteSubmit}>
            <div className="lg:col-span-4">
              <label htmlFor="invite-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Collaborator email
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="teammate@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none"
                required
              />
            </div>
            <div className="lg:col-span-3">
              <label htmlFor="invite-role" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Role or context
              </label>
              <input
                id="invite-role"
                type="text"
                value={inviteForm.role}
                onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
                placeholder="Reviewer, hiring manager, mentor"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none"
              />
            </div>
            <div className="lg:col-span-5">
              <label htmlFor="invite-message" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Personal message
              </label>
              <textarea
                id="invite-message"
                value={inviteForm.message}
                onChange={(event) => setInviteForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Share expectations, deadlines, or resources to review before joining."
                className="mt-2 h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft focus:border-accent focus:outline-none"
              />
            </div>
            <div className="lg:col-span-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                We&apos;ll attach your latest {findCreationTrackByType(quickDraft.type)?.title?.toLowerCase() ?? 'opportunity'} templates and guardrails so collaborators onboard quickly.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center" aria-live="polite">
                {inviteState.status === 'saving' ? (
                  <p className="text-sm font-medium text-slate-600">Sending invite…</p>
                ) : null}
                {inviteState.status === 'error' ? (
                  <p className="text-sm font-medium text-rose-600">{inviteState.message}</p>
                ) : null}
                {inviteState.status === 'success' ? (
                  <p className="text-sm font-medium text-emerald-600">{inviteState.message}</p>
                ) : null}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={inviteState.status === 'saving'}
                >
                  Send invite
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl" id="studio">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Creation studio workspace</h2>
              <p className="mt-2 text-sm text-slate-600">
                Draft, collaborate, and publish across CVs, cover letters, gigs, projects, volunteering drives, and mentorship tracks.
              </p>
            </div>
            <Link
              to="/feed"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              View live feed
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200/70 bg-slate-50/40 p-6">
            <CreationStudioManager />
          </div>
        </section>

        <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-slate-900">Creation performance analytics</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Understand how launches influence the live feed, marketplace interest, and mentorship bookings so you can focus on the highest-impact opportunities.
          </p>
          <div className="mt-8">
            <DataStatus
              loading={analyticsState.status === 'loading'}
              error={analyticsState.status === 'error' ? analyticsState.error : null}
              fromCache={analyticsState.data?.fromCache}
              lastUpdated={analyticsState.data?.lastUpdated}
              onRefresh={() => loadAnalytics()}
              statusLabel="Live analytics"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {analyticsMetrics.map((metric) => (
                  <div key={metric.id} className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
                    <p className="mt-2 text-sm text-slate-600">{metric.description}</p>
                  </div>
                ))}
              </div>
            </DataStatus>
          </div>
        </section>

        <section className="mt-16">
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Need a hand finishing your brief?</h2>
                <p className="text-sm text-slate-200">
                  Our community concierge team reviews drafts, ensures compliance, and co-authors announcements before you publish.
                </p>
              </div>
              <Link
                to="/inbox"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-soft transition hover:-translate-y-0.5"
              >
                Chat with concierge
                <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-16 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-semibold text-slate-900">Workflow assurance</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Every action performed in the studio is audited, reversible, and synced with real-time notifications. Administrators can trace edits,
            approvals, and publish events down to the individual field change.
          </p>
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
            <DataStatus
              status="success"
              title="All systems operational"
              description="Creation API • Compliance scoring • Publishing pipeline"
              lastUpdated={new Date().toISOString()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
