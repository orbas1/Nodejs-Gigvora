import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  createWorkforceMember,
  updateWorkforceMember,
  deleteWorkforceMember,
  createPayDelegation,
  updatePayDelegation,
  deletePayDelegation,
  createProjectDelegation,
  updateProjectDelegation,
  deleteProjectDelegation,
  createGigDelegation,
  updateGigDelegation,
  deleteGigDelegation,
  recordCapacitySnapshot,
  updateCapacitySnapshot,
  deleteCapacitySnapshot,
  createAvailabilityEntry,
  updateAvailabilityEntry,
  deleteAvailabilityEntry,
} from '../../../../services/agencyWorkforce.js';
import useAgencyWorkforceDashboard from '../../../../hooks/useAgencyWorkforceDashboard.js';
import AgencyWorkforceDashboard from '../../../../components/agency/workforce/AgencyWorkforceDashboard.jsx';

function resolveMessage(action) {
  switch (action) {
    case 'createMember':
      return 'Team member added to roster.';
    case 'updateMember':
      return 'Team member updated.';
    case 'deleteMember':
      return 'Team member removed.';
    case 'createPayDelegation':
      return 'Pay delegation created.';
    case 'updatePayDelegation':
      return 'Pay delegation updated.';
    case 'deletePayDelegation':
      return 'Pay delegation removed.';
    case 'createProjectDelegation':
      return 'Project delegation created.';
    case 'updateProjectDelegation':
      return 'Project delegation updated.';
    case 'deleteProjectDelegation':
      return 'Project delegation removed.';
    case 'createGigDelegation':
      return 'Gig delegation created.';
    case 'updateGigDelegation':
      return 'Gig delegation updated.';
    case 'deleteGigDelegation':
      return 'Gig delegation removed.';
    case 'recordCapacitySnapshot':
      return 'Capacity snapshot recorded.';
    case 'updateCapacitySnapshot':
      return 'Capacity snapshot updated.';
    case 'deleteCapacitySnapshot':
      return 'Capacity snapshot deleted.';
    case 'createAvailabilityEntry':
      return 'Availability entry logged.';
    case 'updateAvailabilityEntry':
      return 'Availability entry updated.';
    case 'deleteAvailabilityEntry':
      return 'Availability entry removed.';
    default:
      return 'Workforce updated.';
  }
}

export default function AgencyHrManagementSection({ workspaceId, canEdit }) {
  const [statusMessage, setStatusMessage] = useState('');
  const [actionError, setActionError] = useState(null);

  const workforce = useAgencyWorkforceDashboard({ workspaceId });

  const withWorkspace = useCallback(
    (payload = {}) => {
      if (workspaceId == null || workspaceId === '') {
        return payload;
      }
      return { ...payload, workspaceId };
    },
    [workspaceId],
  );

  const refresh = useCallback(async () => {
    setStatusMessage('');
    setActionError(null);
    await workforce.refresh?.();
  }, [workforce]);

  const runAction = useCallback(
    async (actionName, handler) => {
      setStatusMessage('');
      setActionError(null);
      try {
        const result = await handler();
        setStatusMessage(resolveMessage(actionName));
        await workforce.refresh?.();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to complete request.';
        setActionError(message);
        throw error;
      }
    },
    [workforce],
  );

  const actions = useMemo(
    () => ({
      refresh,
      createMember: (payload) => runAction('createMember', () => createWorkforceMember(withWorkspace(payload))),
      updateMember: (memberId, payload) =>
        runAction('updateMember', () => updateWorkforceMember(memberId, withWorkspace(payload))),
      deleteMember: (memberId) => runAction('deleteMember', () => deleteWorkforceMember(memberId, withWorkspace())),
      createPayDelegation: (payload) =>
        runAction('createPayDelegation', () => createPayDelegation(withWorkspace(payload))),
      updatePayDelegation: (delegationId, payload) =>
        runAction('updatePayDelegation', () => updatePayDelegation(delegationId, withWorkspace(payload))),
      deletePayDelegation: (delegationId) =>
        runAction('deletePayDelegation', () => deletePayDelegation(delegationId, withWorkspace())),
      createProjectDelegation: (payload) =>
        runAction('createProjectDelegation', () => createProjectDelegation(withWorkspace(payload))),
      updateProjectDelegation: (delegationId, payload) =>
        runAction('updateProjectDelegation', () => updateProjectDelegation(delegationId, withWorkspace(payload))),
      deleteProjectDelegation: (delegationId) =>
        runAction('deleteProjectDelegation', () => deleteProjectDelegation(delegationId, withWorkspace())),
      createGigDelegation: (payload) => runAction('createGigDelegation', () => createGigDelegation(withWorkspace(payload))),
      updateGigDelegation: (delegationId, payload) =>
        runAction('updateGigDelegation', () => updateGigDelegation(delegationId, withWorkspace(payload))),
      deleteGigDelegation: (delegationId) =>
        runAction('deleteGigDelegation', () => deleteGigDelegation(delegationId, withWorkspace())),
      recordCapacitySnapshot: (payload) =>
        runAction('recordCapacitySnapshot', () => recordCapacitySnapshot(withWorkspace(payload))),
      updateCapacitySnapshot: (snapshotId, payload) =>
        runAction('updateCapacitySnapshot', () => updateCapacitySnapshot(snapshotId, withWorkspace(payload))),
      deleteCapacitySnapshot: (snapshotId) =>
        runAction('deleteCapacitySnapshot', () => deleteCapacitySnapshot(snapshotId, withWorkspace())),
      createAvailabilityEntry: (payload) =>
        runAction('createAvailabilityEntry', () => createAvailabilityEntry(withWorkspace(payload))),
      updateAvailabilityEntry: (entryId, payload) =>
        runAction('updateAvailabilityEntry', () => updateAvailabilityEntry(entryId, withWorkspace(payload))),
      deleteAvailabilityEntry: (entryId) =>
        runAction('deleteAvailabilityEntry', () => deleteAvailabilityEntry(entryId, withWorkspace())),
    }),
    [refresh, runAction, withWorkspace],
  );

  return (
    <section id="agency-hr" className="space-y-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Dashboard / People</p>
          <h2 className="text-3xl font-semibold text-slate-900">HR management</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage bench, assignments, availability, and pay governance for every squad in your agency workspace.
          </p>
        </div>
      </header>

      {statusMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      ) : null}

      <AgencyWorkforceDashboard
        data={workforce.data}
        loading={workforce.loading}
        error={workforce.error}
        summaryCards={workforce.summaryCards}
        onRefresh={refresh}
        workspaceId={workspaceId}
        permissions={{ canEdit }}
        actions={actions}
      />
    </section>
  );
}

AgencyHrManagementSection.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  canEdit: PropTypes.bool,
};

AgencyHrManagementSection.defaultProps = {
  workspaceId: null,
  canEdit: false,
};
