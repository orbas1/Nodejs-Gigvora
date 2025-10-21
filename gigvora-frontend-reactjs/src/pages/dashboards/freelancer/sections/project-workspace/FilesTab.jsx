import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { filesConfig } from './config.js';

export default function FilesTab({ files, manager, disabled = false, readOnlyReason, loading = false }) {
  return (
    <ResourceManager
      title={filesConfig.title}
      description={filesConfig.description}
      items={files}
      fields={filesConfig.fields}
      columns={filesConfig.columns}
      createLabel={filesConfig.createLabel}
      emptyLabel={filesConfig.emptyLabel}
      itemName={filesConfig.itemName}
      disabled={disabled}
      readOnlyMessage={readOnlyReason}
      loading={loading}
      onCreate={(payload) => manager.createFile(payload)}
      onUpdate={(item, payload) => manager.updateFile(item.id, payload)}
      onDelete={(item) => manager.deleteFile(item.id)}
    />
  );
}

FilesTab.propTypes = {
  files: PropTypes.array,
  manager: PropTypes.shape({
    createFile: PropTypes.func.isRequired,
    updateFile: PropTypes.func.isRequired,
    deleteFile: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
  readOnlyReason: PropTypes.string,
  loading: PropTypes.bool,
};
