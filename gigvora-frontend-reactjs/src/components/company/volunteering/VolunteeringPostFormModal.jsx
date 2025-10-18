import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { POST_STATUSES } from './volunteeringOptions.js';

function Field({ label, required, children, description }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {description ? <span className="text-xs text-slate-500">{description}</span> : null}
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

export default function VolunteeringPostFormModal({ open, mode = 'create', initialValue, onClose, onSubmit, busy, error }) {
  const [form, setForm] = useState({
    title: '',
    summary: '',
    description: '',
    status: 'draft',
    location: '',
    remoteFriendly: true,
    applicationUrl: '',
    contactEmail: '',
    commitmentHours: '',
    startDate: '',
    endDate: '',
    applicationDeadline: '',
    tags: '',
    skills: '',
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    if (initialValue) {
      setForm({
        title: initialValue.title ?? '',
        summary: initialValue.summary ?? '',
        description: initialValue.description ?? '',
        status: initialValue.status ?? 'draft',
        location: initialValue.location ?? '',
        remoteFriendly: Boolean(initialValue.remoteFriendly ?? true),
        applicationUrl: initialValue.applicationUrl ?? '',
        contactEmail: initialValue.contactEmail ?? '',
        commitmentHours: initialValue.commitmentHours ?? '',
        startDate: initialValue.startDate ? initialValue.startDate.slice(0, 10) : '',
        endDate: initialValue.endDate ? initialValue.endDate.slice(0, 10) : '',
        applicationDeadline: initialValue.applicationDeadline ? initialValue.applicationDeadline.slice(0, 10) : '',
        tags: Array.isArray(initialValue.tags) ? initialValue.tags.join(', ') : '',
        skills: Array.isArray(initialValue.skills) ? initialValue.skills.join(', ') : '',
      });
    } else {
      setForm({
        title: '',
        summary: '',
        description: '',
        status: 'draft',
        location: '',
        remoteFriendly: true,
        applicationUrl: '',
        contactEmail: '',
        commitmentHours: '',
        startDate: '',
        endDate: '',
        applicationDeadline: '',
        tags: '',
        skills: '',
      });
    }
  }, [open, initialValue]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      return;
    }
    const payload = {
      title: form.title,
      summary: form.summary || undefined,
      description: form.description || undefined,
      status: form.status,
      location: form.location || undefined,
      remoteFriendly: Boolean(form.remoteFriendly),
      applicationUrl: form.applicationUrl || undefined,
      contactEmail: form.contactEmail || undefined,
      commitmentHours: form.commitmentHours ? Number(form.commitmentHours) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      applicationDeadline: form.applicationDeadline || undefined,
      tags: form.tags ? form.tags.split(',').map((value) => value.trim()).filter(Boolean) : undefined,
      skills: form.skills ? form.skills.split(',').map((value) => value.trim()).filter(Boolean) : undefined,
    };
    onSubmit(payload);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-6"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-6"
            >
              <Dialog.Panel className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  {mode === 'create' ? 'Create volunteering posting' : 'Update volunteering posting'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-600">
                  Publish opportunities with clear expectations, application channels, and compliance-ready details.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title" required>
                      <Input
                        required
                        value={form.title}
                        onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                      />
                    </Field>
                    <Field label="Status">
                      <Select
                        value={form.status}
                        onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                        options={POST_STATUSES}
                      />
                    </Field>
                    <Field label="Location">
                      <Input
                        value={form.location}
                        onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                      />
                    </Field>
                    <Field label="Remote friendly">
                      <select
                        value={form.remoteFriendly ? 'yes' : 'no'}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, remoteFriendly: event.target.value === 'yes' }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </Field>
                    <Field label="Application URL">
                      <Input
                        value={form.applicationUrl}
                        onChange={(event) => setForm((prev) => ({ ...prev, applicationUrl: event.target.value }))}
                      />
                    </Field>
                    <Field label="Contact email">
                      <Input
                        type="email"
                        value={form.contactEmail}
                        onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                      />
                    </Field>
                    <Field label="Commitment hours">
                      <Input
                        type="number"
                        min="0"
                        value={form.commitmentHours}
                        onChange={(event) => setForm((prev) => ({ ...prev, commitmentHours: event.target.value }))}
                      />
                    </Field>
                    <Field label="Application deadline">
                      <Input
                        type="date"
                        value={form.applicationDeadline}
                        onChange={(event) => setForm((prev) => ({ ...prev, applicationDeadline: event.target.value }))}
                      />
                    </Field>
                    <Field label="Start date">
                      <Input
                        type="date"
                        value={form.startDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                      />
                    </Field>
                    <Field label="End date">
                      <Input
                        type="date"
                        value={form.endDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                      />
                    </Field>
                  </div>
                  <Field label="Summary">
                    <TextArea
                      rows={2}
                      value={form.summary}
                      onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
                    />
                  </Field>
                  <Field label="Description">
                    <TextArea
                      rows={4}
                      value={form.description}
                      onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tags" description="Comma separated">
                      <Input
                        value={form.tags}
                        onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                      />
                    </Field>
                    <Field label="Skills" description="Comma separated">
                      <Input
                        value={form.skills}
                        onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
                      />
                    </Field>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {mode === 'create' ? 'Create posting' : 'Save changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
