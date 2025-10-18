import DashboardLayout from '../../layouts/DashboardLayout.jsx';

const SECTIONS = [
  {
    id: 'overview',
    title: 'Agency Project Management',
    description: 'This dashboard view is being prepared.',
  },
];

export default function AgencyProjectManagementPage() {
  return (
    <DashboardLayout
      currentDashboard="dashboard"
      title="Agency Project Management"
      description="Stay tuned for a fully interactive experience."
      sections={SECTIONS}
    >
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-600 shadow-sm">
        <p className="text-sm">We're building out the agency project management dashboard. Key actions and insights will appear here soon.</p>
      </div>
    </DashboardLayout>
  );
}
