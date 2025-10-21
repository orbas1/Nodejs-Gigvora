import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { rolesConfig } from './config.js';

export default function RolesTab({ roles, manager, disabled = false, readOnlyReason, loading = false }) {
  return (
    <ResourceManager
      title={rolesConfig.title}
      description={rolesConfig.description}
      items={roles}
      fields={rolesConfig.fields}
      columns={rolesConfig.columns}
      createLabel={rolesConfig.createLabel}
      emptyLabel={rolesConfig.emptyLabel}
      itemName={rolesConfig.itemName}
      disabled={disabled}
      readOnlyMessage={readOnlyReason}
      loading={loading}
      onCreate={(payload) => manager.createRole(payload)}
      onUpdate={(item, payload) => manager.updateRole(item.id, payload)}
      onDelete={(item) => manager.deleteRole(item.id)}
    />
  );
}

RolesTab.propTypes = {
  roles: PropTypes.array,
  manager: PropTypes.shape({
    createRole: PropTypes.func.isRequired,
    updateRole: PropTypes.func.isRequired,
    deleteRole: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
  readOnlyReason: PropTypes.string,
  loading: PropTypes.bool,
};
