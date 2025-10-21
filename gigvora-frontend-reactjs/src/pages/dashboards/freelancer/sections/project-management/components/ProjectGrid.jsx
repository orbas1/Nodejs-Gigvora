import PropTypes from 'prop-types';
import ProjectCard from './ProjectCard.jsx';

export default function ProjectGrid({ projects, onOpen, onArchive, onRestore, loading, emptyState }) {
  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`project-skeleton-${index}`}
            className="animate-pulse rounded-3xl border border-slate-200 bg-slate-100 p-6"
          >
            <div className="h-5 w-1/3 rounded-full bg-slate-200" />
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded-full bg-slate-200" />
              <div className="h-3 w-5/6 rounded-full bg-slate-200" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="h-10 rounded-2xl bg-slate-200" />
              <div className="h-10 rounded-2xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!projects.length) {
    const title = emptyState?.title ?? 'No projects yet';
    const description = emptyState?.description ??
      'Start by creating a project or importing one from another workspace.';
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
        <p className="text-lg font-semibold text-slate-600">{title}</p>
        {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={onOpen}
          onArchive={onArchive}
          onRestore={onRestore}
        />
      ))}
    </div>
  );
}

ProjectGrid.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
  onOpen: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  emptyState: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
};

ProjectGrid.defaultProps = {
  loading: false,
  emptyState: {
    title: 'No projects yet',
    description: 'Start by creating a project or importing one from another workspace.',
  },
};
