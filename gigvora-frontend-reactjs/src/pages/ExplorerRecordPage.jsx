import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Tab, Transition } from '@headlessui/react';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  GlobeAmericasIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PlayCircleIcon,
  SparklesIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ExplorerMap from '../components/explorer/ExplorerMap.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataStatus from '../components/DataStatus.jsx';
import useSession from '../hooks/useSession.js';
import analytics from '../services/analytics.js';
import {
  createExplorerInteraction,
  fetchExplorerInteractions,
  fetchExplorerRecord,
  updateExplorerInteraction,
  deleteExplorerInteraction,
} from '../services/explorerData.js';

const CATEGORY_CONFIG = {
  project: {
    label: 'Project',
    highlight: 'Deliver end-to-end programmes with structured milestones.',
    primaryAction: {
      type: 'bid',
      label: 'Submit a project bid',
      description:
        'Share delivery approach, commercials, and your squad composition. We respond within 48 hours.',
      cta: 'Submit bid',
    },
    secondaryAction: {
      type: 'enquiry',
      label: 'Request a discovery call',
    },
  },
  gig: {
    label: 'Gig',
    highlight: 'Fixed-price packages with instant bookable availability.',
    primaryAction: {
      type: 'booking',
      label: 'Book this gig',
      description: 'Lock in the delivery window and share required context for kickoff.',
      cta: 'Book now',
    },
    secondaryAction: {
      type: 'enquiry',
      label: 'Ask a question',
    },
  },
  job: {
    label: 'Job',
    highlight: 'Long-term roles inside the Gigvora ecosystem.',
    primaryAction: {
      type: 'application',
      label: 'Apply for this role',
      description: 'Tell us about your experience, motivation, and salary expectations.',
      cta: 'Submit application',
    },
    secondaryAction: {
      type: 'intro_request',
      label: 'Refer a candidate',
    },
  },
  mentor: {
    label: 'Mentor',
    highlight: 'Book concentrated mentorship sessions or ongoing advisory retainers.',
    primaryAction: {
      type: 'booking',
      label: 'Book a mentorship session',
      description: 'Share goals, availability, and session preferences to confirm a slot.',
      cta: 'Book mentor',
    },
    secondaryAction: {
      type: 'enquiry',
      label: 'Request a chemistry call',
    },
  },
  talent: {
    label: 'Freelancer',
    highlight: 'Independent talent available for collaborations and retainers.',
    primaryAction: {
      type: 'intro_request',
      label: 'Request an introduction',
      description: 'Share project context, timings, and decision-makers to organise an introduction.',
      cta: 'Request intro',
    },
    secondaryAction: {
      type: 'enquiry',
      label: 'Start a conversation',
    },
  },
  volunteering: {
    label: 'Volunteering',
    highlight: 'Purpose-led missions from nonprofits and community partners.',
    primaryAction: {
      type: 'volunteer',
      label: 'Pledge your support',
      description: 'Tell us how you would like to help, availability, and any materials you can contribute.',
      cta: 'Volunteer',
    },
    secondaryAction: {
      type: 'enquiry',
      label: 'Share this mission',
    },
  },
  launchpad: {
    label: 'Experience Launchpad',
    highlight: 'Cohort-based experiences accelerating your growth trajectory.',
    primaryAction: {
      type: 'application',
      label: 'Apply to this launchpad',
      description: 'Outline your objectives, availability, and what you hope to achieve.',
      cta: 'Apply now',
    },
    secondaryAction: {
      type: 'intro_request',
      label: 'Share with a teammate',
    },
  },
};

const INTERACTION_TYPE_LABELS = {
  bid: 'Bid',
  booking: 'Booking',
  enquiry: 'Enquiry',
  application: 'Application',
  intro_request: 'Introduction request',
  volunteer: 'Volunteer pledge',
};

