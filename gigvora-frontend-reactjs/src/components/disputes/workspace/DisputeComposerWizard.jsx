import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { readFileAsBase64, humanFileSize } from '../../../utils/file.js';

const STEPS = [
  { id: 'case', label: 'Case' },
  { id: 'details', label: 'Details' },
  { id: 'confirm', label: 'Review' },
];

function StepBadge({ active, complete, children }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active
          ? 'border-accent bg-accent/10 text-accent'
          : complete
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      {complete ? <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

function Stepper({ currentStep }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((step, index) => {
        const active = step.id === currentStep;
        const currentIndex = STEPS.findIndex((item) => item.id === currentStep);
        const complete = index < currentIndex;
        return (
          <StepBadge key={step.id} active={active} complete={complete}>
            {step.label}
          </StepBadge>
        );
      })}
    </div>
  );
}

export default function DisputeComposerWizard({ open, onClose, onSubmit, transactions, metadata, busy }) {
  const [step, setStep] = useState('case');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    transactionId: '',
    reasonCode: '',
    priority: 'medium',
    summary: '',
    customerDeadlineAt: '',
    providerDeadlineAt: '',
    notes: '',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setStep('case');
      setForm({
        transactionId: '',
        reasonCode: '',
        priority: 'medium',
        summary: '',
        customerDeadlineAt: '',
        providerDeadlineAt: '',
        notes: '',
      });
      setSelectedFile(null);
      setPreview(null);
      setError(null);
    }
  }, [open]);

  const availableTransactions = useMemo(() => (Array.isArray(transactions) ? transactions : []).slice(0, 100), [transactions]);
  const reasonCodes = useMemo(() => metadata?.reasonCodes ?? [], [metadata]);
  const priorities = useMemo(() => metadata?.priorities ?? [], [metadata]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedFile) {
      setPreview(null);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      const content = await readFileAsBase64(selectedFile);
      if (!cancelled) {
        setPreview({
          fileName: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
          size: humanFileSize(selectedFile.size),
          content,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedFile]);

  const canContinueCase = form.transactionId && form.reasonCode;
  const canContinueDetails = form.summary.trim().length >= 20;

  const handleNext = async () => {
    if (step === 'case') {
      if (!canContinueCase) {
        setError('Select a transaction and reason.');
        return;
      }
      setError(null);
      setStep('details');
      return;
    }
    if (step === 'details') {
      if (!canContinueDetails) {
        setError('Add a clear summary (20+ characters).');
        return;
      }
      setError(null);
      setStep('confirm');
      return;
    }
    if (step === 'confirm') {
      try {
        setError(null);
        await onSubmit({
          escrowTransactionId: Number(form.transactionId),
          reasonCode: form.reasonCode,
          priority: form.priority,
          summary: form.summary.trim(),
          customerDeadlineAt: form.customerDeadlineAt || null,
          providerDeadlineAt: form.providerDeadlineAt || null,
          metadata: form.notes ? { initialNotes: form.notes.trim() } : undefined,
          evidence: preview
            ? {
                content: preview.content,
                fileName: preview.fileName,
                contentType: preview.contentType,
              }
            : undefined,
        });
        onClose();
      } catch (submissionError) {
        setError(submissionError.message || 'Failed to submit dispute.');
      }
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('case');
    } else if (step === 'confirm') {
      setStep('details');
    } else {
      onClose();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const renderCaseStep = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Escrow
        <select
          name="transactionId"
          value={form.transactionId}
          onChange={handleChange}
          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          required
        >
          <option value="">Select</option>
          {availableTransactions.map((transaction) => (
            <option key={transaction.id} value={transaction.id}>
              {transaction.displayName} · {transaction.currencyCode} {transaction.amount}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Reason
        <select
          name="reasonCode"
          value={form.reasonCode}
          onChange={handleChange}
          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          required
        >
          <option value="">Select</option>
          {reasonCodes.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option.name ?? option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Priority
        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
          className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {priorities.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option.name ?? option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Summary
        <textarea
          name="summary"
          value={form.summary}
          onChange={handleChange}
          rows={4}
          placeholder="Describe the issue and requested fix."
          className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Your deadline
          <input
            type="datetime-local"
            name="customerDeadlineAt"
            value={form.customerDeadlineAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Partner deadline
          <input
            type="datetime-local"
            name="providerDeadlineAt"
            value={form.providerDeadlineAt}
            onChange={handleChange}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </div>
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Notes (optional)
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          className="mt-1 w-full rounded-3xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Evidence
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-slate-600"
        />
      </label>
      {preview ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {preview.fileName} · {preview.contentType} · {preview.size}
        </div>
      ) : null}
    </div>
  );

  const renderConfirmStep = () => {
    const transaction = availableTransactions.find((item) => String(item.id) === String(form.transactionId));
    const reason = reasonCodes.find((item) => (item.value ?? item) === form.reasonCode);
    const priority = priorities.find((item) => (item.value ?? item) === form.priority);
    return (
      <div className="space-y-3 text-sm text-slate-700">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="font-semibold text-slate-900">{transaction?.displayName ?? 'Escrow case'}</p>
          <p className="text-xs text-slate-500">{transaction?.currencyCode} {transaction?.amount}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Reason</p>
            <p className="mt-1 font-medium">{reason?.label ?? form.reasonCode}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Priority</p>
            <p className="mt-1 font-medium">{priority?.label ?? form.priority}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Summary</p>
          <p className="mt-1 whitespace-pre-line text-slate-700">{form.summary}</p>
        </div>
        {preview ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Evidence</p>
            <p className="mt-1 text-slate-700">{preview.fileName}</p>
          </div>
        ) : null}
      </div>
    );
  };

  let content = null;
  if (step === 'case') {
    content = renderCaseStep();
  } else if (step === 'details') {
    content = renderDetailsStep();
  } else {
    content = renderConfirmStep();
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
              enterTo="translate-y-0 opacity-100 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 sm:scale-100"
              leaveTo="translate-y-4 opacity-0 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-4xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Dialog.Title className="text-xl font-semibold text-slate-900">New dispute</Dialog.Title>
                    <Stepper currentStep={step} />
                  </div>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-full px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                    disabled={busy}
                  >
                    {step === 'case' ? 'Close' : 'Back'}
                  </button>
                </div>

                <div className="mt-6 space-y-4">{content}</div>

                {error ? <p className="mt-4 rounded-3xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    disabled={busy}
                  >
                    {step === 'case' ? 'Cancel' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={busy}
                  >
                    {step === 'confirm' ? (busy ? 'Submitting…' : 'Submit case') : 'Next'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
