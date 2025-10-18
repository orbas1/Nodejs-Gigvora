import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { timeLogConfig } from './config.js';

export default function TimeLogsTab({ entries, manager, disabled = false }) {
  return (
    <ResourceManager
      title={timeLogConfig.title}
      description={timeLogConfig.description}
      items={entries}
      fields={timeLogConfig.fields}
      columns={timeLogConfig.columns}
      createLabel={timeLogConfig.createLabel}
      emptyLabel={timeLogConfig.emptyLabel}
      itemName={timeLogConfig.itemName}
      disabled={disabled}
      onCreate={(payload) => manager.createTimeLog(payload)}
      onUpdate={(item, payload) => manager.updateTimeLog(item.id, payload)}
      onDelete={(item) => manager.deleteTimeLog(item.id)}
    />
  );
}

TimeLogsTab.propTypes = {
  entries: PropTypes.array,
  manager: PropTypes.shape({
    createTimeLog: PropTypes.func.isRequired,
    updateTimeLog: PropTypes.func.isRequired,
    deleteTimeLog: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};
