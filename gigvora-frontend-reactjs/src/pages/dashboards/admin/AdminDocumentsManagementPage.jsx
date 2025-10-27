import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminGovernanceLayout from '../../../components/admin/AdminGovernanceLayout.jsx';
import DocumentRepositoryManager from '../../../components/admin/documents/DocumentRepositoryManager.jsx';
import DocumentReviewWorkflow from '../../../components/admin/documents/DocumentReviewWorkflow.jsx';
import DocumentUploadModal from '../../../components/admin/documents/DocumentUploadModal.jsx';
import useSession from '../../../hooks/useSession.js';
import {
  fetchDocumentRepository,
  uploadDocument,
  updateDocument,
  deleteDocument,
  publishDocument,
  requestDocumentReview,
  createDocumentCollection,
  updateDocumentCollection,
  deleteDocumentCollection,
} from '../../../services/documentsManagement.js';

const MENU_SECTIONS = [
  {
    label: 'Documents',
    items: [
      { id: 'document-repository', name: 'Repository', sectionId: 'document-repository' },
      { id: 'document-reviews', name: 'Reviews', sectionId: 'document-reviews' },
      { id: 'document-collaboration', name: 'Collaboration', sectionId: 'document-collaboration' },
    ],
  },
  {
    label: 'Navigation',
    items: [
      { id: 'governance-home', name: 'Governance overview', href: '/dashboard/admin/governance' },
      { id: 'policy-workflows', name: 'Policy workflows', href: '/dashboard/admin/governance/policies' },
      { id: 'admin-dashboard', name: 'Admin control center', href: '/dashboard/admin' },
    ],
  },
];

const SECTIONS = [
  { id: 'document-repository', title: 'Repository' },
  { id: 'document-reviews', title: 'Reviews' },
  { id: 'document-collaboration', title: 'Collaboration' },
];

const FALLBACK_DATA = {
  documents: [
    {
      id: 'privacy-policy',
      name: 'Privacy Policy',
      owner: 'Legal',
      tags: ['policies', 'gdpr'],
      status: 'published',
      version: '3.2',
      type: 'policy',
      updatedAt: '2024-04-20T00:00:00Z',
    },
    {
      id: 'incident-playbook',
      name: 'Incident Response Playbook',
      owner: 'Security',
      tags: ['security', 'runbook'],
      status: 'draft',
      version: '1.4',
      type: 'procedure',
      updatedAt: '2024-03-18T00:00:00Z',
    },
  ],
  collections: [
    {
      id: 'investor-pack',
      name: 'Investor trust pack',
      documents: ['privacy-policy'],
    },
    {
      id: 'soc2-evidence',
      name: 'SOC 2 Evidence Locker',
      documents: ['incident-playbook'],
    },
  ],
  reviews: [
    {
      id: 'review-1',
      documentName: 'Privacy Policy',
      status: 'approved',
      requestedBy: 'Chief Legal Officer',
      dueAt: '2024-04-01T00:00:00Z',
      notes: 'Ready for publication after stakeholder sign-off.',
    },
    {
      id: 'review-2',
      documentName: 'Incident Response Playbook',
      status: 'pending',
      requestedBy: 'Head of Security',
      dueAt: '2024-05-05T00:00:00Z',
      notes: 'Awaiting compliance review of updated breach workflow.',
    },
    {
      id: 'review-3',
      documentName: 'Vendor Due Diligence Template',
      status: 'rejected',
      requestedBy: 'Vendor Management',
      dueAt: '2024-04-15T00:00:00Z',
      notes: 'Needs GDPR clause updates.',
    },
  ],
};

function toSnapshot(payload = {}) {
  const documents = Array.isArray(payload.documents) ? payload.documents : FALLBACK_DATA.documents;
  const collections = Array.isArray(payload.collections) ? payload.collections : FALLBACK_DATA.collections;
  const reviews = Array.isArray(payload.reviews) ? payload.reviews : FALLBACK_DATA.reviews;

  return {
    documents: documents.map((document) => ({ ...document })),
    collections: collections.map((collection) => ({ ...collection })),
    reviews: reviews.map((review) => ({ ...review })),
    refreshedAt: payload.refreshedAt ?? payload.generatedAt ?? new Date().toISOString(),
  };
}

