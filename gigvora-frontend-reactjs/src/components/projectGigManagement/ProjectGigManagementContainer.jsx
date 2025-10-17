import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import DataStatus from '../DataStatus.jsx';
import ProjectGigManagementSection from './ProjectGigManagementSection.jsx';
import { useProjectManagementAccess } from '../../hooks/useAuthorization.js';
import useSession from '../../hooks/useSession.js';
import GigOperationsWorkspace from './GigOperationsWorkspace.jsx';
import ProjectWizard from './ProjectWizard.jsx';
import GigOrderComposer from './GigOrderComposer.jsx';
import TimelineComposer from './TimelineComposer.jsx';
import SubmissionComposer from './SubmissionComposer.jsx';
import ChatComposer from './ChatComposer.jsx';
import GigOrderDetailDrawer from './GigOrderDetailDrawer.jsx';

const EMPTY_COMPOSER = { form: null, context: null };

export default function ProjectGigManagementContainer({ userId }) {
  const { canManageProjects, denialReason } = useProjectManagementAccess();
  const { session } = useSession();

  if (!canManageProjects) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Access needed</h2>
        <p className="mt-3 text-sm text-slate-600">{denialReason ?? 'Switch to a workspace role with project rights.'}</p>
      </section>
    );
  }

  const { data, loading, error, actions, reload } = useProjectGigManagement(userId);
  const [activeView, setActiveView] = useState('manage');
  const [composer, setComposer] = useState(EMPTY_COMPOSER);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const orders = useMemo(() => (Array.isArray(data?.purchasedGigs?.orders) ? data.purchasedGigs.orders : []), [data]);
  const orderOptions = useMemo(
    () =>
      orders.map((order) => ({
        value: order.id,
        label: `${order.orderNumber ?? `Order ${order.id}`} · ${order.serviceName}`,
      })),
    [orders],
  );
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const accessReason = hasSnapshot && !canManage
    ? access.reason ??
      (access.actorRole
        ? `Gig operations are view-only for the ${access.actorRole.replace(/_/g, ' ')} role.`
        : 'Gig operations are view-only for your current access level.')
    : null;

  const defaultAuthorName = useMemo(() => {
    if (!session) {
      return null;
    }
    if (session.name) {
      return session.name;
    }
    const user = session.user ?? {};
    if (user.name) {
      return user.name;
    }
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (parts.length) {
      return parts.join(' ');
    }
    return session.email ?? session.user?.email ?? null;
  }, [session]);

  const inputClassName = (hasError) =>
    `rounded-xl border px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
      hasError ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500' : 'border-slate-200'
    }`;

  const handleProjectChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((current) => ({ ...current, [name]: value }));
  };

  const openComposer = (form, context = null) => {
    setComposer({ form, context });
  };

  const closeComposer = () => {
    setComposer(EMPTY_COMPOSER);
  };

  const handleOrderDetail = (orderId) => {
    setSelectedOrderId(orderId ?? null);
  };

  return (
    <section className="flex h-full flex-col gap-6">
      <DataStatus
        loading={loading}
        error={error}
        retry={reload}
        className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm"
      >
        {data ? (
          <ProjectGigManagementSection
            data={data}
            activeView={activeView}
            onViewChange={setActiveView}
            onOpenProject={() => openComposer('project')}
            onOpenOrder={() => openComposer('order')}
            onOpenOrderDetail={(orderId) => handleOrderDetail(orderId)}
            onCreateTimeline={(orderId) => openComposer('timeline', { orderId })}
            onEditTimeline={(orderId, event) => openComposer('timeline', { orderId, event })}
            onLogSubmission={(orderId) => openComposer('submission', { orderId })}
            onEditSubmission={(orderId, submission) => openComposer('submission', { orderId, submission })}
            onStartChat={(orderId) => openComposer('chat', { orderId })}
            onEditOrder={(order) => openComposer('order', { order })}
          />
        ) : null}
      </DataStatus>

      <ProjectWizard
        open={composer.form === 'project'}
        templates={data?.projectCreation?.templates ?? []}
        onClose={closeComposer}
        onSubmit={(payload) => actions.createProject(payload)}
      />

      {loading && !data ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-full rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="h-full animate-pulse space-y-4">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-3 w-3/4 rounded bg-slate-200" />
              <div className="h-32 rounded-xl bg-slate-100" />
              <div className="h-10 rounded-xl bg-slate-100" />
            </div>
          </div>
          <div className="h-full rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="h-full animate-pulse space-y-4">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
              <div className="h-32 rounded-xl bg-slate-100" />
              <div className="h-10 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {renderProjectForm()}
            {renderGigForm()}
          </div>
          {data ? (
            <>
              <ProjectGigManagementSection data={data} />
              <GigOperationsWorkspace
                data={data}
                canManage={canManage}
                onCreateOrder={actions.createGigOrder}
                onUpdateOrder={actions.updateGigOrder}
                onAddTimelineEvent={actions.addTimelineEvent}
                onPostMessage={actions.postGigMessage}
                onCreateEscrow={actions.createEscrowCheckpoint}
                onUpdateEscrow={actions.updateEscrowCheckpoint}
                onSubmitReview={(orderId, payload) => actions.updateGigOrder(orderId, payload)}
                defaultAuthorName={defaultAuthorName}
              />
            </>
          ) : null}
        </>
      )}
      <GigOrderComposer
        open={composer.form === 'order'}
        order={composer.context?.order ?? null}
        onClose={closeComposer}
        onSubmit={(payload) =>
          composer.context?.order
            ? actions.updateGigOrder(composer.context.order.id, payload)
            : actions.createGigOrder(payload)
        }
      />

      <TimelineComposer
        open={composer.form === 'timeline'}
        onClose={closeComposer}
        orderOptions={orderOptions}
        context={composer.context}
        onSubmit={({ orderId, payload, event }) =>
          event
            ? actions.updateGigTimelineEvent(orderId, event.id, payload)
            : actions.createGigTimelineEvent(orderId, payload)
        }
      />

      <SubmissionComposer
        open={composer.form === 'submission'}
        onClose={closeComposer}
        orderOptions={orderOptions}
        context={composer.context}
        onSubmit={({ orderId, payload, submission }) =>
          submission
            ? actions.updateGigSubmission(orderId, submission.id, payload)
            : actions.createGigSubmission(orderId, payload)
        }
      />

      <ChatComposer
        open={composer.form === 'chat'}
        onClose={closeComposer}
        orderOptions={orderOptions}
        context={composer.context}
        onSubmit={({ orderId, payload }) => actions.postGigChatMessage(orderId, payload)}
      />

      <GigOrderDetailDrawer
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        onClose={() => handleOrderDetail(null)}
        onEditOrder={(order) => openComposer('order', { order })}
        onAddTimeline={(orderId) => openComposer('timeline', { orderId })}
        onEditTimeline={(orderId, event) => openComposer('timeline', { orderId, event })}
        onLogSubmission={(orderId) => openComposer('submission', { orderId })}
        onEditSubmission={(orderId, submission) => openComposer('submission', { orderId, submission })}
        onStartChat={(orderId) => openComposer('chat', { orderId })}
      />
    </section>
  );
}

ProjectGigManagementContainer.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
