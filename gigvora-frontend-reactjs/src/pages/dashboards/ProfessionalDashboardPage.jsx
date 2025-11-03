import SimpleDashboardShell from '../../components/dashboard/SimpleDashboardShell.jsx';

const MENU_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Unified view for mentors, headhunters, and independent professionals.',
  },
];

export default function ProfessionalDashboardPage() {
  return (
    <SimpleDashboardShell
      role="professional"
      title="Professional workspace"
      subtitle="Build relationships, opportunities, and services from one command centre"
      description="Freelancer, mentor, and headhunter dashboards now live together. The overview keeps your activity visible while new specialist modules are crafted."
      menuItems={MENU_ITEMS}
    >
      <div className="space-y-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-slate-600">
        <p>
          Welcome to the consolidated professional experience. This blank canvas is ready to host lead pipelines,
          mentoring programmes, and talent sourcing tools as we reintroduce them with a unified design language.
        </p>
        <p>
          Continue engaging with clients and collaborators through messaging and community features in the meantime.
          We will migrate your historical data into refreshed modules as they return.
        </p>
      </div>
    </SimpleDashboardShell>
  );
}
