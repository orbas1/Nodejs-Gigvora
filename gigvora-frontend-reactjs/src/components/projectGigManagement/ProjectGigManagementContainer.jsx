import { useState } from 'react';
import PropTypes from 'prop-types';
import useProjectGigManagement from '../../hooks/useProjectGigManagement.js';
import DataStatus from '../DataStatus.jsx';
import ProjectGigManagementSection from './ProjectGigManagementSection.jsx';

const INITIAL_PROJECT_FORM = {
  title: '',
  description: '',
  budgetAllocated: '',
  budgetCurrency: 'USD',
  dueDate: '',
};

const INITIAL_GIG_FORM = {
  vendorName: '',
  serviceName: '',
  amount: '',
  currency: 'USD',
  dueAt: '',
};

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function ProjectGigManagementContainer({ userId }) {
  const { data, loading, error, actions } = useProjectGigManagement(userId);
  const [projectForm, setProjectForm] = useState(INITIAL_PROJECT_FORM);
  const [gigForm, setGigForm] = useState(INITIAL_GIG_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [gigSubmitting, setGigSubmitting] = useState(false);

  const handleProjectChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((current) => ({ ...current, [name]: value }));
  };

  const handleGigChange = (event) => {
    const { name, value } = event.target;
    setGigForm((current) => ({ ...current, [name]: value }));
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    if (!projectForm.title || !projectForm.description) {
      return;
    }
    setSubmitting(true);
    try {
      await actions.createProject({
        title: projectForm.title,
        description: projectForm.description,
        budgetCurrency: projectForm.budgetCurrency,
        budgetAllocated: parseNumber(projectForm.budgetAllocated) ?? 0,
        dueDate: projectForm.dueDate || undefined,
        workspace: { status: 'planning', progressPercent: 5, nextMilestone: 'Kickoff workshop' },
        milestones: [
          {
            title: 'Kickoff workshop',
            dueDate: projectForm.dueDate || new Date(),
            ordinal: 1,
            status: 'planned',
          },
          {
            title: 'Delivery sprint',
            dueDate: projectForm.dueDate || undefined,
            ordinal: 2,
            status: 'planned',
          },
        ],
        collaborators: [],
        integrations: [{ provider: 'notion' }],
      });
      setProjectForm(INITIAL_PROJECT_FORM);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGigSubmit = async (event) => {
    event.preventDefault();
    if (!gigForm.vendorName || !gigForm.serviceName) {
      return;
    }
    setGigSubmitting(true);
    try {
      await actions.createGigOrder({
        vendorName: gigForm.vendorName,
        serviceName: gigForm.serviceName,
        amount: parseNumber(gigForm.amount) ?? 0,
        currency: gigForm.currency,
        dueAt: gigForm.dueAt || undefined,
        requirements: [{ title: 'Provide baseline materials', dueAt: gigForm.dueAt || undefined }],
      });
      setGigForm(INITIAL_GIG_FORM);
    } finally {
      setGigSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Kick off a new initiative</h2>
        <p className="mt-1 text-sm text-slate-500">
          Launch a project workspace with default milestones, workspace metrics, and collaborator scaffolding.
        </p>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleProjectSubmit}>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Title
            <input
              name="title"
              value={projectForm.title}
              onChange={handleProjectChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="Community relaunch"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Budget (optional)
            <input
              name="budgetAllocated"
              value={projectForm.budgetAllocated}
              onChange={handleProjectChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="25000"
              type="number"
              min="0"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
            Description
            <textarea
              name="description"
              value={projectForm.description}
              onChange={handleProjectChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="Detail the intent, collaborators, and expected outcomes."
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Currency
            <select
              name="budgetCurrency"
              value={projectForm.budgetCurrency}
              onChange={handleProjectChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Target completion
            <input
              type="date"
              name="dueDate"
              value={projectForm.dueDate}
              onChange={handleProjectChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="md:col-span-2 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-accent/60"
            disabled={submitting}
          >
            {submitting ? 'Creating project…' : 'Create project workspace'}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Track a purchased gig</h2>
        <p className="mt-1 text-sm text-slate-500">Capture vendor engagements, milestone tracking, and revision rounds.</p>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleGigSubmit}>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Vendor name
            <input
              name="vendorName"
              value={gigForm.vendorName}
              onChange={handleGigChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="Resume Studio"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Service name
            <input
              name="serviceName"
              value={gigForm.serviceName}
              onChange={handleGigChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="Executive resume refresh"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Budget (optional)
            <input
              name="amount"
              value={gigForm.amount}
              onChange={handleGigChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
              placeholder="4800"
              type="number"
              min="0"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Currency
            <select
              name="currency"
              value={gigForm.currency}
              onChange={handleGigChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Delivery due date
            <input
              type="date"
              name="dueAt"
              value={gigForm.dueAt}
              onChange={handleGigChange}
              className="rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="md:col-span-2 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={gigSubmitting}
          >
            {gigSubmitting ? 'Saving gig…' : 'Add gig engagement'}
          </button>
        </form>
      </div>

      <DataStatus loading={loading} error={error} />
      {data ? <ProjectGigManagementSection data={data} /> : null}
    </section>
  );
}

ProjectGigManagementContainer.propTypes = {
  userId: PropTypes.number.isRequired,
};
