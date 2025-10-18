import DashboardLayout from '../../layouts/DashboardLayout.jsx';

const SECTIONS = [
  {
    id: 'overview',
    title: 'Company Creation Studio',
    description: 'This dashboard view is being prepared.',
  },
];

export default function CompanyCreationStudioPage() {
  return (
    <DashboardLayout
      currentDashboard="dashboard"
      title="Company Creation Studio"
      description="Stay tuned for a fully interactive experience."
      sections={SECTIONS}
    >
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-600 shadow-sm">
        <p className="text-sm">We're building out the company creation studio dashboard. Key actions and insights will appear here soon.</p>
      </div>
    </DashboardLayout>
  );
}
