import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';

const STEPS = ['Identity', 'Story', 'Location'];

function buildDraft(profile) {
  return {
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    title: profile?.title || '',
    headline: profile?.headline || '',
    bio: profile?.bio || '',
    missionStatement: profile?.missionStatement || '',
    location: profile?.location || profile?.locationDetails?.summary || '',
    timezone: profile?.timezone || '',
  };
}

export default function ProfileInfoDrawer({ open, profile, onClose, onSave, saving }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(buildDraft(profile));

  useEffect(() => {
    if (open) {
      setDraft(buildDraft(profile));
      setStep(0);
    }
  }, [open, profile]);

  const handleChange = (field) => (event) => {
    setDraft((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!onSave) {
      return;
    }
    await onSave(draft);
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={saving ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" />
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
              <Dialog.Panel className="pointer-events-auto w-screen max-w-xl bg-white shadow-2xl">
                <form onSubmit={handleSubmit} className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">Profile</Dialog.Title>
                    <div className="flex gap-2 text-xs text-slate-500">
                      {STEPS.map((label, index) => (
                        <span
                          key={label}
                          className={
                            index === step
                              ? 'rounded-full bg-slate-900 px-3 py-1 font-semibold text-white'
                              : 'rounded-full bg-slate-100 px-3 py-1'
                          }
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    {step === 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">First name</span>
                          <input
                            type="text"
                            value={draft.firstName}
                            onChange={handleChange('firstName')}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            required
                          />
                        </label>
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Last name</span>
                          <input
                            type="text"
                            value={draft.lastName}
                            onChange={handleChange('lastName')}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            required
                          />
                        </label>
                        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
                          <input
                            type="text"
                            value={draft.title}
                            onChange={handleChange('title')}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                          />
                        </label>
                      </div>
                    ) : null}

                    {step === 1 ? (
                      <div className="space-y-4">
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Headline</span>
                          <input
                            type="text"
                            value={draft.headline}
                            onChange={handleChange('headline')}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                          />
                        </label>
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</span>
                          <textarea
                            rows={4}
                            value={draft.bio}
                            onChange={handleChange('bio')}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                          />
                        </label>
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Mission</span>
                          <textarea
                            rows={3}
                            value={draft.missionStatement}
                            onChange={handleChange('missionStatement')}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                          />
                        </label>
                      </div>
                    ) : null}

                    {step === 2 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Location</span>
                          <input
                            type="text"
                            value={draft.location}
                            onChange={handleChange('location')}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                          />
                        </label>
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Timezone</span>
                          <input
                            type="text"
                            value={draft.timezone}
                            onChange={handleChange('timezone')}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                    <button
                      type="button"
                      onClick={step === 0 ? onClose : handlePrev}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                      disabled={saving}
                    >
                      {step === 0 ? 'Close' : 'Back'}
                    </button>
                    {step === STEPS.length - 1 ? (
                      <button
                        type="submit"
                        className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                      >
                        Next
                      </button>
                    )}
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
