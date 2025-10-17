import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import AlertInbox from './AlertInbox.jsx';
import AlertSettings from './AlertSettings.jsx';
import AlertComposer from './AlertComposer.jsx';

const VIEWS = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'settings', label: 'Settings' },
  { key: 'new', label: 'New' },
];

export default function AlertWorkspaceDrawer({
  open,
  onClose,
  view,
  onViewChange,
  inbox,
  stats,
  filters,
  loading,
  error,
  pagination,
  onRefresh,
  onLoadMore,
  onFiltersChange,
  onMarkRead,
  onArchive,
  onMarkAll,
  markAllBusy,
  actionBusy,
  preferences,
  onSavePreferences,
  savingPreferences,
  preferencesError,
  onPreferencesReset,
  composerError,
  onComposerReset,
  onComposerSubmit,
  composing,
  onClearError,
}) {
  const [selectedId, setSelectedId] = useState(() => (inbox.items[0]?.id ? inbox.items[0].id : null));

  useEffect(() => {
    if (!inbox.items.length) {
      setSelectedId(null);
      return;
    }
    if (!inbox.items.find((item) => item.id === selectedId)) {
      setSelectedId(inbox.items[0].id);
    }
  }, [inbox.items, selectedId]);

  const activeView = useMemo(() => {
    return VIEWS.find((item) => item.key === view) ? view : 'inbox';
  }, [view]);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-6xl">
                  <div className="flex h-full flex-col gap-6 overflow-hidden bg-slate-50 p-6 shadow-2xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <Dialog.Title className="text-xl font-semibold text-slate-900">Alerts</Dialog.Title>
                        <p className="text-sm text-slate-500">Control delivery, compose updates, and clear your queue.</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:border-blue-300 hover:text-blue-600"
                        onClick={onClose}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {VIEWS.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => onViewChange?.(item.key)}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                            activeView === item.key
                              ? 'bg-blue-600 text-white shadow'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {activeView === 'inbox' ? (
                        <AlertInbox
                          items={inbox.items}
                          stats={stats}
                          filters={filters}
                          onFiltersChange={onFiltersChange}
                          onRefresh={onRefresh}
                          onLoadMore={onLoadMore}
                          onSelect={setSelectedId}
                          selectedId={selectedId}
                          loading={loading}
                          error={error}
                          onClearError={onClearError}
                          pagination={pagination}
                          onMarkRead={onMarkRead}
                          onArchive={onArchive}
                          onMarkAll={onMarkAll}
                          markAllBusy={markAllBusy}
                          actionBusy={actionBusy}
                        />
                      ) : null}
                      {activeView === 'settings' ? (
                        <div className="mx-auto max-w-3xl">
                          <AlertSettings
                            preferences={preferences}
                            onSubmit={onSavePreferences}
                            busy={savingPreferences}
                            error={preferencesError}
                            onResetError={onPreferencesReset}
                          />
                        </div>
                      ) : null}
                      {activeView === 'new' ? (
                        <div className="mx-auto max-w-3xl">
                          <AlertComposer
                            onSubmit={onComposerSubmit}
                            busy={composing}
                            error={composerError}
                            onResetError={onComposerReset}
                            onSuccess={() => onViewChange?.('inbox')}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
