import { useCallback, useMemo, useState } from 'react';
import { Tab } from '@headlessui/react';
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  createVolunteerApplication,
  updateVolunteerApplication,
  createVolunteerResponse,
  updateVolunteerResponse,
  deleteVolunteerResponse,
  upsertVolunteerContract,
  createVolunteerSpend,
  updateVolunteerSpend,
  deleteVolunteerSpend,
  createVolunteerReview,
  updateVolunteerReview,
  deleteVolunteerReview,
} from '../../services/volunteeringManagement.js';
import VolunteeringSlideOver from './VolunteeringSlideOver.jsx';
import ApplicationForm from './forms/ApplicationForm.jsx';
import ResponseForm from './forms/ResponseForm.jsx';
import ContractForm from './forms/ContractForm.jsx';
import SpendForm from './forms/SpendForm.jsx';
import ReviewForm from './forms/ReviewForm.jsx';
import ApplicationsBoard from './panels/ApplicationsBoard.jsx';
import ResponsesBoard from './panels/ResponsesBoard.jsx';
import ContractsBoard from './panels/ContractsBoard.jsx';
import SpendBoard from './panels/SpendBoard.jsx';
import ReviewsBoard from './panels/ReviewsBoard.jsx';
import { formatTimeAgo } from './utils.js';

const tabs = [
  { id: 'apply', label: 'Apply' },
  { id: 'reply', label: 'Reply' },
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'spend', label: 'Spend' },
  { id: 'review', label: 'Review' },
];

