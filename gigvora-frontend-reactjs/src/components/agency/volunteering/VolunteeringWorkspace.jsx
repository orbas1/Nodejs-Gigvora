import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  fetchAgencyVolunteeringOverview,
  createAgencyVolunteeringContract,
  updateAgencyVolunteeringContract,
  deleteAgencyVolunteeringContract,
  createAgencyVolunteeringApplication,
  updateAgencyVolunteeringApplication,
  deleteAgencyVolunteeringApplication,
  createAgencyVolunteeringResponse,
  updateAgencyVolunteeringResponse,
  deleteAgencyVolunteeringResponse,
  createAgencyVolunteeringSpendEntry,
  updateAgencyVolunteeringSpendEntry,
  deleteAgencyVolunteeringSpendEntry,
} from '../../../services/agency.js';
import ModalShell from './ModalShell.jsx';
import OverviewPane from './panes/OverviewPane.jsx';
import ContractsPane from './panes/ContractsPane.jsx';
import ApplicationsPane from './panes/ApplicationsPane.jsx';
import ResponsesPane from './panes/ResponsesPane.jsx';
import SpendPane from './panes/SpendPane.jsx';
import ContractForm from './forms/ContractForm.jsx';
import ApplicationForm from './forms/ApplicationForm.jsx';
import ResponseForm from './forms/ResponseForm.jsx';
import SpendForm from './forms/SpendForm.jsx';
import { fromDateTimeInput, safeNumber } from './utils.js';

const PANES = [
  { id: 'overview', label: 'Home' },
  { id: 'applications', label: 'Apply' },
  { id: 'responses', label: 'Replies' },
  { id: 'contracts', label: 'Deals' },
  { id: 'spend', label: 'Spend' },
];

const DEFAULT_MODAL_STATE = Object.freeze({ type: null, mode: 'create', record: null });

const MODAL_LABELS = {
  contract: {
    title: { create: 'New deal', edit: 'Edit deal', view: 'Deal details' },
  },
  application: {
    title: { create: 'New application', edit: 'Edit application', view: 'Application' },
  },
  response: {
    title: { create: 'New reply', edit: 'Edit reply', view: 'Reply' },
  },
  spend: {
    title: { create: 'New spend entry', edit: 'Edit spend entry', view: 'Spend entry' },
  },
};

