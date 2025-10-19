import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCreationStudioItems,
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

export default function CreationStudioManager() {
  const { session } = useSession();
  const ownerId = session?.id ?? 1;

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
      setLoading(true);
      try {
        const response = await fetchCreationStudioItems({ ownerId, ...filters, ...overrides });
        setItems(response?.items ?? []);
      } catch (error) {
        console.error('Failed to load creations', error);
      } finally {
        setLoading(false);
      }
    },
    [ownerId, filters],
  );

  useEffect(() => {
    loadItems();
  }, [loadItems]);

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
      const nextType = typeId ?? wizardType ?? 'gig';
      setWizardType(nextType);
      setActiveItem(null);
      setWizardMode('create');
      setWizardOpen(true);
    },
    [wizardType],
  );

  const handleRefresh = useCallback(() => {
    loadItems();
  }, [loadItems]);

  const handlePreview = useCallback(async (item) => {
    try {
      const fullItem = await getCreationStudioItem(item.id);
      setPreviewItem(fullItem);
      setPreviewOpen(true);
    } catch (error) {
      console.error('Unable to preview item', error);
    }
  }, []);

  const handleEditItem = useCallback(async (item) => {
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
  }, []);

  const typeSummary = useMemo(() => CREATION_TYPES, []);
  const selectedTypeConfig = useMemo(() => getTypeConfig(wizardType), [wizardType]);

  const handleSaveDraft = useCallback(
    async (payload) => {
      setSaving(true);
      try {
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
    [wizardMode, activeItem?.id, ownerId, loadItems],
  );

  const handlePublish = useCallback(
    async (payload) => {
      setSaving(true);
      try {
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
    [wizardMode, activeItem?.id, ownerId, loadItems],
  );

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
