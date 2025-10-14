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
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [packagesSaving, setPackagesSaving] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const menuSections = useMemo(() => MENU_GROUPS, []);

  const formatRelativeTime = useCallback((timestamp) => {
    if (!timestamp) {
      return null;
    }
    try {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      const diffMs = date.getTime() - Date.now();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      if (Math.abs(diffMinutes) < 60) {
        const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
        return formatter.format(diffMinutes, 'minute');
      }
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      if (Math.abs(diffHours) < 48) {
        const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
        return formatter.format(diffHours, 'hour');
      }
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
      return formatter.format(diffDays, 'day');
    } catch (formatError) {
      console.warn('Failed to format mentorship dashboard timestamp', formatError);
      return null;
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMentorDashboard();
      setDashboard({ ...DEFAULT_DASHBOARD, ...data });
      if (data?.profile) {
        setProfile((current) => ({ ...current, ...data.profile }));
      }
      setMetadata(data?.metadata ?? null);
    } catch (loadError) {
      const normalisedError = loadError instanceof Error ? loadError : new Error('Unable to load mentor dashboard.');
      setError(normalisedError);
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
      profile={profile}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem={activeSection}
      onMenuItemSelect={(itemId) => setActiveSection(itemId)}
    >
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-10">
        {metadata?.generatedAt ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-blue-100 bg-blue-50/80 px-5 py-3 text-sm text-slate-600">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Synced data</span>
              <span>Snapshot refreshed {formatRelativeTime(metadata.generatedAt) ?? 'recently'}</span>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Refreshing…' : 'Refresh now'}
            </button>
          </div>
        ) : null}
        {renderSection()}
      </div>
    </DashboardLayout>
  );
}
