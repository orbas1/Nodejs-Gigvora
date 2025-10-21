import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownOnSquareIcon,
  ArrowUpOnSquareIcon,
  CheckCircleIcon,
  PhotoIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { PlayCircleIcon } from '@heroicons/react/24/solid';
import SectionShell from '../SectionShell.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerShowcase from '../../../../hooks/useFreelancerShowcase.js';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    return `${value}`;
  }
}

function ModuleIcon({ type }) {
  if (type === 'video') {
    return <PlayCircleIcon className="h-5 w-5 text-rose-500" />;
  }
  if (type === 'gallery') {
    return <PhotoIcon className="h-5 w-5 text-blue-500" />;
  }
  return <SparklesIcon className="h-5 w-5 text-emerald-500" />;
}

export default function ProfileShowcaseSection() {
  const { session } = useSession();
  const freelancerId =
    session?.freelancerId ?? session?.profileId ?? session?.userId ?? session?.id ?? null;

  const {
    hero,
    modules,
    feed,
    recommendations,
    updateHero,
    updateModule,
    reorderModules,
    updatingHero,
    updatingModuleId,
    reordering,
    refresh,
    loading,
    error,
  } = useFreelancerShowcase({ freelancerId, enabled: Boolean(freelancerId) });

  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id ?? null);

  useEffect(() => {
    if (modules.length === 0) {
      setSelectedModuleId(null);
      return;
    }
    if (!modules.some((module) => module.id === selectedModuleId)) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? modules[0] ?? null,
    [modules, selectedModuleId],
  );

  const moduleOrder = useMemo(() => modules.map((module) => module.id), [modules]);

  const handleToggleHeroPublish = () => {
    if (!hero) {
      return;
    }
    updateHero({ ...hero, published: !hero.published }).catch((err) => {
      console.error('Unable to toggle hero publish state', err);
    });
  };

  const handleToggleModule = (module) => {
    updateModule(module.id, { ...module, published: !module.published }).catch((err) => {
      console.error('Unable to toggle showcase module', err);
    });
  };

  const handleSelectModule = (moduleId) => {
    setSelectedModuleId(moduleId);
  };

  const handleMoveModule = (moduleId, direction) => {
    const currentIndex = moduleOrder.indexOf(moduleId);
    if (currentIndex < 0) {
      return;
    }
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= moduleOrder.length) {
      return;
    }
    const newOrder = moduleOrder.slice();
    const [item] = newOrder.splice(currentIndex, 1);
    newOrder.splice(targetIndex, 0, item);
    reorderModules(newOrder).catch((err) => {
      console.error('Unable to reorder showcase modules', err);
    });
  };

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => refresh({ force: true })}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SparklesIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Sync showcase
      </button>
      <button
        type="button"
        onClick={handleToggleHeroPublish}
        disabled={!hero || updatingHero}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CheckCircleIcon className="h-4 w-4" />
        {hero?.published ? 'Unpublish hero' : 'Publish hero'}
      </button>
    </div>
  );

  return (
    <SectionShell
      id="profile-showcase"
      title="Profile showcase"
      description="Craft a rich public profile with multimedia storytelling and credentialing."
      actions={actions}
    >
      {error ? (
        <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error?.message ?? 'Unable to load showcase.'}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Hero experience</p>
                <p className="mt-1 text-sm text-slate-600">
                  Optimise your hero narrative to match current go-to-market priorities.
                </p>
              </div>
              {hero?.published ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  <CheckCircleIcon className="h-4 w-4" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Draft
                </span>
              )}
            </div>
            <div className="mt-5 rounded-2xl bg-slate-900 p-6 text-white">
              <p className="text-2xl font-semibold leading-tight">{hero?.headline}</p>
              <p className="mt-3 max-w-2xl text-sm text-slate-200">{hero?.subheadline}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                <a
                  href={hero?.ctaUrl ?? '#'}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-600"
                >
                  {hero?.ctaLabel ?? 'Open portfolio'}
                </a>
                {hero?.mediaUrl ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    <PhotoIcon className="h-4 w-4" />
                    Cover active
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Showcase modules</p>
                <p className="mt-1 text-sm text-slate-600">
                  Reorder sections and toggle publication to curate the right narrative.
                </p>
              </div>
              {reordering ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  <SparklesIcon className="h-4 w-4 animate-spin" />
                  Reordering
                </span>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {modules.map((module, index) => {
                const isSelected = selectedModule?.id === module.id;
                return (
                  <div
                    key={module.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectModule(module.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelectModule(module.id);
                      }
                    }}
                    className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ModuleIcon type={module.type} />
                        <p className="text-sm font-semibold text-slate-900">{module.title}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          module.published
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        {module.published ? 'Live' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{module.summary}</p>
                    <div className="flex w-full items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMoveModule(module.id, -1);
                          }}
                          disabled={index === 0 || reordering}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ArrowUpOnSquareIcon className="h-4 w-4" />
                          Up
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMoveModule(module.id, 1);
                          }}
                          disabled={index === modules.length - 1 || reordering}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ArrowDownOnSquareIcon className="h-4 w-4" />
                          Down
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleModule(module);
                        }}
                        disabled={updatingModuleId === module.id}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        {module.published ? 'Hide' : 'Publish'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedModule ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Module preview</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedModule.type === 'video'
                      ? 'Preview the media reel, transcripts, and key timestamps.'
                      : selectedModule.type === 'gallery'
                      ? 'Surface curated visuals from delivery artefacts.'
                      : 'Tell the story of your flagship engagements with measurable impact.'}
                  </p>
                </div>
                <ModuleIcon type={selectedModule.type} />
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{selectedModule.title}</p>
                <p>{selectedModule.summary}</p>
                {Array.isArray(selectedModule.metrics) && selectedModule.metrics.length ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {selectedModule.metrics.map((metric) => (
                      <li
                        key={metric.label}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
                      >
                        <span className="block text-xs uppercase tracking-wide text-slate-500">{metric.label}</span>
                        <span className="font-semibold">{metric.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {selectedModule.assets ? (
                  <p className="text-xs text-slate-500">{selectedModule.assets} curated assets attached.</p>
                ) : null}
                {selectedModule.duration ? (
                  <p className="text-xs text-slate-500">Runtime: {selectedModule.duration}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Recent feed posts</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {feed?.posts?.length
                ? feed.posts.map((post) => (
                    <li key={post.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="font-semibold text-slate-900">{post.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(post.publishedAt)}</p>
                    </li>
                  ))
                : (
                  <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Publish updates to keep your network engaged.
                  </li>
                )}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Suggested follows</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {recommendations.map((profile) => (
                <li key={profile.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">{profile.name}</p>
                  <p className="text-xs text-slate-500">{profile.role}</p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    Follow
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Syncing live showcase data…
            </div>
          ) : null}
        </aside>
      </div>
    </SectionShell>
  );
}
