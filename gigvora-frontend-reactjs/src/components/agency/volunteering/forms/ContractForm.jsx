import { memo } from 'react';
import { normalizeLookup, toDateInputValue } from '../utils.js';

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

function NumberInput(props) {
  return <Input type="number" inputMode="decimal" step="any" {...props} />;
}

function ContractForm({ record = {}, lookups = {}, defaultCurrency = 'USD', disabled }) {
  const statusOptions = normalizeLookup(lookups.contractStatuses, ['draft', 'open', 'in_progress', 'finished']);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Field label="Name" required>
        <Input name="title" defaultValue={record.title ?? ''} required disabled={disabled} placeholder="Service sprint" />
      </Field>
      <Field label="Partner">
        <Input name="partnerOrganization" defaultValue={record.partnerOrganization ?? ''} disabled={disabled} placeholder="Community org" />
      </Field>
      <Field label="Status" required>
        <Select name="status" defaultValue={record.status ?? 'draft'} required disabled={disabled}>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Currency">
        <Input
          name="currency"
          defaultValue={record.currency ?? defaultCurrency}
          maxLength={3}
          disabled={disabled}
          className="uppercase"
        />
      </Field>
      <Field label="Starts">
        <Input type="date" name="startDate" defaultValue={toDateInputValue(record.startDate)} disabled={disabled} />
      </Field>
      <Field label="Ends">
        <Input type="date" name="endDate" defaultValue={toDateInputValue(record.endDate)} disabled={disabled} />
      </Field>
      <Field label="Planned volunteers">
        <NumberInput name="volunteerCount" defaultValue={record.volunteerCount ?? ''} min="0" disabled={disabled} />
      </Field>
      <Field label="Value">
        <NumberInput name="contractValue" defaultValue={record.contractValue ?? ''} min="0" disabled={disabled} />
      </Field>
      <Field label="Spend to date">
        <NumberInput name="spendToDate" defaultValue={record.spendToDate ?? ''} min="0" disabled={disabled} />
      </Field>
      <Field label="Lead name">
        <Input name="engagementLeadName" defaultValue={record.engagementLeadName ?? ''} disabled={disabled} />
      </Field>
      <Field label="Lead email">
        <Input type="email" name="engagementLeadEmail" defaultValue={record.engagementLeadEmail ?? ''} disabled={disabled} />
      </Field>
      <Field label="Notes" className="lg:col-span-2">
        <Textarea name="notes" defaultValue={record.notes ?? ''} disabled={disabled} rows={4} />
      </Field>
    </div>
  );
}

export default memo(ContractForm);
