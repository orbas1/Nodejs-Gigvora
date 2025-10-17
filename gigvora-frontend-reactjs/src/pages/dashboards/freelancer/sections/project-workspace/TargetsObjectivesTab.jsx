import { useState } from 'react';
import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { objectivesConfig, targetsConfig } from './config.js';

const GOAL_VIEWS = [
  { id: 'targets', label: 'Targets' },
  { id: 'objectives', label: 'Objectives' },
];

export default function TargetsObjectivesTab({ targets, objectives, manager, disabled = false }) {
  const [view, setView] = useState('targets');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {GOAL_VIEWS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setView(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === option.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {view === 'targets' ? (
        <ResourceManager
          title={targetsConfig.title}
          description={targetsConfig.description}
          items={targets}
          fields={targetsConfig.fields}
          columns={targetsConfig.columns}
          createLabel={targetsConfig.createLabel}
          emptyLabel={targetsConfig.emptyLabel}
          itemName={targetsConfig.itemName}
          disabled={disabled}
          onCreate={(payload) => manager.createTarget(payload)}
          onUpdate={(item, payload) => manager.updateTarget(item.id, payload)}
          onDelete={(item) => manager.deleteTarget(item.id)}
        />
      ) : (
        <ResourceManager
          title={objectivesConfig.title}
          description={objectivesConfig.description}
          items={objectives}
          fields={objectivesConfig.fields}
          columns={objectivesConfig.columns}
          createLabel={objectivesConfig.createLabel}
          emptyLabel={objectivesConfig.emptyLabel}
          itemName={objectivesConfig.itemName}
          disabled={disabled}
          onCreate={(payload) => manager.createObjective(payload)}
          onUpdate={(item, payload) => manager.updateObjective(item.id, payload)}
          onDelete={(item) => manager.deleteObjective(item.id)}
        />
      )}
    </div>
  );
}

TargetsObjectivesTab.propTypes = {
  targets: PropTypes.array,
  objectives: PropTypes.array,
  manager: PropTypes.shape({
    createTarget: PropTypes.func.isRequired,
    updateTarget: PropTypes.func.isRequired,
    deleteTarget: PropTypes.func.isRequired,
    createObjective: PropTypes.func.isRequired,
    updateObjective: PropTypes.func.isRequired,
    deleteObjective: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};
