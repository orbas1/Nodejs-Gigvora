import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { submissionsConfig } from './config.js';

export default function SubmissionsTab({ submissions, manager, disabled = false }) {
  return (
    <ResourceManager
      title={submissionsConfig.title}
      description={submissionsConfig.description}
      items={submissions}
      fields={submissionsConfig.fields}
      columns={submissionsConfig.columns}
      createLabel={submissionsConfig.createLabel}
      emptyLabel={submissionsConfig.emptyLabel}
      itemName={submissionsConfig.itemName}
      disabled={disabled}
      onCreate={(payload) => manager.createSubmission(payload)}
      onUpdate={(item, payload) => manager.updateSubmission(item.id, payload)}
      onDelete={(item) => manager.deleteSubmission(item.id)}
    />
  );
}

SubmissionsTab.propTypes = {
  submissions: PropTypes.array,
  manager: PropTypes.shape({
    createSubmission: PropTypes.func.isRequired,
    updateSubmission: PropTypes.func.isRequired,
    deleteSubmission: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};
