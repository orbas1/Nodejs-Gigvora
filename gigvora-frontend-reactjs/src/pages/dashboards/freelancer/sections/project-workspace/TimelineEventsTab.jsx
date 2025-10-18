import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { timelineEventsConfig } from './config.js';

export default function TimelineEventsTab({ timelineEvents, manager, disabled = false }) {
  return (
    <ResourceManager
      title={timelineEventsConfig.title}
      description={timelineEventsConfig.description}
      items={timelineEvents}
      fields={timelineEventsConfig.fields}
      columns={timelineEventsConfig.columns}
      createLabel={timelineEventsConfig.createLabel}
      emptyLabel={timelineEventsConfig.emptyLabel}
      itemName={timelineEventsConfig.itemName}
      disabled={disabled}
      onCreate={(payload) => manager.createTimelineEvent(payload)}
      onUpdate={(item, payload) => manager.updateTimelineEvent(item.id, payload)}
      onDelete={(item) => manager.deleteTimelineEvent(item.id)}
    />
  );
}

TimelineEventsTab.propTypes = {
  timelineEvents: PropTypes.array,
  manager: PropTypes.shape({
    createTimelineEvent: PropTypes.func.isRequired,
    updateTimelineEvent: PropTypes.func.isRequired,
    deleteTimelineEvent: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};
