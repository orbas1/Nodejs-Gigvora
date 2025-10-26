import PropTypes from 'prop-types';
import DataStatus from '../../../../components/DataStatus.jsx';
import {
  GigManagementSection,
  OpenGigsSection,
  ClosedGigsSection,
  GigSubmissionsSection,
  GigTimelineSection,
  GigChatSection,
  GigCreationSection,
  AgencyFairnessSection,
  AgencyGigWorkspaceSection,
} from './index.js';

export default function GigOperationsSection({
  summary,
  deliverables,
  orders,
  selectedOrderId,
  onSelectOrder,
  onRefresh,
  loading,
  error,
  fromCache,
  lastUpdated,
  detail,
  onUpdateOrder,
  updatingOrderId,
  onReopenOrder,
  onCreateSubmission,
  onUpdateSubmission,
  pendingAction,
  onAddEvent,
  onSendMessage,
  onAcknowledgeMessage,
  onCreateGig,
  creatingGig,
  defaultCurrency,
  onGigCreated,
  autoMatchSnapshot,
  boardMetrics,
  gigStats,
  onReviewPipeline,
  projectGigResource,
  workspaceStatusLabel,
  statusLabel,
}) {
  return (
    <section id="agency-gig-management" className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / Gigs</p>
          <h2 className="text-3xl font-semibold text-slate-900">Gig operations</h2>
        </div>
        <DataStatus
          loading={loading}
          error={error}
          fromCache={fromCache}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          statusLabel={statusLabel}
        />
      </div>

      <GigManagementSection
        summary={summary}
        deliverables={deliverables}
        orders={orders}
        selectedOrderId={selectedOrderId}
        onSelectOrder={onSelectOrder}
        onRefresh={onRefresh}
        loading={loading}
        detail={detail}
      />

      <OpenGigsSection orders={orders} onUpdateOrder={onUpdateOrder} updatingOrderId={updatingOrderId} />

      <ClosedGigsSection orders={orders} onReopen={onReopenOrder} updatingOrderId={updatingOrderId} />

      <GigSubmissionsSection
        orderDetail={detail}
        onCreateSubmission={onCreateSubmission}
        onUpdateSubmission={onUpdateSubmission}
        pending={pendingAction}
      />

      <GigTimelineSection
        orderDetail={detail}
        onAddEvent={onAddEvent}
        loading={loading}
        pending={pendingAction}
      />

      <GigChatSection
        orderDetail={detail}
        onSendMessage={onSendMessage}
        onAcknowledgeMessage={onAcknowledgeMessage}
        pending={pendingAction}
      />

      <GigCreationSection
        onCreate={onCreateGig}
        creating={creatingGig}
        defaultCurrency={defaultCurrency}
        onCreated={onGigCreated}
      />

      <AgencyFairnessSection
        orders={orders}
        autoMatch={autoMatchSnapshot}
        boardMetrics={boardMetrics}
        gigStats={gigStats}
        onReviewPipeline={onReviewPipeline}
      />

      <AgencyGigWorkspaceSection
        resource={projectGigResource}
        statusLabel={workspaceStatusLabel}
        onRefresh={onRefresh}
      />
    </section>
  );
}

GigOperationsSection.propTypes = {
  summary: PropTypes.object,
  deliverables: PropTypes.arrayOf(PropTypes.object),
  orders: PropTypes.arrayOf(PropTypes.object),
  selectedOrderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectOrder: PropTypes.func,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  detail: PropTypes.object,
  onUpdateOrder: PropTypes.func,
  updatingOrderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onReopenOrder: PropTypes.func,
  onCreateSubmission: PropTypes.func,
  onUpdateSubmission: PropTypes.func,
  pendingAction: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  onAddEvent: PropTypes.func,
  onSendMessage: PropTypes.func,
  onAcknowledgeMessage: PropTypes.func,
  onCreateGig: PropTypes.func,
  creatingGig: PropTypes.bool,
  defaultCurrency: PropTypes.string,
  onGigCreated: PropTypes.func,
  autoMatchSnapshot: PropTypes.object,
  boardMetrics: PropTypes.object,
  gigStats: PropTypes.object,
  onReviewPipeline: PropTypes.func,
  projectGigResource: PropTypes.object,
  workspaceStatusLabel: PropTypes.string,
  statusLabel: PropTypes.string,
};

GigOperationsSection.defaultProps = {
  summary: null,
  deliverables: [],
  orders: [],
  selectedOrderId: null,
  onSelectOrder: undefined,
  onRefresh: undefined,
  loading: false,
  error: null,
  fromCache: false,
  lastUpdated: null,
  detail: null,
  onUpdateOrder: undefined,
  updatingOrderId: undefined,
  onReopenOrder: undefined,
  onCreateSubmission: undefined,
  onUpdateSubmission: undefined,
  pendingAction: false,
  onAddEvent: undefined,
  onSendMessage: undefined,
  onAcknowledgeMessage: undefined,
  onCreateGig: undefined,
  creatingGig: false,
  defaultCurrency: 'USD',
  onGigCreated: undefined,
  autoMatchSnapshot: null,
  boardMetrics: null,
  gigStats: null,
  onReviewPipeline: undefined,
  projectGigResource: null,
  workspaceStatusLabel: 'Gig marketplace sync',
  statusLabel: 'Gig data',
};
