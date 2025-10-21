import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import {
  fetchProjectPortfolio,
} from '../../../services/adminProjectManagement.js';
import ProjectCreateWizard from './ProjectCreateWizard.jsx';
import ProjectWorkspaceDrawer from './ProjectWorkspaceDrawer.jsx';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
];

const RISK_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const VIEW_MODES = [
  { value: 'table', label: 'Table', icon: ListBulletIcon },
  { value: 'board', label: 'Board', icon: Squares2X2Icon },
];

const RISK_INDICATOR_CLASSES = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
};

const BREAKDOWN_BADGE_CLASSES = {
  planning: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  at_risk: 'bg-rose-100 text-rose-700',
  on_hold: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};

function SummaryTile({ title, value, accent = '' }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm shadow-indigo-100/40">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      {accent ? <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{accent}</p> : null}
    </div>
  );
}

SummaryTile.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  accent: PropTypes.string,
};

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function ProjectsBoard({ initialSnapshot = null }) {
  const [portfolio, setPortfolio] = useState(initialSnapshot ?? null);
  const [loading, setLoading] = useState(!initialSnapshot);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', risk: '', ownerId: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  const filtersRef = useRef(filters);
  const portfolioRef = useRef(portfolio);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const owners = useMemo(() => portfolio?.owners ?? [], [portfolio]);

  const projects = portfolio?.projects ?? [];

  const boardLanes = useMemo(() => portfolio?.board ?? [], [portfolio]);

  const breakdowns = useMemo(() => {
    const statusMap = portfolio?.breakdowns?.status ?? {};
    const riskMap = portfolio?.breakdowns?.risk ?? {};
    const statusTotal = Object.values(statusMap).reduce((total, value) => total + Number(value ?? 0), 0);
    const riskTotal = Object.values(riskMap).reduce((total, value) => total + Number(value ?? 0), 0);
    const normalize = (map, total) =>
      Object.entries(map).map(([key, count]) => ({
        key,
        label: key.replace(/_/g, ' '),
        count,
        percent: total > 0 ? Math.round((Number(count ?? 0) / total) * 100) : 0,
      }));

    return {
      status: normalize(statusMap, statusTotal),
      risk: normalize(riskMap, riskTotal),
    };
  }, [portfolio]);

  const summaryCards = useMemo(() => {
    const snapshot = portfolio?.summary;
    if (!snapshot) {
      return [];
    }
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    return [
      {
        title: 'Projects',
        value: new Intl.NumberFormat().format(snapshot.totalProjects ?? 0),
        accent: `${new Intl.NumberFormat().format(snapshot.activeProjects ?? 0)} active`,
      },
      {
        title: 'At risk',
        value: new Intl.NumberFormat().format(snapshot.atRiskProjects ?? 0),
        accent: `${new Intl.NumberFormat().format(snapshot.completedProjects ?? 0)} done`,
      },
      {
        title: 'Budget',
        value: formatter.format(snapshot.budgetAllocated ?? 0),
        accent: `Spent ${formatter.format(snapshot.budgetSpent ?? 0)}`,
      },
      {
        title: 'Progress',
        value: `${Math.round(snapshot.averageProgress ?? 0)}%`,
        accent: 'Average completion',
      },
    ];
  }, [portfolio]);

  const loadPortfolio = useCallback(async (overrides = {}) => {
    const baseFilters = filtersRef.current;
    const nextFilters = { ...baseFilters, ...overrides };
    filtersRef.current = nextFilters;
    setFilters(nextFilters);

    const hasExistingSnapshot = Boolean(portfolioRef.current);
    if (!hasExistingSnapshot) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const params = {
        search: nextFilters.search || undefined,
        ownerId: nextFilters.ownerId || undefined,
        statuses: nextFilters.status || undefined,
        riskLevels: nextFilters.risk || undefined,
      };
      const snapshot = await fetchProjectPortfolio(params);
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setPortfolio(snapshot);
    } catch (err) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      if (err?.status === 403) {
        setError(
          'You do not have permission to view project portfolio data. Ask an administrator to grant the project:manage or platform:admin role.',
        );
      } else if (err?.status === 401) {
        setError('Your session has expired. Sign in again to reload projects.');
      } else {
        setError(err?.message || 'Unable to load projects.');
      }
    } finally {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSnapshot) {
      loadPortfolio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadPortfolio({ search: filters.search });
  };

  const handleFilterChange = (field, value) => {
    const nextValue = value === 'all' ? '' : value;
    loadPortfolio({ [field]: nextValue });
  };

  const handleRefresh = () => {
    loadPortfolio();
  };

  const handleViewChange = (mode) => {
    setViewMode(mode);
  };

  const handleOpenProject = (projectId) => {
    setSelectedProjectId(projectId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedProjectId(null);
  };

  const handleCreated = async (project) => {
    await loadPortfolio();
    if (project?.id) {
      setSelectedProjectId(project.id);
      setDrawerOpen(true);
    }
  };

  const handleUpdated = async () => {
    await loadPortfolio();
  };

  const renderRows = () => {
    if (loading && !portfolio) {
      return (
        <tr>
          <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-500">
            Loading projects…
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={7} className="px-4 py-16 text-center text-sm text-rose-600">
            {error}
          </td>
        </tr>
      );
    }

    if (!projects.length) {
      return (
        <tr>
          <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-500">
            No projects yet.
          </td>
        </tr>
      );
    }

    return projects.map((project) => {
      const statusLabel = project.status?.replace(/_/g, ' ') ?? '—';
      const riskLabel = project.workspace?.riskLevel?.replace(/_/g, ' ') ?? '—';
      const ownerName = project.owner?.name ?? project.owner?.fullName ?? `User ${project.ownerId}`;
      const dueDate = project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '—';
      const progress = project.workspace?.progressPercent != null ? `${Math.round(project.workspace.progressPercent)}%` : '—';
      return (
        <tr
          key={project.id}
          className="cursor-pointer border-t border-slate-100 transition hover:bg-indigo-50/40"
          onClick={() => handleOpenProject(project.id)}
        >
          <td className="px-4 py-4 text-sm font-semibold text-slate-900">{project.title}</td>
          <td className="px-4 py-4 text-sm text-slate-600">{ownerName}</td>
          <td className="px-4 py-4 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {statusLabel}
            </span>
          </td>
          <td className="px-4 py-4 text-sm text-slate-600">
            <span
              className={classNames(
                'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                project.workspace?.riskLevel === 'high'
                  ? 'bg-rose-100 text-rose-700'
                  : project.workspace?.riskLevel === 'medium'
                  ? 'bg-amber-100 text-amber-700'
                  : project.workspace?.riskLevel === 'low'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {riskLabel}
            </span>
          </td>
          <td className="px-4 py-4 text-sm text-slate-600">{progress}</td>
          <td className="px-4 py-4 text-sm text-slate-600">{dueDate}</td>
          <td className="px-4 py-4 text-right text-sm font-semibold text-accent">Open</td>
        </tr>
      );
    });
  };

  const renderBoard = () => {
    if (loading && !portfolio) {
      return (
        <div className="flex min-h-[22rem] items-center justify-center text-sm text-slate-500">Loading projects…</div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[22rem] items-center justify-center text-sm text-rose-600">{error}</div>
      );
    }

    if (!boardLanes.length) {
      return (
        <div className="flex min-h-[22rem] items-center justify-center text-sm text-slate-500">No projects yet.</div>
      );
    }

    return (
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4 pb-1">
          {boardLanes.map((lane) => (
            <div
              key={lane.key}
              className="flex w-80 flex-col rounded-3xl border border-slate-200 bg-white/95 shadow-sm shadow-indigo-100/40"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{lane.label}</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{lane.count}</span>
              </div>
              <div className="flex max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto px-5 pb-6">
                {lane.projects.length ? (
                  lane.projects.map((project) => {
                    const ownerName =
                      project.owner?.name ?? project.owner?.fullName ?? (project.ownerId ? `User ${project.ownerId}` : '—');
                    const progress = Math.max(0, Math.min(100, Math.round(Number(project.progressPercent ?? 0))));
                    const dueLabel = project.nextMilestoneDueAt
                      ? new Date(project.nextMilestoneDueAt).toLocaleDateString()
                      : 'No date';
                    const milestoneLabel = project.nextMilestone || 'No milestone';
                    const riskClass = RISK_INDICATOR_CLASSES[project.riskLevel] ?? 'bg-slate-400';
                    const riskLabel = project.riskLevel ? project.riskLevel.replace(/_/g, ' ') : '—';
                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => handleOpenProject(project.id)}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{project.title}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{ownerName}</p>
                          </div>
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            <span className={`h-2 w-2 rounded-full ${riskClass}`} />
                            {riskLabel}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                            <span>Progress</span>
                            <span className="text-slate-700">{progress}%</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate" title={milestoneLabel}>
                            {milestoneLabel}
                          </span>
                          <span>{dueLabel}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-10 text-xs font-medium uppercase tracking-wide text-slate-300">
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <section id="overview" className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_40px_120px_-70px_rgba(79,70,229,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Snapshot</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Projects</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              disabled={refreshing}
            >
              <ArrowPathIcon className={classNames('mr-2 h-4 w-4', refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              <PlusIcon className="mr-2 h-4 w-4" /> New
            </button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryTile key={card.title} {...card} />
          ))}
        </div>
        {(breakdowns.status.length || breakdowns.risk.length) && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {breakdowns.status.length ? (
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {breakdowns.status.map((entry) => (
                    <span
                      key={entry.key}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${BREAKDOWN_BADGE_CLASSES[entry.key] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      <span className="capitalize">{entry.label}</span>
                      <span className="text-slate-600">{entry.count}</span>
                      <span className="text-slate-500">{entry.percent}%</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {breakdowns.risk.length ? (
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Risk</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {breakdowns.risk.map((entry) => (
                    <span
                      key={entry.key}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${BREAKDOWN_BADGE_CLASSES[entry.key] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      <span className="capitalize">{entry.label}</span>
                      <span className="text-slate-600">{entry.count}</span>
                      <span className="text-slate-500">{entry.percent}%</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section id="portfolio" className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 xl:flex-1">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2"
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search"
                aria-label="Search projects"
                className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none"
              />
            </form>
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => handleViewChange(mode.value)}
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                    viewMode === mode.value
                      ? 'bg-accent text-white shadow-soft'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  <mode.icon className="h-4 w-4" />
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <FunnelIcon className="h-4 w-4" />
            <select
              value={filters.status || 'all'}
              onChange={(event) => handleFilterChange('status', event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 focus:border-accent focus:outline-none"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value || 'all'}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.risk || 'all'}
              onChange={(event) => handleFilterChange('risk', event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 focus:border-accent focus:outline-none"
              aria-label="Filter by risk"
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value || 'all'}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.ownerId || 'all'}
              onChange={(event) => handleFilterChange('ownerId', event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 focus:border-accent focus:outline-none"
              aria-label="Filter by owner"
            >
              <option value="all">Owners</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name || owner.fullName || `User ${owner.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          {viewMode === 'board' ? (
            renderBoard()
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Owner
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Risk
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Progress
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Due
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">

                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">{renderRows()}</tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <ProjectCreateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        owners={owners}
        onCreated={handleCreated}
      />
      <ProjectWorkspaceDrawer
        open={drawerOpen}
        projectId={selectedProjectId}
        owners={owners}
        onClose={handleCloseDrawer}
        onUpdated={handleUpdated}
      />
    </div>
  );
}

ProjectsBoard.propTypes = {
  initialSnapshot: PropTypes.shape({
    summary: PropTypes.object,
    projects: PropTypes.arrayOf(PropTypes.object),
    owners: PropTypes.arrayOf(PropTypes.object),
  }),
};
