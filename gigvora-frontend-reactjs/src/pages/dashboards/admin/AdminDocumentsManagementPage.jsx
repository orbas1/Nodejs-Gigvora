import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import DocumentRepositoryManager from '../../../components/admin/documents/DocumentRepositoryManager.jsx';
import DocumentReviewWorkflow from '../../../components/admin/documents/DocumentReviewWorkflow.jsx';
import DocumentUploadModal from '../../../components/admin/documents/DocumentUploadModal.jsx';
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
    label: 'Dashboards',
    items: [{ id: 'admin-dashboard', name: 'Admin', href: '/dashboard/admin' }],
  },
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

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency'];

export default function AdminDocumentsManagementPage() {
  const [repository, setRepository] = useState(FALLBACK_DATA);
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
      setRepository({
        documents: response?.documents ?? FALLBACK_DATA.documents,
        collections: response?.collections ?? FALLBACK_DATA.collections,
        reviews: response?.reviews ?? FALLBACK_DATA.reviews,
      });
      setToast('Loaded document repository.');
    } catch (err) {
      console.warn('Failed to fetch documents. Using fallback content.', err);
      setError('Using offline document data. Connect the API for real-time content.');
      setRepository(FALLBACK_DATA);
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

  const sections = useMemo(() => [
    { id: 'document-repository', title: 'Repository' },
    { id: 'document-reviews', title: 'Reviews' },
    { id: 'document-collaboration', title: 'Collaboration' },
  ], []);

  const handleUpload = useCallback(
    async (payload) => {
      setUploading(true);
      setToast('Uploading document…');
      try {
        const created = await uploadDocument(payload);
        setRepository((current) => ({
          ...current,
          documents: [...(current.documents ?? []), created ?? { ...payload, id: `doc-${Date.now()}` }],
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
      }));
      setToast('Collection removed.');
    } catch (err) {
      setError(err?.message || 'Failed to delete collection.');
    }
  }, []);

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Document management"
      subtitle="Govern policies, evidence, and legal assets with enterprise-grade workflows"
      description="Keep every policy, template, and evidence artefact audit-ready. Route reviews, publish collections, and maintain a single source of truth."
      menuSections={MENU_SECTIONS}
      sections={sections}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="space-y-12">
        {error && (
          <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
            {error}
          </p>
        )}
        {toast && !error && (
          <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
            {toast}
          </p>
        )}

        <DocumentRepositoryManager
          documents={documents}
          collections={collections}
          onUploadClick={() => setUploadOpen(true)}
          onUpdateDocument={handleUpdateDocument}
          onDeleteDocument={handleDeleteDocument}
          onPublishDocument={handlePublishDocument}
          onDownloadDocument={handleDownloadDocument}
        />

        <DocumentReviewWorkflow
          reviews={reviews}
          onApprove={handleApproveReview}
          onReject={handleRejectReview}
          onRequestChanges={handleRequestChanges}
        />

        <section id="document-collaboration" className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft lg:grid-cols-2">
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
      </div>

      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        collections={collections}
        uploading={uploading}
      />
    </DashboardLayout>
  );
}
