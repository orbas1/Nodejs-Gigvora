import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { objectManagerConfig } from './config.js';

export default function ObjectsTab({ objects, manager, disabled = false }) {
  return (
    <ResourceManager
      title={objectManagerConfig.title}
      description={objectManagerConfig.description}
      items={objects}
      fields={objectManagerConfig.fields}
      columns={objectManagerConfig.columns}
      createLabel={objectManagerConfig.createLabel}
      emptyLabel={objectManagerConfig.emptyLabel}
      itemName={objectManagerConfig.itemName}
      disabled={disabled}
      onCreate={(payload) => manager.createObject(payload)}
      onUpdate={(item, payload) => manager.updateObject(item.id, payload)}
      onDelete={(item) => manager.deleteObject(item.id)}
    />
  );
}

ObjectsTab.propTypes = {
  objects: PropTypes.array,
  manager: PropTypes.shape({
    createObject: PropTypes.func.isRequired,
    updateObject: PropTypes.func.isRequired,
    deleteObject: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};
