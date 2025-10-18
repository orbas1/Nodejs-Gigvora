import { useCallback, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import CompanyProfileOverview from '../../components/company/profile/CompanyProfileOverview.jsx';
import CompanyProfileForm from '../../components/company/profile/CompanyProfileForm.jsx';
import CompanyAvatarManager from '../../components/company/profile/CompanyAvatarManager.jsx';
import CompanyFollowersManager from '../../components/company/profile/CompanyFollowersManager.jsx';
import CompanyConnectionsManager from '../../components/company/profile/CompanyConnectionsManager.jsx';
import { useSession } from '../../context/SessionContext.jsx';
import useCompanyProfileWorkspace from '../../hooks/useCompanyProfileWorkspace.js';
import {
  updateCompanyProfile,
  updateCompanyAvatar,
  addCompanyFollower,
  updateCompanyFollower,
  removeCompanyFollower,
  createCompanyConnection,
  updateCompanyConnection,
  removeCompanyConnection,
} from '../../services/companyProfile.js';

const MENU_SECTIONS = [
  {
    label: 'Profile',
    items: [
      { id: 'overview', name: 'Overview' },
      { id: 'edit', name: 'Profile' },
      { id: 'media', name: 'Media' },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'fans', name: 'Fans' },
      { id: 'network', name: 'Network' },
    ],
  },
];

const DASHBOARD_DESTINATIONS = [
  { id: 'company', label: 'Home', href: '/dashboard/company' },
  { id: 'company-profile', label: 'Profile', href: '/dashboard/company/profile' },
  { id: 'company-analytics', label: 'Reports', href: '/dashboard/company/analytics' },
  { id: 'company-ats', label: 'ATS', href: '/dashboard/company/ats' },
  { id: 'company-integrations', label: 'Integrations', href: '/dashboard/company/integrations' },
];

