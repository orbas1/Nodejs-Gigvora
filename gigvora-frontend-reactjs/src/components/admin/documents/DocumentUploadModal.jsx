import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowUpTrayIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

const DEFAULT_DRAFT = {
  name: '',
  description: '',
  tags: [],
  owner: '',
  type: 'policy',
  collectionIds: [],
  confidentiality: 'internal',
  autoWatermark: true,
  requiresReview: true,
};

export default function DocumentUploadModal({ open, onClose, onUpload, collections = [], uploading }) {
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [file, setFile] = useState(null);
  const [previewName, setPreviewName] = useState('');

  useEffect(() => {
    if (!open) {
      setDraft(DEFAULT_DRAFT);
      setFile(null);
      setPreviewName('');
    }
  }, [open]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file) {
      return;
    }
    onUpload?.({
      ...draft,
      file,
      tags: draft.tags.filter(Boolean),
      collectionIds: draft.collectionIds,
    });
  };

  const handleTagsChange = (event) => {
    const values = event.target.value
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    setDraft((current) => ({ ...current, tags: values }));
  };

  const handleCollectionChange = (event) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setDraft((current) => ({ ...current, collectionIds: values }));
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-6 p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-2xl font-semibold text-slate-900">Upload document</Dialog.Title>
                      <p className="mt-1 text-sm text-slate-600">
                        Drag-and-drop policy packs, evidence, or training decks. We handle versioning, watermarking, and trust centre syncs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    >
                      Close
                    </button>
                  </div>

                  <label className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center text-sm text-slate-500">
                    <ArrowUpTrayIcon className="h-10 w-10 text-slate-400" aria-hidden="true" />
                    <span className="font-semibold text-slate-700">
                      {previewName || 'Drop file or click to browse'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md,.html"
                      onChange={(event) => {
                        const nextFile = event.target.files?.[0] ?? null;
                        setFile(nextFile);
                        setPreviewName(nextFile ? nextFile.name : '');
                      }}
                      className="hidden"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document name</span>
                      <input
                        type="text"
                        required
                        value={draft.name}
                        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
                      <input
                        type="text"
                        value={draft.owner}
                        onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
                      <select
                        value={draft.type}
                        onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="policy">Policy</option>
                        <option value="procedure">Procedure</option>
                        <option value="evidence">Evidence</option>
                        <option value="training">Training</option>
                      </select>
                    </label>

                    <label className="space-y-1 text-sm">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidentiality</span>
                      <select
                        value={draft.confidentiality}
                        onChange={(event) => setDraft((current) => ({ ...current, confidentiality: event.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      >
                        <option value="public">Public</option>
                        <option value="client">Client</option>
                        <option value="internal">Internal</option>
                        <option value="restricted">Restricted</option>
                      </select>
                    </label>
                  </div>

                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
                    <textarea
                      rows={3}
                      value={draft.description}
                      onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tags (comma separated)</span>
                    <input
                      type="text"
                      value={draft.tags.join(', ')}
                      onChange={handleTagsChange}
                      placeholder="security, finance, contract"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collections</span>
                    <select
                      multiple
                      value={draft.collectionIds}
                      onChange={handleCollectionChange}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={draft.autoWatermark}
                        onChange={(event) => setDraft((current) => ({ ...current, autoWatermark: event.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                      <span>Enable watermarking</span>
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={draft.requiresReview}
                        onChange={(event) => setDraft((current) => ({ ...current, requiresReview: event.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                      />
                      <span>Route for compliance review</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!file || uploading}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft hover:bg-accentDark disabled:opacity-60"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4" aria-hidden="true" /> Upload document
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

DocumentUploadModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onUpload: PropTypes.func,
  collections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    }),
  ),
  uploading: PropTypes.bool,
};

DocumentUploadModal.defaultProps = {
  open: false,
  onClose: undefined,
  onUpload: undefined,
  collections: [],
  uploading: false,
};
