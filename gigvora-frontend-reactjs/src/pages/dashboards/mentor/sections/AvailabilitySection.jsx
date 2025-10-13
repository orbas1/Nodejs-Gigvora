import MentorAvailabilityPlanner from '../../../../components/mentor/MentorAvailabilityPlanner.jsx';
import analytics from '../../../../services/analytics.js';

export default function AvailabilitySection({ availability, onSave, saving }) {
  return (
    <MentorAvailabilityPlanner availability={availability} onSave={onSave} saving={saving} analytics={analytics} />
  );
}
