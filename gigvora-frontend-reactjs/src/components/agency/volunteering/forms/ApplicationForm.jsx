import { memo, useMemo } from 'react';
import { normalizeLookup, toDateTimeInputValue } from '../utils.js';

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0 ${className}`}
    />
  );
}

function Textarea({ className = '', rows = 4, ...props }) {
  return (
    <textarea
      {...props}
      rows={rows}
      className={`rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0 ${className}`}
    />
  );
}

function Select({ className = '', children, ...props }) {
  return (
    <select
      {...props}
      className={`rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-0 ${className}`}
    >
      {children}
    </select>
  );
}

function ApplicationForm({ record = {}, contracts = [], lookups = {}, disabled }) {
  const stageOptions = normalizeLookup(lookups.applicationStages, ['review', 'screen', 'interview', 'offer']);
  const statusOptions = normalizeLookup(lookups.applicationStatuses, ['new', 'active', 'hired', 'closed']);

  const contractOptions = useMemo(() => {
    if (!Array.isArray(contracts)) {
      return [];
    }
    return contracts.map((contract) => ({
      id: contract.id,
      title: contract.title,
    }));
  }, [contracts]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Field label="Volunteer" required>
        <Input name="volunteerName" defaultValue={record.volunteerName ?? ''} required disabled={disabled} placeholder="Jane Doe" />
      </Field>
      <Field label="Email">
        <Input type="email" name="volunteerEmail" defaultValue={record.volunteerEmail ?? ''} disabled={disabled} />
      </Field>
      <Field label="Phone">
        <Input name="volunteerPhone" defaultValue={record.volunteerPhone ?? ''} disabled={disabled} />
      </Field>
      <Field label="Profile photo">
        <Input name="avatarUrl" defaultValue={record.avatarUrl ?? ''} disabled={disabled} placeholder="https://" />
      </Field>
      <Field label="Contract">
        <Select name="contractId" defaultValue={record.contractId ?? ''} disabled={disabled}>
          <option value="">Unassigned</option>
          {contractOptions.map((contract) => (
            <option key={contract.id} value={contract.id}>
              {contract.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Stage">
        <Select name="stage" defaultValue={record.stage ?? ''} disabled={disabled}>
          <option value="">No stage</option>
          {stageOptions.map((stage) => (
            <option key={stage} value={stage}>
              {stage.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Status">
        <Select name="status" defaultValue={record.status ?? ''} disabled={disabled}>
          <option value="">No status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Submitted">
        <Input type="datetime-local" name="submittedAt" defaultValue={toDateTimeInputValue(record.submittedAt)} disabled={disabled} />
      </Field>
      <Field label="Source">
        <Input name="source" defaultValue={record.source ?? ''} disabled={disabled} placeholder="Referral" />
      </Field>
      <Field label="Experience" className="lg:col-span-2">
        <Textarea name="experienceSummary" defaultValue={record.experienceSummary ?? ''} disabled={disabled} rows={4} />
      </Field>
      <Field label="Skills" className="lg:col-span-2">
        <Input
          name="skills"
          defaultValue={(record.skills ?? []).join(', ')}
          disabled={disabled}
          placeholder="Community, Outreach"
        />
      </Field>
      <Field label="Owner">
        <Input name="assignedContactName" defaultValue={record.assignedContactName ?? ''} disabled={disabled} />
      </Field>
      <Field label="Owner email">
        <Input type="email" name="assignedContactEmail" defaultValue={record.assignedContactEmail ?? ''} disabled={disabled} />
      </Field>
      <Field label="Rating">
        <Input type="number" name="rating" defaultValue={record.rating ?? ''} min="0" max="5" step="0.5" disabled={disabled} />
      </Field>
      <Field label="Notes" className="lg:col-span-2">
        <Textarea name="notes" defaultValue={record.notes ?? ''} disabled={disabled} rows={4} />
      </Field>
    </div>
  );
}

export default memo(ApplicationForm);
