import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Tab, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const TAB_DEFINITIONS = [
  { id: 'summary', label: 'Summary', icon: ShieldCheckIcon },
  { id: 'notes', label: 'Notes', icon: DocumentDuplicateIcon },
  { id: 'interviews', label: 'Interviews', icon: CalendarDaysIcon },
  { id: 'files', label: 'Files', icon: DocumentArrowDownIcon },
  { id: 'history', label: 'History', icon: ClockIcon },
];

const CONTROL_CLASS =
  'rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function parseList(value = '') {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildForm(application) {
  if (!application) {
    return {
      candidateName: '',
      candidateEmail: '',
      candidatePhone: '',
      resumeUrl: '',
      coverLetter: '',
      portfolioUrl: '',
      linkedinUrl: '',
      githubUrl: '',
      jobTitle: '',
      jobId: '',
      jobLocation: '',
      employmentType: '',
      salaryExpectation: '',
      currency: 'USD',
      status: '',
      stage: '',
      priority: '',
      source: '',
      score: '',
      tags: '',
      skills: '',
      assignedRecruiterId: '',
      assignedRecruiterName: '',
      assignedTeam: '',
      availabilityDate: '',
      transitionNote: '',
    };
  }

  return {
    candidateName: application.candidateName ?? '',
    candidateEmail: application.candidateEmail ?? '',
    candidatePhone: application.candidatePhone ?? '',
    resumeUrl: application.resumeUrl ?? '',
    coverLetter: application.coverLetter ?? '',
    portfolioUrl: application.portfolioUrl ?? '',
    linkedinUrl: application.linkedinUrl ?? '',
    githubUrl: application.githubUrl ?? '',
    jobTitle: application.jobTitle ?? '',
    jobId: application.jobId ?? '',
    jobLocation: application.jobLocation ?? '',
    employmentType: application.employmentType ?? '',
    salaryExpectation: application.salaryExpectation != null ? String(application.salaryExpectation) : '',
    currency: application.currency ?? 'USD',
    status: application.status ?? '',
    stage: application.stage ?? '',
    priority: application.priority ?? '',
    source: application.source ?? '',
    score: application.score != null ? String(application.score) : '',
    tags: Array.isArray(application.tags) ? application.tags.join(', ') : '',
    skills: Array.isArray(application.skills) ? application.skills.join(', ') : '',
    assignedRecruiterId: application.assignedRecruiterId != null ? String(application.assignedRecruiterId) : '',
    assignedRecruiterName: application.assignedRecruiterName ?? '',
    assignedTeam: application.assignedTeam ?? '',
    availabilityDate: application.availabilityDate ? new Date(application.availabilityDate).toISOString().slice(0, 10) : '',
    transitionNote: '',
  };
}

