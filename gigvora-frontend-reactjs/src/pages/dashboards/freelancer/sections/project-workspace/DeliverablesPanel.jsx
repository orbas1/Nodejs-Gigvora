import { useState } from 'react';
import PropTypes from 'prop-types';
import ObjectsTab from './ObjectsTab.jsx';
import SubmissionsTab from './SubmissionsTab.jsx';

const PANES = [
  { id: 'objects', label: 'Objects' },
  { id: 'submissions', label: 'Submissions' },
];

export default function DeliverablesPanel({ objects, submissions, manager, disabled = false }) {
  const [activePane, setActivePane] = useState('objects');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PANES.map((pane) => (
          <button
            key={pane.id}
            type="button"
            onClick={() => setActivePane(pane.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activePane === pane.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            {pane.label}
          </button>
        ))}
      </div>

      {activePane === 'objects' ? (
        <ObjectsTab objects={objects} manager={manager} disabled={disabled} />
      ) : (
        <SubmissionsTab submissions={submissions} manager={manager} disabled={disabled} />
      )}
    </div>
  );
}

DeliverablesPanel.propTypes = {
  objects: PropTypes.array,
  submissions: PropTypes.array,
  manager: PropTypes.shape({
    createObject: PropTypes.func.isRequired,
    updateObject: PropTypes.func.isRequired,
    deleteObject: PropTypes.func.isRequired,
    createSubmission: PropTypes.func.isRequired,
    updateSubmission: PropTypes.func.isRequired,
    deleteSubmission: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};
