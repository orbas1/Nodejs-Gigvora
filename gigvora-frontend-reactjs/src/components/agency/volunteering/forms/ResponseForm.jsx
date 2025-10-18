import { memo } from 'react';
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

function ResponseForm({ record = {}, applications = [], lookups = {}, disabled }) {
  const responseTypes = normalizeLookup(lookups.responseTypes, ['email', 'call', 'meeting']);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Field label="Application" required>
        <Select name="applicationId" defaultValue={record.applicationId ?? ''} required disabled={disabled}>
          <option value="" disabled>
            Choose application
          </option>
          {applications.map((application) => (
            <option key={application.id} value={application.id}>
              {application.volunteerName}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Type">
        <Select name="responseType" defaultValue={record.responseType ?? ''} disabled={disabled}>
          <option value="">Select type</option>
          {responseTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Responder">
        <Input name="responderName" defaultValue={record.responderName ?? ''} disabled={disabled} />
      </Field>
      <Field label="Role">
        <Input name="responderRole" defaultValue={record.responderRole ?? ''} disabled={disabled} />
      </Field>
      <Field label="Summary" className="lg:col-span-2">
        <Textarea name="summary" defaultValue={record.summary ?? ''} disabled={disabled} rows={4} />
      </Field>
      <Field label="Next steps" className="lg:col-span-2">
        <Textarea name="nextSteps" defaultValue={record.nextSteps ?? ''} disabled={disabled} rows={3} />
      </Field>
      <Field label="Follow up">
        <Input type="datetime-local" name="followUpAt" defaultValue={toDateTimeInputValue(record.followUpAt)} disabled={disabled} />
      </Field>
      <Field label="Needs action" className="flex items-center gap-3">
        <input
          type="checkbox"
          name="requiresAction"
          defaultChecked={record.requiresAction ?? false}
          disabled={disabled}
          className="h-5 w-5 rounded border border-slate-200 text-slate-900 focus:ring-slate-900"
        />
      </Field>
      <Field label="Document">
        <Input name="documentUrl" defaultValue={record.documentUrl ?? ''} disabled={disabled} placeholder="https://" />
      </Field>
    </div>
  );
}

export default memo(ResponseForm);
