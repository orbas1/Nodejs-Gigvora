import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowUpOnSquareIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  fetchAdminLegalPolicies,
  fetchAdminLegalPolicy,
  updateAdminLegalPolicyVersion,
  createAdminLegalPolicyVersion,
  publishAdminLegalPolicyVersion,
  activateAdminLegalPolicyVersion,
} from '../../../services/legalPolicies.js';

function PolicyListItem({ document, isActive = false, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(document)}
      className={`flex w-full flex-col items-start rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
        isActive ? 'border-sky-400 bg-white shadow-sky-100' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <span className="text-sm font-semibold text-slate-900">{document.title}</span>
      <span className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{document.category}</span>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{document.summary || 'No summary provided yet.'}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Status: {document.status}</span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
          Active version: {document.activeVersionId ? `#${document.activeVersionId}` : '—'}
        </span>
      </div>
    </button>
  );
}

PolicyListItem.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    summary: PropTypes.string,
    status: PropTypes.string.isRequired,
    activeVersionId: PropTypes.number,
  }).isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

function VersionTimeline({ versions = [] }) {
  if (!versions?.length) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No draft versions yet. Create a draft to begin the review process.
      </p>
    );
  }
  return (
    <ol className="space-y-2">
      {versions.map((version) => (
        <li
          key={`${version.id}-${version.version}-${version.locale}`}
          className="rounded-3xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">
                v{version.version} · {version.locale.toUpperCase()} · {version.status.replace('_', ' ')}
              </span>
              {version.summary && <span className="text-xs text-slate-500">{version.summary}</span>}
            </div>
            <div className="text-xs text-slate-500">
              <p>Created {version.createdAt ? new Date(version.createdAt).toLocaleString() : '—'}</p>
              {version.publishedAt && <p>Published {new Date(version.publishedAt).toLocaleString()}</p>}
            </div>
          </div>
          {version.changeSummary && (
            <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Change notes: {version.changeSummary}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

VersionTimeline.propTypes = {
  versions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      version: PropTypes.number.isRequired,
      locale: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      summary: PropTypes.string,
      changeSummary: PropTypes.string,
      createdAt: PropTypes.string,
      publishedAt: PropTypes.string,
    }),
  ),
};

export default function PolicyEditor({ locale = 'en' }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeVersion, setActiveVersion] = useState(null);
  const [editorValue, setEditorValue] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminLegalPolicies({ includeVersions: false });
      setDocuments(response.documents ?? []);
    } catch (fetchError) {
      setError(fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const loadDocument = useCallback(async (document) => {
    if (!document) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchAdminLegalPolicy(document.slug ?? document.id, {
        includeVersions: true,
        includeAudit: true,
      });
      setSelectedDocument(detail);
      const latest = detail.versions?.find((version) => version.locale === (locale || detail.defaultLocale));
      setActiveVersion(latest || null);
      setEditorValue(latest?.content || '');
      setChangeSummary(latest?.changeSummary || '');
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  const handleSelect = (document) => {
    loadDocument(document);
  };

  const handleCreateDraft = async () => {
    if (!selectedDocument) return;
    setSaving(true);
    setError(null);
    try {
      const draft = await createAdminLegalPolicyVersion(selectedDocument.id, {
        locale: locale || selectedDocument.defaultLocale,
        status: 'draft',
        summary: changeSummary || 'Draft prepared in governance editor',
        content: editorValue || '',
      });
      setStatusMessage('Draft saved. Continue refining or submit for review.');
      await loadDocument(selectedDocument);
      setActiveVersion(draft);
    } catch (draftError) {
      setError(draftError);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDocument || !activeVersion) {
      await handleCreateDraft();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateAdminLegalPolicyVersion(selectedDocument.id, activeVersion.id, {
        content: editorValue,
        changeSummary: changeSummary,
        status: activeVersion.status === 'draft' ? 'in_review' : activeVersion.status,
      });
      setStatusMessage('Draft updated. Changes ready for compliance review.');
      await loadDocument(selectedDocument);
    } catch (saveError) {
      setError(saveError);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedDocument || !activeVersion) return;
    setSaving(true);
    setError(null);
    try {
      await publishAdminLegalPolicyVersion(selectedDocument.id, activeVersion.id, {
        changeSummary: changeSummary || 'Published via governance editor',
      });
      await activateAdminLegalPolicyVersion(selectedDocument.id, activeVersion.id);
      setStatusMessage('Policy published and activated. Audience will see updates immediately.');
      await loadDocument(selectedDocument);
      await fetchPolicies();
    } catch (publishError) {
      setError(publishError);
    } finally {
      setSaving(false);
    }
  };

  const auditInsights = useMemo(() => {
    if (!selectedDocument?.auditEvents) return [];
    return selectedDocument.auditEvents.slice(0, 5);
  }, [selectedDocument?.auditEvents]);

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-3">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Policy catalogue</p>
              <h2 className="text-lg font-semibold text-slate-900">Operational policies</h2>
            </div>
            <button
              type="button"
              onClick={fetchPolicies}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Refresh
            </button>
          </header>
          <p className="mt-2 text-sm text-slate-600">
            Track policy health, draft updates, and align on governance checkpoints across the organisation.
          </p>
        </div>
        {loading && documents.length === 0 ? (
          <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Loading policies…</p>
        ) : documents.length === 0 ? (
          <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No policies found. Create a legal document via the governance console to begin.
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <PolicyListItem
                key={document.id}
                document={document}
                isActive={selectedDocument?.id === document.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </aside>

      <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200">
        {error && (
          <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <InformationCircleIcon className="h-5 w-5" aria-hidden />
            <span>{error.message || 'Something went wrong while updating the policy.'}</span>
          </div>
        )}

        {statusMessage && (
          <div className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <SparklesIcon className="h-5 w-5" aria-hidden />
            <span>{statusMessage}</span>
          </div>
        )}

        {selectedDocument ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{selectedDocument.category}</p>
                <h3 className="text-2xl font-semibold text-slate-900">{selectedDocument.title}</h3>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  {selectedDocument.summary || 'Provide a concise description for this policy so reviewers understand its intent.'}
                </p>
              </div>
              <div className="flex flex-col items-end text-xs text-slate-500">
                <span>Status: {selectedDocument.status}</span>
                <span>Locale: {locale || selectedDocument.defaultLocale}</span>
                <span>Active version: {selectedDocument.activeVersionId ?? '—'}</span>
              </div>
            </header>

            <section className="space-y-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Change summary
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(event) => setChangeSummary(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="Summarise key updates, obligations, and impacted personas."
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                Draft content
                <textarea
                  rows={14}
                  value={editorValue}
                  onChange={(event) => setEditorValue(event.target.value)}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900"
                  placeholder="Document policy language, escalation pathways, and enforcement guardrails."
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {saving ? 'Saving…' : 'Save draft'}
                </button>
                <button
                  type="button"
                  onClick={handleCreateDraft}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Create new draft
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={saving || !activeVersion}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ArrowUpOnSquareIcon className="h-4 w-4" aria-hidden />
                  Publish & activate
                </button>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                <header className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <DocumentTextIcon className="h-4 w-4" aria-hidden />
                  Version history
                </header>
                <VersionTimeline versions={selectedDocument.versions} />
              </div>

              <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-inner">
                <header className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent audit trail</header>
                {auditInsights.length === 0 ? (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    No governance audit events recorded for this policy yet.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-600">
                    {auditInsights.map((event) => (
                      <li key={event.id} className="rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm">
                        <p className="font-semibold text-slate-800">{event.action}</p>
                        <p className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            <DocumentTextIcon className="h-12 w-12 text-slate-300" aria-hidden />
            <p className="mt-3 text-sm font-medium">Select a policy to begin editing and publish compliant updates.</p>
          </div>
        )}
      </div>
    </section>
  );
}

PolicyEditor.propTypes = {
  locale: PropTypes.string,
};
