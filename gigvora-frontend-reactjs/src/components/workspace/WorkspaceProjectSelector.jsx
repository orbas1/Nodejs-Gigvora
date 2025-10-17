import { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import discoveryService from '../../services/discovery.js';

function normaliseResults(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload.projects)) {
    return payload.projects;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
}

export default function WorkspaceProjectSelector({ value, onSelect, loading = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [manualId, setManualId] = useState(value?.id ? `${value.id}` : '');

  useEffect(() => {
    setManualId(value?.id ? `${value.id}` : '');
  }, [value?.id]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      discoveryService
        .searchProjects(query.trim(), { pageSize: 8, signal: controller.signal })
        .then((payload) => {
          if (cancelled) {
            return;
          }
          setResults(normaliseResults(payload));
          setError(null);
        })
        .catch((searchError) => {
          if (controller.signal.aborted || cancelled) {
            return;
          }
          setError(searchError);
          setResults([]);
        })
        .finally(() => {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 200);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const helperText = useMemo(() => {
    if (loading) {
      return 'Loading workspace data…';
    }
    if (value?.title) {
      return `Viewing workspace for ${value.title}`;
    }
    if (value?.name) {
      return `Viewing workspace for ${value.name}`;
    }
    return 'Search by project title or provide a project ID to open its workspace.';
  }, [loading, value?.title, value?.name]);

  function handleSelect(project) {
    if (!project?.id) {
      return;
    }
    onSelect?.(project);
    setQuery('');
  }

  function handleManualSubmit(event) {
    event.preventDefault();
    const trimmed = manualId.trim();
    if (!trimmed) {
      return;
    }
    onSelect?.({ id: trimmed, title: trimmed });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Project workspace selector</h2>
          <p className="mt-1 text-sm text-slate-600">{helperText}</p>
        </div>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={handleManualSubmit}>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="manual-project-id">
            Project ID
          </label>
          <input
            id="manual-project-id"
            value={manualId}
            onChange={(event) => setManualId(event.target.value)}
            placeholder="e.g. 1024"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-40"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
          >
            Load
          </button>
        </form>
      </div>

      <div className="mt-6">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="project-search">
          Search projects
        </label>
        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
          <input
            id="project-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Start typing a project name…"
            className="flex-1 border-none bg-transparent text-sm text-slate-700 focus:outline-none"
          />
        </div>
        {error ? (
          <p className="mt-2 text-sm text-rose-600">Unable to search projects. Try again in a moment.</p>
        ) : null}
        {query.trim().length >= 2 ? (
          <div className="mt-3 space-y-2">
            {searching ? (
              <p className="text-sm text-slate-500">Searching projects…</p>
            ) : results.length ? (
              <ul className="space-y-2">
                {results.map((project) => (
                  <li
                    key={project.id ?? project.slug}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{project.title ?? project.name ?? 'Untitled project'}</p>
                      <p className="text-xs text-slate-500">
                        ID: {project.id ?? project.slug}
                        {project.status ? ` • ${project.status}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelect(project)}
                      className="rounded-xl border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/10"
                    >
                      Open workspace
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No projects found. Refine your search terms.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
