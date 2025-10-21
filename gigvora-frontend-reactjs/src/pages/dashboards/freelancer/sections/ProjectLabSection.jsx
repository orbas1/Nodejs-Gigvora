import { useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../SectionShell.jsx';
import useSession from '../../../../hooks/useSession.js';
import useProjectBlueprints from '../../../../hooks/useProjectBlueprints.js';

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

const STAGE_OPTIONS = [
  { value: 'all', label: 'All stages' },
  { value: 'draft', label: 'Draft' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'in-review', label: 'In review' },
  { value: 'archived', label: 'Archived' },
];

const INDUSTRY_OPTIONS = [
  { value: 'all', label: 'All industries' },
  { value: 'financial services', label: 'Financial services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'saas', label: 'SaaS' },
];

function BlueprintRow({ blueprint, onDuplicate, onArchive, busyDuplicate, busyArchive }) {
  const healthTone =
    blueprint.health === 'on-track'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : blueprint.health === 'at-risk'
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-rose-600 bg-rose-50 border-rose-200';
  return (
    <tr className="border-b border-slate-100 text-sm text-slate-600 last:border-0">
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-900">{blueprint.name}</td>
      <td className="whitespace-nowrap px-3 py-3">{blueprint.industry}</td>
      <td className="whitespace-nowrap px-3 py-3 capitalize">{blueprint.stage.replace('-', ' ')}</td>
      <td className="whitespace-nowrap px-3 py-3">{formatDate(blueprint.updatedAt)}</td>
      <td className="whitespace-nowrap px-3 py-3">{blueprint.timelineWeeks} weeks</td>
      <td className="whitespace-nowrap px-3 py-3">{blueprint.budget}</td>
      <td className="whitespace-nowrap px-3 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${healthTone}`}>
          {blueprint.health.replace('-', ' ')}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onDuplicate(blueprint)}
            disabled={busyDuplicate}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => onArchive(blueprint)}
            disabled={busyArchive}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Archive
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProjectLabSection() {
  const { session } = useSession();
  const freelancerId =
    session?.freelancerId ?? session?.profileId ?? session?.userId ?? session?.id ?? null;

  const {
    blueprints,
    metrics,
    templates,
    filters,
    setFilters,
    refresh,
    createBlueprint,
    duplicateBlueprint,
    archiveBlueprint,
    creating,
    duplicatingId,
    archivingId,
    loading,
    error,
  } = useProjectBlueprints({ freelancerId, enabled: Boolean(freelancerId) });

  const [newBlueprintName, setNewBlueprintName] = useState('');
  const [newBlueprintTemplate, setNewBlueprintTemplate] = useState(templates[0]?.id ?? '');

  useEffect(() => {
    if (!templates.length) {
      setNewBlueprintTemplate('');
      return;
    }
    if (!templates.some((template) => template.id === newBlueprintTemplate)) {
      setNewBlueprintTemplate(templates[0].id);
    }
  }, [templates, newBlueprintTemplate]);

  const filteredBlueprints = useMemo(() => {
    return blueprints.filter((blueprint) => {
      const matchesStage = filters.stage === 'all' || blueprint.stage === filters.stage;
      const matchesIndustry = filters.industry === 'all' || blueprint.industry?.toLowerCase() === filters.industry;
      const matchesQuery =
        !filters.query ||
        blueprint.name.toLowerCase().includes(filters.query.toLowerCase()) ||
        blueprint.industry?.toLowerCase().includes(filters.query.toLowerCase());
      return matchesStage && matchesIndustry && matchesQuery;
    });
  }, [blueprints, filters]);

  const summaryCards = useMemo(
    () => [
      { id: 'total', label: 'Blueprints', value: metrics?.total ?? filteredBlueprints.length },
      { id: 'drafts', label: 'Drafts', value: metrics?.drafts ?? 0 },
      { id: 'live', label: 'Live', value: metrics?.live ?? 0 },
      { id: 'automation', label: 'Automation ready', value: metrics?.automationReady ?? 0 },
    ],
    [filteredBlueprints.length, metrics],
  );

  const handleCreateBlueprint = (event) => {
    event.preventDefault();
    if (!newBlueprintName.trim()) {
      return;
    }
    createBlueprint({
      name: newBlueprintName.trim(),
      templateId: newBlueprintTemplate || null,
    })
      .then((result) => {
        if (result?.fallback && typeof window !== 'undefined') {
          window.alert('Connect a freelancer workspace to create production blueprints.');
          return;
        }
        setNewBlueprintName('');
      })
      .catch((err) => {
        console.error('Unable to create blueprint', err);
      });
  };

  const handleDuplicate = (blueprint) => {
    duplicateBlueprint(blueprint.id, { name: `${blueprint.name} (Copy)` })
      .then((result) => {
        if (result?.fallback && typeof window !== 'undefined') {
          window.alert('Connect a freelancer workspace to duplicate blueprints.');
        }
      })
      .catch((err) => {
        console.error('Unable to duplicate blueprint', err);
      });
  };

  const handleArchive = (blueprint) => {
    if (typeof window !== 'undefined' && !window.confirm('Archive this blueprint? You can restore it from the archive later.')) {
      return;
    }
    archiveBlueprint(blueprint.id)
      .then((result) => {
        if (result?.fallback && typeof window !== 'undefined') {
          window.alert('Connect a freelancer workspace to archive blueprints.');
        }
      })
      .catch((err) => {
        console.error('Unable to archive blueprint', err);
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
        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh data
      </button>
    </div>
  );

  return (
    <SectionShell
      id="project-lab"
      title="Project lab"
      description="Blueprint custom enterprise engagements with structured milestones and controls."
      actions={actions}
    >
      {error ? (
        <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error?.message ?? 'Unable to load project lab data.'}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FunnelIcon className="h-5 w-5 text-slate-500" />
                Filters
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-500">Stage</span>
                  <select
                    value={filters.stage}
                    onChange={(event) => setFilters({ stage: event.target.value })}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 focus:border-blue-300 focus:outline-none"
                  >
                    {STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-500">Industry</span>
                  <select
                    value={filters.industry}
                    onChange={(event) => setFilters({ industry: event.target.value })}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 focus:border-blue-300 focus:outline-none"
                  >
                    {INDUSTRY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-500">Search</span>
                  <input
                    type="search"
                    value={filters.query}
                    onChange={(event) => setFilters({ query: event.target.value })}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 focus:border-blue-300 focus:outline-none"
                    placeholder="Find blueprints"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left font-semibold">
                      Blueprint
                    </th>
                    <th scope="col" className="px-3 py-3 text-left font-semibold">
                      Industry
                    </th>
                    <th scope="col" className="px-3 py-3 text-left font-semibold">
                      Stage
                    </th>
                    <th scope="col" className="px-3 py-3 text-left font-semibold">
                      Updated
                    </th>
                    <th scope="col" className="px-3 py-3 text-left font-semibold">
                      Timeline
                    </th>
                    <th scope="col" className="px-3 py-3 text-left font-semibold">
                      Budget
                    </th>
                    <th scope="col" className="px-3 py-3 text-left font-semibold">
                      Health
                    </th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlueprints.length ? (
                    filteredBlueprints.map((blueprint) => (
                      <BlueprintRow
                        key={blueprint.id}
                        blueprint={blueprint}
                        onDuplicate={handleDuplicate}
                        onArchive={handleArchive}
                        busyDuplicate={duplicatingId === blueprint.id}
                        busyArchive={archivingId === blueprint.id}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-sm text-slate-500">
                        No blueprints match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <form
            onSubmit={handleCreateBlueprint}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-900">Create new blueprint</p>
            <p className="mt-1 text-sm text-slate-600">
              Start from a template to generate milestones, deliverables, and automation hooks.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Name</span>
                <input
                  type="text"
                  value={newBlueprintName}
                  onChange={(event) => setNewBlueprintName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none"
                  placeholder="Enterprise launch playbook"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wide text-slate-500">Template</span>
                <select
                  value={newBlueprintTemplate}
                  onChange={(event) => setNewBlueprintTemplate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} · {template.durationWeeks} weeks
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Create blueprint
            </button>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Operational resources</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {templates.map((template) => (
                <li key={template.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{template.name}</p>
                      <p className="text-xs text-slate-500">{template.durationWeeks} week sprint</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600 transition hover:border-blue-300 hover:text-blue-700"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      Open
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}