const STATUS_LABELS = {
  new: 'New',
  in_review: 'In review',
  shortlisted: 'Shortlisted',
  declined: 'Declined',
  won: 'Won / converted',
  contacted: 'Contacted',
};

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function formatCurrency(amount, currency) {
  if (amount == null || Number.isNaN(Number(amount))) {
    return null;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch (error) {
    return `${currency || 'USD'} ${amount}`;
  }
}

function buildHighlights(record) {
  const highlights = [];
  if (record.status) {
    highlights.push({ label: 'Status', value: record.status });
  }
  if (record.price?.amount) {
    const formatted = formatCurrency(record.price.amount, record.price.currency);
    if (formatted) {
      highlights.push({
        label: record.price.unit ? `${record.price.unit.charAt(0).toUpperCase()}${record.price.unit.slice(1)}` : 'Budget',
        value: formatted,
      });
    }
  }
  if (record.duration) {
    highlights.push({ label: 'Duration', value: record.duration });
  }
  if (record.experienceLevel) {
    highlights.push({ label: 'Experience', value: record.experienceLevel });
  }
  if (record.employmentType) {
    highlights.push({ label: 'Engagement', value: record.employmentType });
  }
  if (record.availability) {
    highlights.push({ label: 'Availability', value: record.availability });
  }
  if (record.isRemote != null) {
    highlights.push({ label: 'Remote', value: record.isRemote ? 'Remote friendly' : 'On-site' });
  }
  return highlights;
}

function emptyInteractionForm(session, record) {
  return {
    name: session?.profile?.fullName || session?.name || '',
    email: session?.email || '',
    company: session?.profile?.company || '',
    headline: '',
    message: '',
    budgetAmount: record?.price?.amount ? `${record.price.amount}` : '',
    budgetCurrency: record?.price?.currency || 'USD',
    availability: '',
    startDate: '',
    attachments: [''],
    linkedin: '',
    website: '',
  };
}

function normaliseInteractionPayload(type, form) {
  const payload = {
    type,
    name: form.name.trim(),
    email: form.email.trim(),
    company: form.company?.trim() || undefined,
    headline: form.headline?.trim() || undefined,
    message: form.message.trim(),
    availability: form.availability?.trim() || undefined,
    startDate: form.startDate?.trim() || undefined,
    linkedin: form.linkedin?.trim() || undefined,
    website: form.website?.trim() || undefined,
    attachments: form.attachments.filter((value) => value && value.trim().length),
  };

  if (form.budgetAmount) {
    const amount = Number(form.budgetAmount);
    if (!Number.isNaN(amount)) {
      payload.budgetAmount = amount;
      payload.budgetCurrency = form.budgetCurrency || 'USD';
    }
  }

  return payload;
}

export default function ExplorerRecordPage() {
  const { category, recordId } = useParams();
  const navigate = useNavigate();
  const session = useSession();

  const [recordState, setRecordState] = useState({ loading: true, error: null, data: null });
  const [interactionsState, setInteractionsState] = useState({ loading: true, error: null, items: [] });
  const [interactionDialog, setInteractionDialog] = useState({ open: false, type: null });
  const [interactionForm, setInteractionForm] = useState(emptyInteractionForm(session, null));
  const [interactionErrors, setInteractionErrors] = useState(null);
  const [submittingInteraction, setSubmittingInteraction] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);

  const categoryConfig = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.project;

  useEffect(() => {
    let cancelled = false;

    async function loadRecord() {
      setRecordState((state) => ({ ...state, loading: true, error: null }));
      try {
        const record = await fetchExplorerRecord(category, recordId);
        if (cancelled) {
          return;
        }
        setRecordState({ loading: false, error: null, data: record });
        setInteractionForm(emptyInteractionForm(session, record));
        analytics.track('web_explorer_record_viewed', {
          category,
          recordId,
          title: record?.title,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setRecordState({
          loading: false,
          error: error?.body?.message || error.message || 'Unable to load record',
          data: null,
        });
      }
    }

    loadRecord();
    return () => {
      cancelled = true;
    };
  }, [category, recordId, session]);

  const refreshInteractions = useMemo(
    () =>
      async function loadInteractions() {
        setInteractionsState((state) => ({ ...state, loading: true, error: null }));
        try {
          const response = await fetchExplorerInteractions(category, recordId);
          setInteractionsState({ loading: false, error: null, items: response.items || [] });
        } catch (error) {
          setInteractionsState({
            loading: false,
            error: error?.body?.message || error.message || 'Unable to load interactions',
            items: [],
          });
        }
      },
    [category, recordId],
  );

  useEffect(() => {
    refreshInteractions();
  }, [refreshInteractions]);

  const record = recordState.data;

  const highlights = useMemo(() => (record ? buildHighlights(record) : []), [record]);

  const skills = record?.skills ?? [];
  const tags = record?.tags ?? [];

  function handleOpenInteraction(type) {
    setInteractionErrors(null);
    setInteractionForm(emptyInteractionForm(session, record));
    setInteractionDialog({ open: true, type });
    analytics.track('web_explorer_record_interaction_opened', {
      category,
      recordId,
      type,
    });
  }

  function handleCloseInteraction() {
    setInteractionDialog({ open: false, type: null });
  }

  function handleInteractionFieldChange(field, value) {
    setInteractionForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAttachmentChange(index, value) {
    setInteractionForm((prev) => {
      const next = [...prev.attachments];
      next[index] = value;
      return { ...prev, attachments: next };
    });
  }

  function handleAddAttachmentField() {
    setInteractionForm((prev) => ({ ...prev, attachments: [...prev.attachments, ''] }));
  }

  async function handleSubmitInteraction(event) {
    event.preventDefault();
    if (!interactionDialog.type) {
      return;
    }

    setSubmittingInteraction(true);
    setInteractionErrors(null);

    try {
      const payload = normaliseInteractionPayload(interactionDialog.type, interactionForm);
      const interaction = await createExplorerInteraction(category, recordId, payload);
      setFlashMessage({
        type: 'success',
        title: `${INTERACTION_TYPE_LABELS[interaction.type] || 'Interaction'} sent`,
        description: 'We will follow up shortly with next steps.',
      });
      setInteractionDialog({ open: false, type: null });
      setInteractionForm(emptyInteractionForm(session, record));
      analytics.track('web_explorer_record_interaction_submitted', {
        category,
        recordId,
        interactionId: interaction.id,
        type: interaction.type,
      });
      await refreshInteractions();
    } catch (error) {
      if (error?.issues) {
        setInteractionErrors(error.issues);
      } else {
        setInteractionErrors([{ message: error?.body?.message || error.message || 'Submission failed' }]);
      }
    } finally {
      setSubmittingInteraction(false);
    }
  }

  async function handleUpdateInteraction(interaction, updates) {
    try {
      const next = await updateExplorerInteraction(category, recordId, interaction.id, updates);
      setInteractionsState((state) => ({
        ...state,
        items: state.items.map((item) => (item.id === next.id ? next : item)),
      }));
      analytics.track('web_explorer_record_interaction_updated', {
        category,
        recordId,
        interactionId: interaction.id,
        updates,
      });
    } catch (error) {
      setFlashMessage({
        type: 'error',
        title: 'Unable to update interaction',
        description: error?.body?.message || error.message || 'Try again shortly.',
      });
    }
  }

  async function handleDeleteInteraction(interaction) {
    try {
      await deleteExplorerInteraction(category, recordId, interaction.id);
      setInteractionsState((state) => ({
        ...state,
        items: state.items.filter((item) => item.id !== interaction.id),
      }));
      analytics.track('web_explorer_record_interaction_deleted', {
        category,
        recordId,
        interactionId: interaction.id,
      });
    } catch (error) {
      setFlashMessage({
        type: 'error',
        title: 'Unable to delete interaction',
        description: error?.body?.message || error.message || 'Please try again.',
      });
    }
  }

  return (
    <section className="relative overflow-hidden pb-24 pt-16">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-accentDark"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to Explorer
        </button>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-10 shadow-soft">
          {recordState.loading ? (
            <div className="space-y-6">
              <div className="h-8 w-2/3 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
              <div className="h-52 animate-pulse rounded-3xl bg-slate-100" />
            </div>
          ) : recordState.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
              {recordState.error}
            </div>
          ) : record ? (
            <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div>
                <PageHeader
                  eyebrow={`${categoryConfig.label} · ${record.organization || 'Gigvora network'}`}
                  title={record.title}
                  description={record.summary || record.description}
                  meta={
                    <DataStatus
                      loading={recordState.loading}
                      lastUpdated={record.updatedAt ? new Date(record.updatedAt) : null}
                      fromCache={false}
                      compact
                    />
                  }
                />

                {flashMessage ? (
                  <div
                    className={classNames(
                      'mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm',
                      flashMessage.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-600',
                    )}
                  >
                    <CheckCircleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">{flashMessage.title}</p>
                      {flashMessage.description ? <p className="mt-1 text-xs">{flashMessage.description}</p> : null}
                    </div>
                  </div>
                ) : null}

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  {record.heroImage ? (
                    <img
                      src={record.heroImage}
                      alt="Explorer hero"
                      className="h-60 w-full rounded-3xl object-cover"
                    />
                  ) : (
                    <div className="flex h-60 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                      <SparklesIcon className="h-10 w-10" aria-hidden="true" />
                    </div>
                  )}

                  <div className="flex flex-col justify-between rounded-3xl border border-slate-200 p-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">
                        Opportunity snapshot
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{categoryConfig.highlight}</p>
                      <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                        {highlights.map((item) => (
                          <div key={item.label} className="rounded-2xl border border-slate-200 px-4 py-3">
                            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
                              {item.label}
                            </p>
                            <p className="mt-1 font-medium text-slate-900">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {record.location ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1">
                          <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                          {record.location}
                        </span>
                      ) : null}
                      {record.owner?.name ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1">
                          <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                          {record.owner.name}
                        </span>
                      ) : null}
                      {record.rating ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1">
                          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                          {record.rating.toFixed(1)} ({record.reviewCount || 0} reviews)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {record.gallery?.length ? (
                  <div className="mt-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Gallery</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {record.gallery.map((image) => (
                        <img key={image} src={image} alt="Explorer gallery" className="h-48 w-full rounded-3xl object-cover" />
                      ))}
                    </div>
                  </div>
                ) : null}

                {record.videoUrl ? (
                  <div className="mt-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Showcase video</p>
                    <a
                      href={record.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
                    >
                      <PlayCircleIcon className="h-6 w-6" aria-hidden="true" />
                      Watch the video showcase
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                ) : null}

                <div className="mt-10">
                  <Tab.Group>
                    <Tab.List className="flex flex-wrap gap-2">
                      {['Overview', 'Deliverables', 'Reviews'].map((tab) => (
                        <Tab
                          key={tab}
                          className={({ selected }) =>
                            classNames(
                              'rounded-full px-5 py-2 text-xs font-semibold transition',
                              selected
                                ? 'bg-accent text-white shadow-soft'
                                : 'border border-slate-200 text-slate-600 hover:border-accent hover:text-accent',
                            )
                          }
                        >
                          {tab}
                        </Tab>
                      ))}
                    </Tab.List>

                    <Tab.Panels className="mt-6">
                      <Tab.Panel className="rounded-3xl border border-slate-200 p-6 text-sm text-slate-600">
                        <p>{record.description}</p>
                        {record.longDescription ? <p className="mt-4 whitespace-pre-line">{record.longDescription}</p> : null}
                      </Tab.Panel>

                      <Tab.Panel className="rounded-3xl border border-slate-200 p-6 text-sm text-slate-600">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Key skills</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {skills.length ? (
                                skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600"
                                  >
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">Skills will appear once the poster adds them.</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Tags</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {tags.length ? (
                                tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600"
                                  >
                                    #{tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">No tags provided yet.</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                          Add delivery blueprints, success metrics, and collaboration rituals from the management panel to keep
                          this placement conversion-ready.
                        </div>
                      </Tab.Panel>

                      <Tab.Panel className="rounded-3xl border border-slate-200 p-6 text-sm text-slate-600">
                        {record.reviewCount ? (
                          <div>
                            <p className="text-base font-semibold text-slate-900">
                              {record.rating ? `${record.rating.toFixed(1)} / 5.0` : 'Reviews'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">{record.reviewCount} verified reviews across Gigvora.</p>
                            <div className="mt-4 space-y-4">
                              <div className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-sm font-semibold text-slate-900">Keep your reviews synced</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Connect CRM or survey tooling via the management panel to pull in detailed testimonials.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-xs text-slate-500">
                            Reviews will appear here once published. Capture client feedback after delivery to boost Explorer
                            visibility.
                          </div>
                        )}
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accentDark">Take action</p>
                  <p className="mt-2 text-sm text-slate-600">{categoryConfig.primaryAction.description}</p>
                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={() => handleOpenInteraction(categoryConfig.primaryAction.type)}
                      className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                    >
                      {categoryConfig.primaryAction.cta}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenInteraction(categoryConfig.secondaryAction.type)}
                      className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                    >
                      {categoryConfig.secondaryAction.label}
                    </button>

                    {record.applicationUrl ? (
                      <a
                        href={record.applicationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                      >
                        Continue on external page
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-6 text-[0.65rem] text-slate-400">
                    Secure checkout, NDAs, and briefing workspaces activate the moment your interaction is accepted.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Poster</p>
                  <div className="mt-3 flex items-center gap-3">
                    {record.owner?.avatar ? (
                      <img
                        src={record.owner.avatar}
                        alt={record.owner.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{record.owner?.name || 'Team Gigvora'}</p>
                      <p className="text-xs text-slate-500">{record.owner?.role || 'Opportunity curator'}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <p className="inline-flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                      Response SLA under 48 hours
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
                      Saved to your Explorer library
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                      Updated {record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                </div>

                {record.geo?.lat && record.geo?.lng ? (
                  <div className="rounded-3xl border border-slate-200 p-3">
                    <ExplorerMap
                      items={[
                        {
                          ...record,
                          id: record.id,
                          category: record.category,
                        },
                      ]}
                      className="h-60"
                    />
                  </div>
                ) : null}
              </aside>
            </div>
          ) : null}
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Lead management</p>
              <p className="text-xs text-slate-500">
                Track Explorer submissions, update stages, and collaborate with your team in real time.
              </p>
            </div>
            <DataStatus
              loading={interactionsState.loading}
              lastUpdated={null}
              fromCache={false}
              onRefresh={() => refreshInteractions()}
            />
          </div>

          {interactionsState.error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
              {interactionsState.error}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {interactionsState.items.length ? (
              interactionsState.items.map((interaction) => (
                <div
                  key={interaction.id}
                  className="rounded-3xl border border-slate-200 p-5 transition hover:border-accent"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {interaction.name}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          · {INTERACTION_TYPE_LABELS[interaction.type] || 'Interaction'}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {interaction.email}
                        {interaction.company ? ` · ${interaction.company}` : ''}
                        {interaction.budgetAmount
                          ? ` · ${formatCurrency(interaction.budgetAmount, interaction.budgetCurrency)}`
                          : ''}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{interaction.message}</p>
                      {interaction.attachments?.length ? (
                        <ul className="mt-3 space-y-1 text-xs text-accent">
                          {interaction.attachments.map((attachment) => (
                            <li key={attachment} className="inline-flex items-center gap-2">
                              <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
                              <a href={attachment} target="_blank" rel="noreferrer" className="hover:underline">
                                {attachment}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-3 text-xs">
                      <select
                        value={interaction.status || 'new'}
                        onChange={(event) => handleUpdateInteraction(interaction, { status: event.target.value })}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteInteraction(interaction)}
                        className="text-xs font-semibold text-rose-500 transition hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-[0.65rem] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <GlobeAmericasIcon className="h-4 w-4" aria-hidden="true" />
                      {interaction.website || interaction.linkedin || 'No profile provided'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                      {interaction.createdAt
                        ? new Date(interaction.createdAt).toLocaleString()
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No interactions yet. Encourage prospects to engage via Explorer or share this profile.
              </div>
            )}
          </div>
        </div>

        <Transition.Root show={interactionDialog.open} as={Fragment}>
          <Dialog as="div" className="relative z-30" onClose={handleCloseInteraction}>
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

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-soft transition-all">
                    <button
                      type="button"
                      onClick={handleCloseInteraction}
                      className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Close</span>
                    </button>

                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {categoryConfig.primaryAction.type === interactionDialog.type
                        ? categoryConfig.primaryAction.label
                        : categoryConfig.secondaryAction.label}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-slate-500">
                      We share your details directly with the poster and surface progress inside your dashboards.
                    </p>

                    {interactionErrors?.length ? (
                      <div className="mt-4 space-y-2">
                        {interactionErrors.map((issue, index) => (
                          <div key={index} className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                            {issue.message}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <form className="mt-6 space-y-4" onSubmit={handleSubmitInteraction}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Full name
                          <input
                            type="text"
                            value={interactionForm.name}
                            onChange={(event) => handleInteractionFieldChange('name', event.target.value)}
                            required
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Email
                          <input
                            type="email"
                            value={interactionForm.email}
                            onChange={(event) => handleInteractionFieldChange('email', event.target.value)}
                            required
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Company or organisation
                          <input
                            type="text"
                            value={interactionForm.company}
                            onChange={(event) => handleInteractionFieldChange('company', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Headline
                          <input
                            type="text"
                            value={interactionForm.headline}
                            onChange={(event) => handleInteractionFieldChange('headline', event.target.value)}
                            placeholder="e.g. Product Design Lead, Accelerator Team"
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                        Message
                        <textarea
                          value={interactionForm.message}
                          onChange={(event) => handleInteractionFieldChange('message', event.target.value)}
                          required
                          rows={4}
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          placeholder="Share context, outcomes, or any notes for the poster."
                        />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Budget amount
                          <input
                            type="number"
                            min="0"
                            value={interactionForm.budgetAmount}
                            onChange={(event) => handleInteractionFieldChange('budgetAmount', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Currency
                          <input
                            type="text"
                            value={interactionForm.budgetCurrency}
                            onChange={(event) => handleInteractionFieldChange('budgetCurrency', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Availability window
                          <input
                            type="text"
                            value={interactionForm.availability}
                            onChange={(event) => handleInteractionFieldChange('availability', event.target.value)}
                            placeholder="e.g. Week of 4 Nov or evenings GMT"
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Ideal start date
                          <input
                            type="text"
                            value={interactionForm.startDate}
                            onChange={(event) => handleInteractionFieldChange('startDate', event.target.value)}
                            placeholder="e.g. 12 November 2024"
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          LinkedIn profile
                          <input
                            type="url"
                            value={interactionForm.linkedin}
                            onChange={(event) => handleInteractionFieldChange('linkedin', event.target.value)}
                            placeholder="https://"
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                        <label className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                          Website or portfolio
                          <input
                            type="url"
                            value={interactionForm.website}
                            onChange={(event) => handleInteractionFieldChange('website', event.target.value)}
                            placeholder="https://"
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </label>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Attachments</p>
                        <p className="mt-1 text-[0.65rem] text-slate-400">
                          Share proposal decks, reels, or references. Paste public URLs to instantly surface them in Explorer.
                        </p>
                        <div className="mt-3 space-y-2">
                          {interactionForm.attachments.map((value, index) => (
                            <input
                              key={index}
                              type="url"
                              value={value}
                              onChange={(event) => handleAttachmentChange(index, event.target.value)}
                              placeholder="https://"
                              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={handleAddAttachmentField}
                          className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-accent transition hover:text-accentDark"
                        >
                          <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
                          Add another attachment
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                        <p>
                          We share a secure workspace with the poster, including NDAs and messaging, once your submission is
                          accepted.
                        </p>
                        <Link to="/trust-center" className="font-semibold text-accent hover:text-accentDark">
                          Trust centre
                        </Link>
                      </div>

                      <div className="flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleCloseInteraction}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingInteraction}
                          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-accent/60"
                        >
                          {submittingInteraction ? 'Submitting…' : 'Send'}
                          <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </div>
    </section>
  );
}
