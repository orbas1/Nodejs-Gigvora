import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { invitesConfig } from './config.js';

export default function InvitesTab({ invites, manager, disabled = false }) {
  return (
    <ResourceManager
      title={invitesConfig.title}
      description={invitesConfig.description}
      items={invites}
      fields={invitesConfig.fields}
      columns={invitesConfig.columns}
      createLabel={invitesConfig.createLabel}
      emptyLabel={invitesConfig.emptyLabel}
      itemName={invitesConfig.itemName}
      disabled={disabled}
      onCreate={(payload) => manager.createInvite(payload)}
      onUpdate={(item, payload) => manager.updateInvite(item.id, payload)}
      onDelete={(item) => manager.deleteInvite(item.id)}
    />
  );
}

InvitesTab.propTypes = {
  invites: PropTypes.array,
  manager: PropTypes.shape({
    createInvite: PropTypes.func.isRequired,
    updateInvite: PropTypes.func.isRequired,
    deleteInvite: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};
