import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowTopRightOnSquareIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import CreationStudioManager from '../components/creationStudio/CreationStudioManager.jsx';
import useSession from '../hooks/useSession.js';
import DataStatus from '../components/DataStatus.jsx';
import {
  CREATION_STUDIO_TRACKS,
  CREATION_STUDIO_STATS,
  extractRecommendedTrack,
  formatRecommendedAudience,
  resolveCreationTrack,
} from '../constants/creationStudio.js';
import {
  createCreationStudioItem as createCommunityCreationItem,
  publishCreationStudioItem as publishCommunityCreationItem,
} from '../services/creationStudio.js';

export { CREATION_STUDIO_TRACKS as creationTracks, CREATION_STUDIO_STATS as stats } from '../constants/creationStudio.js';

function StatCard({ label, value, tone }) {
  return (
    <div className={`rounded-3xl border p-6 shadow-soft transition hover:-translate-y-0.5 ${tone}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TrackCard({ title, description, icon: Icon, to, recommended, audienceLabel }) {
  return (
    <article
      className={`group rounded-3xl border bg-white/85 p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl ${
        recommended ? 'border-accent/60 ring-2 ring-accent/25' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {recommended ? (
            <p className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              Recommended for you
            </p>
          ) : null}
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{audienceLabel}</p>
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

function PromptCard({ prompt, isCopied, onCopy }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-soft">
      <h3 className="text-sm font-semibold text-slate-900">{prompt.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{prompt.prompt}</p>
      <button
        type="button"
        onClick={() => onCopy(prompt)}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
      >
        {isCopied ? 'Copied' : 'Copy prompt'}
        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </article>
  );
}

function TemplateCard({ template, onApply }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-soft">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{template.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{template.summary}</p>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <button
          type="button"
          onClick={() => onApply(template)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accentDark"
        >
          Apply template
        </button>
      </div>
    </article>
  );
}

function CollaborationRole({ role, benefit }) {
  return (
    <li className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-4">
      <p className="text-sm font-semibold text-slate-900">{role}</p>
      <p className="mt-1 text-sm text-slate-600">{benefit}</p>
    </li>
  );
}

export default function CreationStudioWizardPage() {
  const { isAuthenticated, session } = useSession();
  const membershipKeys = useMemo(
    () => (Array.isArray(session?.memberships) ? session.memberships.map((value) => value.toLowerCase()) : []),
    [session?.memberships],
  );

  const enrichedTracks = useMemo(
    () =>
      CREATION_STUDIO_TRACKS.map((track) => ({
        ...track,
        recommended: track.recommendedFor?.some((membership) => membershipKeys.includes(membership)),
        audienceLabel: formatRecommendedAudience(track.recommendedFor),
      })),
    [membershipKeys],
  );

  const recommendedTrack = useMemo(() => extractRecommendedTrack(membershipKeys), [membershipKeys]);
  const recommendedTrackId = recommendedTrack?.id ?? enrichedTracks[0]?.id ?? 'gig';
  const recommendedTrackType = recommendedTrack?.type ?? enrichedTracks[0]?.type ?? 'gig';

  const manualTrackSelectionRef = useRef(false);
  const submissionGuardRef = useRef(false);
  const copyTimeoutRef = useRef(null);
  const inviteTimeoutRef = useRef(null);

  const [selectedTrackId, setSelectedTrackId] = useState(recommendedTrackId);
  const [quickDraft, setQuickDraft] = useState({
    type: recommendedTrackType,
    title: '',
    summary: '',
    audience: 'connections',
    autoPublish: false,
  });
  const [quickState, setQuickState] = useState({ status: 'idle', message: null });
  const [progress, setProgress] = useState(0);
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteState, setInviteState] = useState({ status: 'idle', message: null });
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    if (!manualTrackSelectionRef.current) {
      setSelectedTrackId(recommendedTrackId);
    }
    setQuickDraft((current) => {
      if (current.title || current.summary) {
        return current;
      }
      if (current.type === recommendedTrackType) {
        return current;
      }
      return { ...current, type: recommendedTrackType };
    });
  }, [recommendedTrackId, recommendedTrackType]);

  useEffect(() => () => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    if (inviteTimeoutRef.current) {
      clearTimeout(inviteTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (quickState.status === 'saving') {
      setProgress(12);
      const interval = setInterval(() => {
        setProgress((current) => {
          if (current >= 90) {
            return current;
          }
          return current + 8;
        });
      }, 200);
      return () => clearInterval(interval);
    }

    if (quickState.status === 'success') {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 800);
      return () => clearTimeout(timeout);
    }

    if (quickState.status === 'error') {
      setProgress(0);
    }

    return undefined;
  }, [quickState.status]);

  useEffect(() => {
    if (quickState.status !== 'success' && quickState.status !== 'error') {
      return undefined;
    }
    const status = quickState.status;
    const timeout = setTimeout(() => {
      setQuickState((current) => (current.status === status ? { status: 'idle', message: null } : current));
    }, 6000);
    return () => clearTimeout(timeout);
  }, [quickState.status]);

  useEffect(() => {
    if (inviteState.status !== 'success' && inviteState.status !== 'error') {
      return undefined;
    }
    const status = inviteState.status;
    const timeout = setTimeout(() => {
      setInviteState((current) => (current.status === status ? { status: 'idle', message: null } : current));
    }, 5000);
    return () => clearTimeout(timeout);
  }, [inviteState.status]);

  const selectedTrack = useMemo(() => {
    const fallback = enrichedTracks.find((track) => track.id === recommendedTrackId) ?? enrichedTracks[0] ?? null;
    return enrichedTracks.find((track) => track.id === selectedTrackId) ?? fallback;
  }, [enrichedTracks, recommendedTrackId, selectedTrackId]);

  const authenticatedCopy = useMemo(
    () =>
      isAuthenticated
        ? 'Manage drafts, publish opportunities, and collaborate with teammates in one orchestrated studio.'
        : 'Sign in to orchestrate gigs, projects, and documents from one collaborative studio.',
    [isAuthenticated],
  );

  const handleSelectTrack = useCallback((trackId) => {
    manualTrackSelectionRef.current = true;
    setSelectedTrackId(trackId);
    const resolved = resolveCreationTrack(trackId);
    if (resolved) {
      setQuickDraft((current) => ({ ...current, type: resolved.type }));
    }
  }, []);

  const handleCopyPrompt = useCallback((prompt) => {
    if (!prompt?.prompt) {
      return;
    }
    const performCopy = async () => {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(prompt.prompt);
        } catch (error) {
          console.warn('Unable to copy prompt', error);
        }
      }
    };
    performCopy();
    setCopiedPromptId(prompt.id);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => setCopiedPromptId(null), 3000);
  }, []);

  const handleApplyTemplate = useCallback(
    (template) => {
      if (!template || !selectedTrack) {
        return;
      }
      manualTrackSelectionRef.current = true;
      setSelectedTrackId(selectedTrack.id);
      setQuickDraft((current) => ({
        ...current,
        type: selectedTrack.type,
        title: template.title,
        summary: template.summary,
      }));
      setQuickState((current) => (current.status === 'saving' ? current : { status: 'idle', message: null }));
    },
    [selectedTrack],
  );

  const handleInviteCollaborator = useCallback(
    (event) => {
      event.preventDefault();
      if (!selectedTrack) {
        setInviteState({ status: 'error', message: 'Select a track before inviting collaborators.' });
        return;
      }
      const trimmed = inviteEmail.trim();
      if (!trimmed) {
        setInviteState({ status: 'error', message: 'Enter an email address to send an invite.' });
        return;
      }
      const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailPattern.test(trimmed)) {
        setInviteState({ status: 'error', message: 'Enter a valid email address.' });
        return;
      }
      setInviteState({ status: 'sending', message: 'Scheduling invite…' });
      if (inviteTimeoutRef.current) {
        clearTimeout(inviteTimeoutRef.current);
      }
      inviteTimeoutRef.current = setTimeout(() => {
        setCollaborators((current) => [
          ...current,
          {
            email: trimmed,
            role: selectedTrack.collaborationRoles?.[0]?.role ?? 'Collaborator',
            trackId: selectedTrack.id,
            status: 'Pending acceptance',
          },
        ]);
        setInviteEmail('');
        setInviteState({ status: 'success', message: `Invite sent to ${trimmed}.` });
      }, 450);
    },
    [inviteEmail, selectedTrack],
  );

  const handleQuickLaunch = useCallback(
    async (event) => {
      event.preventDefault();
      if (submissionGuardRef.current) {
        return;
      }
      if (!quickDraft.title || !quickDraft.summary) {
        setQuickState({ status: 'error', message: 'Add a title and summary to generate your workspace.' });
        return;
      }
      const trackDetails = resolveCreationTrack(quickDraft.type);
      submissionGuardRef.current = true;
      setQuickState({
        status: 'saving',
        message: trackDetails ? `Setting up your ${trackDetails.title.toLowerCase()}…` : 'Setting up your workspace…',
      });
      try {
        const payload = {
          type: quickDraft.type,
          title: quickDraft.title,
          summary: quickDraft.summary,
          visibility: quickDraft.audience,
          status: 'draft',
          metadata: {
            origin: 'quick-launch',
            template: trackDetails?.id ?? null,
          },
        };
        const created = await createCommunityCreationItem(payload);
        if (quickDraft.autoPublish && created?.id) {
          await publishCommunityCreationItem(created.id, {});
        }
        window.dispatchEvent(
          new CustomEvent('creation-studio:refresh', {
            detail: { type: quickDraft.type, id: created?.id },
          }),
        );
        setQuickState({
          status: 'success',
          message:
            trackDetails?.title
              ? `${trackDetails.title} workspace created. Continue in the manager below to refine details.`
              : 'Workspace created. Continue in the manager below to refine details.',
        });
        setQuickDraft((current) => ({ ...current, title: '', summary: '' }));
      } catch (error) {
        setQuickState({
          status: 'error',
          message: error?.body?.message ?? error?.message ?? 'Unable to create the workspace right now.',
        });
      } finally {
        submissionGuardRef.current = false;
      }
    },
    [quickDraft],
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
          {CREATION_STUDIO_STATS.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>

        <section className="mt-16">
          <div className="grid gap-6 lg:grid-cols-2">
            {enrichedTracks.map((track) => (
              <TrackCard key={track.id} {...track} />
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900">Quick launch an opportunity</h2>
              <p className="text-sm text-slate-600">
                Capture the essentials for a gig, project, mentorship offer, or volunteering mission. We&apos;ll create the workspace
                instantly so you can continue refining details inside the Creation Studio.
              </p>
            </div>
            {quickState.status === 'success' ? (
              <p className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Draft saved
              </p>
            ) : null}
          </div>

          <form className="mt-8 grid gap-4 lg:grid-cols-12" onSubmit={handleQuickLaunch} aria-live="polite">
            <div className="lg:col-span-2">
              <label htmlFor="quick-type" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Opportunity type
              </label>
              <select
                id="quick-type"
                value={quickDraft.type}
                onChange={(event) => handleSelectTrack(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-soft focus:border-accent focus:outline-none"
              >
                {enrichedTracks.map((track) => (
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {quickState.status === 'error' ? (
                  <p className="text-sm font-medium text-rose-600">{quickState.message}</p>
                ) : null}
                {quickState.status === 'success' ? (
                  <p className="text-sm font-medium text-emerald-600">
                    {quickState.message}{' '}
                    <a href="#studio" className="text-emerald-700 underline decoration-emerald-200 underline-offset-4">
                      Open studio manager
                    </a>
                  </p>
                ) : null}
                {quickState.status === 'saving' ? (
                  <p className="text-sm font-medium text-slate-600">{quickState.message}</p>
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
            {progress > 0 ? (
              <div className="lg:col-span-12">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-150 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : null}
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

        {selectedTrack ? (
          <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Templates &amp; AI prompt library</h2>
                <p className="text-sm text-slate-200">
                  Switch tracks to preview curated prompts, templates, and collaboration roles tailored to each opportunity type.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {enrichedTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handleSelectTrack(track.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      selectedTrack.id === track.id
                        ? 'border-white bg-white/10 text-white'
                        : 'border-white/20 text-slate-200 hover:border-white hover:text-white'
                    }`}
                  >
                    {track.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1 space-y-4">
                {selectedTrack.prompts.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} isCopied={copiedPromptId === prompt.id} onCopy={handleCopyPrompt} />
                ))}
              </div>
              <div className="lg:col-span-1 space-y-4">
                {selectedTrack.templates.map((template) => (
                  <TemplateCard key={template.id} template={template} onApply={handleApplyTemplate} />
                ))}
              </div>
              <div className="lg:col-span-1 space-y-4 rounded-3xl border border-white/30 bg-white/10 p-6">
                <div>
                  <h3 className="text-lg font-semibold">Collaboration invites</h3>
                  <p className="mt-2 text-sm text-slate-200">
                    Coordinate {selectedTrack.title.toLowerCase()} launches with recommended roles and real-time invite tracking.
                  </p>
                </div>
                <ul className="space-y-3">
                  {selectedTrack.collaborationRoles?.map((role) => (
                    <CollaborationRole key={role.role} {...role} />
                  ))}
                </ul>
                <form className="mt-4 space-y-3" onSubmit={handleInviteCollaborator}>
                  <div>
                    <label htmlFor="collaborator-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                      Invite by email
                    </label>
                    <input
                      id="collaborator-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="product.partner@gigvora.com"
                      className="mt-2 w-full rounded-2xl border border-white/40 bg-white/20 px-4 py-3 text-sm text-white placeholder:text-slate-300 focus:border-white focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:-translate-y-0.5"
                    disabled={inviteState.status === 'sending'}
                  >
                    {inviteState.status === 'sending' ? 'Sending…' : 'Send invite'}
                  </button>
                  {inviteState.status === 'error' ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">{inviteState.message}</p>
                  ) : null}
                  {inviteState.status === 'success' ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">{inviteState.message}</p>
                  ) : null}
                </form>
                <div className="space-y-3">
                  {collaborators.length ? (
                    <ul className="space-y-3">
                      {collaborators.map((collaborator) => (
                        <li
                          key={`${collaborator.email}-${collaborator.trackId}-${collaborator.status}`}
                          className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{collaborator.email}</p>
                            <p className="text-xs text-slate-300">
                              {collaborator.role} • {collaborator.status}
                            </p>
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Invited</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-300">
                      No invites sent yet. Add teammates to accelerate review cycles and stay compliant.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {selectedTrack ? (
          <section className="mt-16 rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-slate-900">Opportunity impact analytics</h2>
                <p className="text-sm text-slate-600">
                  Track how your {selectedTrack.title.toLowerCase()} performs across the feed, marketplace, and collaborator experiences.
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Real-time telemetry from creation studio manager</p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {selectedTrack.analytics.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{item.metric}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16 rounded-[2.5rem] border border-dashed border-slate-300 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
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
        </section>
      </div>

      <div className="mt-16 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-semibold text-slate-900">Workflow assurance</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Every action performed in the studio is audited, reversible, and synced with real-time notifications. Administrators can
            trace edits, approvals, and publish events down to the individual field change.
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
