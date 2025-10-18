import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, PaperAirplaneIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

const STEPS = ['Recipients', 'Message'];

function DrawerShell({ open, title, onClose, children, footer }) {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="hidden flex-1 bg-slate-900/40 backdrop-blur-sm lg:block" onClick={onClose} aria-hidden="true" />
      <div className="ml-auto flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-5 w-5 text-accent" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">Send a verification email</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            aria-label="Close test drawer"
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

export default function TestEmailDrawer({ open, defaults, onClose, onSend, smtpConfig, templates }) {
  const [step, setStep] = useState(0);
  const [recipients, setRecipients] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('Gigvora test email');
  const [htmlBody, setHtmlBody] = useState('<p>This is a test.</p>');
  const [textBody, setTextBody] = useState('This is a test.');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setStep(0);
    setRecipients(defaults?.recipients?.join?.(', ') || defaults?.recipients || '');
    setTemplateId(defaults?.templateId ? String(defaults.templateId) : '');
    setSubject(defaults?.subject || 'Gigvora test email');
    setHtmlBody(defaults?.htmlBody || '<p>This is a test.</p>');
    setTextBody(defaults?.textBody || 'This is a test.');
  }, [open, defaults]);

  const templateOptions = useMemo(() => (Array.isArray(templates) ? templates : []), [templates]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!templateId) {
      return;
    }
    const template = templateOptions.find((item) => String(item.id) === String(templateId));
    if (template) {
      setSubject(template.subject || 'Gigvora test email');
      setHtmlBody(template.htmlBody || '<p>This is a test.</p>');
      setTextBody(template.textBody || 'This is a test.');
    }
  }, [open, templateId, templateOptions]);

  const footer = (
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
            {index < step ? <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> : null}
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
            if (step === STEPS.length - 1) {
              setSending(true);
              try {
                const payload = {
                  recipients: recipients
                    .split(',')
                    .map((value) => value.trim())
                    .filter(Boolean),
                  subject,
                  htmlBody,
                  textBody,
                };
                if (templateId) {
                  payload.templateId = Number(templateId);
                }
                await onSend?.(payload);
              } finally {
                setSending(false);
              }
              return;
            }
            setStep((current) => Math.min(STEPS.length - 1, current + 1));
          }}
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {step === STEPS.length - 1 ? (
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          )}
          {step === STEPS.length - 1 ? (sending ? 'Sending…' : 'Send') : 'Next'}
        </button>
      </div>
    </div>
  );

  return (
    <DrawerShell open={open} title="Test send" onClose={onClose} footer={footer}>
      {step === 0 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</p>
            <p className="mt-1 text-slate-900">
              {smtpConfig?.fromName ? `${smtpConfig.fromName} <${smtpConfig.fromAddress}>` : smtpConfig?.fromAddress || '—'}
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Recipients</span>
            <textarea
              value={recipients}
              onChange={(event) => setRecipients(event.target.value)}
              rows={3}
              placeholder="admin@example.com"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Template</span>
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">None</option>
              {templateOptions.map((templateOption) => (
                <option key={templateOption.id} value={templateOption.id}>
                  {templateOption.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Subject</span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">HTML</span>
            <textarea
              value={htmlBody}
              onChange={(event) => setHtmlBody(event.target.value)}
              rows={10}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-600">Text</span>
            <textarea
              value={textBody}
              onChange={(event) => setTextBody(event.target.value)}
              rows={6}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-mono text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
      ) : null}
    </DrawerShell>
  );
}
