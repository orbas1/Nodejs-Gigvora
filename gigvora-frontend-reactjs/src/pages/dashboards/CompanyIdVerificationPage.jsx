import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import IdVerificationSummaryCards from '../../components/company/idVerification/IdVerificationSummaryCards.jsx';
import IdVerificationFilters from '../../components/company/idVerification/IdVerificationFilters.jsx';
import IdVerificationTable from '../../components/company/idVerification/IdVerificationTable.jsx';
import IdVerificationDrawer from '../../components/company/idVerification/IdVerificationDrawer.jsx';
import IdVerificationRequestModal from '../../components/company/idVerification/IdVerificationRequestModal.jsx';
import { useCompanyIdentityVerifications } from '../../hooks/useCompanyIdentityVerifications.js';
import {
  fetchIdentityVerificationDetail,
  createIdentityVerification,
  updateIdentityVerification,
} from '../../services/companyIdentity.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';
import { useSession } from '../../context/SessionContext.jsx';
import AccessDeniedPanel from '../../components/dashboard/AccessDeniedPanel.jsx';

const menuSections = COMPANY_DASHBOARD_MENU_SECTIONS;
const availableDashboards = ['company', 'headhunter', 'agency', 'user'];

const STATUS_SEGMENTS = [
  { key: 'all', label: 'All', statuses: [] },
  { key: 'new', label: 'New', statuses: ['pending', 'submitted'] },
  { key: 'review', label: 'Review', statuses: ['in_review'] },
  { key: 'done', label: 'Done', statuses: ['verified'] },
  { key: 'flagged', label: 'Flagged', statuses: ['rejected', 'expired'] },
];

