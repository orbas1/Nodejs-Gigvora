import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';
import ProfileFilters from '../../components/admin/profile/ProfileFilters.jsx';
import ProfileList from '../../components/admin/profile/ProfileList.jsx';
import ProfileDetailDrawer from '../../components/admin/profile/ProfileDetailDrawer.jsx';
import ProfileCreateModal from '../../components/admin/profile/ProfileCreateModal.jsx';
import {
  fetchAdminProfiles,
  fetchAdminProfile,
  updateAdminProfile,
  createAdminProfile,
  createAdminProfileReference,
  updateAdminProfileReference,
  deleteAdminProfileReference,
  createAdminProfileNote,
  updateAdminProfileNote,
  deleteAdminProfileNote,
} from '../../services/adminProfiles.js';
import useSession from '../../hooks/useSession.js';
import { deriveAdminAccess } from '../../utils/adminAccess.js';

const BASE_MENU_SECTIONS = [
  {
    label: 'Profile workspace',
    items: [
      { name: 'Directory', sectionId: 'profile-directory' },
      { name: 'Profile details', sectionId: 'profile-content' },
      { name: 'References', sectionId: 'profile-references' },
      { name: 'Admin notes', sectionId: 'profile-notes' },
      { name: 'Create profile', href: '#create-profile' },
    ],
  },
  {
    label: 'Shortcuts',
    items: [
      { name: 'Admin dashboard', href: '/dashboard/admin' },
      { name: 'RBAC controls', href: '/dashboard/admin#admin-governance-rbac' },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency'];

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  availability: '',
  userType: '',
  membership: '',
  hasAvatar: '',
  sortBy: 'recent',
});

function normaliseFilters(filters) {
  const payload = { ...filters };
  if (!payload.search) delete payload.search;
  if (!payload.availability) delete payload.availability;
  if (!payload.userType) delete payload.userType;
  if (!payload.membership) delete payload.membership;
  if (payload.hasAvatar === 'true') {
    payload.hasAvatar = true;
  } else if (payload.hasAvatar === 'false') {
    payload.hasAvatar = false;
  } else {
    delete payload.hasAvatar;
  }
  if (!payload.sortBy) payload.sortBy = 'recent';
  return payload;
}

function buildMenuSections() {
  return BASE_MENU_SECTIONS.map((section) => ({
    ...section,
    items: Array.isArray(section.items) ? section.items.map((item) => ({ ...item })) : [],
  }));
}

const SECTIONS = [
  { id: 'profile-directory', title: 'Directory' },
];

function getUserScopes(session) {
  const permissions = Array.isArray(session?.permissions) ? session.permissions : [];
  const capabilities = Array.isArray(session?.capabilities) ? session.capabilities : [];
  return [...permissions, ...capabilities];
}

function AdminProfileManagementPageContent() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [profiles, setProfiles] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeout = setTimeout(() => setSuccessMessage(''), 4000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchAdminProfiles(normaliseFilters(filters));
      setProfiles(Array.isArray(response?.results) ? response.results : []);
      setPagination(response?.pagination ?? null);
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const refreshProfile = useCallback(
    async (profileId = selectedProfileId) => {
      if (!profileId) return null;
      setDetailLoading(true);
      setDetailError(null);
      try {
        const payload = await fetchAdminProfile(profileId);
        setSelectedProfile(payload);
        return payload;
      } catch (refreshError) {
        setDetailError(refreshError);
        throw refreshError;
      } finally {
        setDetailLoading(false);
      }
    },
    [selectedProfileId],
  );

  const handleSelectProfile = useCallback(
    async (profile) => {
      if (!profile?.id) return;
      setSelectedProfileId(profile.id);
      await refreshProfile(profile.id);
    },
    [refreshProfile],
  );

  const handleCloseDrawer = () => {
    setSelectedProfileId(null);
    setSelectedProfile(null);
    setDetailError(null);
  };

  const handleSaveProfile = async (payload) => {
    if (!selectedProfileId) return null;
    const response = await updateAdminProfile(selectedProfileId, payload);
    setSelectedProfile(response);
    setSuccessMessage('Profile changes saved successfully.');
    await loadProfiles();
    return response;
  };

  const handleCreateReference = async (payload) => {
    if (!selectedProfileId) return null;
    await createAdminProfileReference(selectedProfileId, payload);
    setSuccessMessage('Reference added.');
    await refreshProfile();
  };

  const handleUpdateReference = async (reference, updates) => {
    if (!selectedProfileId || !reference?.id) return null;
    const payload = {
      referenceName: updates.referenceName,
      relationship: updates.relationship,
      company: updates.company,
      email: updates.email,
      phone: updates.phone,
      endorsement: updates.endorsement,
      isVerified: updates.isVerified,
      weight: updates.weight,
      lastInteractedAt: updates.lastInteractedAt,
    };
    await updateAdminProfileReference(selectedProfileId, reference.id, payload);
    setSuccessMessage('Reference updated.');
    await refreshProfile();
  };

  const handleDeleteReference = async (reference) => {
    if (!selectedProfileId || !reference?.id) return null;
    await deleteAdminProfileReference(selectedProfileId, reference.id);
    setSuccessMessage('Reference removed.');
    await refreshProfile();
  };

  const handleCreateNote = async (payload) => {
    if (!selectedProfileId) return null;
    await createAdminProfileNote(selectedProfileId, payload);
    setSuccessMessage('Note added to timeline.');
    await refreshProfile();
  };

  const handleUpdateNote = async (note, updates) => {
    if (!selectedProfileId || !note?.id) return null;
    const payload = {
      body: updates.body,
      visibility: updates.visibility,
      pinned: updates.pinned,
      metadata: updates.metadata,
    };
    await updateAdminProfileNote(selectedProfileId, note.id, payload);
    setSuccessMessage('Note updated.');
    await refreshProfile();
  };

  const handleDeleteNote = async (note) => {
    if (!selectedProfileId || !note?.id) return null;
    await deleteAdminProfileNote(selectedProfileId, note.id);
    setSuccessMessage('Note removed.');
    await refreshProfile();
  };

  const handleCreateProfile = async (payload) => {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await createAdminProfile(payload);
      setCreateOpen(false);
      setSuccessMessage('Profile created successfully.');
      await loadProfiles();
      if (created?.id) {
        setSelectedProfileId(created.id);
        await refreshProfile(created.id);
      }
    } catch (createErr) {
      setCreateError(createErr);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFiltersChange = (nextFilters) => {
    setFilters((previous) => ({ ...previous, ...nextFilters }));
  };

  const profileCountSummary = useMemo(() => {
    if (!pagination?.total) {
      return 'Directory ready for provisioning';
    }
    return `${pagination.total} profiles in scope`;
  }, [pagination]);

  return (
    <>
      <div className="space-y-8">
        <section id="profile-directory" className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">Profile directory</h1>
            <p className="text-sm text-slate-600">
              Search, filter, and open detailed records without leaving the admin console.
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{profileCountSummary}</p>
          </div>
          <ProfileFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onCreate={() => setCreateOpen(true)}
          />
          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
          <ProfileList
            profiles={profiles}
            loading={loading}
            error={error}
            onRetry={loadProfiles}
            onSelect={handleSelectProfile}
          />
        </section>
      </div>

      <ProfileDetailDrawer
        open={Boolean(selectedProfileId)}
        profile={selectedProfile}
        loading={detailLoading && !selectedProfile}
        error={detailError}
        onClose={handleCloseDrawer}
        onRefresh={() => refreshProfile(selectedProfileId)}
        onSaveProfile={handleSaveProfile}
        onCreateReference={handleCreateReference}
        onUpdateReference={handleUpdateReference}
        onDeleteReference={handleDeleteReference}
        onCreateNote={handleCreateNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
      />

      <section id="create-profile">
        <ProfileCreateModal
          open={createOpen}
          onClose={() => {
            setCreateOpen(false);
            setCreateError(null);
          }}
          onCreate={handleCreateProfile}
          loading={createLoading}
          error={createError}
        />
      </section>
    </>
  );
}

export default function AdminProfileManagementPage() {
  const { session, isAuthenticated } = useSession();
  const { hasAdminAccess } = useMemo(() => deriveAdminAccess(session), [session]);
  const userScopes = useMemo(() => getUserScopes(session), [session]);
  const menuSections = useMemo(() => buildMenuSections(), []);

  if (!isAuthenticated || !hasAdminAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Profile management"
        subtitle="Curate member records, access, and trust signals"
        description="Provision new accounts, ensure compliant profiles, and coordinate admin actions from one workspace."
        menuSections={menuSections}
        sections={[]}
        availableDashboards={AVAILABLE_DASHBOARDS}
        profile={session?.user ?? null}
        adSurface="admin_dashboard"
      >
        <AccessDeniedPanel
          role="admin"
          availableDashboards={AVAILABLE_DASHBOARDS}
          userScopes={userScopes}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Profile management"
      subtitle="Curate member records, access, and trust signals"
      description="Provision new accounts, ensure compliant profiles, and coordinate admin actions from one workspace."
      menuSections={menuSections}
      sections={SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      profile={session?.user ?? null}
      adSurface="admin_dashboard"
    >
      <AdminProfileManagementPageContent />
    </DashboardLayout>
  );
}
