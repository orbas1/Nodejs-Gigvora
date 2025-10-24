import PropTypes from 'prop-types';
import { useMemo } from 'react';

export default function CollaborationNotesPanel({ projects, onOpen }) {
  const notes = useMemo(() => {
    return projects
      .flatMap((project) => project.workspace?.notes ? [{ projectId: project.id, title: project.title, notes: project.workspace.notes }] : [])
      .slice(0, 6);
  }, [projects]);

  if (!notes.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
        Collaboration notes populate once you add updates inside project workspaces.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((item) => (
        <button
          key={item.projectId}
          type="button"
          onClick={() => onOpen?.(item.projectId)}
          className="w-full rounded-2xl border border-slate-200 bg-white/90 p-4 text-left shadow-sm transition hover:border-blue-300 hover:text-slate-900"
        >
          <p className="text-sm font-semibold text-slate-900">{item.title ?? 'Untitled project'}</p>
          <p className="mt-2 text-xs text-slate-600 line-clamp-3">{item.notes}</p>
        </button>
      ))}
    </div>
  );
}

CollaborationNotesPanel.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.object),
  onOpen: PropTypes.func,
};

CollaborationNotesPanel.defaultProps = {
  projects: [],
  onOpen: undefined,
};
