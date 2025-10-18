import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  buildInitialItem,
  getTypeConfig,
  extractPackages,
  extractFaqs,
} from '../config.js';
import OverviewStep from './steps/OverviewStep.jsx';
import DetailsStep from './steps/DetailsStep.jsx';
import PackagesStep from './steps/PackagesStep.jsx';
import MediaStep from './steps/MediaStep.jsx';
import AccessStep from './steps/AccessStep.jsx';
import ReviewStep from './steps/ReviewStep.jsx';

const steps = [
  { id: 'overview', label: 'Basics', component: OverviewStep },
  { id: 'details', label: 'Details', component: DetailsStep },
  { id: 'packages', label: 'Packages', component: PackagesStep },
  { id: 'media', label: 'Media', component: MediaStep },
  { id: 'access', label: 'Access', component: AccessStep },
  { id: 'review', label: 'Review', component: ReviewStep },
];

function hydrateDraft(item, ownerId) {
  if (!item) {
    return null;
  }
  return {
    ...item,
    ownerId: item.ownerId ?? ownerId ?? null,
    packages: item.packages ?? extractPackages(item.metadata),
    faqs: item.faqs ?? extractFaqs(item.metadata),
    permissions: item.permissions ?? [],
    assets: item.assets ?? [],
    deliverables: item.deliverables ?? [],
    tags: item.tags ?? [],
    audienceSegments: item.audienceSegments ?? [],
    roleAccess: item.roleAccess ?? [],
    commitmentHours:
      item.commitmentHours == null || item.commitmentHours === '' ? '' : `${item.commitmentHours}`,
    compensationMin:
      item.compensationMin == null || item.compensationMin === '' ? '' : `${item.compensationMin}`,
    compensationMax:
      item.compensationMax == null || item.compensationMax === '' ? '' : `${item.compensationMax}`,
    applicationDeadline: item.applicationDeadline ? item.applicationDeadline.substring(0, 10) : '',
    startAt: item.startAt ? item.startAt.substring(0, 10) : '',
    endAt: item.endAt ? item.endAt.substring(0, 10) : '',
  };
}

function sanitizeAssets(assets) {
  return (assets ?? [])
    .filter((asset) => asset.label && asset.url)
    .map((asset, index) => ({
      label: asset.label,
      url: asset.url,
      type: asset.type ?? 'image',
      thumbnailUrl: asset.thumbnailUrl ?? null,
      altText: asset.altText ?? null,
      caption: asset.caption ?? null,
      isPrimary: Boolean(asset.isPrimary),
      orderIndex: asset.orderIndex ?? index,
      metadata: asset.metadata ?? null,
    }));
}

function sanitizeMetadata(draft) {
  const metadata = { ...(draft.metadata ?? {}) };
  metadata.packages = draft.packages ?? [];
  metadata.faqs = draft.faqs ?? [];
  return metadata;
}

function sanitizeNumber(value) {
  if (value === '' || value == null) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function CreationWizard({
  open,
  mode,
  typeId,
  ownerId,
  item,
  loading,
  onClose,
  onSaveDraft,
  onPublish,
}) {
  const [draft, setDraft] = useState(() =>
    item ? hydrateDraft(item, ownerId) : buildInitialItem(typeId, ownerId ?? item?.ownerId),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setDraft(item ? hydrateDraft(item, ownerId) : buildInitialItem(typeId, ownerId ?? item?.ownerId));
      setStepIndex(0);
      setError(null);
    }
  }, [open, item, typeId, ownerId]);

  const currentStep = steps[stepIndex];
  const StepComponent = currentStep.component;
  const typeConfig = useMemo(() => getTypeConfig(typeId ?? item?.type ?? draft?.type), [typeId, item?.type, draft?.type]);

  const handlePatch = (patch) => {
    setDraft((previous) => ({
      ...previous,
      ...patch,
    }));
  };

  const handleNext = () => {
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const preparePayload = () => {
    const metadata = sanitizeMetadata(draft);
    const payload = {
      ...draft,
      ownerId: draft.ownerId ?? ownerId,
      metadata,
      assets: sanitizeAssets(draft.assets),
      permissions: draft.permissions ?? [],
      tags: draft.tags ?? [],
      deliverables: draft.deliverables ?? [],
      audienceSegments: draft.audienceSegments ?? [],
      roleAccess: draft.roleAccess ?? [],
      compensationMin: sanitizeNumber(draft.compensationMin),
      compensationMax: sanitizeNumber(draft.compensationMax),
      commitmentHours: sanitizeNumber(draft.commitmentHours),
      applicationDeadline: draft.applicationDeadline || null,
      startAt: draft.startAt || null,
      endAt: draft.endAt || null,
    };
    return payload;
  };

  const handleSave = async (action) => {
    setSaving(true);
    setError(null);
    try {
      const payload = preparePayload();
      const result = await action(payload);
      setSaving(false);
      return result;
    } catch (saveError) {
      console.error('Unable to save creation', saveError);
      setSaving(false);
      setError(saveError?.message ?? 'Unable to save right now.');
      throw saveError;
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) {
      return;
    }
    await handleSave(onSaveDraft);
    onClose();
  };

  const handlePublish = async () => {
    if (!onPublish) {
      return;
    }
    await handleSave(onPublish);
    onClose();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl overflow-hidden rounded-3xl bg-slate-50 shadow-2xl">
                <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      {mode === 'edit' ? 'Update' : 'Create'} {typeConfig?.name ?? draft?.type ?? ''}
                    </Dialog.Title>
                    <p className="text-sm text-slate-500">{typeConfig?.tagline}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={saving || loading}
                      className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save draft
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={saving || loading}
                      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Publish
                    </button>
                  </div>
                </header>

                <div className="flex flex-col gap-6 bg-slate-50 px-6 py-6">
                  <nav className="flex flex-wrap items-center gap-2">
                    {steps.map((step, index) => {
                      const isActive = index === stepIndex;
                      const isComplete = index < stepIndex;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => setStepIndex(index)}
                          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                            isActive
                              ? 'bg-blue-600 text-white shadow'
                              : isComplete
                                ? 'border border-blue-200 text-blue-700 hover:border-blue-300'
                                : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                          }`}
                        >
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
                            {index + 1}
                          </span>
                          {step.label}
                        </button>
                      );
                    })}
                  </nav>

                  <section className="max-h-[70vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6">
                    <StepComponent draft={draft} onChange={handlePatch} />
                  </section>

                  <footer className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={stepIndex === 0}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={stepIndex === steps.length - 1}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Next
                      </button>
                    </div>
                    {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
                  </footer>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

CreationWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  typeId: PropTypes.string,
  ownerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  item: PropTypes.object,
  loading: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func,
  onPublish: PropTypes.func,
};

export default CreationWizard;
