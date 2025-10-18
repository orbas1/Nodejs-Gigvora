import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PencilSquareIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DEFAULT_TEMPLATE = Object.freeze({
  name: '',
  slug: '',
  subject: '',
  preheader: '',
  description: '',
  category: '',
  fromName: '',
  fromAddress: '',
  replyToAddress: '',
  heroImageUrl: '',
  htmlBody:
    '<main style="font-family:Inter,Helvetica,sans-serif;max-width:640px;margin:auto;padding:32px;background:#ffffff;color:#111827;">\n  <h1 style="font-size:24px;margin-bottom:16px;">Hello!</h1>\n  <p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Use this template to send transactional updates.</p>\n  <p style="font-size:14px;color:#6b7280;">Gigvora</p>\n</main>',
  textBody: 'Hello! This is your transactional email.',
  layout: 'standard',
  tags: [],
  variables: [],
  enabled: true,
});

const STEPS = ['Basics', 'Content', 'Delivery'];

function parseVariablesInput(value) {
  if (!value) {
    return [];
  }
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [keyPart, samplePart] = line.split('=').map((segment) => segment.trim());
      if (!keyPart) {
        return null;
      }
      return {
        key: keyPart,
        label: keyPart.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        sampleValue: samplePart || '',
      };
    })
    .filter(Boolean);
}

function formatVariablesInput(variables) {
  if (!Array.isArray(variables) || !variables.length) {
    return '';
  }
  return variables
    .map((variable) => {
      const key = variable?.key || variable?.name;
      if (!key) {
        return null;
      }
      const sample = variable?.sampleValue || '';
      return sample ? `${key}=${sample}` : key;
    })
    .filter(Boolean)
    .join('\n');
}

function DrawerShell({ open, title, children, onClose, footer }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-slate-900/40 backdrop-blur-sm lg:block" onClick={onClose} aria-hidden="true" />
      <div className="ml-auto flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-5 w-5 text-accent" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">Template wizard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label="Close editor"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export default function TemplateEditorDrawer({ open, template, onClose, onCreate, onUpdate }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT_TEMPLATE);
  const [tagsInput, setTagsInput] = useState('');
  const [variablesInput, setVariablesInput] = useState('');
  const editing = Boolean(template?.id);

  useEffect(() => {
    if (!open) {
      return;
    }
    const base = template
      ? {
          ...DEFAULT_TEMPLATE,
          ...template,
          tags: Array.isArray(template.tags) ? template.tags : [],
          variables: Array.isArray(template.variables) ? template.variables : [],
        }
      : DEFAULT_TEMPLATE;
    setForm({ ...base });
    setTagsInput(base.tags.join(', '));
    setVariablesInput(formatVariablesInput(base.variables));
    setStep(0);
  }, [open, template]);

  const footer = useMemo(() => {
    const isLast = step === STEPS.length - 1;
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                index === step
                  ? 'bg-accent/10 text-accent'
                  : index < step
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {index < step ? <CheckIcon className="h-4 w-4" aria-hidden="true" /> : null}
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <button
            type="button"
            onClick={async () => {
              if (isLast) {
                const payload = {
                  ...form,
                  tags: tagsInput
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                  variables: parseVariablesInput(variablesInput),
                };
                if (editing) {
                  await onUpdate?.(template.id, payload);
                } else {
                  await onCreate?.(payload);
                }
                return;
              }
              setStep((current) => Math.min(STEPS.length - 1, current + 1));
            }}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark"
          >
            {isLast ? <PencilSquareIcon className="h-4 w-4" aria-hidden="true" /> : <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />}
            {isLast ? (editing ? 'Save' : 'Create') : 'Next'}
          </button>
        </div>
      </div>
    );
  }, [step, tagsInput, variablesInput, form, editing, template, onCreate, onUpdate]);

  return (
    <DrawerShell open={open} title={editing ? 'Edit template' : 'New template'} onClose={onClose} footer={footer}>
      {step === 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Slug</span>
            <input
              value={form.slug}
              onChange={(event) => setForm((previous) => ({ ...previous, slug: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="lg:col-span-2 flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Subject</span>
            <input
              value={form.subject}
              onChange={(event) => setForm((previous) => ({ ...previous, subject: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Preheader</span>
            <input
              value={form.preheader}
              onChange={(event) => setForm((previous) => ({ ...previous, preheader: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Category</span>
            <input
              value={form.category}
              onChange={(event) => setForm((previous) => ({ ...previous, category: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="lg:col-span-2 flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
              rows={3}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">HTML</span>
            <textarea
              value={form.htmlBody}
              onChange={(event) => setForm((previous) => ({ ...previous, htmlBody: event.target.value }))}
              rows={12}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Text</span>
            <textarea
              value={form.textBody}
              onChange={(event) => setForm((previous) => ({ ...previous, textBody: event.target.value }))}
              rows={6}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Tags</span>
            <input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="welcome, receipts"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Variables</span>
            <textarea
              value={variablesInput}
              onChange={(event) => setVariablesInput(event.target.value)}
              placeholder={"order_id=12345\ncustomer_name=Jane"}
              rows={4}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">From name</span>
            <input
              value={form.fromName}
              onChange={(event) => setForm((previous) => ({ ...previous, fromName: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">From email</span>
            <input
              value={form.fromAddress}
              onChange={(event) => setForm((previous) => ({ ...previous, fromAddress: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Reply-to</span>
            <input
              value={form.replyToAddress}
              onChange={(event) => setForm((previous) => ({ ...previous, replyToAddress: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Hero image URL</span>
            <input
              value={form.heroImageUrl}
              onChange={(event) => setForm((previous) => ({ ...previous, heroImageUrl: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Layout</span>
            <input
              value={form.layout}
              onChange={(event) => setForm((previous) => ({ ...previous, layout: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((previous) => ({ ...previous, enabled: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
            Enabled
          </label>
        </div>
      ) : null}
    </DrawerShell>
  );
}
