import PropTypes from 'prop-types';
import { useMemo } from 'react';
import OverviewPanel from './panels/OverviewPanel.jsx';
import ApplicationsPanel from './panels/ApplicationsPanel.jsx';
import InterviewsPanel from './panels/InterviewsPanel.jsx';
import FavouritesPanel from './panels/FavouritesPanel.jsx';
import ResponsesPanel from './panels/ResponsesPanel.jsx';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', sectionId: 'job-hub-overview' },
  { id: 'company', label: 'Company dash', sectionId: 'job-hub-overview-company' },
  { id: 'headhunter', label: 'Headhunter desk', sectionId: 'job-hub-overview-headhunter' },
  { id: 'agency', label: 'Agency desk', sectionId: 'job-hub-overview-agency' },
  { id: 'apps', label: 'Apps', sectionId: 'job-hub-apps' },
  { id: 'meets', label: 'Meets', sectionId: 'job-hub-meets' },
  { id: 'saved', label: 'Saved', sectionId: 'job-hub-saved' },
  { id: 'replies', label: 'Replies', sectionId: 'job-hub-replies' },
];

function resolveNavItems(workspace) {
  const summary = workspace?.summary ?? {};
  return NAV_ITEMS.map((item) => {
    switch (item.id) {
      case 'overview':
        return { ...item, count: (workspace?.jobListings ?? []).length || summary.totalApplications || 0 };
      case 'company':
      case 'headhunter':
      case 'agency':
        return { ...item, count: summary.totalApplications ?? 0 };
      case 'apps':
        return { ...item, count: summary.activeApplications ?? 0 };
      case 'meets':
        return { ...item, count: summary.interviewsScheduled ?? 0 };
      case 'saved':
        return { ...item, count: summary.favourites ?? 0 };
      case 'replies':
        return { ...item, count: summary.pendingResponses ?? 0 };
      default:
        return { ...item, count: summary.totalApplications ?? 0 };
    }
  });
}

export default function JobApplicationWorkspaceLayout({
  workspace,
  activeView,
  onChangeView,
  onCreateJob,
  onCreateApplication,
  onEditApplication,
  onArchiveApplication,
  onCreateInterview,
  onEditInterview,
  onDeleteInterview,
  onCreateFavourite,
  onEditFavourite,
  onDeleteFavourite,
  onCreateResponse,
  onEditResponse,
  onDeleteResponse,
  actionError,
}) {
  const navItems = useMemo(() => resolveNavItems(workspace), [workspace]);

  const {
    summary,
    statusBreakdown,
    recommendedActions,
    applications,
    interviews,
    favourites,
    responses,
    jobListings,
    pipelineSnapshot,
  } = workspace ?? {};

  let panel = null;
  switch (activeView) {
    case 'apps':
      panel = (
        <section id="job-hub-apps" className="h-full">
          <ApplicationsPanel
            applications={applications ?? []}
            onCreate={onCreateApplication}
            onEdit={onEditApplication}
            onArchive={onArchiveApplication}
          />
        </section>
      );
      break;
    case 'meets':
      panel = (
        <section id="job-hub-meets" className="h-full">
          <InterviewsPanel
            interviews={interviews ?? []}
            applications={applications ?? []}
            onCreate={onCreateInterview}
            onEdit={onEditInterview}
            onDelete={onDeleteInterview}
          />
        </section>
      );
      break;
    case 'saved':
      panel = (
        <section id="job-hub-saved" className="h-full">
          <FavouritesPanel
            favourites={favourites ?? []}
            onCreate={onCreateFavourite}
            onEdit={onEditFavourite}
            onDelete={onDeleteFavourite}
          />
        </section>
      );
      break;
    case 'replies':
      panel = (
        <section id="job-hub-replies" className="h-full">
          <ResponsesPanel
            responses={responses ?? []}
            applications={applications ?? []}
            onCreate={onCreateResponse}
            onEdit={onEditResponse}
            onDelete={onDeleteResponse}
          />
        </section>
      );
      break;
    case 'company':
    case 'headhunter':
    case 'agency':
      panel = (
        <section id={`job-hub-overview-${activeView}`} className="h-full">
          <OverviewPanel
            summary={summary}
            statusBreakdown={statusBreakdown ?? []}
            recommendedActions={recommendedActions ?? []}
            jobListings={jobListings ?? []}
            pipelineSnapshot={pipelineSnapshot ?? null}
            applications={applications ?? []}
            onCreateJob={onCreateJob}
            onCreateApplication={onCreateApplication}
            onCreateInterview={onCreateInterview}
            onCreateFavourite={onCreateFavourite}
            onCreateResponse={onCreateResponse}
            defaultPersona={activeView}
          />
        </section>
      );
      break;
    default:
      panel = (
        <section id="job-hub-overview" className="h-full">
          <OverviewPanel
            summary={summary}
            statusBreakdown={statusBreakdown ?? []}
            recommendedActions={recommendedActions ?? []}
            jobListings={jobListings ?? []}
            pipelineSnapshot={pipelineSnapshot ?? null}
            applications={applications ?? []}
            onCreateJob={onCreateJob}
            onCreateApplication={onCreateApplication}
            onCreateInterview={onCreateInterview}
            onCreateFavourite={onCreateFavourite}
            onCreateResponse={onCreateResponse}
            defaultPersona="company"
          />
        </section>
      );
      break;
  }

  return (
    <div className="grid h-full gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = item.id === activeView;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onChangeView(item.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-full border text-xs ${
                    isActive ? 'border-white/40 bg-white/20 text-white' : 'border-slate-200 bg-white text-slate-600'
                  }`}>
                    {item.count ?? 0}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex h-full flex-col gap-4">
        {actionError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {actionError.message ?? 'Action failed. Try again in a moment.'}
          </div>
        ) : null}
        <div className="flex-1 overflow-hidden">{panel}</div>
      </div>
    </div>
  );
}

JobApplicationWorkspaceLayout.propTypes = {
  workspace: PropTypes.shape({
    summary: PropTypes.object,
    statusBreakdown: PropTypes.array,
    recommendedActions: PropTypes.array,
    applications: PropTypes.array,
    interviews: PropTypes.array,
    favourites: PropTypes.array,
    responses: PropTypes.array,
    jobListings: PropTypes.array,
    pipelineSnapshot: PropTypes.object,
  }),
  activeView: PropTypes.string.isRequired,
  onChangeView: PropTypes.func.isRequired,
  onCreateApplication: PropTypes.func.isRequired,
  onEditApplication: PropTypes.func.isRequired,
  onArchiveApplication: PropTypes.func.isRequired,
  onCreateInterview: PropTypes.func.isRequired,
  onEditInterview: PropTypes.func.isRequired,
  onDeleteInterview: PropTypes.func.isRequired,
  onCreateFavourite: PropTypes.func.isRequired,
  onEditFavourite: PropTypes.func.isRequired,
  onDeleteFavourite: PropTypes.func.isRequired,
  onCreateResponse: PropTypes.func.isRequired,
  onEditResponse: PropTypes.func.isRequired,
  onDeleteResponse: PropTypes.func.isRequired,
  actionError: PropTypes.shape({ message: PropTypes.string }),
  onCreateJob: PropTypes.func,
};

JobApplicationWorkspaceLayout.defaultProps = {
  workspace: null,
  actionError: null,
  onCreateJob: undefined,
};
