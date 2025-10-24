import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowDownTrayIcon,
  BoltIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import SectionShell from '../../SectionShell.jsx';
import DataStatus from '../../../../../components/DataStatus.jsx';
import useProjectGigManagement from '../../../../../hooks/useProjectGigManagement.js';
import useDebounce from '../../../../../hooks/useDebounce.js';
import StatsStrip from './components/StatsStrip.jsx';
import ProjectToolbar from './components/ProjectToolbar.jsx';
import ProjectGrid from './components/ProjectGrid.jsx';
import CreateProjectWizard from './components/CreateProjectWizard.jsx';
import ProjectDrawer from './components/ProjectDrawer.jsx';
import ProjectKanban from './components/ProjectKanban.jsx';
import TimelineAnalytics from './components/TimelineAnalytics.jsx';
import CollaborationNotesPanel from './components/CollaborationNotesPanel.jsx';
import { applyProjectFilters, exportProjectsToCsv, logProjectAction } from './toolkit.js';

const INITIAL_VISIBLE_COUNT = 12;

export default function ProjectManagementSection({ freelancerId, managementResource, onProjectEvent }) {
  const fallbackResource = useProjectGigManagement(freelancerId, {
    enabled: !managementResource && Boolean(freelancerId),
  });
  const resource = managementResource ?? fallbackResource;
  const { data, loading, error, actions = {}, reload } = resource ?? {};

  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('open');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortKey, setSortKey] = useState('updated');
  const [showCreate, setShowCreate] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  const lifecycle = data?.projectLifecycle ?? { open: [], closed: [], stats: null };
  const currency = data?.summary?.currency ?? lifecycle?.stats?.currency ?? 'USD';

  const openProjects = useMemo(() => (Array.isArray(lifecycle.open) ? lifecycle.open : []), [lifecycle.open]);
  const closedProjects = useMemo(() => (Array.isArray(lifecycle.closed) ? lifecycle.closed : []), [lifecycle.closed]);

  const filteredOpen = useMemo(
    () =>
      applyProjectFilters(openProjects, {
        term: debouncedSearchTerm,
        status: statusFilter,
        risk: riskFilter,
        sort: sortKey,
      }),
    [openProjects, debouncedSearchTerm, statusFilter, riskFilter, sortKey],
  );

  const filteredClosed = useMemo(
    () =>
      applyProjectFilters(closedProjects, {
        term: debouncedSearchTerm,
        status: statusFilter,
        risk: riskFilter,
        sort: sortKey,
      }),
    [closedProjects, debouncedSearchTerm, statusFilter, riskFilter, sortKey],
  );

  const combinedProjects = useMemo(() => [...filteredOpen, ...filteredClosed], [filteredOpen, filteredClosed]);
  const listProjects = view === 'closed' ? filteredClosed : filteredOpen;
  const visibleProjects = useMemo(
    () => listProjects.slice(0, visibleCount),
    [listProjects, visibleCount],
  );

  const activeProject = useMemo(
    () => combinedProjects.find((project) => project.id === activeProjectId) ?? null,
    [combinedProjects, activeProjectId],
  );

  const timelineMilestones = useMemo(() => {
    return combinedProjects
      .map((project) => ({
        id: project.id ?? project.title,
        label: project.workspace?.nextMilestone ?? project.title ?? 'Milestone',
        dueDate: project.workspace?.nextMilestoneDueAt ?? project.dueDate ?? null,
        progress: project.workspace?.progressPercent ?? project.lifecycle?.progressPercent ?? 0,
        budget: project.budgetAllocated
          ? { amount: project.budgetAllocated, currency: project.budgetCurrency ?? currency }
          : null,
      }))
      .filter((item) => item.label);
  }, [combinedProjects, currency]);

  useEffect(() => {
    if (!actionSuccess) {
      return undefined;
    }
    const timeout = setTimeout(() => setActionSuccess(null), 4000);
    return () => clearTimeout(timeout);
  }, [actionSuccess]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [view, debouncedSearchTerm, statusFilter, riskFilter, sortKey, filteredOpen.length, filteredClosed.length]);

  useEffect(() => {
    if (view !== 'open' && view !== 'closed') {
      return undefined;
    }
    const handleScroll = () => {
      if (listProjects.length <= visibleCount) {
        return;
      }
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 320) {
        setVisibleCount((previous) => Math.min(previous + 8, listProjects.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [listProjects.length, view, visibleCount]);

  useEffect(() => {
    logProjectAction('filters.applied', {
      view,
      status: statusFilter,
      risk: riskFilter,
      sort: sortKey,
      query: debouncedSearchTerm,
    });
    onProjectEvent?.('filters.applied', {
      view,
      status: statusFilter,
      risk: riskFilter,
      sort: sortKey,
      query: debouncedSearchTerm,
    });
  }, [debouncedSearchTerm, onProjectEvent, riskFilter, sortKey, statusFilter, view]);

  const runProjectAction = useCallback(
    async (task, { successMessage, propagate = false, eventName, eventPayload } = {}) => {
      setActionError(null);
      setActionSuccess(null);
      try {
        const result = await task();
        if (successMessage) {
          setActionSuccess(successMessage);
        }
        if (eventName) {
          logProjectAction(eventName, eventPayload);
          onProjectEvent?.(eventName, eventPayload);
        }
        return result;
      } catch (error) {
        console.error('Project action failed', error);
        setActionError(error?.message ?? 'Unable to process the project request.');
        if (propagate) {
          throw error;
        }
        return null;
      }
    },
    [onProjectEvent],
  );

  const handleExportProjects = useCallback(() => {
    if (!combinedProjects.length || exporting) {
      return;
    }
    setExporting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      exportProjectsToCsv(combinedProjects, {
        filename: `gigvora-projects-${new Date().toISOString().slice(0, 10)}.csv`,
      });
      setActionSuccess('Projects exported to CSV.');
      logProjectAction('exported', { count: combinedProjects.length });
      onProjectEvent?.('exported', { count: combinedProjects.length });
    } catch (error) {
      console.error('Failed to export projects', error);
      setActionError(error?.message ?? 'Unable to export projects.');
    } finally {
      setExporting(false);
    }
  }, [combinedProjects, exporting, onProjectEvent]);

  const handleArchive = async (project) => {
    if (typeof actions.archiveProject !== 'function') {
      return;
    }
    await runProjectAction(() => actions.archiveProject(project.id, {}), {
      successMessage: 'Project archived.',
      eventName: 'archived',
      eventPayload: { projectId: project.id },
    });
  };

  const handleRestore = async (project) => {
    if (typeof actions.restoreProject !== 'function') {
      return;
    }
    await runProjectAction(() => actions.restoreProject(project.id, {}), {
      successMessage: 'Project restored.',
      eventName: 'restored',
      eventPayload: { projectId: project.id },
    });
  };

  const handleCreateProject = useCallback(
    async (payload) => {
      if (typeof actions.createProject !== 'function') {
        return null;
      }
      const result = await runProjectAction(() => actions.createProject(payload), {
        successMessage: 'Project created.',
        propagate: true,
        eventName: 'created',
        eventPayload: { payload },
      });
      if (result?.id) {
        logProjectAction('created', { projectId: result.id });
        onProjectEvent?.('created', { projectId: result.id });
      }
      return result;
    },
    [actions, onProjectEvent, runProjectAction],
  );

  const filtersApplied = Boolean(debouncedSearchTerm.trim()) || statusFilter !== 'all' || riskFilter !== 'all';

  const emptyState = useMemo(() => {
    if (view === 'closed') {
      if (filtersApplied) {
        return {
          title: 'No closed projects match the current filters.',
          description: 'Adjust filters or review archived workspaces to find the engagement you need.',
        };
      }
      return {
        title: 'No closed projects yet',
        description: 'Projects will appear here once engagements are completed and archived.',
      };
    }
    if (filtersApplied) {
      return {
        title: 'No projects match the current filters.',
        description: 'Try updating the search, status, or risk filters to broaden the results.',
      };
    }
    return {
      title: 'No projects yet',
      description: 'Start by creating a project or importing one from another workspace.',
    };
  }, [filtersApplied, view]);

  const showLoadMore = (view === 'open' || view === 'closed') && visibleProjects.length < listProjects.length;

  return (
    <SectionShell
      id="project-management"
      title="Projects"
      description="Plan, track, and close out engagements without leaving mission control."
      actions={
        <>
          <button
            type="button"
            onClick={handleExportProjects}
            disabled={exporting || combinedProjects.length === 0}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowDownTrayIcon className={`h-4 w-4 ${exporting ? 'animate-pulse' : ''}`} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open('/project-auto-match', '_blank', 'noopener,noreferrer');
              }
              logProjectAction('autoMatch.launch', { projectCount: combinedProjects.length });
              onProjectEvent?.('autoMatch.launch', { projectCount: combinedProjects.length });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
          >
            <BoltIcon className="h-4 w-4" />
            Auto-match queue
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <ViewColumnsIcon className="h-4 w-4" />
            New project
          </button>
        </>
      }
    >
      <StatsStrip stats={lifecycle.stats} currency={currency} />
      <DataStatus
        loading={loading}
        fromCache={data?.meta?.fromCache ?? data?.projectLifecycle?.meta?.fromCache ?? false}
        lastUpdated={
          data?.meta?.lastUpdated ??
          data?.projectLifecycle?.meta?.generatedAt ??
          data?.projectLifecycle?.stats?.generatedAt ??
          null
        }
        onRefresh={reload}
        error={error}
      />
      <ProjectToolbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        activeView={view}
        onViewChange={setView}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        sortKey={sortKey}
        onSortKeyChange={setSortKey}
      />
      {actionError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">{actionError}</div>
      ) : null}
      {actionSuccess ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700">
          {actionSuccess}
        </div>
      ) : null}

      {view === 'kanban' ? (
        <ProjectKanban projects={combinedProjects} onOpen={(project) => setActiveProjectId(project.id)} />
      ) : view === 'timeline' ? (
        <TimelineAnalytics milestones={timelineMilestones} />
      ) : (
        <>
          <ProjectGrid
            projects={visibleProjects}
            onOpen={(project) => setActiveProjectId(project.id)}
            onArchive={handleArchive}
            onRestore={handleRestore}
            loading={loading}
            emptyState={emptyState}
          />
          {showLoadMore ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((previous) => Math.min(previous + 12, listProjects.length))}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <Squares2X2Icon className="h-4 w-4" />
                Load more projects
              </button>
            </div>
          ) : null}
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Timeline analytics</h3>
            <ChartBarIcon className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-4">
            <TimelineAnalytics milestones={timelineMilestones.slice(0, 6)} />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Collaboration notes</h3>
            <ViewColumnsIcon className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-4">
            <CollaborationNotesPanel
              projects={combinedProjects}
              onOpen={(projectId) => {
                setActiveProjectId(projectId);
                setView('open');
              }}
            />
          </div>
        </div>
      </div>

      <CreateProjectWizard open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreateProject} />

      {activeProject ? (
        <ProjectDrawer
          open={Boolean(activeProject)}
          project={activeProject}
          onClose={() => setActiveProjectId(null)}
          actions={actions}
        />
      ) : null}
    </SectionShell>
  );
}

ProjectManagementSection.propTypes = {
  freelancerId: PropTypes.number,
  managementResource: PropTypes.shape({
    data: PropTypes.object,
    loading: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    actions: PropTypes.object,
    reload: PropTypes.func,
  }),
  onProjectEvent: PropTypes.func,
};

ProjectManagementSection.defaultProps = {
  freelancerId: null,
  managementResource: null,
  onProjectEvent: undefined,
};
