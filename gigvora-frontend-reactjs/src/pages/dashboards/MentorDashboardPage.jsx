import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './mentor/menuConfig.js';
import { DEFAULT_PROFILE, DEFAULT_DASHBOARD } from './mentor/sampleData.js';
import {
  OverviewSection,
  PipelineSection,
  AvailabilitySection,
  PackagesSection,
  ResourcesSection,
} from './mentor/sections/index.js';
import { fetchMentorDashboard, saveMentorAvailability, saveMentorPackages } from '../../services/mentorship.js';

const SECTION_COMPONENTS = {
  performance: OverviewSection,
  pipeline: PipelineSection,
  availability: AvailabilitySection,
  packages: PackagesSection,
  resources: ResourcesSection,
  marketing: ResourcesSection,
};

export default function MentorDashboardPage() {
  const [activeSection, setActiveSection] = useState('performance');
  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [packagesSaving, setPackagesSaving] = useState(false);

  const menuSections = useMemo(() => MENU_GROUPS, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMentorDashboard();
      setDashboard((current) => ({ ...current, ...data }));
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleSaveAvailability = useCallback(async (slots) => {
    setAvailabilitySaving(true);
    try {
      await saveMentorAvailability(slots);
      setDashboard((current) => ({ ...current, availability: slots }));
    } finally {
      setAvailabilitySaving(false);
    }
  }, []);

  const handleSavePackages = useCallback(async (packages) => {
    setPackagesSaving(true);
    try {
      await saveMentorPackages(packages);
      setDashboard((current) => ({ ...current, packages }));
    } finally {
      setPackagesSaving(false);
    }
  }, []);

  const renderSection = () => {
    const Component = SECTION_COMPONENTS[activeSection] ?? OverviewSection;
    if (Component === OverviewSection) {
      return (
        <OverviewSection
          dashboard={dashboard}
          loading={loading}
          error={error}
          onRefresh={handleRefresh}
        />
      );
    }
    if (Component === PipelineSection) {
      return <PipelineSection bookings={dashboard?.bookings ?? []} segments={dashboard?.segments ?? []} />;
    }
    if (Component === AvailabilitySection) {
      return (
        <AvailabilitySection
          availability={dashboard?.availability ?? []}
          onSave={handleSaveAvailability}
          saving={availabilitySaving}
        />
      );
    }
    if (Component === PackagesSection) {
      return (
        <PackagesSection packages={dashboard?.packages ?? []} onSave={handleSavePackages} saving={packagesSaving} />
      );
    }
    if (Component === ResourcesSection) {
      return <ResourcesSection explorerPlacement={dashboard?.explorerPlacement} />;
    }
    return <Component />;
  };

  return (
    <DashboardLayout
      currentDashboard="mentor"
      title="Mentor mission control"
      subtitle="Manage bookings, packages, and Explorer visibility"
      description="A dedicated workspace for mentors to orchestrate sessions, automate rituals, and grow mentorship revenue."
      menuSections={menuSections}
      profile={DEFAULT_PROFILE}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={activeSection}
      onMenuItemSelect={(itemId) => setActiveSection(itemId)}
    >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">{renderSection()}</div>
    </DashboardLayout>
  );
}
