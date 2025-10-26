import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowUturnLeftIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CommandLineIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  FireIcon,
  Squares2X2Icon,
  TagIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const TOOLBAR_ACTIONS = [
  { id: 'bold', label: 'Bold', prefix: '**', suffix: '**' },
  { id: 'italic', label: 'Italic', prefix: '*', suffix: '*' },
  { id: 'highlight', label: 'Highlight', prefix: '==', suffix: '==' },
  { id: 'quote', label: 'Quote', prefix: '> ', suffix: '' },
  { id: 'list', label: 'Bullet list', prefix: '- ', suffix: '' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function countWords(text) {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function computeDiffStats(nextValue, baseline) {
  if (!baseline) {
    const wordCount = countWords(nextValue);
    return {
      added: wordCount,
      removed: 0,
      delta: wordCount,
    };
  }
  const nextWords = new Set(nextValue.split(/\s+/).filter(Boolean));
  const baselineWords = new Set(baseline.split(/\s+/).filter(Boolean));
  let added = 0;
  let removed = 0;
  nextWords.forEach((word) => {
    if (!baselineWords.has(word)) {
      added += 1;
    }
  });
  baselineWords.forEach((word) => {
    if (!nextWords.has(word)) {
      removed += 1;
    }
  });
  return {
    added,
    removed,
    delta: added - removed,
  };
}

function ToolbarButton({ action, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(action)}
      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/20 hover:text-white"
    >
      {action.label}
    </button>
  );
}

ToolbarButton.propTypes = {
  action: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    prefix: PropTypes.string,
    suffix: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default function PolicyEditor({
  title,
  value,
  onChange,
  versions,
  tags,
  onSaveDraft,
  onRequestApproval,
  onPublish,
  approvals,
  collaborators,
  autoSaveInterval,
  lastSavedAt,
  baselineVersionId,
  onCreateVersion,
  onRestoreVersion,
  guidance,
  readOnly,
}) {
  const [localValue, setLocalValue] = useState(value ?? '');
  const [trackChanges, setTrackChanges] = useState(true);
  const [selectedVersionId, setSelectedVersionId] = useState(baselineVersionId ?? versions?.[0]?.id ?? null);
  const [notes, setNotes] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    if (!baselineVersionId && versions?.length) {
      setSelectedVersionId(versions[0].id);
    }
  }, [baselineVersionId, versions]);

  useEffect(() => {
    if (readOnly || !autoSaveInterval || !onSaveDraft) {
      return undefined;
    }
    const handler = setTimeout(() => {
      onSaveDraft(localValue, { notes, auto: true });
    }, autoSaveInterval);
    return () => clearTimeout(handler);
  }, [autoSaveInterval, localValue, notes, onSaveDraft, readOnly]);

  useEffect(() => {
    if (onChange) {
      onChange(localValue);
    }
  }, [localValue, onChange]);

  const baselineVersion = useMemo(
    () => versions?.find((item) => item.id === selectedVersionId) ?? null,
    [selectedVersionId, versions],
  );

  const wordCount = useMemo(() => countWords(localValue), [localValue]);
  const diffStats = useMemo(() => computeDiffStats(localValue, baselineVersion?.content), [
    localValue,
    baselineVersion,
  ]);
  const dirty = useMemo(() => (baselineVersion ? baselineVersion.content !== localValue : value !== localValue), [
    baselineVersion,
    localValue,
    value,
  ]);

  function handleToolbarAction(action) {
    if (!textareaRef.current || readOnly) return;
    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = textarea;
    const prefix = action.prefix ?? '';
    const suffix = action.suffix ?? '';
    const selected = localValue.slice(selectionStart, selectionEnd);
    const next = `${localValue.slice(0, selectionStart)}${prefix}${selected}${suffix}${localValue.slice(selectionEnd)}`;
    setLocalValue(next);
    requestAnimationFrame(() => {
      const offsetStart = selectionStart + prefix.length;
      const offsetEnd = selectionEnd + prefix.length;
      textarea.focus();
      textarea.setSelectionRange(offsetStart, offsetEnd);
    });
  }

  function handleInsertGuidance(text) {
    if (readOnly) return;
    const next = `${localValue}\n${text}`.trim();
    setLocalValue(next);
  }

  function handleSelectVersion(versionId) {
    setSelectedVersionId(versionId);
    const version = versions?.find((item) => item.id === versionId);
    if (version?.content && onRestoreVersion) {
      onRestoreVersion(versionId, version.content);
    }
  }

  return (
    <section className="space-y-8">
      <header className="rounded-4xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-[0_40px_80px_-40px_rgba(15,23,42,0.8)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/50">Policy operations</p>
            <h1 className="text-3xl font-semibold">{title ?? 'Policy editor workspace'}</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Draft, collaborate, and govern multi-market policies with live version diffing, approval workflows, and editorial
              guardrails aligned to enterprise governance standards.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
              <span className="inline-flex items-center gap-2">
                <ClockIcon className="h-4 w-4" aria-hidden="true" /> Last saved {formatDate(lastSavedAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4" aria-hidden="true" /> {collaborators?.length ?? 0} collaborators active
              </span>
              <span className="inline-flex items-center gap-2">
                <CommandLineIcon className="h-4 w-4" aria-hidden="true" /> Track changes {trackChanges ? 'enabled' : 'disabled'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <button
              type="button"
              disabled={!dirty || readOnly}
              onClick={() => onSaveDraft?.(localValue, { notes, trackChanges })}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
            >
              <DocumentTextIcon className="h-4 w-4" aria-hidden="true" /> Save draft
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => onRequestApproval?.(localValue, { notes, trackChanges })}
              className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100/20 px-4 py-2 text-amber-200 transition hover:bg-amber-200/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" /> Request approval
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => onPublish?.(localValue, { notes })}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-200/20 px-4 py-2 text-emerald-200 transition hover:bg-emerald-200/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/40"
            >
              <DocumentArrowUpIcon className="h-4 w-4" aria-hidden="true" /> Publish
            </button>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <BoltIcon className="h-4 w-4" aria-hidden="true" /> {wordCount} words
            </span>
            <span className="inline-flex items-center gap-2">
              <FireIcon className="h-4 w-4" aria-hidden="true" /> {diffStats.added} new terms
            </span>
            <span className="inline-flex items-center gap-2">
              <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" /> {diffStats.removed} removed terms
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Δ {diffStats.delta}
            </span>
          </div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={trackChanges}
              onChange={(event) => setTrackChanges(event.target.checked)}
              className="h-4 w-4 rounded border-white/40 text-white focus:ring-white/50"
            />
            <span className="uppercase tracking-[0.3em]">Track changes</span>
          </label>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {TOOLBAR_ACTIONS.map((action) => (
                  <ToolbarButton key={action.id} action={action} onClick={handleToolbarAction} />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Squares2X2Icon className="h-4 w-4" aria-hidden="true" /> Baseline version
                <select
                  value={selectedVersionId ?? ''}
                  onChange={(event) => handleSelectVersion(event.target.value)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {(versions ?? []).map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.title ?? `Version ${version.id}`} ({formatDate(version.createdAt)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={localValue}
              readOnly={readOnly}
              onChange={(event) => setLocalValue(event.target.value)}
              className="min-h-[420px] w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm leading-relaxed text-slate-800 shadow-inner focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20"
            />
            <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-600 md:grid-cols-3">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Summary</p>
                <p className="mt-1 text-slate-700">{baselineVersion?.summary ?? 'Provide a 2-line executive summary for this policy.'}</p>
              </div>
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Regions</p>
                <p className="mt-1 text-slate-700">{baselineVersion?.regions?.join(', ') ?? 'Global'}</p>
              </div>
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Effective date</p>
                <p className="mt-1 text-slate-700">{formatDate(baselineVersion?.effectiveAt)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft md:grid-cols-2">
            <div className="space-y-3 text-xs text-slate-600">
              <h3 className="text-sm font-semibold text-slate-900">Approval workflow</h3>
              <ul className="space-y-2">
                {(approvals ?? []).map((approval) => (
                  <li key={approval.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{approval.name}</span>
                      <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{approval.status}</span>
                    </div>
                    <p className="mt-1 text-slate-600">{approval.role}</p>
                    <p className="mt-1 text-slate-500">Due {formatDate(approval.dueAt)}</p>
                  </li>
                ))}
              </ul>
              {!approvals?.length ? <p>No approval workflow configured yet.</p> : null}
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <h3 className="text-sm font-semibold text-slate-900">Notes for reviewers</h3>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Capture context, scope, or risks reviewers should consider."
                className="h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onCreateVersion?.(localValue, { notes })}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                <DocumentCheckIcon className="h-4 w-4" aria-hidden="true" /> Create version snapshot
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-900">Guidance</h3>
            <p className="text-xs text-slate-500">Leverage templates, legal clauses, and tone guidance curated by governance.</p>
            <ul className="space-y-2 text-xs text-slate-600">
              {(guidance ?? []).map((item) => (
                <li key={item.id ?? item.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-slate-600">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleInsertGuidance(item.snippet ?? item.description ?? '')}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed"
                    >
                      Insert
                    </button>
                  </div>
                </li>
              ))}
              {!guidance?.length ? <li className="text-xs text-slate-500">No guidance configured yet.</li> : null}
            </ul>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-900">Tags & coverage</h3>
            <div className="flex flex-wrap gap-2">
              {(tags ?? []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  <TagIcon className="h-3 w-3" aria-hidden="true" /> {tag}
                </span>
              ))}
              {!tags?.length ? <span className="text-xs text-slate-500">Add tags for discoverability.</span> : null}
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-900">Version history</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {(versions ?? []).map((version) => (
                <li
                  key={version.id}
                  className={`rounded-2xl border p-3 transition ${
                    version.id === selectedVersionId
                      ? 'border-slate-900 bg-slate-900/90 text-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.8)]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{version.title ?? `Version ${version.id}`}</span>
                    <span>{formatDate(version.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-slate-500">{version.summary ?? 'No summary provided.'}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

PolicyEditor.propTypes = {
  title: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  versions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      summary: PropTypes.string,
      content: PropTypes.string,
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      effectiveAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      regions: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  tags: PropTypes.arrayOf(PropTypes.string),
  onSaveDraft: PropTypes.func,
  onRequestApproval: PropTypes.func,
  onPublish: PropTypes.func,
  approvals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      role: PropTypes.string,
      status: PropTypes.string,
      dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
  ),
  collaborators: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
  ),
  autoSaveInterval: PropTypes.number,
  lastSavedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  baselineVersionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCreateVersion: PropTypes.func,
  onRestoreVersion: PropTypes.func,
  guidance: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      description: PropTypes.string,
      snippet: PropTypes.string,
    }),
  ),
  readOnly: PropTypes.bool,
};

PolicyEditor.defaultProps = {
  title: null,
  value: '',
  onChange: undefined,
  versions: [],
  tags: [],
  onSaveDraft: undefined,
  onRequestApproval: undefined,
  onPublish: undefined,
  approvals: [],
  collaborators: [],
  autoSaveInterval: null,
  lastSavedAt: null,
  baselineVersionId: null,
  onCreateVersion: undefined,
  onRestoreVersion: undefined,
  guidance: [],
  readOnly: false,
};

