import SimpleDashboardShell from '../../components/dashboard/SimpleDashboardShell.jsx';

const MENU_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'High level summary of your personal workspace.',
  },
];

export default function UserDashboardPage() {
  return (
    <SimpleDashboardShell
      role="user"
      title="User workspace"
      subtitle="All-in-one hub for your GigVora journey"
      description="We have streamlined the experience into a single overview for now. Future releases will expand this canvas with job tracking, collaboration tools, and personal insights."
      menuItems={MENU_ITEMS}
    >
      <div className="space-y-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-slate-600">
        <p>
          Welcome to your refreshed user dashboard. This overview highlights the start of a simplified experience
          focused on clarity and calm. As new modules ship they will appear in the navigation and populate this
          workspace.
        </p>
        <p>
          For now, use the global navigation to explore the community feed, opportunities, and messaging tools. Your
          saved data remains intact and will resurface here once the dedicated modules are reintroduced.
        </p>
      </div>
    </SimpleDashboardShell>
  );
}