export default function AdminDocumentsManagementPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [repository, setRepository] = useState(() => toSnapshot(FALLBACK_DATA));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState('');

  const loadRepository = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchDocumentRepository();
      setRepository(toSnapshot(response ?? {}));
      setToast('Loaded document repository.');
    } catch (err) {
      console.warn('Failed to fetch documents. Using fallback content.', err);
      setError('Using offline document data. Connect the API for real-time content.');
      setRepository(toSnapshot(FALLBACK_DATA));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepository();
  }, [loadRepository]);

  const documents = repository.documents ?? [];
  const collections = repository.collections ?? [];
  const reviews = repository.reviews ?? [];

  const lastUpdated = repository?.refreshedAt ?? repository?.generatedAt ?? null;
  const pendingReviews = useMemo(
    () => reviews.filter((review) => (review.status ?? '').toLowerCase() !== 'approved').length,
    [reviews],
  );

  const handleUpload = useCallback(
    async (payload) => {
      setUploading(true);
      setToast('Uploading document…');
      try {
        const created = await uploadDocument(payload);
        setRepository((current) => ({
          ...current,
          documents: [...(current.documents ?? []), created ?? { ...payload, id: `doc-${Date.now()}` }],
          refreshedAt: new Date().toISOString(),
        }));
        setUploadOpen(false);
        setToast('Document uploaded.');
      } catch (err) {
        setError(err?.message || 'Failed to upload document.');
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  const handleUpdateDocument = useCallback(async (documentId, payload) => {
    if (!documentId) return;
    setToast('Updating document…');
    try {
      const updated = await updateDocument(documentId, payload);
      setRepository((current) => ({
        ...current,
        documents: (current.documents ?? []).map((document) =>
          document.id === documentId ? { ...document, ...(updated ?? payload) } : document,
        ),
        refreshedAt: new Date().toISOString(),
      }));
      setToast('Document updated.');
    } catch (err) {
      setError(err?.message || 'Unable to update document.');
    }
  }, []);

  const handleDeleteDocument = useCallback(async (documentId) => {
    if (!documentId) return;
    setToast('Deleting document…');
    try {
      await deleteDocument(documentId);
      setRepository((current) => ({
        ...current,
        documents: (current.documents ?? []).filter((document) => document.id !== documentId),
        refreshedAt: new Date().toISOString(),
      }));
      setToast('Document removed.');
    } catch (err) {
      setError(err?.message || 'Failed to delete document.');
    }
  }, []);

  const handlePublishDocument = useCallback(async (documentId) => {
    if (!documentId) return;
    setToast('Publishing document…');
    try {
      const published = await publishDocument(documentId, { publish: true });
      setRepository((current) => ({
        ...current,
        documents: (current.documents ?? []).map((document) =>
          document.id === documentId ? { ...document, ...(published ?? { status: 'published' }) } : document,
        ),
        refreshedAt: new Date().toISOString(),
      }));
      setToast('Document published.');
    } catch (err) {
      setError(err?.message || 'Failed to publish document.');
    }
  }, []);

  const handleDownloadDocument = useCallback((documentId) => {
    setToast(`Preparing download for ${documentId === 'all' ? 'all documents' : documentId}…`);
  }, []);

  const handleApproveReview = useCallback(async (reviewId) => {
    setToast('Approving review…');
    try {
      await requestDocumentReview(reviewId, { status: 'approved' });
      setRepository((current) => ({
        ...current,
        reviews: (current.reviews ?? []).map((review) =>
          review.id === reviewId ? { ...review, status: 'approved' } : review,
        ),
        refreshedAt: new Date().toISOString(),
      }));
      setToast('Review approved.');
    } catch (err) {
      setError(err?.message || 'Failed to approve review.');
    }
  }, []);

  const handleRejectReview = useCallback(async (reviewId) => {
    setToast('Rejecting review…');
    try {
      await requestDocumentReview(reviewId, { status: 'rejected' });
      setRepository((current) => ({
        ...current,
        reviews: (current.reviews ?? []).map((review) =>
          review.id === reviewId ? { ...review, status: 'rejected' } : review,
        ),
        refreshedAt: new Date().toISOString(),
      }));
      setToast('Review rejected.');
    } catch (err) {
      setError(err?.message || 'Failed to reject review.');
    }
  }, []);

  const handleRequestChanges = useCallback(async (reviewId) => {
    setToast('Requesting changes…');
    try {
      await requestDocumentReview(reviewId, { status: 'pending', notes: 'Changes requested from UI.' });
      setToast('Reviewer notified of requested changes.');
    } catch (err) {
      setError(err?.message || 'Failed to request changes.');
    }
  }, []);

  const handleCreateCollection = useCallback(
    async (payload) => {
      setCreatingCollection(true);
      setToast('Creating collection…');
      try {
        const created = await createDocumentCollection(payload);
        setRepository((current) => ({
          ...current,
          collections: [...(current.collections ?? []), created ?? { ...payload, id: `collection-${Date.now()}` }],
          refreshedAt: new Date().toISOString(),
        }));
        setToast('Collection created.');
      } catch (err) {
        setError(err?.message || 'Failed to create collection.');
        throw err;
      } finally {
        setCreatingCollection(false);
      }
    },
    [],
  );

  const handleUpdateCollection = useCallback(async (collectionId, payload) => {
    if (!collectionId) return;
    setEditingCollectionId(collectionId);
    setToast('Updating collection…');
    try {
      const updated = await updateDocumentCollection(collectionId, payload);
      setRepository((current) => ({
        ...current,
        collections: (current.collections ?? []).map((collection) =>
          collection.id === collectionId ? { ...collection, ...(updated ?? payload) } : collection,
        ),
        refreshedAt: new Date().toISOString(),
      }));
      setToast('Collection updated.');
    } catch (err) {
      setError(err?.message || 'Failed to update collection.');
    } finally {
      setEditingCollectionId('');
    }
  }, []);

  const handleDeleteCollection = useCallback(async (collectionId) => {
    if (!collectionId) return;
    setToast('Deleting collection…');
    try {
      await deleteDocumentCollection(collectionId);
      setRepository((current) => ({
        ...current,
        collections: (current.collections ?? []).filter((collection) => collection.id !== collectionId),
        refreshedAt: new Date().toISOString(),
      }));
      setToast('Collection removed.');
    } catch (err) {
      setError(err?.message || 'Failed to delete collection.');
    }
  }, []);

  const handleDownloadManifest = useCallback(() => {
    const manifest = {
      generatedAt: new Date().toISOString(),
      totals: {
        documents: documents.length,
        collections: collections.length,
        reviews: reviews.length,
      },
      documents,
      collections,
      reviews,
    };
    const payload = JSON.stringify(manifest, null, 2);

    if (typeof window === 'undefined') {
      console.info('Document manifest', payload);
      setToast('Document manifest printed to console output.');
      return;
    }

    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `gigvora-documents-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.rel = 'noopener';
      anchor.click();
      window.URL.revokeObjectURL(url);
      setToast('Downloaded repository manifest.');
    } catch (exportError) {
      console.error('Failed to export document manifest', exportError);
      setError('Unable to download document manifest.');
    }
  }, [collections, documents, reviews]);

  const headerActions = useMemo(
    () => [
      {
        label: 'Governance overview',
        variant: 'secondary',
        onClick: () => navigate('/dashboard/admin/governance'),
      },
      {
        label: 'Policy workflows',
        variant: 'secondary',
        onClick: () => navigate('/dashboard/admin/governance/policies'),
      },
      {
        label: 'Download manifest',
        variant: 'secondary',
        onClick: handleDownloadManifest,
      },
      {
        label: 'Upload document',
        variant: 'primary',
        onClick: () => setUploadOpen(true),
      },
    ],
    [handleDownloadManifest, navigate],
  );

  return (
    <AdminGovernanceLayout
      session={session}
      currentDashboard="admin"
      title="Document management"
      subtitle="Governance portal & legal operations"
      description="Orchestrate policy assets, approval workflows, and evidence lockers inside a unified governance workspace."
      menuConfig={MENU_SECTIONS}
      sections={SECTIONS}
      statusLabel="Document repository"
      fromCache={Boolean(error)}
      statusChildren={
        <p className="text-xs text-slate-500">
          {documents.length} documents, {collections.length} collections, {pendingReviews} reviews awaiting decision.
        </p>
      }
      lastUpdated={lastUpdated}
      loading={loading}
      error={error ? { message: error } : undefined}
      onRefresh={loadRepository}
      headerActions={headerActions}
      onNavigate={(href) => navigate(href)}
    >
      {(error || toast) && (
        <section aria-live="polite" className="space-y-3">
          {error ? (
            <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
              {error}
            </p>
          ) : null}
          {toast && !error ? (
            <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
              {toast}
            </p>
          ) : null}
        </section>
      )}

      <section id="document-repository" className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Repository snapshot</h2>
            <p className="text-sm text-slate-600">
              {documents.length} documents • {collections.length} collections • {reviews.length} review workflows active.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={handleDownloadManifest}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Download manifest
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 font-semibold text-white shadow-soft transition hover:bg-slate-800"
            >
              Upload document
            </button>
          </div>
        </div>

        <DocumentRepositoryManager
          documents={documents}
          collections={collections}
          onUploadClick={() => setUploadOpen(true)}
          onUpdateDocument={handleUpdateDocument}
          onDeleteDocument={handleDeleteDocument}
          onPublishDocument={handlePublishDocument}
          onDownloadDocument={handleDownloadDocument}
        />
      </section>

      <section id="document-reviews">
        <DocumentReviewWorkflow
          reviews={reviews}
          onApprove={handleApproveReview}
          onReject={handleRejectReview}
          onRequestChanges={handleRequestChanges}
        />
      </section>

      <section
        id="document-collaboration"
        className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft lg:grid-cols-2"
      >
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Collaboration lounge</h2>
          <p className="text-sm text-slate-600">
            Invite legal, compliance, and investors into shared workspaces with granular permissions. Collections can be
            shared in read-only mode or with tracked comments.
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleCreateCollection({ name: 'New shared workspace', documents: [] })}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft hover:bg-slate-800"
            >
              Create workspace
            </button>
            {creatingCollection && <p className="text-xs text-slate-500">Creating collection…</p>}
          </div>
          <ul className="space-y-3 text-sm text-slate-600">
            {collections.map((collection) => (
              <li key={collection.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{collection.name}</p>
                    <p className="text-xs text-slate-500">{collection.documents?.length ?? 0} documents</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleUpdateCollection(collection.id, { name: `${collection.name} (updated)` })}
                      className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollection(collection.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 font-semibold uppercase tracking-wide text-rose-600 hover:border-rose-300 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {editingCollectionId === collection.id && <p className="mt-2 text-xs text-slate-500">Updating…</p>}
              </li>
            ))}
          </ul>
        </div>
        <div className="aspect-video overflow-hidden rounded-3xl border border-slate-200 shadow-soft">
          <iframe
            title="Document collaboration walk-through"
            src="https://player.vimeo.com/video/327857861?title=0&byline=0&portrait=0"
            allow="autoplay; fullscreen; picture-in-picture"
            className="h-full w-full"
          />
        </div>
      </section>

      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        collections={collections}
        uploading={uploading}
      />
    </AdminGovernanceLayout>
  );
}
