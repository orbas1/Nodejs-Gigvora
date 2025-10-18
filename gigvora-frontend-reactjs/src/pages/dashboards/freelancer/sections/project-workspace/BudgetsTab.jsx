import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { budgetManagerConfig } from './config.js';

export default function BudgetsTab({ budgets, manager, disabled = false }) {
  return (
    <ResourceManager
      title={budgetManagerConfig.title}
      description={budgetManagerConfig.description}
      items={budgets}
      fields={budgetManagerConfig.fields}
      columns={budgetManagerConfig.columns}
      createLabel={budgetManagerConfig.createLabel}
      emptyLabel={budgetManagerConfig.emptyLabel}
      itemName={budgetManagerConfig.itemName}
      disabled={disabled}
      onCreate={(payload) => manager.createBudget(payload)}
      onUpdate={(item, payload) => manager.updateBudget(item.id, payload)}
      onDelete={(item) => manager.deleteBudget(item.id)}
    />
  );
}

BudgetsTab.propTypes = {
  budgets: PropTypes.array,
  manager: PropTypes.shape({
    createBudget: PropTypes.func.isRequired,
    updateBudget: PropTypes.func.isRequired,
    deleteBudget: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};
