import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import SectionShell from '../../SectionShell.jsx';
import DataStatus from '../../../../../components/DataStatus.jsx';
import useProjectGigManagement from '../../../../../hooks/useProjectGigManagement.js';
import StatsStrip from './components/StatsStrip.jsx';
import ProjectToolbar from './components/ProjectToolbar.jsx';
import ProjectGrid from './components/ProjectGrid.jsx';
import CreateProjectWizard from './components/CreateProjectWizard.jsx';
import ProjectDrawer from './components/ProjectDrawer.jsx';
import {
  filterProjectsByRisk,
  filterProjectsByStatus,
  searchProjects,
  sortProjects,
} from './utils.js';

export default function ProjectManagementSection({ freelancerId }) {
  const { data, loading, error, actions, reload } = useProjectGigManagement(freelancerId);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('open');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortKey, setSortKey] = useState('updated');
  const [showCreate, setShowCreate] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const lifecycle = data?.projectLifecycle ?? { open: [], closed: [], stats: null };
  const currency = data?.summary?.currency ?? data?.projectLifecycle?.stats?.currency ?? 'USD';

  const openProjects = useMemo(() => Array.isArray(lifecycle.open) ? lifecycle.open : [], [lifecycle.open]);
  const closedProjects = useMemo(() => Array.isArray(lifecycle.closed) ? lifecycle.closed : [], [lifecycle.closed]);

  const filteredOpen = useMemo(() => {
    const filtered = filterProjectsByRisk(
      filterProjectsByStatus(searchProjects(openProjects, searchTerm), statusFilter),
      riskFilter,
    );
    return sortProjects(filtered, sortKey);
  }, [openProjects, searchTerm, statusFilter, riskFilter, sortKey]);

  const filteredClosed = useMemo(() => {
    const filtered = filterProjectsByRisk(
      filterProjectsByStatus(searchProjects(closedProjects, searchTerm), statusFilter),
      riskFilter,
    );
    return sortProjects(filtered, sortKey);
  }, [closedProjects, searchTerm, statusFilter, riskFilter, sortKey]);

  const projectsToRender = view === 'open' ? filteredOpen : filteredClosed;
  const allProjects = useMemo(() => [...openProjects, ...closedProjects], [openProjects, closedProjects]);
  const activeProject = useMemo(
    () => allProjects.find((project) => project.id === activeProjectId) ?? null,
    [allProjects, activeProjectId],
  );

  const handleArchive = async (project) => {
    await actions.archiveProject(project.id, {});
  };

  const handleRestore = async (project) => {
    await actions.restoreProject(project.id, {});
  };

  return (
    <SectionShell
      id="project-management"
      title="Projects"
      description="Plan, track, and close out engagements without leaving mission control."
      actions={
        <>
          <div className="hidden lg:flex">
            <label className="sr-only" htmlFor="project-sort">
              Sort
            </label>
            <select
              id="project-sort"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-accent focus:border-accent focus:outline-none"
            >
              <option value="updated">Recent</option>
              <option value="due">Due date</option>
              <option value="client">Client</option>
              <option value="progress">Progress</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accent/90"
          >
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
      />
      <ProjectGrid
        projects={projectsToRender}
        onOpen={(project) => setActiveProjectId(project.id)}
        onArchive={handleArchive}
        onRestore={handleRestore}
        loading={loading}
      />

      <CreateProjectWizard
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(payload) => actions.createProject(payload)}
      />

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
};

ProjectManagementSection.defaultProps = {
  freelancerId: null,
};
