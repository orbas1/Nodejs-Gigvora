import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { PaperClipIcon } from '@heroicons/react/24/outline';

const DEFAULT_FORM = {
  description: '',
  fileUrl: '',
  source: 'manual_upload',
  submittedAt: '',
};

export default function ComplianceEvidenceModal({ open, obligation, submitting, onClose, onSubmit }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const description = obligation?.title ? `Evidence for ${obligation.title}` : '';
      setForm({
        description,
        fileUrl: '',
        source: 'manual_upload',
        submittedAt: new Date().toISOString().slice(0, 19),
      });
      setError('');
    } else {
      setForm(DEFAULT_FORM);
      setError('');
    }
  }, [open, obligation]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.description.trim()) {
      setError('Description is required to capture evidence.');
      return;
    }
    onSubmit?.({
      description: form.description.trim(),
      fileUrl: form.fileUrl.trim(),
      source: form.source.trim(),
      submittedAt: form.submittedAt ? new Date(form.submittedAt).toISOString() : undefined,
    });
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={submitting ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-all">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      Attach compliance evidence
                    </Dialog.Title>
                    <p className="text-sm text-slate-600">
                      Log proof for <span className="font-semibold text-slate-900">{obligation?.title ?? 'this obligation'}</span> so auditors can verify remediation.
                    </p>
                  </div>

                  <label className="space-y-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={(event) => handleChange('description', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">File URL</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://"
                        value={form.fileUrl}
                        onChange={(event) => handleChange('fileUrl', event.target.value)}
                        className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                      <PaperClipIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</span>
                      <input
                        type="text"
                        value={form.source}
                        onChange={(event) => handleChange('source', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted at</span>
                      <input
                        type="datetime-local"
                        value={form.submittedAt}
                        onChange={(event) => handleChange('submittedAt', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>
                  </div>

                  {error ? (
                    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                      {error}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
                    >
                      {submitting ? 'Saving…' : 'Save evidence'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

ComplianceEvidenceModal.propTypes = {
  open: PropTypes.bool,
  obligation: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
  }),
  submitting: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

ComplianceEvidenceModal.defaultProps = {
  open: false,
  obligation: null,
  submitting: false,
  onClose: undefined,
  onSubmit: undefined,
};