function normalizeNumber(value, fallback = undefined) {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseStatuses(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((status) => status.trim())
    .filter(Boolean);
}

function resolveSegment(statuses) {
  return (
    STATUS_SEGMENTS.find(
      (segment) =>
        segment.statuses.length === statuses.length &&
        segment.statuses.every((status) => statuses.includes(status)),
    )?.key ?? (statuses.length ? 'custom' : 'all')
  );
}

export default function CompanyIdVerificationPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const workspaceIdParam = searchParams.get('workspaceId');
  const statusParamRaw = searchParams.get('status') || '';
  const sortParam = searchParams.get('sort') || 'recent';
  const pageParam = normalizeNumber(searchParams.get('page'), 1) || 1;
  const searchTerm = searchParams.get('q') || '';

  const workspaceId = workspaceIdParam ? Number(workspaceIdParam) : undefined;
  const statusList = useMemo(() => parseStatuses(statusParamRaw), [statusParamRaw]);
  const activeSegment = useMemo(() => resolveSegment(statusList), [statusList]);
  const statusFilterValue = statusList.length ? statusList.join(',') : undefined;

  const queryParams = useMemo(
    () => ({
      workspaceId,
      status: statusFilterValue,
      sort: sortParam,
      page: pageParam,
      search: searchTerm,
      includeMembers: true,
    }),
    [workspaceId, statusFilterValue, sortParam, pageParam, searchTerm],
  );

  const membershipsList = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && membershipsList.includes('company');

  const { data, loading, error, refresh, lastUpdated } = useCompanyIdentityVerifications(queryParams, {
    enabled: isAuthenticated && isCompanyMember,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/company/id-verification' }} />;
  }

  if (!isCompanyMember) {
    const fallbackDashboards = membershipsList.filter((membership) => membership !== 'company');
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Identity verification"
        subtitle="Verification workspace"
        description="You need company membership to review verification requests."
        menuSections={menuSections}
        availableDashboards={availableDashboards}
      >
        <AccessDeniedPanel
          availableDashboards={fallbackDashboards}
          onNavigate={(dashboard) => navigate(`/dashboard/${dashboard}`)}
        />
      </DashboardLayout>
    );
  }

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const metadata = data?.metadata ?? {};
  const stats = data?.stats ?? {};
  const pagination = data?.pagination ?? { page: pageParam, totalPages: 1, totalItems: 0, pageSize: 0 };
  const statusOptions = data?.filters?.statuses ?? ['submitted', 'pending', 'in_review', 'verified', 'rejected', 'expired'];
  const sortOptions = data?.filters?.sortOptions ?? [
    { value: 'recent', label: 'Most recent activity' },
    { value: 'oldest', label: 'Oldest submissions' },
    { value: 'name', label: 'Alphabetical' },
  ];

  const workspaceOptions = metadata.workspaceOptions ?? [];
  const reviewerOptions = metadata.reviewerOptions ?? [];
  const memberOptions = metadata.memberOptions ?? [];
  const countsByStatus = stats.countsByStatus ?? {};
  const statusSegments = useMemo(() => {
    const total = Object.values(countsByStatus).reduce(
      (sum, value) => (Number.isFinite(Number(value)) ? sum + Number(value) : sum),
      0,
    );
    return STATUS_SEGMENTS.map((segment) => ({
      ...segment,
      count: segment.statuses.length
        ? segment.statuses.reduce((acc, status) => acc + (Number(countsByStatus[status]) || 0), 0)
        : total,
    }));
  }, [countsByStatus]);

  const selectedWorkspace = workspaceId
    ? workspaceOptions.find((workspace) => Number(workspace.id) === Number(workspaceId)) ?? metadata.workspace
    : metadata.workspace;

  useEffect(() => {
    if (!workspaceId && metadata.workspace?.id) {
      const next = new URLSearchParams(searchParams);
      next.set('workspaceId', metadata.workspace.id);
      next.delete('page');
      setSearchParams(next, { replace: true });
    }
  }, [workspaceId, metadata.workspace?.id, searchParams, setSearchParams]);

  const updateQueryParams = useCallback(
    (updater) => {
      const next = new URLSearchParams(searchParams);
      updater(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleWorkspaceChange = useCallback(
    (value) => {
      updateQueryParams((params) => {
        if (value) {
          params.set('workspaceId', value);
        } else {
          params.delete('workspaceId');
        }
        params.delete('page');
      });
    },
    [updateQueryParams],
  );

  const handleSegmentChange = useCallback(
    (segmentKey) => {
      const segment = STATUS_SEGMENTS.find((item) => item.key === segmentKey);
      updateQueryParams((params) => {
        if (segmentKey === activeSegment || !segment || !segment.statuses.length) {
          params.delete('status');
        } else {
          params.set('status', segment.statuses.join(','));
        }
        params.delete('page');
      });
    },
    [updateQueryParams, activeSegment],
  );

  const handleSortChange = useCallback(
    (sort) => {
      updateQueryParams((params) => {
        if (sort) {
          params.set('sort', sort);
        } else {
          params.delete('sort');
        }
      });
    },
    [updateQueryParams],
  );

  const handleSearchChange = useCallback(
    (value) => {
      updateQueryParams((params) => {
        if (value && value.length) {
          params.set('q', value);
        } else {
          params.delete('q');
        }
        params.delete('page');
      });
    },
    [updateQueryParams],
  );

  const handlePageChange = useCallback(
    (page) => {
      updateQueryParams((params) => {
        params.set('page', String(page));
      });
    },
    [updateQueryParams],
  );

  const handleSelectVerification = useCallback(
    async (item) => {
      setDrawerOpen(true);
      setDrawerLoading(true);
      setSelectedVerification(item);
      try {
        const detail = await fetchIdentityVerificationDetail(item.id, { workspaceId });
        setSelectedVerification(detail);
      } catch (err) {
        console.error('Failed to load verification detail', err);
      } finally {
        setDrawerLoading(false);
      }
    },
    [workspaceId],
  );

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setDrawerLoading(false);
    setSelectedVerification(null);
  }, []);

  const handleDrawerSubmit = useCallback(
    async (payload) => {
      if (!selectedVerification) {
        return;
      }
      await updateIdentityVerification(selectedVerification.id, payload);
      await refresh();
    },
    [selectedVerification, refresh],
  );

  const handleCreateSubmit = useCallback(
    async (payload) => {
      if (!payload.workspaceId) {
        throw new Error('Select a workspace before submitting a verification.');
      }
      await createIdentityVerification(payload);
      await refresh();
    },
    [refresh],
  );

  const handleRefresh = useCallback(() => refresh(), [refresh]);

  useEffect(() => {
    if (session && session.userType !== 'company') {
      navigate('/dashboard/company', { replace: true });
    }
  }, [session, navigate]);

  return (
    <DashboardLayout
      currentDashboard="company"
      title="ID checks"
      subtitle="Manage identity reviews in one place."
      menuSections={menuSections}
      availableDashboards={availableDashboards}
      activeMenuItem="company-id-verification"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">ID checks</h1>
            <p className="text-sm text-slate-500">Keep reviews flowing without clutter.</p>
          </div>
          <DataStatus
            loading={loading}
            lastUpdated={lastUpdated}
            onRefresh={handleRefresh}
            fromCache={false}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr] xl:grid-cols-[360px,1fr]">
          <IdVerificationFilters
            workspaceOptions={workspaceOptions}
            currentWorkspaceId={selectedWorkspace?.id ?? ''}
            onWorkspaceChange={handleWorkspaceChange}
            segments={statusSegments}
            activeSegment={activeSegment}
            onSegmentChange={handleSegmentChange}
            sortOptions={sortOptions}
            currentSort={sortParam}
            onSortChange={handleSortChange}
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            onCreate={() => setModalOpen(true)}
            onRefresh={handleRefresh}
            loading={loading}
          />

          <div className="flex flex-col gap-6">
            <IdVerificationSummaryCards
              stats={stats}
              loading={loading}
              activeSegment={activeSegment}
              onSelect={handleSegmentChange}
            />

            <IdVerificationTable
              items={data?.items ?? []}
              loading={loading}
              error={error}
              onSelect={handleSelectVerification}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <IdVerificationDrawer
        open={drawerOpen}
        verification={selectedVerification}
        statusOptions={statusOptions}
        reviewerOptions={reviewerOptions}
        workspaceId={workspaceId ?? selectedWorkspace?.id}
        onClose={handleDrawerClose}
        onSubmit={handleDrawerSubmit}
        loading={drawerLoading}
      />

      <IdVerificationRequestModal
        open={modalOpen}
        workspaceId={workspaceId ?? selectedWorkspace?.id}
        memberOptions={memberOptions}
        reviewerOptions={reviewerOptions}
        statusOptions={statusOptions}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </DashboardLayout>
  );
}
