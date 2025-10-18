import { useMemo, useState } from 'react';
import {
  APPLICATION_STATUSES,
  RESPONSE_TYPES,
  RESPONSE_VISIBILITY,
  INTERVIEW_STATUSES,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
} from './volunteeringOptions.js';

function Section({ title, description, children }) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${props.className || ''}`}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${props.className || ''}`}
    />
  );
}

function Select({ options, ...props }) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${props.className || ''}`}
    >
      {(options ?? []).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

export default function ApplicationManager({
  application,
  onUpdate,
  onDelete,
  onCreateResponse,
  onUpdateResponse,
  onDeleteResponse,
  onScheduleInterview,
  onUpdateInterview,
  onDeleteInterview,
  onCreateContract,
  onUpdateContract,
  onAddSpend,
  onUpdateSpend,
  onDeleteSpend,
  busy,
}) {
  const [applicationForm, setApplicationForm] = useState({
    status: application.status ?? 'submitted',
    stage: application.stage ?? '',
    assignedTo: application.assignedTo ?? '',
    source: application.source ?? '',
    notes: application.notes ?? '',
    candidateName: application.candidateName ?? '',
    candidateEmail: application.candidateEmail ?? '',
    candidatePhone: application.candidatePhone ?? '',
  });
  const [responseDraft, setResponseDraft] = useState({ message: '', responseType: 'message', visibility: 'internal' });
  const [editingResponse, setEditingResponse] = useState(null);
  const [interviewDraft, setInterviewDraft] = useState({
    scheduledAt: '',
    durationMinutes: 45,
    interviewerName: '',
    interviewerEmail: '',
    status: 'scheduled',
    location: '',
    meetingUrl: '',
    notes: '',
  });
  const [editingInterview, setEditingInterview] = useState(null);
  const [contractDraft, setContractDraft] = useState({
    title: `${application.candidateName || 'Volunteer'} contract`,
    status: 'draft',
    contractType: 'fixed_term',
    stipendAmount: '',
    currency: 'USD',
    hoursPerWeek: '',
    startDate: '',
    endDate: '',
    terms: '',
  });
  const [editingContract, setEditingContract] = useState(null);
  const [spendDraft, setSpendDraft] = useState({ amount: '', currency: 'USD', category: '', description: '', contractId: null });
  const [editingSpend, setEditingSpend] = useState(null);
  const [error, setError] = useState(null);

  const contractsById = useMemo(() => {
    const map = new Map();
    (application.contracts ?? []).forEach((contract) => {
      map.set(contract.id, contract);
    });
    return map;
  }, [application.contracts]);

  const handleApplicationSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await onUpdate({
        status: applicationForm.status,
        stage: applicationForm.stage || undefined,
        assignedTo: applicationForm.assignedTo || undefined,
        source: applicationForm.source || undefined,
        notes: applicationForm.notes || undefined,
        candidateName: applicationForm.candidateName,
        candidateEmail: applicationForm.candidateEmail || undefined,
        candidatePhone: applicationForm.candidatePhone || undefined,
      });
    } catch (err) {
      setError(err.message || 'Unable to update application.');
    }
  };

  const handleResponseSubmit = async (event) => {
    event.preventDefault();
    if (!responseDraft.message.trim()) {
      setError('Response message is required.');
      return;
    }
    setError(null);
    try {
      await onCreateResponse({
        message: responseDraft.message,
        responseType: responseDraft.responseType,
        visibility: responseDraft.visibility,
      });
      setResponseDraft({ message: '', responseType: 'message', visibility: 'internal' });
    } catch (err) {
      setError(err.message || 'Unable to log response.');
    }
  };

  const handleResponseUpdate = async (event) => {
    event.preventDefault();
    if (!editingResponse) return;
    setError(null);
    try {
      await onUpdateResponse(editingResponse.id, {
        message: editingResponse.message,
        responseType: editingResponse.responseType,
        visibility: editingResponse.visibility,
      });
      setEditingResponse(null);
    } catch (err) {
      setError(err.message || 'Unable to update response.');
    }
  };

  const handleInterviewSubmit = async (event) => {
    event.preventDefault();
    if (!interviewDraft.scheduledAt) {
      setError('Scheduled date is required.');
      return;
    }
    setError(null);
    try {
      await onScheduleInterview({
        scheduledAt: interviewDraft.scheduledAt,
        durationMinutes: Number(interviewDraft.durationMinutes) || undefined,
        interviewerName: interviewDraft.interviewerName || undefined,
        interviewerEmail: interviewDraft.interviewerEmail || undefined,
        status: interviewDraft.status,
        location: interviewDraft.location || undefined,
        meetingUrl: interviewDraft.meetingUrl || undefined,
        notes: interviewDraft.notes || undefined,
      });
      setInterviewDraft({
        scheduledAt: '',
        durationMinutes: 45,
        interviewerName: '',
        interviewerEmail: '',
        status: 'scheduled',
        location: '',
        meetingUrl: '',
        notes: '',
      });
    } catch (err) {
      setError(err.message || 'Unable to schedule interview.');
    }
  };

  const handleInterviewUpdate = async (event) => {
    event.preventDefault();
    if (!editingInterview) return;
    setError(null);
    try {
      await onUpdateInterview(editingInterview.id, {
        scheduledAt: editingInterview.scheduledAt,
        durationMinutes: Number(editingInterview.durationMinutes) || undefined,
        interviewerName: editingInterview.interviewerName || undefined,
        interviewerEmail: editingInterview.interviewerEmail || undefined,
        status: editingInterview.status,
        location: editingInterview.location || undefined,
        meetingUrl: editingInterview.meetingUrl || undefined,
        notes: editingInterview.notes || undefined,
      });
      setEditingInterview(null);
    } catch (err) {
      setError(err.message || 'Unable to update interview.');
    }
  };

  const handleContractSubmit = async (event) => {
    event.preventDefault();
    if (!contractDraft.title.trim()) {
      setError('Contract title is required.');
      return;
    }
    setError(null);
    try {
      await onCreateContract({
        title: contractDraft.title,
        status: contractDraft.status,
        contractType: contractDraft.contractType,
        stipendAmount: contractDraft.stipendAmount ? Number(contractDraft.stipendAmount) : undefined,
        currency: contractDraft.currency || 'USD',
        hoursPerWeek: contractDraft.hoursPerWeek ? Number(contractDraft.hoursPerWeek) : undefined,
        startDate: contractDraft.startDate || undefined,
        endDate: contractDraft.endDate || undefined,
        terms: contractDraft.terms || undefined,
      });
      setContractDraft({
        title: `${application.candidateName || 'Volunteer'} contract`,
        status: 'draft',
        contractType: 'fixed_term',
        stipendAmount: '',
        currency: 'USD',
        hoursPerWeek: '',
        startDate: '',
        endDate: '',
        terms: '',
      });
    } catch (err) {
      setError(err.message || 'Unable to create contract.');
    }
  };

  const handleContractUpdate = async (event) => {
    event.preventDefault();
    if (!editingContract) return;
    setError(null);
    try {
      await onUpdateContract(editingContract.id, {
        title: editingContract.title,
        status: editingContract.status,
        contractType: editingContract.contractType,
        stipendAmount: editingContract.stipendAmount ? Number(editingContract.stipendAmount) : undefined,
        currency: editingContract.currency || 'USD',
        hoursPerWeek: editingContract.hoursPerWeek ? Number(editingContract.hoursPerWeek) : undefined,
        startDate: editingContract.startDate || undefined,
        endDate: editingContract.endDate || undefined,
        terms: editingContract.terms || undefined,
      });
      setEditingContract(null);
    } catch (err) {
      setError(err.message || 'Unable to update contract.');
    }
  };

  const handleSpendSubmit = async (event) => {
    event.preventDefault();
    if (!spendDraft.contractId) {
      setError('Select a contract to attribute the spend.');
      return;
    }
    if (!spendDraft.amount) {
      setError('Amount is required.');
      return;
    }
    setError(null);
    try {
      await onAddSpend(spendDraft.contractId, {
        amount: Number(spendDraft.amount),
        currency: spendDraft.currency || 'USD',
        category: spendDraft.category || undefined,
        description: spendDraft.description || undefined,
      });
      setSpendDraft({ amount: '', currency: 'USD', category: '', description: '', contractId: spendDraft.contractId });
    } catch (err) {
      setError(err.message || 'Unable to record spend.');
    }
  };

  const handleSpendUpdate = async (event) => {
    event.preventDefault();
    if (!editingSpend) return;
    setError(null);
    try {
      await onUpdateSpend(editingSpend.id, {
        amount: Number(editingSpend.amount) || 0,
        currency: editingSpend.currency || 'USD',
        category: editingSpend.category || undefined,
        description: editingSpend.description || undefined,
      });
      setEditingSpend(null);
    } catch (err) {
      setError(err.message || 'Unable to update spend.');
    }
  };

  return (
    <div className="space-y-4">
      <Section title="Candidate details" description="Update status and ownership for this application.">
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
        <form onSubmit={handleApplicationSubmit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Candidate name">
            <Input
              value={applicationForm.candidateName}
              onChange={(event) => setApplicationForm((prev) => ({ ...prev, candidateName: event.target.value }))}
            />
          </Field>
          <Field label="Candidate email">
            <Input
              type="email"
              value={applicationForm.candidateEmail}
              onChange={(event) => setApplicationForm((prev) => ({ ...prev, candidateEmail: event.target.value }))}
            />
          </Field>
          <Field label="Candidate phone">
            <Input
              value={applicationForm.candidatePhone}
              onChange={(event) => setApplicationForm((prev) => ({ ...prev, candidatePhone: event.target.value }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={applicationForm.status}
              onChange={(event) => setApplicationForm((prev) => ({ ...prev, status: event.target.value }))}
              options={APPLICATION_STATUSES}
            />
          </Field>
          <Field label="Stage">
            <Input
              value={applicationForm.stage}
              onChange={(event) => setApplicationForm((prev) => ({ ...prev, stage: event.target.value }))}
            />
          </Field>
          <Field label="Assigned recruiter">
            <Input
              value={applicationForm.assignedTo}
              onChange={(event) => setApplicationForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
            />
          </Field>
          <Field label="Source">
            <Input
              value={applicationForm.source}
              onChange={(event) => setApplicationForm((prev) => ({ ...prev, source: event.target.value }))}
            />
          </Field>
          <Field label="Notes">
            <TextArea
              rows={3}
              value={applicationForm.notes}
              onChange={(event) => setApplicationForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </Field>
          <div className="col-span-full flex items-center justify-between">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100"
            >
              Remove application
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save application
            </button>
          </div>
        </form>
      </Section>

      <Section title="Responses" description="Share updates with the candidate or leave an internal note.">
        <form onSubmit={handleResponseSubmit} className="grid gap-3 sm:grid-cols-3">
          <Field label="Visibility">
            <Select
              value={responseDraft.visibility}
              onChange={(event) => setResponseDraft((prev) => ({ ...prev, visibility: event.target.value }))}
              options={RESPONSE_VISIBILITY}
            />
          </Field>
          <Field label="Type">
            <Select
              value={responseDraft.responseType}
              onChange={(event) => setResponseDraft((prev) => ({ ...prev, responseType: event.target.value }))}
              options={RESPONSE_TYPES}
            />
          </Field>
          <Field label="Message">
            <TextArea
              rows={3}
              value={responseDraft.message}
              onChange={(event) => setResponseDraft((prev) => ({ ...prev, message: event.target.value }))}
            />
          </Field>
          <div className="col-span-full flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Log response
            </button>
          </div>
        </form>
        <div className="space-y-3">
          {(application.responses ?? []).map((response) => (
            <div key={response.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {response.actorName || 'Team member'} · {response.visibility === 'candidate' ? 'Candidate visible' : 'Internal'}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(response.sentAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    onClick={() =>
                      setEditingResponse({
                        id: response.id,
                        message: response.message ?? '',
                        visibility: response.visibility ?? 'internal',
                        responseType: response.responseType ?? 'message',
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    onClick={() => onDeleteResponse(response.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {response.message ? <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{response.message}</p> : null}
            </div>
          ))}
        </div>
        {editingResponse ? (
          <form onSubmit={handleResponseUpdate} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Edit response</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Visibility">
                <Select
                  value={editingResponse.visibility}
                  onChange={(event) => setEditingResponse((prev) => ({ ...prev, visibility: event.target.value }))}
                  options={RESPONSE_VISIBILITY}
                />
              </Field>
              <Field label="Type">
                <Select
                  value={editingResponse.responseType}
                  onChange={(event) => setEditingResponse((prev) => ({ ...prev, responseType: event.target.value }))}
                  options={RESPONSE_TYPES}
                />
              </Field>
            </div>
            <Field label="Message">
              <TextArea
                rows={3}
                value={editingResponse.message}
                onChange={(event) => setEditingResponse((prev) => ({ ...prev, message: event.target.value }))}
              />
            </Field>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => setEditingResponse(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        ) : null}
      </Section>

      <Section title="Interviews" description="Coordinate interview logistics and follow-up.">
        <form onSubmit={handleInterviewSubmit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Scheduled at">
            <Input
              type="datetime-local"
              value={interviewDraft.scheduledAt}
              onChange={(event) => setInterviewDraft((prev) => ({ ...prev, scheduledAt: event.target.value }))}
            />
          </Field>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              min="15"
              value={interviewDraft.durationMinutes}
              onChange={(event) => setInterviewDraft((prev) => ({ ...prev, durationMinutes: event.target.value }))}
            />
          </Field>
          <Field label="Interviewer name">
            <Input
              value={interviewDraft.interviewerName}
              onChange={(event) => setInterviewDraft((prev) => ({ ...prev, interviewerName: event.target.value }))}
            />
          </Field>
          <Field label="Interviewer email">
            <Input
              type="email"
              value={interviewDraft.interviewerEmail}
              onChange={(event) => setInterviewDraft((prev) => ({ ...prev, interviewerEmail: event.target.value }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={interviewDraft.status}
              onChange={(event) => setInterviewDraft((prev) => ({ ...prev, status: event.target.value }))}
              options={INTERVIEW_STATUSES}
            />
          </Field>
          <Field label="Meeting link">
            <Input
              value={interviewDraft.meetingUrl}
              onChange={(event) => setInterviewDraft((prev) => ({ ...prev, meetingUrl: event.target.value }))}
            />
          </Field>
          <Field label="Notes">
            <TextArea
              rows={3}
              value={interviewDraft.notes}
              onChange={(event) => setInterviewDraft((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </Field>
          <div className="col-span-full flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Schedule interview
            </button>
          </div>
        </form>
        <div className="space-y-3">
          {(application.interviews ?? []).map((interview) => (
            <div key={interview.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(interview.scheduledAt)}</p>
                  <p className="text-xs text-slate-500">
                    {interview.status?.replace(/_/g, ' ')} · {interview.interviewerName || 'Interviewer TBD'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    onClick={() =>
                      setEditingInterview({
                        ...interview,
                        scheduledAt: interview.scheduledAt ? interview.scheduledAt.slice(0, 16) : '',
                        durationMinutes: interview.durationMinutes ?? '',
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    onClick={() => onDeleteInterview(interview.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {interview.notes ? <p className="mt-2 text-xs text-slate-500">{interview.notes}</p> : null}
            </div>
          ))}
        </div>
        {editingInterview ? (
          <form onSubmit={handleInterviewUpdate} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Edit interview</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Scheduled at">
                <Input
                  type="datetime-local"
                  value={editingInterview.scheduledAt ?? ''}
                  onChange={(event) => setEditingInterview((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                />
              </Field>
              <Field label="Duration">
                <Input
                  type="number"
                  value={editingInterview.durationMinutes ?? ''}
                  onChange={(event) => setEditingInterview((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={editingInterview.status ?? 'scheduled'}
                  onChange={(event) => setEditingInterview((prev) => ({ ...prev, status: event.target.value }))}
                  options={INTERVIEW_STATUSES}
                />
              </Field>
              <Field label="Meeting link">
                <Input
                  value={editingInterview.meetingUrl ?? ''}
                  onChange={(event) => setEditingInterview((prev) => ({ ...prev, meetingUrl: event.target.value }))}
                />
              </Field>
            </div>
            <Field label="Notes">
              <TextArea
                rows={3}
                value={editingInterview.notes ?? ''}
                onChange={(event) => setEditingInterview((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </Field>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => setEditingInterview(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        ) : null}
      </Section>

      <Section title="Contracts" description="Formalise placements and manage stipend payments.">
        <form onSubmit={handleContractSubmit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <Input
              value={contractDraft.title}
              onChange={(event) => setContractDraft((prev) => ({ ...prev, title: event.target.value }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={contractDraft.status}
              onChange={(event) => setContractDraft((prev) => ({ ...prev, status: event.target.value }))}
              options={CONTRACT_STATUSES}
            />
          </Field>
          <Field label="Contract type">
            <Select
              value={contractDraft.contractType}
              onChange={(event) => setContractDraft((prev) => ({ ...prev, contractType: event.target.value }))}
              options={CONTRACT_TYPES}
            />
          </Field>
          <Field label="Stipend amount">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={contractDraft.stipendAmount}
              onChange={(event) => setContractDraft((prev) => ({ ...prev, stipendAmount: event.target.value }))}
            />
          </Field>
          <Field label="Currency">
            <Input
              value={contractDraft.currency}
              onChange={(event) => setContractDraft((prev) => ({ ...prev, currency: event.target.value }))}
            />
          </Field>
          <Field label="Hours per week">
            <Input
              type="number"
              min="0"
              value={contractDraft.hoursPerWeek}
              onChange={(event) => setContractDraft((prev) => ({ ...prev, hoursPerWeek: event.target.value }))}
            />
          </Field>
          <Field label="Start date">
            <Input
              type="date"
              value={contractDraft.startDate}
              onChange={(event) => setContractDraft((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              value={contractDraft.endDate}
              onChange={(event) => setContractDraft((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </Field>
          <Field label="Terms">
            <TextArea
              rows={3}
              value={contractDraft.terms}
              onChange={(event) => setContractDraft((prev) => ({ ...prev, terms: event.target.value }))}
            />
          </Field>
          <div className="col-span-full flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create contract
            </button>
          </div>
        </form>
        <div className="space-y-3">
          {(application.contracts ?? []).map((contract) => (
            <div key={contract.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{contract.title}</p>
                  <p className="text-xs text-slate-500">
                    {contract.status?.replace(/_/g, ' ')} · {formatCurrency(contract.stipendAmount, contract.currency || 'USD')}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={() =>
                    setEditingContract({
                      ...contract,
                      stipendAmount: contract.stipendAmount ?? '',
                      hoursPerWeek: contract.hoursPerWeek ?? '',
                      startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
                      endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
                    })
                  }
                >
                  Edit
                </button>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spend</p>
                {(contract.spendEntries ?? []).length ? (
                  <ul className="mt-2 space-y-2">
                    {contract.spendEntries.map((entry) => (
                      <li key={entry.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{formatCurrency(entry.amount, entry.currency || contract.currency || 'USD')}</p>
                          <p className="text-xs text-slate-500">{entry.category || 'General'} · {formatDate(entry.spentAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            onClick={() =>
                              setEditingSpend({
                                ...entry,
                                amount: entry.amount ?? '',
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            onClick={() => onDeleteSpend(entry.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">No spend recorded yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
        {editingContract ? (
          <form onSubmit={handleContractUpdate} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Edit contract</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <Input
                  value={editingContract.title}
                  onChange={(event) => setEditingContract((prev) => ({ ...prev, title: event.target.value }))}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={editingContract.status ?? 'draft'}
                  onChange={(event) => setEditingContract((prev) => ({ ...prev, status: event.target.value }))}
                  options={CONTRACT_STATUSES}
                />
              </Field>
              <Field label="Contract type">
                <Select
                  value={editingContract.contractType ?? 'fixed_term'}
                  onChange={(event) => setEditingContract((prev) => ({ ...prev, contractType: event.target.value }))}
                  options={CONTRACT_TYPES}
                />
              </Field>
              <Field label="Stipend amount">
                <Input
                  type="number"
                  value={editingContract.stipendAmount ?? ''}
                  onChange={(event) => setEditingContract((prev) => ({ ...prev, stipendAmount: event.target.value }))}
                />
              </Field>
              <Field label="Currency">
                <Input
                  value={editingContract.currency ?? 'USD'}
                  onChange={(event) => setEditingContract((prev) => ({ ...prev, currency: event.target.value }))}
                />
              </Field>
              <Field label="Hours per week">
                <Input
                  type="number"
                  value={editingContract.hoursPerWeek ?? ''}
                  onChange={(event) => setEditingContract((prev) => ({ ...prev, hoursPerWeek: event.target.value }))}
                />
              </Field>
            </div>
            <Field label="Terms">
              <TextArea
                rows={3}
                value={editingContract.terms ?? ''}
                onChange={(event) => setEditingContract((prev) => ({ ...prev, terms: event.target.value }))}
              />
            </Field>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => setEditingContract(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save contract
              </button>
            </div>
          </form>
        ) : null}
        <form onSubmit={handleSpendSubmit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Contract">
            <select
              value={spendDraft.contractId ?? ''}
              onChange={(event) => setSpendDraft((prev) => ({ ...prev, contractId: Number(event.target.value) || '' }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select contract</option>
              {(application.contracts ?? []).map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={spendDraft.amount}
              onChange={(event) => setSpendDraft((prev) => ({ ...prev, amount: event.target.value }))}
            />
          </Field>
          <Field label="Currency">
            <Input
              value={spendDraft.currency}
              onChange={(event) => setSpendDraft((prev) => ({ ...prev, currency: event.target.value }))}
            />
          </Field>
          <Field label="Category">
            <Input
              value={spendDraft.category}
              onChange={(event) => setSpendDraft((prev) => ({ ...prev, category: event.target.value }))}
            />
          </Field>
          <Field label="Description">
            <TextArea
              rows={2}
              value={spendDraft.description}
              onChange={(event) => setSpendDraft((prev) => ({ ...prev, description: event.target.value }))}
            />
          </Field>
          <div className="col-span-full flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add spend
            </button>
          </div>
        </form>
        {editingSpend ? (
          <form onSubmit={handleSpendUpdate} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Edit stipend spend</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Amount">
                <Input
                  type="number"
                  value={editingSpend.amount ?? ''}
                  onChange={(event) => setEditingSpend((prev) => ({ ...prev, amount: event.target.value }))}
                />
              </Field>
              <Field label="Currency">
                <Input
                  value={editingSpend.currency ?? 'USD'}
                  onChange={(event) => setEditingSpend((prev) => ({ ...prev, currency: event.target.value }))}
                />
              </Field>
              <Field label="Category">
                <Input
                  value={editingSpend.category ?? ''}
                  onChange={(event) => setEditingSpend((prev) => ({ ...prev, category: event.target.value }))}
                />
              </Field>
            </div>
            <Field label="Description">
              <TextArea
                rows={2}
                value={editingSpend.description ?? ''}
                onChange={(event) => setEditingSpend((prev) => ({ ...prev, description: event.target.value }))}
              />
            </Field>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => setEditingSpend(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save spend
              </button>
            </div>
          </form>
        ) : null}
      </Section>
    </div>
  );
}
