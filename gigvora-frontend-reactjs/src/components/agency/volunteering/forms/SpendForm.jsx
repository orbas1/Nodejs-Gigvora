import { memo } from 'react';
import { toDateTimeInputValue } from '../utils.js';

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

function SpendForm({ record = {}, contracts = [], defaultCurrency = 'USD', disabled }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Field label="Contract">
        <Select name="contractId" defaultValue={record.contractId ?? ''} disabled={disabled}>
          <option value="">Workspace</option>
          {contracts.map((contract) => (
            <option key={contract.id} value={contract.id}>
              {contract.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Amount" required>
        <Input
          type="number"
          step="any"
          min="0"
          name="amount"
          defaultValue={record.amount ?? ''}
          required
          disabled={disabled}
        />
      </Field>
      <Field label="Currency">
        <Input name="currency" defaultValue={record.currency ?? defaultCurrency} maxLength={3} disabled={disabled} className="uppercase" />
      </Field>
      <Field label="Category">
        <Input name="category" defaultValue={record.category ?? ''} disabled={disabled} placeholder="Supplies" />
      </Field>
      <Field label="Recorded">
        <Input type="datetime-local" name="recordedAt" defaultValue={toDateTimeInputValue(record.recordedAt)} disabled={disabled} />
      </Field>
      <Field label="Invoice">
        <Input name="invoiceReference" defaultValue={record.invoiceReference ?? ''} disabled={disabled} />
      </Field>
      <Field label="Receipt">
        <Input name="receiptUrl" defaultValue={record.receiptUrl ?? ''} disabled={disabled} placeholder="https://" />
      </Field>
      <Field label="Entered by">
        <Input name="recordedByName" defaultValue={record.recordedByName ?? ''} disabled={disabled} />
      </Field>
      <Field label="Role">
        <Input name="recordedByRole" defaultValue={record.recordedByRole ?? ''} disabled={disabled} />
      </Field>
      <Field label="Memo" className="lg:col-span-2">
        <Textarea name="memo" defaultValue={record.memo ?? ''} disabled={disabled} rows={4} />
      </Field>
    </div>
  );
}

export default memo(SpendForm);