function PaneButton({ id, label, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
        active ? 'bg-slate-900 text-white shadow-soft' : 'border border-transparent text-slate-600 hover:border-slate-200 hover:text-slate-900'
      }`}
    >
      {label}
      {active ? <span className="text-xs uppercase tracking-wide">Now</span> : null}
    </button>
  );
}

PaneButton.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

PaneButton.defaultProps = {
  active: false,
};

export default function VolunteeringWorkspace({ workspaceId, workspaceSlug, initialPane = 'overview', onPaneChange }) {
  const [pane, setPane] = useState(() => (PANES.some((item) => item.id === initialPane) ? initialPane : 'overview'));
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [modal, setModal] = useState(DEFAULT_MODAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setPane((current) => {
      if (current === initialPane) {
        return current;
      }
      return PANES.some((item) => item.id === initialPane) ? initialPane : current;
    });
  }, [initialPane]);

  const handleSelectPane = useCallback(
    (nextPane) => {
      const validPane = PANES.some((item) => item.id === nextPane) ? nextPane : 'overview';
      setPane(validPane);
      if (onPaneChange) {
        onPaneChange(validPane);
      }
    },
    [onPaneChange],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAgencyVolunteeringOverview({ workspaceId, workspaceSlug });
      setSnapshot(result);
      setLastUpdated(result?.refreshedAt ?? new Date().toISOString());
    } catch (err) {
      console.error('Failed to load volunteering workspace', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, workspaceSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const allowedActions = snapshot?.allowedActions ?? {};
  const canView = allowedActions.canView ?? true;
  const canManage = canView && (allowedActions.canManage ?? false);

  const contracts = snapshot?.contracts ?? { all: [], open: [], finished: [] };
  const applications = snapshot?.applications ?? [];
  const responses = snapshot?.responses ?? [];
  const spendEntries = snapshot?.spend?.entries ?? [];
  const spendTotals = snapshot?.spend?.totals ?? {};
  const summary = snapshot?.summary ?? {};
  const lookups = snapshot?.lookups ?? {};
  const defaultCurrency = snapshot?.workspace?.defaultCurrency ?? 'USD';
  const resolvedWorkspaceId = snapshot?.workspace?.id ?? workspaceId ?? null;
  const isInitialLoading = loading && !snapshot;

  const allContracts = useMemo(() => {
    const combined = [];
    const seen = new Set();
    [contracts.all, contracts.open, contracts.finished]
      .filter(Array.isArray)
      .forEach((list) => {
        list.forEach((contract) => {
          if (contract?.id == null || seen.has(contract.id)) {
            return;
          }
          seen.add(contract.id);
          combined.push(contract);
        });
      });
    return combined;
  }, [contracts]);

  const contractLookup = useMemo(() => {
    const map = new Map();
    allContracts.forEach((contract) => {
      if (contract?.id != null) {
        map.set(contract.id, contract);
      }
    });
    return map;
  }, [allContracts]);

  const decoratedApplications = useMemo(() => {
    return (applications ?? []).map((application) => {
      const contract = application.contractId ? contractLookup.get(application.contractId) : null;
      return {
        ...application,
        contractTitle: application.contractTitle ?? contract?.title ?? null,
      };
    });
  }, [applications, contractLookup]);

  const applicationLookup = useMemo(() => {
    const map = new Map();
    decoratedApplications.forEach((application) => {
      if (application?.id != null) {
        map.set(application.id, application);
      }
    });
    return map;
  }, [decoratedApplications]);

  const decoratedResponses = useMemo(() => {
    return (responses ?? []).map((response) => {
      const application = response.applicationId ? applicationLookup.get(response.applicationId) : null;
      return {
        ...response,
        applicationVolunteer: response.applicationVolunteer ?? application?.volunteerName ?? null,
      };
    });
  }, [responses, applicationLookup]);

  const decoratedSpendEntries = useMemo(() => {
    return (spendEntries ?? []).map((entry) => {
      const contract = entry.contractId ? contractLookup.get(entry.contractId) : null;
      return {
        ...entry,
        contractTitle: entry.contractTitle ?? contract?.title ?? null,
      };
    });
  }, [spendEntries, contractLookup]);

  const openModal = useCallback((type, mode = 'create', record = null) => {
    setModal({ type, mode, record });
    setActionError(null);
  }, []);

  const closeModal = useCallback(() => {
    setModal(DEFAULT_MODAL_STATE);
    setSubmitting(false);
    setActionError(null);
  }, []);

  const handleEnterEdit = useCallback(() => {
    if (!canManage) {
      return;
    }
    setModal((current) => {
      if (!current.type) {
        return current;
      }
      return { ...current, mode: 'edit' };
    });
  }, [canManage]);

  const updateSnapshot = useCallback(
    (nextSnapshot) => {
      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
        setLastUpdated(nextSnapshot?.refreshedAt ?? new Date().toISOString());
      } else {
        refresh();
      }
    },
    [refresh],
  );

  const handleDelete = useCallback(
    async (type, record) => {
      if (!canManage || !record?.id) {
        return;
      }
      const confirmMessage = {
        contract: 'Remove this deal?',
        application: 'Remove this application?',
        response: 'Remove this reply?',
        spend: 'Remove this spend entry?',
      }[type];
      const confirmed = typeof window === 'undefined' ? true : window.confirm(confirmMessage);
      if (!confirmed) {
        return;
      }
      try {
        let result;
        if (type === 'contract') {
          result = await deleteAgencyVolunteeringContract(record.id);
        } else if (type === 'application') {
          result = await deleteAgencyVolunteeringApplication(record.id);
        } else if (type === 'response') {
          result = await deleteAgencyVolunteeringResponse(record.id);
        } else if (type === 'spend') {
          result = await deleteAgencyVolunteeringSpendEntry(record.id);
        }
        updateSnapshot(result?.snapshot);
        setActionError(null);
      } catch (err) {
        console.error('Failed to delete record', err);
        setActionError(err);
      }
    },
    [canManage, updateSnapshot],
  );

  const handleSubmitContract = useCallback(
    async (event) => {
      event.preventDefault();
      if (!canManage) {
        return;
      }
      setSubmitting(true);
      setActionError(null);
      const formData = new FormData(event.currentTarget);
      const payload = {
        workspaceId: resolvedWorkspaceId ?? undefined,
        title: formData.get('title')?.trim(),
        partnerOrganization: formData.get('partnerOrganization')?.trim() || undefined,
        status: formData.get('status') || undefined,
        startDate: formData.get('startDate') || undefined,
        endDate: formData.get('endDate') || undefined,
        volunteerCount: safeNumber(formData.get('volunteerCount')),
        contractValue: safeNumber(formData.get('contractValue')),
        spendToDate: safeNumber(formData.get('spendToDate')),
        currency: formData.get('currency')?.toUpperCase() || undefined,
        engagementLeadName: formData.get('engagementLeadName')?.trim() || undefined,
        engagementLeadEmail: formData.get('engagementLeadEmail')?.trim() || undefined,
        notes: formData.get('notes')?.trim() || undefined,
      };

      try {
        const result =
          modal.mode === 'edit' && modal.record
            ? await updateAgencyVolunteeringContract(modal.record.id, payload)
            : await createAgencyVolunteeringContract(payload);
        updateSnapshot(result?.snapshot);
        closeModal();
      } catch (err) {
        console.error('Failed to save contract', err);
        setActionError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [canManage, closeModal, modal.mode, modal.record, resolvedWorkspaceId, updateSnapshot],
  );

  const handleSubmitApplication = useCallback(
    async (event) => {
      event.preventDefault();
      if (!canManage) {
        return;
      }
      setSubmitting(true);
      setActionError(null);
      const formData = new FormData(event.currentTarget);
      const skills = (formData.get('skills')?.toString() ?? '')
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);

      const payload = {
        workspaceId: resolvedWorkspaceId ?? undefined,
        contractId: safeNumber(formData.get('contractId')),
        volunteerName: formData.get('volunteerName')?.trim(),
        volunteerEmail: formData.get('volunteerEmail')?.trim() || undefined,
        volunteerPhone: formData.get('volunteerPhone')?.trim() || undefined,
        avatarUrl: formData.get('avatarUrl')?.trim() || undefined,
        stage: formData.get('stage') || undefined,
        status: formData.get('status') || undefined,
        submittedAt: fromDateTimeInput(formData.get('submittedAt')),
        source: formData.get('source')?.trim() || undefined,
        experienceSummary: formData.get('experienceSummary')?.trim() || undefined,
        skills,
        assignedContactName: formData.get('assignedContactName')?.trim() || undefined,
        assignedContactEmail: formData.get('assignedContactEmail')?.trim() || undefined,
        rating: safeNumber(formData.get('rating')),
        notes: formData.get('notes')?.trim() || undefined,
      };

      try {
        const result =
          modal.mode === 'edit' && modal.record
            ? await updateAgencyVolunteeringApplication(modal.record.id, payload)
            : await createAgencyVolunteeringApplication(payload);
        updateSnapshot(result?.snapshot);
        closeModal();
      } catch (err) {
        console.error('Failed to save application', err);
        setActionError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [canManage, closeModal, modal.mode, modal.record, resolvedWorkspaceId, updateSnapshot],
  );

  const handleSubmitResponse = useCallback(
    async (event) => {
      event.preventDefault();
      if (!canManage) {
        return;
      }
      setSubmitting(true);
      setActionError(null);
      const formData = new FormData(event.currentTarget);
      const payload = {
        workspaceId: resolvedWorkspaceId ?? undefined,
        applicationId: safeNumber(formData.get('applicationId')),
        responseType: formData.get('responseType') || undefined,
        responderName: formData.get('responderName')?.trim() || undefined,
        responderRole: formData.get('responderRole')?.trim() || undefined,
        summary: formData.get('summary')?.trim(),
        nextSteps: formData.get('nextSteps')?.trim() || undefined,
        followUpAt: fromDateTimeInput(formData.get('followUpAt')),
        requiresAction: formData.get('requiresAction') === 'on',
        documentUrl: formData.get('documentUrl')?.trim() || undefined,
      };

      try {
        const result =
          modal.mode === 'edit' && modal.record
            ? await updateAgencyVolunteeringResponse(modal.record.id, payload)
            : await createAgencyVolunteeringResponse(payload);
        updateSnapshot(result?.snapshot);
        closeModal();
      } catch (err) {
        console.error('Failed to save response', err);
        setActionError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [canManage, closeModal, modal.mode, modal.record, resolvedWorkspaceId, updateSnapshot],
  );

  const handleSubmitSpend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!canManage) {
        return;
      }
      setSubmitting(true);
      setActionError(null);
      const formData = new FormData(event.currentTarget);
      const payload = {
        workspaceId: resolvedWorkspaceId ?? undefined,
        contractId: safeNumber(formData.get('contractId')),
        amount: safeNumber(formData.get('amount')),
        currency: formData.get('currency')?.toUpperCase() || undefined,
        category: formData.get('category')?.trim() || undefined,
        recordedAt: fromDateTimeInput(formData.get('recordedAt')),
        memo: formData.get('memo')?.trim() || undefined,
        invoiceReference: formData.get('invoiceReference')?.trim() || undefined,
        receiptUrl: formData.get('receiptUrl')?.trim() || undefined,
        recordedByName: formData.get('recordedByName')?.trim() || undefined,
        recordedByRole: formData.get('recordedByRole')?.trim() || undefined,
      };

      try {
        const result =
          modal.mode === 'edit' && modal.record
            ? await updateAgencyVolunteeringSpendEntry(modal.record.id, payload)
            : await createAgencyVolunteeringSpendEntry(payload);
        updateSnapshot(result?.snapshot);
        closeModal();
      } catch (err) {
        console.error('Failed to save spend entry', err);
        setActionError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [canManage, closeModal, modal.mode, modal.record, resolvedWorkspaceId, updateSnapshot],
  );

  const modalTitle = modal.type ? MODAL_LABELS[modal.type]?.title?.[modal.mode] ?? 'Details' : '';

  const modalActions = useMemo(() => {
    if (!modal.type) {
      return null;
    }
    if (modal.mode === 'view') {
      const viewActions = [];
      if (canManage) {
        viewActions.push(
          <button
            key="edit"
            type="button"
            onClick={handleEnterEdit}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Edit
          </button>,
        );
      }
      viewActions.push(
        <button
          key="close"
          type="button"
          onClick={closeModal}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Close
        </button>,
      );
      return viewActions;
    }

    const submitLabel = modal.mode === 'edit' ? 'Save' : 'Create';
    return [
      <button
        key="cancel"
        type="button"
        onClick={closeModal}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
      >
        Cancel
      </button>,
      <button
        key="submit"
        type="submit"
        form={`volunteering-${modal.type}-form`}
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700 disabled:opacity-60"
      >
        {submitLabel}
      </button>,
    ];
  }, [canManage, closeModal, handleEnterEdit, modal.mode, modal.type, submitting]);

  const renderModalBody = () => {
    if (!modal.type) {
      return null;
    }
    const record = modal.record ?? {};
    const disabled = modal.mode === 'view' || !canManage;

    if (modal.type === 'contract') {
      return (
        <form id="volunteering-contract-form" onSubmit={handleSubmitContract} className="space-y-6">
          <ContractForm record={record} lookups={lookups} defaultCurrency={defaultCurrency} disabled={disabled} />
        </form>
      );
    }

    if (modal.type === 'application') {
      return (
        <form id="volunteering-application-form" onSubmit={handleSubmitApplication} className="space-y-6">
          <ApplicationForm record={record} contracts={allContracts} lookups={lookups} disabled={disabled} />
        </form>
      );
    }

    if (modal.type === 'response') {
      return (
        <form id="volunteering-response-form" onSubmit={handleSubmitResponse} className="space-y-6">
          <ResponseForm record={record} applications={decoratedApplications} lookups={lookups} disabled={disabled} />
        </form>
      );
    }

    if (modal.type === 'spend') {
      return (
        <form id="volunteering-spend-form" onSubmit={handleSubmitSpend} className="space-y-6">
          <SpendForm record={record} contracts={allContracts} defaultCurrency={defaultCurrency} disabled={disabled} />
        </form>
      );
    }

    return null;
  };

  const activePane = pane;

  if (!canView) {
    return (
      <section id="volunteering-home" className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-soft lg:p-10">
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-white bg-white p-10 text-center shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">Access restricted</h2>
          <p className="max-w-xl text-sm text-slate-600">
            You do not have permission to view volunteering data for this workspace. Please contact your administrator to request
            access or update your role permissions.
          </p>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Retry access check
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="volunteering-home" className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-soft lg:p-10">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">Volunteer</h2>
          <div className="hidden flex-col gap-2 lg:flex">
            {PANES.map((item) => (
              <PaneButton key={item.id} id={item.id} label={item.label} active={activePane === item.id} onSelect={handleSelectPane} />
            ))}
          </div>
          <div className="lg:hidden">
            <select
              value={activePane}
              onChange={(event) => handleSelectPane(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0"
            >
              {PANES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <div className="flex min-h-[640px] flex-col gap-6 rounded-3xl border border-white bg-white p-6 shadow-soft lg:p-8">
          {actionError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError.message ?? 'We could not complete that action. Please try again.'}
            </div>
          ) : null}

          {activePane === 'overview' ? (
            <OverviewPane
              summary={summary}
              contracts={contracts}
              applications={decoratedApplications}
              responses={decoratedResponses}
              spendTotals={spendTotals}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={refresh}
              defaultCurrency={defaultCurrency}
              onViewContract={(record) => openModal('contract', 'view', record)}
              onViewApplication={(record) => openModal('application', 'view', record)}
              onViewResponse={(record) => openModal('response', 'view', record)}
            />
          ) : null}

          {activePane === 'contracts' ? (
            <ContractsPane
              contracts={contracts}
              defaultCurrency={defaultCurrency}
              canManage={canManage}
              onCreate={() => openModal('contract', 'create')}
              onEdit={(record) => openModal('contract', 'edit', record)}
              onDelete={(record) => handleDelete('contract', record)}
              onView={(record) => openModal('contract', 'view', record)}
              loading={isInitialLoading}
            />
          ) : null}

          {activePane === 'applications' ? (
            <ApplicationsPane
              applications={decoratedApplications}
              canManage={canManage}
              onCreate={() => openModal('application', 'create')}
              onEdit={(record) => openModal('application', 'edit', record)}
              onDelete={(record) => handleDelete('application', record)}
              onView={(record) => openModal('application', 'view', record)}
              loading={isInitialLoading}
            />
          ) : null}

          {activePane === 'responses' ? (
            <ResponsesPane
              responses={decoratedResponses}
              canManage={canManage}
              onCreate={() => openModal('response', 'create')}
              onEdit={(record) => openModal('response', 'edit', record)}
              onDelete={(record) => handleDelete('response', record)}
              onView={(record) => openModal('response', 'view', record)}
              loading={isInitialLoading}
            />
          ) : null}

          {activePane === 'spend' ? (
            <SpendPane
              entries={decoratedSpendEntries}
              totals={spendTotals}
              defaultCurrency={defaultCurrency}
              canManage={canManage}
              onCreate={() => openModal('spend', 'create')}
              onEdit={(record) => openModal('spend', 'edit', record)}
              onDelete={(record) => handleDelete('spend', record)}
              onView={(record) => openModal('spend', 'view', record)}
              loading={isInitialLoading}
            />
          ) : null}
        </div>
      </div>

      <ModalShell title={modalTitle} open={Boolean(modal.type)} onClose={closeModal} actions={modalActions}>
        {renderModalBody()}
      </ModalShell>
    </section>
  );
}

VolunteeringWorkspace.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  workspaceSlug: PropTypes.string,
  initialPane: PropTypes.string,
  onPaneChange: PropTypes.func,
};

VolunteeringWorkspace.defaultProps = {
  workspaceId: null,
  workspaceSlug: undefined,
  initialPane: 'overview',
  onPaneChange: undefined,
};
