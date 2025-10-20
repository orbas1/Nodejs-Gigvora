import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './mentor/menuConfig.js';
import { DEFAULT_PROFILE, DEFAULT_DASHBOARD } from './mentor/sampleData.js';
import {
  HomeProfileSection,
  HomeOverviewSection,
  FinanceManagementSection,
  MentorshipManagementSection,
} from './mentor/sections/index.js';
import {
  fetchMentorDashboard,
  saveMentorAvailability,
  saveMentorPackages,
  submitMentorProfile,
  createMentorBooking,
  updateMentorBooking,
  deleteMentorBooking,
  createMentorInvoice,
  updateMentorInvoice,
  deleteMentorInvoice,
  createMentorPayout,
  updateMentorPayout,
  deleteMentorPayout,
} from '../../services/mentorship.js';

const SECTION_COMPONENTS = {
  'home-profile': HomeProfileSection,
  'home-overview': HomeOverviewSection,
  finance: FinanceManagementSection,
  mentorship: MentorshipManagementSection,
};

export default function MentorDashboardPage() {
  const [activeSection, setActiveSection] = useState('home-overview');
  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [packagesSaving, setPackagesSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const menuSections = useMemo(() => MENU_GROUPS, []);

  const applyDashboardUpdate = useCallback((snapshot) => {
    if (!snapshot) {
      return;
    }
    setDashboard({ ...DEFAULT_DASHBOARD, ...snapshot });
    if (snapshot.profile) {
      setProfile((current) => ({ ...current, ...snapshot.profile }));
    }
    setMetadata(snapshot.metadata ?? null);
  }, []);

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
      applyDashboardUpdate(data);
    } catch (loadError) {
      const normalisedError = loadError instanceof Error ? loadError : new Error('Unable to load mentor dashboard.');
      setError(normalisedError);
    } finally {
      setLoading(false);
    }
  }, [applyDashboardUpdate]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const handleSaveAvailability = useCallback(async (slots) => {
    setAvailabilitySaving(true);
    try {
      await saveMentorAvailability(slots);
      const snapshot = await fetchMentorDashboard();
      applyDashboardUpdate(snapshot);
    } finally {
      setAvailabilitySaving(false);
    }
  }, [applyDashboardUpdate]);

  const handleSavePackages = useCallback(async (packages) => {
    setPackagesSaving(true);
    try {
      await saveMentorPackages(packages);
      const snapshot = await fetchMentorDashboard();
      applyDashboardUpdate(snapshot);
    } finally {
      setPackagesSaving(false);
    }
  }, [applyDashboardUpdate]);

  const handleSaveProfile = useCallback(
    async (payload) => {
      setProfileSaving(true);
      try {
        const response = await submitMentorProfile(payload);
        if (response?.profile) {
          setProfile((current) => ({ ...current, ...response.profile }));
          setDashboard((current) => ({ ...current, profile: response.profile }));
        }
        return response;
      } catch (saveError) {
        throw saveError;
      } finally {
        setProfileSaving(false);
      }
    },
    [],
  );

  const handleCreateBooking = useCallback(
    async (payload) => {
      setBookingSaving(true);
      try {
        const response = await createMentorBooking(payload);
        applyDashboardUpdate(response?.dashboard);
        return response?.booking;
      } catch (bookingError) {
        throw bookingError;
      } finally {
        setBookingSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateBooking = useCallback(
    async (bookingId, payload) => {
      setBookingSaving(true);
      try {
        const response = await updateMentorBooking(bookingId, payload);
        applyDashboardUpdate(response?.dashboard);
        return response?.booking;
      } catch (bookingError) {
        throw bookingError;
      } finally {
        setBookingSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteBooking = useCallback(
    async (bookingId) => {
      setBookingSaving(true);
      try {
        const response = await deleteMentorBooking(bookingId);
        applyDashboardUpdate(response?.dashboard);
        return response;
      } catch (bookingError) {
        throw bookingError;
      } finally {
        setBookingSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreateInvoice = useCallback(
    async (payload) => {
      setInvoiceSaving(true);
      try {
        const response = await createMentorInvoice(payload);
        applyDashboardUpdate(response?.dashboard);
        return response?.invoice;
      } catch (invoiceError) {
        throw invoiceError;
      } finally {
        setInvoiceSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdateInvoice = useCallback(
    async (invoiceId, payload) => {
      setInvoiceSaving(true);
      try {
        const response = await updateMentorInvoice(invoiceId, payload);
        applyDashboardUpdate(response?.dashboard);
        return response?.invoice;
      } catch (invoiceError) {
        throw invoiceError;
      } finally {
        setInvoiceSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeleteInvoice = useCallback(
    async (invoiceId) => {
      setInvoiceSaving(true);
      try {
        const response = await deleteMentorInvoice(invoiceId);
        applyDashboardUpdate(response?.dashboard);
        return response;
      } catch (invoiceError) {
        throw invoiceError;
      } finally {
        setInvoiceSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleCreatePayout = useCallback(
    async (payload) => {
      setPayoutSaving(true);
      try {
        const response = await createMentorPayout(payload);
        applyDashboardUpdate(response?.dashboard);
        return response?.payout;
      } catch (payoutError) {
        throw payoutError;
      } finally {
        setPayoutSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleUpdatePayout = useCallback(
    async (payoutId, payload) => {
      setPayoutSaving(true);
      try {
        const response = await updateMentorPayout(payoutId, payload);
        applyDashboardUpdate(response?.dashboard);
        return response?.payout;
      } catch (payoutError) {
        throw payoutError;
      } finally {
        setPayoutSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const handleDeletePayout = useCallback(
    async (payoutId) => {
      setPayoutSaving(true);
      try {
        const response = await deleteMentorPayout(payoutId);
        applyDashboardUpdate(response?.dashboard);
        return response;
      } catch (payoutError) {
        throw payoutError;
      } finally {
        setPayoutSaving(false);
      }
    },
    [applyDashboardUpdate],
  );

  const renderSection = () => {
    const Component = SECTION_COMPONENTS[activeSection] ?? HomeOverviewSection;
    if (Component === HomeProfileSection) {
      return <HomeProfileSection profile={profile} onSave={handleSaveProfile} saving={profileSaving} />;
    }
    if (Component === HomeOverviewSection) {
      return (
        <HomeOverviewSection
          stats={dashboard?.stats}
          conversion={dashboard?.conversion}
          bookings={dashboard?.bookings}
          explorerPlacement={dashboard?.explorerPlacement}
          feedback={dashboard?.feedback}
          finance={dashboard?.finance}
          onRequestNewBooking={() => setActiveSection('mentorship')}
        />
      );
    }
    if (Component === FinanceManagementSection) {
      return (
        <FinanceManagementSection
          finance={dashboard?.finance}
          onCreateInvoice={handleCreateInvoice}
          onUpdateInvoice={handleUpdateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onCreatePayout={handleCreatePayout}
          onUpdatePayout={handleUpdatePayout}
          onDeletePayout={handleDeletePayout}
          invoiceSaving={invoiceSaving}
          payoutSaving={payoutSaving}
        />
      );
    }
    if (Component === MentorshipManagementSection) {
      return (
        <MentorshipManagementSection
          bookings={dashboard?.bookings ?? []}
          availability={dashboard?.availability ?? []}
          packages={dashboard?.packages ?? []}
          segments={dashboard?.segments ?? []}
          onCreateBooking={handleCreateBooking}
          onUpdateBooking={handleUpdateBooking}
          onDeleteBooking={handleDeleteBooking}
          onSaveAvailability={handleSaveAvailability}
          availabilitySaving={availabilitySaving}
          onSavePackages={handleSavePackages}
          packagesSaving={packagesSaving}
          bookingSaving={bookingSaving}
        />
      );
    }
    return null;
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
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {error.message}
          </div>
        ) : null}
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