export default function CompanyProfileWorkspacePage() {
  const { session, isAuthenticated } = useSession();
  const memberships = session?.memberships ?? [];
  const hasCompanyAccess = memberships.includes('company') || session?.userType === 'company';

  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [feedbackVariant, setFeedbackVariant] = useState('success');
  const [activeView, setActiveView] = useState('overview');

  const {
    data,
    loading,
    error,
    refresh,
    fromCache,
    lastUpdated,
    profile,
    metrics,
    followers,
    connections,
  } = useCompanyProfileWorkspace({ enabled: isAuthenticated && hasCompanyAccess });

  const handleRefresh = useCallback(() => refresh({ force: true }), [refresh]);

  const handleMenuSelect = useCallback((itemId) => {
    if (!itemId) return;
    setActiveView(String(itemId));
  }, []);

  const showFeedback = useCallback((message, variant = 'success') => {
    setFeedback(message);
    setFeedbackVariant(variant);
    if (message) {
      window.setTimeout(() => setFeedback(null), 6000);
    }
  }, []);

  const handleProfileSubmit = useCallback(
    async (changes) => {
      setProfileSaving(true);
      try {
        await updateCompanyProfile(changes);
        await refresh({ force: true });
        showFeedback('Profile details updated successfully.');
        setActiveView('overview');
      } catch (submitError) {
        console.error('Failed to update company profile', submitError);
        showFeedback(submitError?.message || 'Unable to update profile details.', 'error');
      } finally {
        setProfileSaving(false);
      }
    },
    [refresh, showFeedback],
  );

  const handleAvatarSubmit = useCallback(
    async (changes) => {
      setAvatarSaving(true);
      try {
        await updateCompanyAvatar(changes);
        await refresh({ force: true });
        showFeedback('Brand imagery saved.');
        setActiveView('overview');
      } catch (submitError) {
        console.error('Failed to update company avatar', submitError);
        showFeedback(submitError?.message || 'Unable to save imagery.', 'error');
      } finally {
        setAvatarSaving(false);
      }
    },
    [refresh, showFeedback],
  );

  const handleAddFollower = useCallback(
    async (payload) => {
      try {
        await addCompanyFollower(payload);
        await refresh({ force: true });
        showFeedback('Follower added.');
      } catch (submitError) {
        console.error('Failed to add follower', submitError);
        showFeedback(submitError?.message || 'Unable to add follower.', 'error');
      }
    },
    [refresh, showFeedback],
  );

  const handleUpdateFollower = useCallback(
    async (followerId, payload) => {
      try {
        await updateCompanyFollower(followerId, payload);
        await refresh({ force: false });
        showFeedback('Follower settings updated.');
      } catch (submitError) {
        console.error('Failed to update follower', submitError);
        showFeedback(submitError?.message || 'Unable to update follower.', 'error');
      }
    },
    [refresh, showFeedback],
  );

  const handleRemoveFollower = useCallback(
    async (followerId) => {
      try {
        await removeCompanyFollower(followerId);
        await refresh({ force: true });
        showFeedback('Follower removed.');
      } catch (submitError) {
        console.error('Failed to remove follower', submitError);
        showFeedback(submitError?.message || 'Unable to remove follower.', 'error');
      }
    },
    [refresh, showFeedback],
  );

  const handleCreateConnection = useCallback(
    async (payload) => {
      try {
        await createCompanyConnection(payload);
        await refresh({ force: true });
        showFeedback('Connection recorded.');
      } catch (submitError) {
        console.error('Failed to create connection', submitError);
        showFeedback(submitError?.message || 'Unable to create connection.', 'error');
      }
    },
    [refresh, showFeedback],
  );

  const handleUpdateConnection = useCallback(
    async (connectionId, payload) => {
      try {
        await updateCompanyConnection(connectionId, payload);
        await refresh({ force: false });
        showFeedback('Connection updated.');
      } catch (submitError) {
        console.error('Failed to update connection', submitError);
        showFeedback(submitError?.message || 'Unable to update connection.', 'error');
      }
    },
    [refresh, showFeedback],
  );

  const handleRemoveConnection = useCallback(
    async (connectionId) => {
      try {
        await removeCompanyConnection(connectionId);
        await refresh({ force: true });
        showFeedback('Connection removed.');
      } catch (submitError) {
        console.error('Failed to remove connection', submitError);
        showFeedback(submitError?.message || 'Unable to remove connection.', 'error');
      }
    },
    [refresh, showFeedback],
  );

  const statusPanel = error ? (
    <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
      {error.message || 'Unable to load profile workspace.'}
    </div>
  ) : null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!hasCompanyAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const overviewProfile = useMemo(() => profile ?? data?.profile ?? null, [profile, data?.profile]);

  const activeContent = useMemo(() => {
    if (activeView === 'edit') {
      return (
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
            <button
              type="button"
              onClick={() => setActiveView('overview')}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Back
            </button>
          </div>
          <CompanyProfileForm
            profile={overviewProfile}
            saving={profileSaving}
            onSubmit={handleProfileSubmit}
            onCancel={() => setActiveView('overview')}
          />
        </section>
      );
    }

    if (activeView === 'media') {
      return (
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Media</h2>
            <button
              type="button"
              onClick={() => setActiveView('overview')}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Back
            </button>
          </div>
          <CompanyAvatarManager
            profile={overviewProfile}
            saving={avatarSaving}
            onSubmit={handleAvatarSubmit}
            onCancel={() => setActiveView('overview')}
          />
        </section>
      );
    }

    if (activeView === 'fans') {
      return (
        <CompanyFollowersManager
          followers={followers}
          onAddFollower={handleAddFollower}
          onUpdateFollower={handleUpdateFollower}
          onRemoveFollower={handleRemoveFollower}
        />
      );
    }

    if (activeView === 'network') {
      return (
        <CompanyConnectionsManager
          connections={connections}
          onCreateConnection={handleCreateConnection}
          onUpdateConnection={handleUpdateConnection}
          onRemoveConnection={handleRemoveConnection}
        />
      );
    }

    return (
      <CompanyProfileOverview
        profile={overviewProfile}
        metrics={metrics}
        onEdit={() => setActiveView('edit')}
        onMedia={() => setActiveView('media')}
        onOpenFans={() => setActiveView('fans')}
        onOpenNetwork={() => setActiveView('network')}
      />
    );
  }, [
    activeView,
    overviewProfile,
    metrics,
    profileSaving,
    avatarSaving,
    followers,
    connections,
    handleProfileSubmit,
    handleAvatarSubmit,
    handleAddFollower,
    handleUpdateFollower,
    handleRemoveFollower,
    handleCreateConnection,
    handleUpdateConnection,
    handleRemoveConnection,
  ]);

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Profile"
      subtitle="Company workspace"
      description="Manage your brand, fans, and partners in one place."
      menuSections={MENU_SECTIONS}
      availableDashboards={DASHBOARD_DESTINATIONS}
      activeMenuItem={activeView}
      onMenuItemSelect={handleMenuSelect}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-slate-900 capitalize">{activeView}</h1>
          <DataStatus loading={loading} fromCache={fromCache} lastUpdated={lastUpdated} onRefresh={handleRefresh} />
        </div>

        {feedback ? (
          <div
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              feedbackVariant === 'error'
                ? 'border-rose-200 bg-rose-50/70 text-rose-700'
                : 'border-emerald-200 bg-emerald-50/70 text-emerald-700'
            }`}
          >
            <span>{feedback}</span>
            <button type="button" onClick={() => setFeedback(null)} className="text-xs font-semibold uppercase tracking-wide">
              Dismiss
            </button>
          </div>
        ) : null}

        {statusPanel}

        {activeContent}
      </div>
    </DashboardLayout>
  );
}
