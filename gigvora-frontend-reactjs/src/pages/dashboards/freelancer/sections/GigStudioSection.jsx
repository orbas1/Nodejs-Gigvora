import SectionShell from '../SectionShell.jsx';
import CreationStudioSnapshot from '../../../../components/creationStudio/CreationStudioSnapshot.jsx';

export default function GigStudioSection() {
  return (
    <SectionShell
      id="creation-studio"
      title="Creation Studio"
      description="Launch gigs, jobs, experiences, and campaigns with a dedicated workspace."
      actions={[
        <a
          key="open-studio"
          href="/dashboard/freelancer/creation-studio"
          className="inline-flex items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
        >
          Open full studio
        </a>,
      ]}
    >
      <CreationStudioSnapshot />
    </SectionShell>
  );
}
