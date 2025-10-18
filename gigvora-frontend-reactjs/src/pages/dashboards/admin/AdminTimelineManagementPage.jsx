import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import ADMIN_MENU_SECTIONS, { ADMIN_TIMELINE_MENU_ITEM_ID } from './adminMenuConfig.js';
import TimelineManagementPage from './timelines/TimelineManagementPage.jsx';

export default function AdminTimelineManagementPage() {
  const { session } = useSession();
  const profile = session?.profile ?? null;

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Timelines"
      subtitle="Plan rollouts and milestones"
      description="Manage programme schedules, comms, and delivery events."
      menuSections={ADMIN_MENU_SECTIONS}
      sections={[]}
      profile={profile}
      availableDashboards={[
        'admin',
        'user',
        'freelancer',
        'company',
        'agency',
        'headhunter',
      ]}
      activeMenuItem={ADMIN_TIMELINE_MENU_ITEM_ID}
    >
      <TimelineManagementPage />
    </DashboardLayout>
  );
}
