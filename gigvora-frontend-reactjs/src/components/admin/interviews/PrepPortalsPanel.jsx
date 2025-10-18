import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { LinkIcon, PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatResources(resources = []) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return '—';
  }
  return resources
    .map((resource) => resource.label ?? resource.url ?? '')
    .filter(Boolean)
    .join(', ');
}

function formatChecklist(checklist = []) {
  if (!Array.isArray(checklist) || checklist.length === 0) {
    return '—';
  }
  return checklist.join(', ');
}

function PrepModal({ open, portal, onClose, onSubmit, onDelete, busy }) {
  const isNew = !portal?.id;
  const [draft, setDraft] = useState({ title: '', status: 'active', shareUrl: '', resources: '', checklist: '' });

  useEffect(() => {
    if (portal) {
      setDraft({
        title: portal.title ?? '',
        status: portal.status ?? 'active',
        shareUrl: portal.shareUrl ?? '',
        resources: (portal.resources ?? [])
          .map((resource) => [resource.label, resource.url].filter(Boolean).join(' | '))
          .join('\n'),
        checklist: (portal.checklist ?? []).join('\n'),
      });
    } else {
      setDraft({ title: '', status: 'active', shareUrl: '', resources: '', checklist: '' });
    }
  }, [portal, open]);

  const handleSubmit = () => {
    const payload = {
      title: draft.title,
      status: draft.status,
      shareUrl: draft.shareUrl || undefined,
      resources: draft.resources
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [label, url] = line.split('|');
          return { id: portal?.resources?.[index]?.id ?? `resource_${index}`, label: label?.trim() ?? '', url: url?.trim() ?? '' };
        }),
      checklist: draft.checklist
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    };
    onSubmit?.(payload);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-4xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {isNew ? 'New prep portal' : draft.title}
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                    <select
                      value={draft.status}
                      onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {['active', 'paused', 'archived'].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share link</span>
                    <input
                      type="url"
                      value={draft.shareUrl}
                      onChange={(event) => setDraft((prev) => ({ ...prev, shareUrl: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resources</span>
                    <textarea
                      value={draft.resources}
                      onChange={(event) => setDraft((prev) => ({ ...prev, resources: event.target.value }))}
                      rows={3}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Agenda | https://..."
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checklist</span>
                    <textarea
                      value={draft.checklist}
                      onChange={(event) => setDraft((prev) => ({ ...prev, checklist: event.target.value }))}
                      rows={3}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Confirm schedule"
                    />
                  </label>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  {!isNew ? (
                    <button
                      type="button"
                      onClick={() => onDelete?.(portal)}
                      disabled={busy}
                      className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
                    >
                      Delete portal
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={busy || !draft.title}
                    className={classNames(
                      'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
                      busy || !draft.title ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700',
                    )}
                  >
                    Save
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

export default function PrepPortalsPanel({
  prepPortals = [],
  busy = false,
  onCreatePortal,
  onUpdatePortal,
  onDeletePortal,
  showHeader = true,
  className = '',
}) {
  const [modalState, setModalState] = useState({ open: false, portal: null });
  const orderedPortals = useMemo(() => prepPortals.slice().sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '')), [prepPortals]);

  return (
    <div className={classNames('space-y-6', className)}>
      {showHeader ? (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Prep</h2>
          <button
            type="button"
            onClick={() => setModalState({ open: true, portal: null })}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> New
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setModalState({ open: true, portal: null })}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> New
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {orderedPortals.map((portal) => (
          <div key={portal.id} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{portal.title}</p>
                <p className="text-sm text-slate-500 capitalize">{portal.status}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalState({ open: true, portal })}
                className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-slate-600">
              <p className="flex items-center gap-2 text-blue-600">
                <LinkIcon className="h-4 w-4" />
                <a href={portal.shareUrl} className="truncate" target="_blank" rel="noreferrer">
                  {portal.shareUrl}
                </a>
              </p>
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Resources</p>
              <p>{formatResources(portal.resources)}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Checklist</p>
              <p>{formatChecklist(portal.checklist)}</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onDeletePortal(portal.id)}
                disabled={busy}
                className="inline-flex items-center gap-2 text-sm font-semibold text-rose-500 transition hover:text-rose-600"
              >
                <TrashIcon className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <PrepModal
        open={modalState.open}
        portal={modalState.portal}
        onClose={() => setModalState({ open: false, portal: null })}
        onSubmit={async (payload) => {
          if (modalState.portal) {
            await onUpdatePortal(modalState.portal.id, payload);
          } else {
            await onCreatePortal(payload);
          }
          setModalState({ open: false, portal: null });
        }}
        onDelete={async (portal) => {
          await onDeletePortal(portal.id);
          setModalState({ open: false, portal: null });
        }}
        busy={busy}
      />
    </div>
  );
}
