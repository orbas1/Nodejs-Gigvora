import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
  SparklesIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../UserAvatar.jsx';

const STEP_CONFIG = [
  {
    key: 'identity',
    label: 'Name',
    icon: UserIcon,
  },
  {
    key: 'summary',
    label: 'Story',
    icon: SparklesIcon,
  },
  {
    key: 'location',
    label: 'Place',
    icon: MapPinIcon,
  },
];

function StepIndicator({ currentStep }) {
  return (
    <ol className="flex items-center justify-center gap-4">
      {STEP_CONFIG.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        const Icon = step.icon;
        return (
          <li key={step.key} className="flex flex-col items-center gap-2 text-xs font-medium">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-600 shadow'
                  : isComplete
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              {isComplete ? <CheckIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className={isActive ? 'text-blue-600' : 'text-slate-500'}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function AdminOverviewProfileWizard({
  open,
  saving = false,
  identity,
  summary,
  location,
  onClose,
  onSubmit,
  onIdentityChange,
  onSummaryChange,
  onLocationChange,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [localIdentity, setLocalIdentity] = useState(identity ?? { firstName: '', lastName: '' });
  const [localSummary, setLocalSummary] = useState(
    summary ?? { headline: '', missionStatement: '', bio: '' },
  );
  const [localLocation, setLocalLocation] = useState(
    location ?? { avatarSeed: '', location: '', timezone: '' },
  );

  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setLocalIdentity(identity ?? { firstName: '', lastName: '' });
  }, [identity?.firstName, identity?.lastName]);

  useEffect(() => {
    setLocalSummary(summary ?? { headline: '', missionStatement: '', bio: '' });
  }, [summary?.headline, summary?.missionStatement, summary?.bio]);

  useEffect(() => {
    setLocalLocation(location ?? { avatarSeed: '', location: '', timezone: '' });
  }, [location?.avatarSeed, location?.location, location?.timezone]);

  const canGoNext = useMemo(() => {
    if (stepIndex === 0) {
      return Boolean(localIdentity.firstName?.trim()) && Boolean(localIdentity.lastName?.trim());
    }
    return true;
  }, [localIdentity.firstName, localIdentity.lastName, stepIndex]);

  const handleIdentityChange = (updates) => {
    setLocalIdentity((previous) => {
      const next = { ...previous, ...updates };
      if (typeof onIdentityChange === 'function') {
        onIdentityChange(next);
      }
      return next;
    });
  };

  const handleSummaryChange = (updates) => {
    setLocalSummary((previous) => {
      const next = { ...previous, ...updates };
      if (typeof onSummaryChange === 'function') {
        onSummaryChange(next);
      }
      return next;
    });
  };

  const handleLocationChange = (updates) => {
    setLocalLocation((previous) => {
      const next = { ...previous, ...updates };
      if (typeof onLocationChange === 'function') {
        onLocationChange(next);
      }
      return next;
    });
  };

  const handleClose = () => {
    if (saving) {
      return;
    }
    onClose?.();
  };

  const handleNext = () => {
    if (!canGoNext) {
      return;
    }
    setStepIndex((index) => Math.min(index + 1, STEP_CONFIG.length - 1));
  };

  const handleBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (typeof onSubmit !== 'function' || saving) {
      return;
    }
    const payload = {
      firstName: localIdentity.firstName.trim(),
      lastName: localIdentity.lastName.trim(),
      headline: localSummary.headline?.trim() ?? '',
      missionStatement: localSummary.missionStatement?.trim() ?? '',
      bio: localSummary.bio?.trim() ?? '',
      avatarSeed: localLocation.avatarSeed?.trim() ?? '',
      location: localLocation.location?.trim() ?? '',
      timezone: localLocation.timezone?.trim() ?? '',
    };
    await onSubmit(payload);
  };

  const renderStep = () => {
    if (stepIndex === 0) {
      return (
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            First name
            <input
              type="text"
              required
              value={localIdentity.firstName}
              onChange={(event) => handleIdentityChange({ firstName: event.target.value })}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Jordan"
              disabled={saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Last name
            <input
              type="text"
              required
              value={localIdentity.lastName}
              onChange={(event) => handleIdentityChange({ lastName: event.target.value })}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Kim"
              disabled={saving}
            />
          </label>
        </div>
      );
    }

    if (stepIndex === 1) {
      return (
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Headline
            <input
              type="text"
              value={localSummary.headline}
              onChange={(event) => handleSummaryChange({ headline: event.target.value })}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Lead admin"
              disabled={saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Mission
            <textarea
              rows={3}
              value={localSummary.missionStatement}
              onChange={(event) => handleSummaryChange({ missionStatement: event.target.value })}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Keep the marketplace healthy"
              disabled={saving}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Notes
            <textarea
              rows={4}
              value={localSummary.bio}
              onChange={(event) => handleSummaryChange({ bio: event.target.value })}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Add context for teammates"
              disabled={saving}
            />
          </label>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
          <UserAvatar name={`${localIdentity.firstName} ${localIdentity.lastName}`.trim()} seed={localLocation.avatarSeed} size="lg" />
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Avatar preview</p>
            <p>{localLocation.location || 'Set a city to show weather'}</p>
          </div>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Avatar seed
          <input
            type="text"
            value={localLocation.avatarSeed}
            onChange={(event) => handleLocationChange({ avatarSeed: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Jordan Kim"
            disabled={saving}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Location
          <input
            type="text"
            value={localLocation.location}
            onChange={(event) => handleLocationChange({ location: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="London"
            disabled={saving}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Timezone
          <input
            type="text"
            value={localLocation.timezone}
            onChange={(event) => handleLocationChange({ timezone: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Europe/London"
            disabled={saving}
          />
        </label>
      </div>
    );
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-10">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all">
                <form onSubmit={handleSubmit} className="space-y-6 p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-2xl font-semibold text-slate-900">Profile setup</Dialog.Title>
                      <p className="mt-1 text-sm text-slate-500">Update your greeting, story, and location.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                      disabled={saving}
                    >
                      Close
                    </button>
                  </div>

                  <StepIndicator currentStep={stepIndex} />

                  {renderStep()}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={stepIndex === 0 || saving}
                    >
                      <ArrowLeftIcon className="h-5 w-5" /> Back
                    </button>
                    {stepIndex < STEP_CONFIG.length - 1 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={!canGoNext || saving}
                      >
                        Next <ArrowRightIcon className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={saving || !canGoNext}
                      >
                        Save <CheckIcon className="h-5 w-5" />
                      </button>
                    )}
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
