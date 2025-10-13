import MentorPackageBuilder from '../../../../components/mentor/MentorPackageBuilder.jsx';
import analytics from '../../../../services/analytics.js';

export default function PackagesSection({ packages, onSave, saving }) {
  return <MentorPackageBuilder packages={packages} onSave={onSave} saving={saving} analytics={analytics} />;
}
