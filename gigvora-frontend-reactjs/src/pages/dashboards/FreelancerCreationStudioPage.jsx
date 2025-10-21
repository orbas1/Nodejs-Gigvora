import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import CreationStudioManager from '../../components/creationStudio/CreationStudioManager.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';

const ALLOWED_ROLES = ['freelancer'];

export default function FreelancerCreationStudioPage() {
  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="freelancer"
        title="Creation studio"
        subtitle="Showcase and package your work"
        description="Design new offers, templates, and marketing assets with live preview tools."
        menuSections={MENU_GROUPS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="creation-studio"
      >
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
          <header className="space-y-2 border-b border-slate-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Create</p>
            <h1 className="text-3xl font-semibold text-slate-900">Creation studio</h1>
            <p className="text-sm text-slate-600">
              Launch new offerings, update deliverables, and publish marketing assets without leaving your dashboard.
            </p>
          </header>
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <CreationStudioManager />
          </section>
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}
