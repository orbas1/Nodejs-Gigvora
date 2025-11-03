import SimpleDashboardShell from '../../components/dashboard/SimpleDashboardShell.jsx';

const MENU_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Snapshot of hiring, operations, and upcoming modules.',
  },
];

export default function CompanyDashboardPage() {
  return (
    <SimpleDashboardShell
      role="company"
      title="Company workspace"
      subtitle="Coordinate hiring and collaborations from one streamlined home"
      description="The combined agency and company experience now begins with a single overview. Dedicated modules for hiring pipelines, project delivery, and analytics will return as refreshed surfaces in future updates."
      menuItems={MENU_ITEMS}
    >
      <div className="space-y-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-slate-600">
        <p>
          This canvas is reserved for your organisation&apos;s overview. Use it to orient teams while we rebuild the
          detailed dashboards that previously powered agency and company workflows.
        </p>
        <p>
          Hiring pipelines, launchpad cohorts, project tracking, and intelligence will reappear here with a unified
          information architecture. Until then, continue managing engagements through existing operational tools or
          contact support for assistance.
        </p>
      </div>
    </SimpleDashboardShell>
  );
}
