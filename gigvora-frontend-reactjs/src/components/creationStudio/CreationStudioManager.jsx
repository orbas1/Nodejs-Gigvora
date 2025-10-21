import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listCreationStudioItems,
  getCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
} from '../../services/creationStudio.js';
import useSession from '../../hooks/useSession.js';
import { CREATION_TYPES, getTypeConfig } from './config.js';
import StudioLayout from './layout/StudioLayout.jsx';
import TypeGallery from './panels/TypeGallery.jsx';
import ItemShelf from './panels/ItemShelf.jsx';
import PreviewDrawer from './panels/PreviewDrawer.jsx';
import CreationWizard from './wizard/CreationWizard.jsx';

const ALLOWED_CREATOR_ROLES = new Set(['freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin']);

export default function CreationStudioManager() {
  const { session, isAuthenticated } = useSession();
  const ownerId = session?.id ?? null;
  const memberships = session?.memberships ?? [];
  const hasRoleAccess = useMemo(
    () => memberships.some((membership) => ALLOWED_CREATOR_ROLES.has(membership)),
    [memberships],
  );
  const canManage = Boolean(ownerId) && isAuthenticated && hasRoleAccess;

  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ status: null, type: null });
  const [loading, setLoading] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState('create');
  const [wizardType, setWizardType] = useState('gig');
  const [activeItem, setActiveItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(
    async (overrides = {}) => {
      if (!canManage) {
        setItems([]);
        return null;
      }
      setLoading(true);
      try {
        const response = await listCreationStudioItems({ ownerId, ...filters, ...overrides });
        setItems(response?.items ?? []);
        return response;
      } catch (error) {
        console.error('Failed to load creations', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [canManage, ownerId, filters],
  );

  useEffect(() => {
    if (!canManage) {
      setItems([]);
      return;
    }
    loadItems();
  }, [canManage, loadItems]);

  useEffect(() => {
    if (!canManage) {
      return undefined;
    }
    const handleExternalRefresh = (event) => {
      const { detail } = event ?? {};
      const nextFilters = {};
      if (detail?.type && typeof detail.type === 'string') {
        nextFilters.type = detail.type;
      }
      loadItems(nextFilters);
    };
    window.addEventListener('creation-studio:refresh', handleExternalRefresh);
    return () => window.removeEventListener('creation-studio:refresh', handleExternalRefresh);
  }, [canManage, loadItems]);

  const handleFiltersChange = useCallback(
    (patch) => {
      setFilters((previous) => ({
        ...previous,
        ...patch,
      }));
    },
    [setFilters],
  );

  const handleOpenCreate = useCallback(
    (typeId) => {
      if (!canManage) {
        return;
      }
      const nextType = typeId ?? wizardType ?? 'gig';
      setWizardType(nextType);
      setActiveItem(null);
      setWizardMode('create');
      setWizardOpen(true);
    },
    [wizardType, canManage],
  );

  const handleRefresh = useCallback(() => {
    if (!canManage) {
      return;
    }
    loadItems();
  }, [canManage, loadItems]);

  const handlePreview = useCallback(
    async (item) => {
      if (!canManage) {
        return;
      }
      try {
        const fullItem = await getCreationStudioItem(item.id);
        setPreviewItem(fullItem);
        setPreviewOpen(true);
      } catch (error) {
        console.error('Unable to preview item', error);
      }
    },
    [canManage],
  );

  const handleEditItem = useCallback(
    async (item) => {
      if (!canManage) {
        return;
      }
      try {
        setSaving(true);
        const fullItem = await getCreationStudioItem(item.id);
        setActiveItem(fullItem);
        setWizardType(fullItem.type);
        setWizardMode('edit');
        setWizardOpen(true);
      } catch (error) {
        console.error('Unable to open item', error);
      } finally {
        setSaving(false);
      }
    },
    [canManage],
  );

  const typeSummary = useMemo(() => CREATION_TYPES, []);
  const selectedTypeConfig = useMemo(() => getTypeConfig(wizardType), [wizardType]);

  const handleSaveDraft = useCallback(
    async (payload) => {
      setSaving(true);
      try {
        if (!canManage || !ownerId) {
          throw new Error('You must be signed in with creation studio access to save drafts.');
        }
        let result;
        if (wizardMode === 'edit' && activeItem?.id) {
          result = await updateCreationStudioItem(activeItem.id, { ...payload, ownerId: ownerId ?? payload.ownerId });
        } else {
          const prepared = { ...payload, ownerId: ownerId ?? payload.ownerId };
          result = await createCreationStudioItem(prepared);
        }
        await loadItems();
        return result;
      } catch (error) {
        console.error('Unable to save creation', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [wizardMode, activeItem?.id, ownerId, loadItems, canManage],
  );

  const handlePublish = useCallback(
    async (payload) => {
      setSaving(true);
      try {
        if (!canManage || !ownerId) {
          throw new Error('You must be signed in with creation studio access to publish content.');
        }
        let result;
        if (wizardMode === 'edit' && activeItem?.id) {
          await updateCreationStudioItem(activeItem.id, { ...payload, ownerId: ownerId ?? payload.ownerId });
          result = await publishCreationStudioItem(activeItem.id, { ownerId: ownerId ?? payload.ownerId });
        } else {
          const created = await createCreationStudioItem({ ...payload, ownerId: ownerId ?? payload.ownerId });
          result = await publishCreationStudioItem(created.id, { ownerId: ownerId ?? payload.ownerId });
        }
        await loadItems();
        return result;
      } catch (error) {
        console.error('Unable to publish creation', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [wizardMode, activeItem?.id, ownerId, loadItems, canManage],
  );

  if (!canManage) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-600 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Creation studio unavailable</h2>
        <p className="mt-2 text-slate-600">
          Sign in with an eligible creator account to manage the creation studio. Freelancer, agency, company, mentor,
          headhunter, or admin roles are required.
        </p>
      </div>
    );
  }

  return (
    <>
      <StudioLayout
        gallery={<TypeGallery types={typeSummary} activeTypeId={wizardType} onSelectType={handleOpenCreate} />}
        shelf={
          <ItemShelf
            items={items}
            loading={loading}
            filters={filters}
            onFilterChange={handleFiltersChange}
            onOpenItem={handleEditItem}
            onPreviewItem={handlePreview}
            onStartNew={() => handleOpenCreate(wizardType)}
            onRefresh={handleRefresh}
          />
        }
        footer={
          selectedTypeConfig ? (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 p-4 text-sm text-blue-700">
              {selectedTypeConfig.tagline}
            </div>
          ) : null
        }
      />

      <PreviewDrawer
        open={previewOpen}
        item={previewItem}
        onClose={() => setPreviewOpen(false)}
        onEdit={(item) => {
          setPreviewOpen(false);
          handleEditItem(item);
        }}
      />

      <CreationWizard
        open={wizardOpen}
        mode={wizardMode}
        typeId={wizardType}
        ownerId={ownerId}
        item={activeItem}
        loading={saving}
        onClose={() => {
          setWizardOpen(false);
          setActiveItem(null);
        }}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
      />
    </>
  );
}
