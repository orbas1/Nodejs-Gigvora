import { useState } from 'react';
import PropTypes from 'prop-types';
import ResourceManager from './ResourceManager.jsx';
import { calendarConfig, meetingsConfig } from './config.js';

const VIEWS = [
  { id: 'meetings', label: 'Meetings' },
  { id: 'calendar', label: 'Calendar' },
];

export default function MeetingsCalendarTab({
  meetings,
  calendarEntries,
  manager,
  disabled = false,
}) {
  const [activeView, setActiveView] = useState('meetings');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setActiveView(view.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeView === view.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {activeView === 'meetings' ? (
        <ResourceManager
          title={meetingsConfig.title}
          description={meetingsConfig.description}
          items={meetings}
          fields={meetingsConfig.fields}
          columns={meetingsConfig.columns}
          createLabel={meetingsConfig.createLabel}
          emptyLabel={meetingsConfig.emptyLabel}
          itemName={meetingsConfig.itemName}
          disabled={disabled}
          onCreate={(payload) => manager.createMeeting(payload)}
          onUpdate={(item, payload) => manager.updateMeeting(item.id, payload)}
          onDelete={(item) => manager.deleteMeeting(item.id)}
        />
      ) : (
        <ResourceManager
          title={calendarConfig.title}
          description={calendarConfig.description}
          items={calendarEntries}
          fields={calendarConfig.fields}
          columns={calendarConfig.columns}
          createLabel={calendarConfig.createLabel}
          emptyLabel={calendarConfig.emptyLabel}
          itemName={calendarConfig.itemName}
          disabled={disabled}
          onCreate={(payload) => manager.createCalendarEntry(payload)}
          onUpdate={(item, payload) => manager.updateCalendarEntry(item.id, payload)}
          onDelete={(item) => manager.deleteCalendarEntry(item.id)}
        />
      )}
    </div>
  );
}

MeetingsCalendarTab.propTypes = {
  meetings: PropTypes.array,
  calendarEntries: PropTypes.array,
  manager: PropTypes.shape({
    createMeeting: PropTypes.func.isRequired,
    updateMeeting: PropTypes.func.isRequired,
    deleteMeeting: PropTypes.func.isRequired,
    createCalendarEntry: PropTypes.func.isRequired,
    updateCalendarEntry: PropTypes.func.isRequired,
    deleteCalendarEntry: PropTypes.func.isRequired,
  }).isRequired,
  disabled: PropTypes.bool,
};
