import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatRoster(roster = []) {
  if (!Array.isArray(roster) || roster.length === 0) {
    return '—';
  }
  return roster.map((item) => item.name ?? '').filter(Boolean).join(', ');
}

function formatFocusAreas(focusAreas = []) {
  if (!Array.isArray(focusAreas) || focusAreas.length === 0) {
    return '—';
  }
  return focusAreas.join(', ');
}

function TemplateModal({ open, template, onClose, onSubmit, onDelete, busy }) {
  const isNew = !template?.id;
  const [draft, setDraft] = useState({
    name: '',
    stage: '',
    durationMinutes: 60,
    focusAreas: '',
    roster: '',
    notes: '',
  });

  useEffect(() => {
    if (template) {
      setDraft({
        name: template.name ?? '',
        stage: template.stage ?? '',
        durationMinutes: template.durationMinutes ?? 60,
        focusAreas: formatFocusAreas(template.focusAreas ?? []).replace(/, /g, ', '),
        roster: (template.interviewerRoster ?? [])
          .map((member) =>
            [member.name, member.title].filter(Boolean).join(' – '),
          )
          .join('\n'),
        notes: template.notes ?? '',
      });
    } else {
      setDraft({ name: '', stage: '', durationMinutes: 60, focusAreas: '', roster: '', notes: '' });
    }
  }, [template, open]);

  const handleSubmit = () => {
    const payload = {
      name: draft.name,
      stage: draft.stage,
      durationMinutes: Number(draft.durationMinutes) || 0,
      focusAreas: draft.focusAreas
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      interviewerRoster: draft.roster
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [name, title] = line.split(/\s+[–-]\s+|\s+-\s+/);
          return { id: template?.interviewerRoster?.[index]?.id ?? `roster_${index}`, name: name?.trim() ?? line, title: title?.trim() ?? '' };
        }),
      notes: draft.notes || null,
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
              <Dialog.Panel className="w-full max-w-3xl rounded-4xl bg-white p-6 shadow-2xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  {isNew ? 'New template' : draft.name}
                </Dialog.Title>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stage</span>
                    <input
                      type="text"
                      value={draft.stage}
                      onChange={(event) => setDraft((prev) => ({ ...prev, stage: event.target.value }))}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration (minutes)</span>
                    <input
                      type="number"
                      min="0"
                      value={draft.durationMinutes}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, durationMinutes: Number(event.target.value) || 0 }))
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Focus areas</span>
                    <input
                      type="text"
                      value={draft.focusAreas}
                      onChange={(event) => setDraft((prev) => ({ ...prev, focusAreas: event.target.value }))}
                      placeholder="Signals, Communication, Craft"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Roster</span>
                    <textarea
                      value={draft.roster}
                      onChange={(event) => setDraft((prev) => ({ ...prev, roster: event.target.value }))}
                      rows={3}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Lena Torres – Hiring manager"
                    />
                  </label>
                  <label className="flex flex-col gap-1 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                    <textarea
                      value={draft.notes}
                      onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
                      rows={3}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  {!isNew ? (
                    <button
                      type="button"
                      onClick={() => onDelete?.(template)}
                      disabled={busy}
                      className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
                    >
                      Delete template
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={busy || !draft.name}
                    className={classNames(
                      'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
                      busy || !draft.name ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700',
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

export default function TemplatesPanel({
  templates = [],
  busy = false,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  showHeader = true,
  className = '',
}) {
  const [modalState, setModalState] = useState({ open: false, template: null });
  const orderedTemplates = useMemo(() => templates.slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')), [templates]);

  return (
    <div className={classNames('space-y-6', className)}>
      {showHeader ? (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Panels</h2>
          <button
            type="button"
            onClick={() => setModalState({ open: true, template: null })}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> New
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setModalState({ open: true, template: null })}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" /> New
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {orderedTemplates.map((template) => (
          <div key={template.id} className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{template.name}</p>
                <p className="text-sm text-slate-500">{template.stage}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalState({ open: true, template })}
                className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                aria-label="Edit template"
                title="Edit template"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-slate-800">{template.durationMinutes} min</p>
              <p className="mt-2">{formatFocusAreas(template.focusAreas)}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">Roster</p>
              <p>{formatRoster(template.interviewerRoster)}</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onDeleteTemplate(template.id)}
                disabled={busy}
                className="inline-flex items-center gap-2 text-sm font-semibold text-rose-500 transition hover:text-rose-600"
              >
                <TrashIcon className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <TemplateModal
        open={modalState.open}
        template={modalState.template}
        onClose={() => setModalState({ open: false, template: null })}
        onSubmit={async (payload) => {
          if (modalState.template) {
            await onUpdateTemplate(modalState.template.id, payload);
          } else {
            await onCreateTemplate(payload);
          }
          setModalState({ open: false, template: null });
        }}
        onDelete={async (template) => {
          await onDeleteTemplate(template.id);
          setModalState({ open: false, template: null });
        }}
        busy={busy}
      />
    </div>
  );
}
