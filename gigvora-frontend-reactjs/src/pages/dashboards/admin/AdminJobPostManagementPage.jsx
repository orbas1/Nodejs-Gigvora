import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import JobPostManagementWorkspace from '../../../components/admin/job-posts/JobPostManagementWorkspace.jsx';

const MENU_SECTIONS = [
  {
    label: 'Jobs',
    items: [
      {
        id: 'jobs-board',
        name: 'Board',
        sectionId: 'jobs-board',
      },
    ],
  },
  {
    label: 'Go',
    items: [
      {
        id: 'admin-home',
        name: 'Home',
        href: '/dashboard/admin',
      },
      {
        id: 'admin-blog',
        name: 'Blog',
        href: '/dashboard/admin/blog',
      },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter'];

export default function AdminJobPostManagementPage() {
  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Job posts"
      subtitle="Manage openings"
      description=""
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50/40 pb-16">
        <div className="mx-auto max-w-screen-2xl space-y-12 px-6 py-12">
          <JobPostManagementWorkspace />
        </div>
      </div>
    </DashboardLayout>
  );
}