const initialDrawerState = { type: null, application: null, record: null };

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function VolunteeringManagementSection({ userId, data, onRefresh }) {
  const summary = data?.summary ?? {};
  const applications = useMemo(() => (Array.isArray(data?.applications) ? data.applications : []), [data?.applications]);
  const applicationLookup = useMemo(() => {
    const map = new Map();
    applications.forEach((application) => {
      map.set(application.id, application);
    });
    return map;
  }, [applications]);

  const responses = useMemo(() => {
    return applications.flatMap((application) =>
      (application.responses ?? []).map((response) => ({ ...response, application })),
    );
  }, [applications]);

  const openContracts = useMemo(() => {
    return (Array.isArray(data?.openContracts) ? data.openContracts : []).map((contract) => ({
      ...contract,
      application: applicationLookup.get(contract.applicationId) ?? null,
    }));
  }, [data?.openContracts, applicationLookup]);

  const finishedContracts = useMemo(() => {
    return (Array.isArray(data?.finishedContracts) ? data.finishedContracts : []).map((contract) => ({
      ...contract,
      application: applicationLookup.get(contract.applicationId) ?? null,
    }));
  }, [data?.finishedContracts, applicationLookup]);

  const spendEntries = useMemo(() => {
    return (Array.isArray(data?.spend?.entries) ? data.spend.entries : []).map((entry) => ({
      ...entry,
      application: applicationLookup.get(entry.applicationId) ?? null,
    }));
  }, [data?.spend?.entries, applicationLookup]);

  const spendTotals = data?.spend?.totalsByCurrency ?? {};

  const reviews = useMemo(() => {
    return (Array.isArray(data?.reviews) ? data.reviews : []).map((review) => ({
      ...review,
      application: applicationLookup.get(review.applicationId) ?? null,
    }));
  }, [data?.reviews, applicationLookup]);

  const [drawer, setDrawer] = useState(initialDrawerState);
  const [selector, setSelector] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    await onRefresh?.();
  }, [onRefresh]);

  const closeDrawer = useCallback(() => {
    if (busy) return;
    setDrawer(initialDrawerState);
  }, [busy]);

  const openApplicationDrawer = useCallback((application = null) => {
    setError(null);
    setDrawer({ type: 'application', application, record: null });
  }, []);

  const openResponseDrawer = useCallback((application, response = null) => {
    if (!application) {
      setSelector('response');
      return;
    }
    setError(null);
    setDrawer({ type: 'response', application, record: response });
  }, []);

  const openContractDrawer = useCallback((application, contract = null) => {
    setError(null);
    setDrawer({ type: 'contract', application, record: contract ?? application?.contract ?? null });
  }, []);

  const openSpendDrawer = useCallback((application, entry = null) => {
    if (!application) {
      setSelector('spend');
      return;
    }
    setError(null);
    setDrawer({ type: 'spend', application, record: entry });
  }, []);

  const openReviewDrawer = useCallback((application, review = null) => {
    if (!application) {
      setSelector('review');
      return;
    }
    setError(null);
    setDrawer({ type: 'review', application, record: review });
  }, []);

  const handleApplicationSubmit = useCallback(
    async (payload) => {
      if (!userId) {
        throw new Error('User required');
      }
      setBusy(true);
      setError(null);
      try {
        if (drawer.application) {
          await updateVolunteerApplication(userId, drawer.application.id, payload);
        } else {
          await createVolunteerApplication(userId, payload);
        }
        await refresh();
        closeDrawer();
      } catch (err) {
        setError(err?.message || 'Unable to save application');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [userId, drawer.application, refresh, closeDrawer],
  );

  const handleResponseSubmit = useCallback(
    async (payload) => {
      if (!userId) {
        throw new Error('User required');
      }
      const applicationId = drawer.application?.id;
      if (!applicationId) {
        throw new Error('Application required');
      }
      setBusy(true);
      setError(null);
      try {
        if (drawer.record) {
          await updateVolunteerResponse(userId, applicationId, drawer.record.id, payload);
        } else {
          await createVolunteerResponse(userId, applicationId, payload);
        }
        await refresh();
        closeDrawer();
      } catch (err) {
        setError(err?.message || 'Unable to save response');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [userId, drawer.application?.id, drawer.record, refresh, closeDrawer],
  );

  const handleResponseDelete = useCallback(
    async (response) => {
      if (!userId) {
        setError('User required');
        return;
      }
      if (!response?.applicationId) {
        setError('Application missing for response');
        return;
      }
      if (!window.confirm('Delete this response?')) {
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await deleteVolunteerResponse(userId, response.applicationId, response.id);
        await refresh();
      } catch (err) {
        setError(err?.message || 'Unable to delete response');
      } finally {
        setBusy(false);
      }
    },
    [userId, refresh],
  );

  const handleContractSubmit = useCallback(
    async (payload) => {
      if (!userId) {
        throw new Error('User required');
      }
      const applicationId = drawer.application?.id;
      if (!applicationId) {
        throw new Error('Application required');
      }
      setBusy(true);
      setError(null);
      try {
        await upsertVolunteerContract(userId, applicationId, payload);
        await refresh();
        closeDrawer();
      } catch (err) {
        setError(err?.message || 'Unable to save contract');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [userId, drawer.application?.id, refresh, closeDrawer],
  );

  const handleSpendSubmit = useCallback(
    async (payload) => {
      if (!userId) {
        throw new Error('User required');
      }
      const applicationId = drawer.application?.id;
      if (!applicationId) {
        throw new Error('Application required');
      }
      setBusy(true);
      setError(null);
      try {
        if (drawer.record) {
          await updateVolunteerSpend(userId, applicationId, drawer.record.id, payload);
        } else {
          await createVolunteerSpend(userId, applicationId, payload);
        }
        await refresh();
        closeDrawer();
      } catch (err) {
        setError(err?.message || 'Unable to save spend');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [userId, drawer.application?.id, drawer.record, refresh, closeDrawer],
  );

  const handleSpendDelete = useCallback(
    async (entry) => {
      if (!userId) {
        setError('User required');
        return;
      }
      if (!entry?.applicationId) {
        setError('Application missing for spend');
        return;
      }
      if (!window.confirm('Delete this spend entry?')) {
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await deleteVolunteerSpend(userId, entry.applicationId, entry.id);
        await refresh();
      } catch (err) {
        setError(err?.message || 'Unable to delete spend');
      } finally {
        setBusy(false);
      }
    },
    [userId, refresh],
  );

  const handleReviewSubmit = useCallback(
    async (payload) => {
      if (!userId) {
        throw new Error('User required');
      }
      const applicationId = drawer.application?.id;
      if (!applicationId) {
        throw new Error('Application required');
      }
      setBusy(true);
      setError(null);
      try {
        if (drawer.record) {
          await updateVolunteerReview(userId, applicationId, drawer.record.id, payload);
        } else {
          await createVolunteerReview(userId, applicationId, payload);
        }
        await refresh();
        closeDrawer();
      } catch (err) {
        setError(err?.message || 'Unable to save review');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [userId, drawer.application?.id, drawer.record, refresh, closeDrawer],
  );

  const handleReviewDelete = useCallback(
    async (review) => {
      if (!userId) {
        setError('User required');
        return;
      }
      if (!review?.applicationId) {
        setError('Application missing for review');
        return;
      }
      if (!window.confirm('Delete this review?')) {
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await deleteVolunteerReview(userId, review.applicationId, review.id);
        await refresh();
      } catch (err) {
        setError(err?.message || 'Unable to delete review');
      } finally {
        setBusy(false);
      }
    },
    [userId, refresh],
  );

  const currentApplication = drawer.application;
  const currentRecord = drawer.record;

  const selectorTitle = selector === 'response' ? 'Pick an application' : selector === 'spend' ? 'Log spend for' : 'Leave a review for';

  const summaryCards = [
    { label: 'Active', value: summary.openApplications ?? 0 },
    { label: 'Requests', value: summary.outstandingRequests ?? 0 },
    { label: 'Open', value: summary.openContracts ?? 0 },
    {
      label: 'Rating',
      value:
        summary.averageReviewRating != null ? Number(summary.averageReviewRating).toFixed(1) : '—',
    },
  ];

  return (
    <section id="volunteering-management" className="rounded-4xl bg-white p-8 shadow-sm">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <nav className="text-xs uppercase tracking-[0.2em] text-emerald-500">Volunteering</nav>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-semibold text-slate-900">Volunteer Hub</h2>
            <SparklesIcon className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-sm text-slate-500">
            Manage applications, partner replies, agreements, spend, and reviews without leaving the dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowPathIcon className="h-4 w-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => openApplicationDrawer(null)}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" /> New
          </button>
        </div>
      </header>

      {error ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <Tab.Group as="div" className="mt-8">
        <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
          <Tab.List className="flex rounded-3xl border border-slate-200 bg-slate-50 p-2 xl:flex-col xl:space-y-2 xl:bg-transparent xl:p-0">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                className={({ selected }) =>
                  classNames(
                    'flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    selected
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-transparent text-slate-600 hover:bg-white hover:text-slate-900',
                  )
                }
              >
                {tab.label}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="rounded-3xl border border-slate-200 bg-white p-4 xl:p-6">
            <Tab.Panel>
              <ApplicationsBoard
                applications={applications}
                onCreate={() => openApplicationDrawer(null)}
                onEdit={(application) => openApplicationDrawer(application)}
                onRespond={(application) => openResponseDrawer(application, null)}
                onContract={(application) => openContractDrawer(application, application.contract ?? null)}
                onSpend={(application) => openSpendDrawer(application, null)}
                onReview={(application) => openReviewDrawer(application, null)}
              />
            </Tab.Panel>
            <Tab.Panel>
              <ResponsesBoard
                responses={responses}
                onEdit={(response) => openResponseDrawer(response.application, response)}
                onDelete={handleResponseDelete}
                onCreate={applications.length ? () => setSelector('response') : undefined}
              />
            </Tab.Panel>
            <Tab.Panel>
              <ContractsBoard
                contracts={openContracts}
                emptyLabel="No open contracts"
                onManage={(contract) => openContractDrawer(contract.application ?? applicationLookup.get(contract.applicationId), contract)}
              />
            </Tab.Panel>
            <Tab.Panel>
              <ContractsBoard
                contracts={finishedContracts}
                emptyLabel="No closed contracts"
                onManage={(contract) => openContractDrawer(contract.application ?? applicationLookup.get(contract.applicationId), contract)}
              />
            </Tab.Panel>
            <Tab.Panel>
              <SpendBoard
                entries={spendEntries}
                totals={spendTotals}
                onEdit={(entry) => openSpendDrawer(entry.application ?? applicationLookup.get(entry.applicationId), entry)}
                onDelete={handleSpendDelete}
                onCreate={applications.length ? () => setSelector('spend') : undefined}
              />
            </Tab.Panel>
            <Tab.Panel>
              <ReviewsBoard
                reviews={reviews}
                onEdit={(review) => openReviewDrawer(review.application ?? applicationLookup.get(review.applicationId), review)}
                onDelete={handleReviewDelete}
                onCreate={applications.length ? () => setSelector('review') : undefined}
              />
            </Tab.Panel>
          </Tab.Panels>
        </div>
      </Tab.Group>

      <VolunteeringSlideOver
        open={drawer.type === 'application'}
        title={drawer.application ? 'Edit application' : 'New application'}
        subtitle={drawer.application?.role?.title ?? 'Set role and timeline'}
        onClose={closeDrawer}
        footer={null}
      >
        {drawer.type === 'application' ? (
          <ApplicationForm value={currentApplication} onSubmit={handleApplicationSubmit} onCancel={closeDrawer} busy={busy} />
        ) : null}
      </VolunteeringSlideOver>

      <VolunteeringSlideOver
        open={drawer.type === 'response'}
        title="Partner reply"
        subtitle={drawer.application?.role?.title ?? 'Record interaction'}
        onClose={closeDrawer}
      >
        {drawer.type === 'response' ? (
          <ResponseForm value={currentRecord} onSubmit={handleResponseSubmit} onCancel={closeDrawer} busy={busy} />
        ) : null}
      </VolunteeringSlideOver>

      <VolunteeringSlideOver
        open={drawer.type === 'contract'}
        title="Contract"
        subtitle={drawer.application?.role?.title ?? 'Agreement details'}
        onClose={closeDrawer}
      >
        {drawer.type === 'contract' ? (
          <ContractForm value={currentRecord} onSubmit={handleContractSubmit} onCancel={closeDrawer} busy={busy} />
        ) : null}
      </VolunteeringSlideOver>

      <VolunteeringSlideOver
        open={drawer.type === 'spend'}
        title="Spend entry"
        subtitle={drawer.application?.role?.title ?? 'Track spend'}
        onClose={closeDrawer}
      >
        {drawer.type === 'spend' ? (
          <SpendForm value={currentRecord} onSubmit={handleSpendSubmit} onCancel={closeDrawer} busy={busy} />
        ) : null}
      </VolunteeringSlideOver>

      <VolunteeringSlideOver
        open={drawer.type === 'review'}
        title="Review"
        subtitle={drawer.application?.role?.title ?? 'Share feedback'}
        onClose={closeDrawer}
      >
        {drawer.type === 'review' ? (
          <ReviewForm value={currentRecord} onSubmit={handleReviewSubmit} onCancel={closeDrawer} busy={busy} />
        ) : null}
      </VolunteeringSlideOver>

      <VolunteeringSlideOver
        open={Boolean(selector)}
        title={selectorTitle}
        subtitle="Choose a volunteering application"
        onClose={() => setSelector(null)}
        footer={null}
      >
        {applications.length === 0 ? (
          <p className="text-sm text-slate-500">Add an application first.</p>
        ) : (
          <div className="grid gap-3">
            {applications.map((application) => (
              <button
                key={application.id}
                type="button"
                onClick={() => {
                  if (selector === 'response') {
                    openResponseDrawer(application, null);
                  } else if (selector === 'spend') {
                    openSpendDrawer(application, null);
                  } else {
                    openReviewDrawer(application, null);
                  }
                  setSelector(null);
                }}
                className="flex flex-col gap-1 rounded-2xl border border-slate-200 px-4 py-3 text-left hover:border-emerald-400 hover:bg-emerald-50"
              >
                <span className="text-sm font-semibold text-slate-900">{application.role?.title ?? 'Application'}</span>
                <span className="text-xs text-slate-500">{application.role?.organization ?? 'Partner'}</span>
                <span className="text-xs text-slate-400">
                  Submitted {application.submittedAt ? formatTimeAgo(application.submittedAt) : 'not yet'}
                </span>
              </button>
            ))}
          </div>
        )}
      </VolunteeringSlideOver>
    </section>
  );
}
