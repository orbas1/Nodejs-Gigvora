import { useCallback, useMemo, useState } from 'react';
import SectionShell from '../../SectionShell.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerReviews from '../../../../hooks/useFreelancerReviews.js';
import ReviewToolbar from './reviews/ReviewToolbar.jsx';
import OverviewView from './reviews/OverviewView.jsx';
import TableView from './reviews/TableView.jsx';
import InsightsView from './reviews/InsightsView.jsx';
import ReviewFormDrawer from './reviews/ReviewFormDrawer.jsx';
import ReviewDetailModal from './reviews/ReviewDetailModal.jsx';
import { VIEW_OPTIONS } from './reviews/constants.js';

const DEFAULT_FILTER_RESET = {
  status: 'all',
  highlighted: undefined,
  minRating: null,
  maxRating: null,
  sort: 'recent',
  query: '',
  tags: [],
  page: 1,
};

export default function ReviewManagementSection() {
  const { session } = useSession();
  const [activeView, setActiveView] = useState('overview');
  const [drawerState, setDrawerState] = useState({ open: false, mode: 'create', review: null });
  const [detailReview, setDetailReview] = useState(null);

  const role = (session?.activeRole ?? session?.role ?? session?.workspace?.role ?? '').toString().toLowerCase();
  const memberships = Array.isArray(session?.memberships) ? session.memberships.map((item) => `${item}`.toLowerCase()) : [];
  const workspaceType = (session?.workspace?.type ?? '').toString().toLowerCase();
  const hasAccess =
    role.includes('freelancer') ||
    memberships.some((value) => value.includes('freelancer')) ||
    workspaceType.includes('freelancer');

  const freelancerId =
    session?.freelancerId ??
    session?.profileId ??
    session?.primaryProfileId ??
    session?.userId ??
    session?.id ??
    null;

  const {
    reviews,
    summary,
    ratingDistribution,
    insights,
    pagination,
    filters,
    setFilters,
    setPage,
    createReview,
    updateReview,
    deleteReview,
    creating,
    updatingId,
    deletingId,
    loading,
    error,
    lastError,
    refresh,
  } = useFreelancerReviews({ freelancerId, enabled: hasAccess });

  const viewLookup = useMemo(() => new Set(VIEW_OPTIONS.map((option) => option.id)), []);

  const handleOpenCreate = useCallback(() => {
    setDrawerState({ open: true, mode: 'create', review: null });
  }, []);

  const handleEdit = useCallback((review) => {
    setDrawerState({ open: true, mode: 'edit', review });
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerState({ open: false, mode: 'create', review: null });
  }, []);

  const handleDetailOpen = useCallback((review) => {
    setDetailReview(review);
  }, []);

  const handleDetailClose = useCallback(() => {
    setDetailReview(null);
  }, []);

  const handleDelete = useCallback(
    async (review) => {
      if (!review?.id) {
        return;
      }
      await deleteReview(review.id);
      setDetailReview((current) => (current?.id === review.id ? null : current));
    },
    [deleteReview],
  );

  const handleSubmit = useCallback(
    async (payload) => {
      if (drawerState.mode === 'edit' && drawerState.review?.id) {
        await updateReview(drawerState.review.id, payload);
      } else {
        await createReview(payload);
      }
      handleDrawerClose();
    },
    [createReview, drawerState.mode, drawerState.review, handleDrawerClose, updateReview],
  );

  const handleFilterChange = useCallback(
    (patch) => {
      setFilters({ ...patch });
    },
    [setFilters],
  );

  const handleFilterReset = useCallback(() => {
    setFilters({ ...DEFAULT_FILTER_RESET });
  }, [setFilters]);

  const handlePageChange = useCallback(
    (page) => {
      setPage(page);
    },
    [setPage],
  );

  const refreshing = loading || creating || Boolean(updatingId);
  const drawerLoading = creating || (drawerState.mode === 'edit' && updatingId === drawerState.review?.id);

  const resolvedError = error ?? lastError;

  if (!hasAccess) {
    return (
      <SectionShell id="reviews" title="Reviews">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
          Freelancer access required.
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell id="reviews" title="Reviews">
      <div className="space-y-6">
        <ReviewToolbar
          activeView={viewLookup.has(activeView) ? activeView : 'overview'}
          onViewChange={(view) => setActiveView(viewLookup.has(view) ? view : 'overview')}
          onCreate={handleOpenCreate}
          onRefresh={() => refresh({ force: true })}
          refreshing={refreshing}
        />

        {resolvedError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {resolvedError.message ?? 'Unable to load reviews.'}
          </div>
        ) : null}

        {activeView === 'overview' ? (
          <OverviewView
            summary={summary}
            reviews={reviews}
            ratingDistribution={ratingDistribution}
            onSelectReview={handleDetailOpen}
          />
        ) : null}

        {activeView === 'table' ? (
          <TableView
            reviews={reviews}
            filters={filters}
            onFilterChange={handleFilterChange}
            onFilterReset={handleFilterReset}
            pagination={pagination}
            onPageChange={handlePageChange}
            onView={handleDetailOpen}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        ) : null}

        {activeView === 'insights' ? <InsightsView insights={insights} summary={summary} /> : null}
      </div>

      <ReviewFormDrawer
        open={drawerState.open}
        mode={drawerState.mode}
        review={drawerState.review}
        onClose={handleDrawerClose}
        onSubmit={handleSubmit}
        loading={drawerLoading}
        error={lastError}
      />

      <ReviewDetailModal
        review={detailReview}
        open={Boolean(detailReview)}
        onClose={handleDetailClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleting={detailReview ? deletingId === detailReview.id : false}
      />
    </SectionShell>
  );
}