function SummaryField({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Badge({ value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900/90 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
      {value.replace(/_/g, ' ')}
    </span>
  );
}
export default function JobApplicationDrawer({
  open,
  application,
  facets = {},
  saving,
  deleting,
  error,
  loadingDetail,
  onClose,
  onUpdate,
  onDelete,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onCreateInterview,
  onUpdateInterview,
  onDeleteInterview,
  onCreateDocument,
  onUpdateDocument,
  onDeleteDocument,
}) {
  const [formState, setFormState] = useState(buildForm(application));
  const [activeTab, setActiveTab] = useState('summary');
  const [fullView, setFullView] = useState(false);

  const [noteDraft, setNoteDraft] = useState('');
  const [noteVisibility, setNoteVisibility] = useState('internal');
  const [editingNote, setEditingNote] = useState(null);
  const [editingNoteBody, setEditingNoteBody] = useState('');
  const [editingNoteVisibility, setEditingNoteVisibility] = useState('internal');

  const [interviewDraft, setInterviewDraft] = useState({
    scheduledAt: '',
    durationMinutes: '',
    type: facets.interviewTypes?.[0] ?? 'video',
    status: facets.interviewStatuses?.[0] ?? 'scheduled',
    location: '',
    meetingLink: '',
    interviewerName: '',
    interviewerEmail: '',
    notes: '',
  });
  const [editingInterview, setEditingInterview] = useState(null);

  const [documentDraft, setDocumentDraft] = useState({ fileName: '', fileUrl: '', fileType: '', sizeBytes: '' });
  const [editingDocument, setEditingDocument] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);

  useEffect(() => {
    if (application) {
      setFormState(buildForm(application));
      setActiveTab('summary');
      setNoteDraft('');
      setNoteVisibility('internal');
      setEditingNote(null);
      setEditingInterview(null);
      setDocumentDraft({ fileName: '', fileUrl: '', fileType: '', sizeBytes: '' });
      setPreviewDocument(null);
    }
  }, [application?.id]);

  const recruiterOptions = useMemo(() => facets.recruiters ?? [], [facets.recruiters]);

  const summaryFieldConfig = useMemo(
    () => [
      { key: 'candidateName', label: 'Name', type: 'text' },
      { key: 'candidateEmail', label: 'Email', type: 'email' },
      { key: 'candidatePhone', label: 'Phone', type: 'text' },
      { key: 'resumeUrl', label: 'Resume link', type: 'text' },
      { key: 'portfolioUrl', label: 'Portfolio', type: 'text' },
      { key: 'linkedinUrl', label: 'LinkedIn', type: 'text' },
      { key: 'githubUrl', label: 'GitHub', type: 'text' },
      { key: 'jobTitle', label: 'Job title', type: 'text' },
      { key: 'jobId', label: 'Requisition', type: 'text' },
      { key: 'jobLocation', label: 'Location', type: 'text' },
      { key: 'employmentType', label: 'Employment type', type: 'text' },
      { key: 'salaryExpectation', label: 'Salary', type: 'number' },
      {
        key: 'currency',
        label: 'Currency',
        type: 'select',
        options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((code) => ({ value: code, label: code })),
      },
      {
        key: 'stage',
        label: 'Stage',
        type: 'select',
        options: (facets.stages ?? []).map((value) => ({ value, label: value.replace(/_/g, ' ') })),
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: (facets.statuses ?? []).map((value) => ({ value, label: value.replace(/_/g, ' ') })),
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: (facets.priorities ?? []).map((value) => ({ value, label: value.replace(/_/g, ' ') })),
      },
      {
        key: 'source',
        label: 'Source',
        type: 'select',
        options: (facets.sources ?? []).map((value) => ({ value, label: value.replace(/_/g, ' ') })),
      },
      { key: 'score', label: 'Score', type: 'number' },
      { key: 'tags', label: 'Tags', type: 'text', placeholder: 'design, ux' },
      { key: 'skills', label: 'Skills', type: 'text', placeholder: 'research, prototyping' },
      {
        key: 'assignedRecruiterId',
        label: 'Recruiter',
        type: 'select',
        options: [{ value: '', label: 'Unassigned' }, ...recruiterOptions.map((item) => ({ value: String(item.id), label: item.name }))],
      },
      { key: 'assignedRecruiterName', label: 'Recruiter name', type: 'text' },
      { key: 'assignedTeam', label: 'Team', type: 'text' },
      { key: 'availabilityDate', label: 'Availability', type: 'date' },
    ],
    [facets.priorities, facets.sources, facets.stages, facets.statuses, recruiterOptions],
  );

  const handleFieldChange = (key, value) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const handleSave = () => {
    if (!application) return;
    if (!formState.candidateName.trim() || !formState.candidateEmail.trim() || !formState.jobTitle.trim()) {
      return;
    }

    const payload = {
      candidateName: formState.candidateName.trim(),
      candidateEmail: formState.candidateEmail.trim(),
      candidatePhone: formState.candidatePhone.trim() || null,
      resumeUrl: formState.resumeUrl.trim() || null,
      coverLetter: formState.coverLetter || null,
      portfolioUrl: formState.portfolioUrl.trim() || null,
      linkedinUrl: formState.linkedinUrl.trim() || null,
      githubUrl: formState.githubUrl.trim() || null,
      jobTitle: formState.jobTitle.trim(),
      jobId: formState.jobId.trim() || null,
      jobLocation: formState.jobLocation.trim() || null,
      employmentType: formState.employmentType.trim() || null,
      salaryExpectation: formState.salaryExpectation ? Number(formState.salaryExpectation) : null,
      currency: formState.currency || 'USD',
      status: formState.status || null,
      stage: formState.stage || null,
      priority: formState.priority || null,
      source: formState.source || null,
      score: formState.score ? Number(formState.score) : null,
      tags: parseList(formState.tags),
      skills: parseList(formState.skills),
      metadata: application.metadata ?? null,
      assignedRecruiterId: formState.assignedRecruiterId ? Number(formState.assignedRecruiterId) : null,
      assignedRecruiterName: formState.assignedRecruiterName.trim() || null,
      assignedTeam: formState.assignedTeam.trim() || null,
      availabilityDate: formState.availabilityDate || null,
      transitionNote: formState.transitionNote.trim() || null,
    };

    onUpdate(application.id, payload);
  };

  const handleDelete = () => {
    if (!application) return;
    onDelete(application.id);
  };

  const handleCreateNote = () => {
    if (!application || !noteDraft.trim()) return;
    onCreateNote(application.id, { body: noteDraft.trim(), visibility: noteVisibility });
    setNoteDraft('');
    setNoteVisibility('internal');
  };

  const handleSaveNote = async () => {
    if (!application || !editingNote) return;
    await onUpdateNote(application.id, editingNote.id, {
      body: editingNoteBody.trim(),
      visibility: editingNoteVisibility,
    });
    setEditingNote(null);
  };

  const handleCreateInterview = () => {
    if (!application || !interviewDraft.scheduledAt) return;
    onCreateInterview(application.id, {
      scheduledAt: interviewDraft.scheduledAt,
      durationMinutes: interviewDraft.durationMinutes ? Number(interviewDraft.durationMinutes) : undefined,
      type: interviewDraft.type,
      status: interviewDraft.status,
      location: interviewDraft.location.trim() || undefined,
      meetingLink: interviewDraft.meetingLink.trim() || undefined,
      interviewerName: interviewDraft.interviewerName.trim() || undefined,
      interviewerEmail: interviewDraft.interviewerEmail.trim() || undefined,
      notes: interviewDraft.notes.trim() || undefined,
    });
    setInterviewDraft({
      scheduledAt: '',
      durationMinutes: '',
      type: facets.interviewTypes?.[0] ?? 'video',
      status: facets.interviewStatuses?.[0] ?? 'scheduled',
      location: '',
      meetingLink: '',
      interviewerName: '',
      interviewerEmail: '',
      notes: '',
    });
  };

  const handleSaveInterview = async () => {
    if (!application || !editingInterview) return;
    await onUpdateInterview(application.id, editingInterview.id, {
      scheduledAt: editingInterview.scheduledAt,
      durationMinutes:
        editingInterview.durationMinutes === '' || editingInterview.durationMinutes == null
          ? null
          : Number(editingInterview.durationMinutes),
      type: editingInterview.type,
      status: editingInterview.status,
      location: editingInterview.location?.trim() || null,
      meetingLink: editingInterview.meetingLink?.trim() || null,
      interviewerName: editingInterview.interviewerName?.trim() || null,
      interviewerEmail: editingInterview.interviewerEmail?.trim() || null,
      notes: editingInterview.notes ?? null,
    });
    setEditingInterview(null);
  };

  const handleCreateDocument = () => {
    if (!application || !documentDraft.fileName.trim() || !documentDraft.fileUrl.trim()) return;
    onCreateDocument(application.id, {
      fileName: documentDraft.fileName.trim(),
      fileUrl: documentDraft.fileUrl.trim(),
      fileType: documentDraft.fileType.trim() || undefined,
      sizeBytes: documentDraft.sizeBytes ? Number(documentDraft.sizeBytes) : undefined,
    });
    setDocumentDraft({ fileName: '', fileUrl: '', fileType: '', sizeBytes: '' });
  };

  const handleSaveDocument = async () => {
    if (!application || !editingDocument) return;
    await onUpdateDocument(application.id, editingDocument.id, {
      fileName: editingDocument.fileName.trim(),
      fileUrl: editingDocument.fileUrl.trim(),
      fileType: editingDocument.fileType?.trim() || null,
      sizeBytes:
        editingDocument.sizeBytes === '' || editingDocument.sizeBytes == null
          ? null
          : Number(editingDocument.sizeBytes),
      metadata: editingDocument.metadata ?? null,
    });
    setEditingDocument(null);
  };
  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={saving || deleting ? () => {} : onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel
                  className={classNames(
                    'relative flex h-[90vh] w-full transform flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl transition-all',
                    fullView ? 'max-w-7xl' : 'max-w-5xl',
                  )}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserCircleIcon className="h-10 w-10 text-blue-600" />
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-slate-900">
                          {application?.candidateName || 'Application'}
                        </Dialog.Title>
                        <p className="text-sm text-slate-500">{application?.jobTitle ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge value={application?.stage} />
                        <Badge value={application?.status} />
                        <Badge value={application?.priority} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFullView((prev) => !prev)}
                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
                      >
                        {fullView ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deleting ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <TrashIcon className="h-5 w-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col overflow-hidden">
                    <Tab.Group selectedIndex={TAB_DEFINITIONS.findIndex((tab) => tab.id === activeTab)} onChange={(index) => setActiveTab(TAB_DEFINITIONS[index].id)}>
                      <Tab.List className="flex gap-2 border-b border-slate-200 bg-slate-100/80 px-6 py-3">
                        {TAB_DEFINITIONS.map((tab) => (
                          <Tab
                            key={tab.id}
                            className={({ selected }) =>
                              classNames(
                                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                                selected
                                  ? 'bg-white text-blue-600 shadow-sm shadow-blue-100'
                                  : 'text-slate-600 hover:bg-white/80',
                              )
                            }
                          >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                          </Tab>
                        ))}
                      </Tab.List>

                      <Tab.Panels className="flex-1 overflow-y-auto px-6 py-6">
                        <Tab.Panel className="space-y-6">
                          <div className="grid gap-4 md:grid-cols-2">
                            {summaryFieldConfig.map((field) => (
                              <SummaryField key={field.key} label={field.label}>
                                {field.type === 'select' ? (
                                  <select
                                    value={formState[field.key] ?? ''}
                                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                                    className={CONTROL_CLASS}
                                  >
                                    {field.options.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field.type}
                                    value={formState[field.key] ?? ''}
                                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                                    placeholder={field.placeholder}
                                    className={CONTROL_CLASS}
                                  />
                                )}
                              </SummaryField>
                            ))}
                          </div>
                          <div className="space-y-3">
                            <SummaryField label="Stage note">
                              <textarea
                                rows={3}
                                value={formState.transitionNote}
                                onChange={(event) => handleFieldChange('transitionNote', event.target.value)}
                                placeholder="Why is this moving?"
                                className={classNames(CONTROL_CLASS, 'resize-none')}
                              />
                            </SummaryField>
                            <SummaryField label="Cover letter">
                              <textarea
                                rows={4}
                                value={formState.coverLetter}
                                onChange={(event) => handleFieldChange('coverLetter', event.target.value)}
                                className={classNames(CONTROL_CLASS, 'resize-none')}
                              />
                            </SummaryField>
                          </div>
                          {error ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
                          ) : null}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleSave}
                              disabled={saving}
                              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-400/40 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                              Save changes
                            </button>
                          </div>
                        </Tab.Panel>

                        <Tab.Panel className="space-y-6">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-800">Add note</h3>
                            <div className="mt-3 space-y-3">
                              <textarea
                                rows={3}
                                value={noteDraft}
                                onChange={(event) => setNoteDraft(event.target.value)}
                                placeholder="Share progress with the team"
                                className={classNames(CONTROL_CLASS, 'w-full resize-none')}
                              />
                              <div className="flex flex-wrap items-center gap-3">
                                <select
                                  value={noteVisibility}
                                  onChange={(event) => setNoteVisibility(event.target.value)}
                                  className={CONTROL_CLASS}
                                >
                                  <option value="internal">Internal</option>
                                  <option value="shared">Shared</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={handleCreateNote}
                                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                  Log note
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {(application?.notes ?? []).map((note) => (
                              <article key={note.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                <header className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{note.authorName || 'Admin'}</p>
                                    <p className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      {note.visibility}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingNote(note);
                                        setEditingNoteBody(note.body ?? '');
                                        setEditingNoteVisibility(note.visibility ?? 'internal');
                                      }}
                                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
                                    >
                                      <PencilSquareIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteNote(application.id, note.id)}
                                      className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:border-rose-300"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </header>
                                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{note.body}</p>
                              </article>
                            ))}
                            {(application?.notes?.length ?? 0) === 0 ? (
                              <p className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
                                No notes yet.
                              </p>
                            ) : null}
                          </div>
                        </Tab.Panel>
                        <Tab.Panel className="space-y-6">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-800">Schedule interview</h3>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</span>
                                <input
                                  type="datetime-local"
                                  value={interviewDraft.scheduledAt}
                                  onChange={(event) =>
                                    setInterviewDraft((prev) => ({ ...prev, scheduledAt: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration (minutes)</span>
                                <input
                                  type="number"
                                  value={interviewDraft.durationMinutes}
                                  onChange={(event) =>
                                    setInterviewDraft((prev) => ({ ...prev, durationMinutes: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
                                <select
                                  value={interviewDraft.type}
                                  onChange={(event) =>
                                    setInterviewDraft((prev) => ({ ...prev, type: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                >
                                  {(facets.interviewTypes ?? []).map((type) => (
                                    <option key={type} value={type}>
                                      {type.replace(/_/g, ' ')}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                                <select
                                  value={interviewDraft.status}
                                  onChange={(event) =>
                                    setInterviewDraft((prev) => ({ ...prev, status: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                >
                                  {(facets.interviewStatuses ?? []).map((status) => (
                                    <option key={status} value={status}>
                                      {status.replace(/_/g, ' ')}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</span>
                                <input
                                  value={interviewDraft.location}
                                  onChange={(event) =>
                                    setInterviewDraft((prev) => ({ ...prev, location: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting link</span>
                                <input
                                  value={interviewDraft.meetingLink}
                                  onChange={(event) =>
                                    setInterviewDraft((prev) => ({ ...prev, meetingLink: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interviewer</span>
                                <input
                                  value={interviewDraft.interviewerName}
                                  onChange={(event) =>
                                    setInterviewDraft((prev) => ({ ...prev, interviewerName: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interviewer email</span>
                                <input
                                  type="email"
                                  value={interviewDraft.interviewerEmail}
                                  onChange={(event) =>
                                    setInterviewDraft((prev) => ({ ...prev, interviewerEmail: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                              <label className="md:col-span-2 flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                                <textarea
                                  rows={3}
                                  value={interviewDraft.notes}
                                  onChange={(event) => setInterviewDraft((prev) => ({ ...prev, notes: event.target.value }))}
                                  className={classNames(CONTROL_CLASS, 'resize-none')}
                                />
                              </label>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <button
                                type="button"
                                onClick={handleCreateInterview}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Add interview
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {(application?.interviews ?? []).map((interview) => (
                              <article key={interview.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                <header className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{formatDateTime(interview.scheduledAt)}</p>
                                    <p className="text-xs text-slate-500">
                                      {interview.type?.replace(/_/g, ' ')} · {interview.status?.replace(/_/g, ' ')}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingInterview({
                                          ...interview,
                                          scheduledAt: interview.scheduledAt
                                            ? new Date(interview.scheduledAt).toISOString().slice(0, 16)
                                            : '',
                                          durationMinutes:
                                            interview.durationMinutes == null ? '' : String(interview.durationMinutes),
                                        })
                                      }
                                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
                                    >
                                      <PencilSquareIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteInterview(application.id, interview.id)}
                                      className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:border-rose-300"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </header>
                                <dl className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                                  <div className="flex items-center gap-2">
                                    <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                                    <span>{interview.location || 'No location'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ClockIcon className="h-4 w-4 text-slate-400" />
                                    <span>{interview.durationMinutes ?? '—'} min</span>
                                  </div>
                                  <div className="md:col-span-2 flex items-center gap-2">
                                    <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
                                    <span>{interview.interviewerName || 'No interviewer'}</span>
                                  </div>
                                </dl>
                                {interview.notes ? (
                                  <p className="mt-3 text-sm text-slate-700">{interview.notes}</p>
                                ) : null}
                              </article>
                            ))}
                            {(application?.interviews?.length ?? 0) === 0 ? (
                              <p className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
                                No interviews planned.
                              </p>
                            ) : null}
                          </div>
                        </Tab.Panel>

                        <Tab.Panel className="space-y-6">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-sm font-semibold text-slate-800">Add file</h3>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">File name</span>
                                <input
                                  value={documentDraft.fileName}
                                  onChange={(event) =>
                                    setDocumentDraft((prev) => ({ ...prev, fileName: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">File link</span>
                                <input
                                  value={documentDraft.fileUrl}
                                  onChange={(event) =>
                                    setDocumentDraft((prev) => ({ ...prev, fileUrl: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
                                <input
                                  value={documentDraft.fileType}
                                  onChange={(event) =>
                                    setDocumentDraft((prev) => ({ ...prev, fileType: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-sm text-slate-600">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size (bytes)</span>
                                <input
                                  type="number"
                                  value={documentDraft.sizeBytes}
                                  onChange={(event) =>
                                    setDocumentDraft((prev) => ({ ...prev, sizeBytes: event.target.value }))
                                  }
                                  className={CONTROL_CLASS}
                                />
                              </label>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <button
                                type="button"
                                onClick={handleCreateDocument}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                              >
                                <PlusIcon className="h-4 w-4" />
                                Upload
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {(application?.documents ?? []).map((document) => (
                              <article key={document.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                <header className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{document.fileName}</p>
                                    <p className="text-xs text-slate-500">{document.fileType || '—'}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewDocument(document)}
                                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingDocument({
                                          ...document,
                                          sizeBytes: document.sizeBytes == null ? '' : String(document.sizeBytes),
                                        })
                                      }
                                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
                                    >
                                      <PencilSquareIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteDocument(application.id, document.id)}
                                      className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:border-rose-300"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </header>
                                <p className="mt-3 text-xs text-slate-500">
                                  Uploaded {formatDateTime(document.createdAt)} · {document.sizeBytes ? `${document.sizeBytes} bytes` : 'Size unknown'}
                                </p>
                              </article>
                            ))}
                            {(application?.documents?.length ?? 0) === 0 ? (
                              <p className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
                                No files stored.
                              </p>
                            ) : null}
                          </div>
                        </Tab.Panel>

                        <Tab.Panel className="space-y-4">
                          <div className="space-y-3">
                            {(application?.stageHistory ?? []).map((entry) => {
                              const stageLabel = [
                                entry.fromStage ? entry.fromStage.replace(/_/g, ' ') : 'Start',
                                '→',
                                entry.toStage ? entry.toStage.replace(/_/g, ' ') : '—',
                              ].join(' ');
                              const statusLabel = entry.toStatus
                                ? `${entry.fromStatus ? entry.fromStatus.replace(/_/g, ' ') : '—'} → ${entry.toStatus.replace(/_/g, ' ')}`
                                : null;
                              return (
                                <div
                                  key={entry.id}
                                  className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                                >
                                  <p className="font-semibold text-slate-900">{stageLabel}</p>
                                  <p className="text-xs text-slate-500">{formatDateTime(entry.changedAt)}</p>
                                  {statusLabel ? (
                                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">Status {statusLabel}</p>
                                  ) : null}
                                  {entry.changedByName ? (
                                    <p className="mt-2 text-xs text-slate-500">by {entry.changedByName}</p>
                                  ) : null}
                                  {entry.note ? <p className="mt-2 text-sm text-slate-600">{entry.note}</p> : null}
                                </div>
                              );
                            })}
                            {(application?.stageHistory?.length ?? 0) === 0 ? (
                              <p className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
                                No timeline yet.
                              </p>
                            ) : null}
                          </div>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  </div>

                  {loadingDetail ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60">
                      <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : null}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      <Transition.Root show={Boolean(editingNote)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setEditingNote(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Edit note</Dialog.Title>
                  <button type="button" onClick={() => setEditingNote(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <textarea
                    rows={4}
                    value={editingNoteBody}
                    onChange={(event) => setEditingNoteBody(event.target.value)}
                    className={classNames(CONTROL_CLASS, 'w-full resize-none')}
                  />
                  <select
                    value={editingNoteVisibility}
                    onChange={(event) => setEditingNoteVisibility(event.target.value)}
                    className={CONTROL_CLASS}
                  >
                    <option value="internal">Internal</option>
                    <option value="shared">Shared</option>
                  </select>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingNote(null)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                      Cancel
                    </button>
                    <button type="button" onClick={handleSaveNote} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                      <CheckCircleIcon className="h-4 w-4" /> Save
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={Boolean(editingInterview)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setEditingInterview(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Edit interview</Dialog.Title>
                  <button type="button" onClick={() => setEditingInterview(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                {editingInterview ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</span>
                      <input
                        type="datetime-local"
                        value={editingInterview.scheduledAt ?? ''}
                        onChange={(event) => setEditingInterview((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</span>
                      <input
                        type="number"
                        value={editingInterview.durationMinutes ?? ''}
                        onChange={(event) => setEditingInterview((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
                      <select
                        value={editingInterview.type}
                        onChange={(event) => setEditingInterview((prev) => ({ ...prev, type: event.target.value }))}
                        className={CONTROL_CLASS}
                      >
                        {(facets.interviewTypes ?? []).map((type) => (
                          <option key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                      <select
                        value={editingInterview.status}
                        onChange={(event) => setEditingInterview((prev) => ({ ...prev, status: event.target.value }))}
                        className={CONTROL_CLASS}
                      >
                        {(facets.interviewStatuses ?? []).map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</span>
                      <input
                        value={editingInterview.location ?? ''}
                        onChange={(event) => setEditingInterview((prev) => ({ ...prev, location: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Meeting link</span>
                      <input
                        value={editingInterview.meetingLink ?? ''}
                        onChange={(event) => setEditingInterview((prev) => ({ ...prev, meetingLink: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interviewer</span>
                      <input
                        value={editingInterview.interviewerName ?? ''}
                        onChange={(event) => setEditingInterview((prev) => ({ ...prev, interviewerName: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interviewer email</span>
                      <input
                        type="email"
                        value={editingInterview.interviewerEmail ?? ''}
                        onChange={(event) => setEditingInterview((prev) => ({ ...prev, interviewerEmail: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                    <label className="md:col-span-2 flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                      <textarea
                        rows={3}
                        value={editingInterview.notes ?? ''}
                        onChange={(event) => setEditingInterview((prev) => ({ ...prev, notes: event.target.value }))}
                        className={classNames(CONTROL_CLASS, 'resize-none')}
                      />
                    </label>
                  </div>
                ) : null}
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingInterview(null)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveInterview} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                    <CheckCircleIcon className="h-4 w-4" /> Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={Boolean(editingDocument)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setEditingDocument(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Edit file</Dialog.Title>
                  <button type="button" onClick={() => setEditingDocument(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                {editingDocument ? (
                  <div className="mt-4 space-y-3">
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">File name</span>
                      <input
                        value={editingDocument.fileName}
                        onChange={(event) => setEditingDocument((prev) => ({ ...prev, fileName: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">File link</span>
                      <input
                        value={editingDocument.fileUrl}
                        onChange={(event) => setEditingDocument((prev) => ({ ...prev, fileUrl: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
                      <input
                        value={editingDocument.fileType ?? ''}
                        onChange={(event) => setEditingDocument((prev) => ({ ...prev, fileType: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-600">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size (bytes)</span>
                      <input
                        type="number"
                        value={editingDocument.sizeBytes ?? ''}
                        onChange={(event) => setEditingDocument((prev) => ({ ...prev, sizeBytes: event.target.value }))}
                        className={CONTROL_CLASS}
                      />
                    </label>
                  </div>
                ) : null}
                <div className="mt-6 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingDocument(null)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSaveDocument} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                    <CheckCircleIcon className="h-4 w-4" /> Save
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={Boolean(previewDocument)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setPreviewDocument(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-slate-900">{previewDocument?.fileName}</Dialog.Title>
                    <p className="text-sm text-slate-500">{previewDocument?.fileType || '—'}</p>
                  </div>
                  <button type="button" onClick={() => setPreviewDocument(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 space-y-4 text-sm text-slate-700">
                  <p>Uploaded {formatDateTime(previewDocument?.createdAt)}</p>
                  {previewDocument?.sizeBytes ? <p>Size: {previewDocument.sizeBytes} bytes</p> : null}
                  {previewDocument?.fileUrl ? (
                    <a
                      href={previewDocument.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-700 hover:border-blue-300"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" /> Open link
                    </a>
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
