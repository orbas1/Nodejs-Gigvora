import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { hrConfig } from './config.js';

export default function TeamTab({ records, manager, disabled = false, readOnlyReason, loading = false }) {
  return (
    <ResourceManager
      title={hrConfig.title}
      description={hrConfig.description}
      items={records}
      fields={hrConfig.fields}
      columns={hrConfig.columns}
      createLabel={hrConfig.createLabel}
      emptyLabel={hrConfig.emptyLabel}
      itemName={hrConfig.itemName}
      disabled={disabled}
      readOnlyMessage={readOnlyReason}
      loading={loading}
      onCreate={(payload) => manager.createHrRecord(payload)}
      onUpdate={(item, payload) => manager.updateHrRecord(item.id, payload)}
      onDelete={(item) => manager.deleteHrRecord(item.id)}
    />
  );
}

TeamTab.propTypes = {
  records: PropTypes.array,
  manager: PropTypes.shape({
    createHrRecord: PropTypes.func.isRequired,
    updateHrRecord: PropTypes.func.isRequired,
    deleteHrRecord: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
  readOnlyReason: PropTypes.string,
  loading: PropTypes.bool,
};
