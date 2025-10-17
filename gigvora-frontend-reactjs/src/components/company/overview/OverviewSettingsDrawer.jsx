import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const inputClasses =
  'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10';

export default function OverviewSettingsDrawer({ open, formState, onChange, onSubmit, onClose, saving }) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-screen max-w-xl">
                <form onSubmit={onSubmit} className="flex h-full flex-col bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">Overview settings</Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <Section title="Profile">
                      <Field
                        id="overview-display-name"
                        label="Display name"
                        value={formState.displayName}
                        onChange={(event) => onChange('displayName', event.target.value)}
                        maxLength={150}
                        required
                      />
                      <Field
                        id="overview-greeting"
                        label="Greeting"
                        value={formState.greeting}
                        onChange={(event) => onChange('greeting', event.target.value)}
                        maxLength={120}
                        placeholder="Hi team"
                      />
                      <Textarea
                        id="overview-note"
                        label="Note"
                        value={formState.note}
                        onChange={(event) => onChange('note', event.target.value)}
                        maxLength={2000}
                        rows={4}
                      />
                    </Section>

                    <Section title="Brand">
                      <Field
                        id="overview-avatar-url"
                        label="Avatar URL"
                        value={formState.avatarUrl}
                        onChange={(event) => onChange('avatarUrl', event.target.value)}
                        type="url"
                        placeholder="https://"
                      />
                    </Section>

                    <Section title="Metrics" layout="grid">
                      <Field
                        id="overview-followers"
                        label="Followers"
                        value={formState.followerCount}
                        onChange={(event) => onChange('followerCount', event.target.value)}
                        type="number"
                        min="0"
                      />
                      <Field
                        id="overview-trust"
                        label="Trust"
                        value={formState.trustScore}
                        onChange={(event) => onChange('trustScore', event.target.value)}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <Field
                        id="overview-rating"
                        label="Rating"
                        value={formState.rating}
                        onChange={(event) => onChange('rating', event.target.value)}
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                      />
                    </Section>

                    <Section title="Weather" layout="grid">
                      <Field
                        id="overview-location-label"
                        label="Location"
                        value={formState.locationLabel}
                        onChange={(event) => onChange('locationLabel', event.target.value)}
                        maxLength={255}
                      />
                      <Field
                        id="overview-timezone"
                        label="Timezone"
                        value={formState.timezone}
                        onChange={(event) => onChange('timezone', event.target.value)}
                        maxLength={120}
                        placeholder="America/New_York"
                      />
                      <Field
                        id="overview-latitude"
                        label="Latitude"
                        value={formState.latitude}
                        onChange={(event) => onChange('latitude', event.target.value)}
                        type="number"
                        step="0.0001"
                      />
                      <Field
                        id="overview-longitude"
                        label="Longitude"
                        value={formState.longitude}
                        onChange={(event) => onChange('longitude', event.target.value)}
                        type="number"
                        step="0.0001"
                      />
                    </Section>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 px-6 py-5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save changes'}
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

function Section({ title, children, layout }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className={layout === 'grid' ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4'}>{children}</div>
    </section>
  );
}

function Field({ id, label, ...props }) {
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input id={id} className={inputClasses} {...props} />
    </label>
  );
}

function Textarea({ id, label, rows = 4, ...props }) {
  return (
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <textarea id={id} rows={rows} className={`${inputClasses} resize-none`} {...props} />
    </label>
  );
}
