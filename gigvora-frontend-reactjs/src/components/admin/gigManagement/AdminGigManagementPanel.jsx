import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useProjectGigManagement from '../../../hooks/useProjectGigManagement.js';
import DataStatus from '../../DataStatus.jsx';
import WorkspaceShell from './WorkspaceShell.jsx';
import WorkspaceOverview from './WorkspaceOverview.jsx';
import ProjectsPanel from './ProjectsPanel.jsx';
import ProjectDrawer from './ProjectDrawer.jsx';
import ProjectWizard from './ProjectWizard.jsx';
import GigOrdersPanel from './GigOrdersPanel.jsx';
import GigOrderDrawer from './GigOrderDrawer.jsx';
import NewGigOrderModal from './NewGigOrderModal.jsx';
import AssetsPanel from './AssetsPanel.jsx';
import AssetModal from './AssetModal.jsx';
import TemplatesPanel from './TemplatesPanel.jsx';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'orders', label: 'Orders' },
  { id: 'assets', label: 'Assets' },
  { id: 'templates', label: 'Templates' },
];

function buildTemplatePreset(template) {
  if (!template) {
    return null;
  }
  return {
    name: template.name,
    serviceName: template.name,
    vendorName: '',
    amount: template.recommendedBudgetMin ?? '',
    currency: 'USD',
    requirements: Array.isArray(template.toolkit)
      ? template.toolkit.map((item) => ({ title: item, status: 'pending' }))
      : [],
  };
}

export default function AdminGigManagementPanel({ userId }) {
  const { data, loading, error, actions, reload } = useProjectGigManagement(userId);
  const [section, setSection] = useState('overview');
  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false);
  const [projectWizardOpen, setProjectWizardOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderPreset, setOrderPreset] = useState(null);
  const [assetModalOpen, setAssetModalOpen] = useState(false);

  const canManage = data?.access?.canManage !== false;
  const projects = useMemo(() => data?.projects ?? [], [data]);
  const board = data?.board ?? { lanes: [], metrics: {} };
  const orders = data?.purchasedGigs?.orders ?? [];
  const orderStats = data?.purchasedGigs?.stats ?? { totalOrders: 0, active: 0, completed: 0 };
  const reminders = data?.purchasedGigs?.reminders ?? [];
  const assets = data?.assets ?? { items: [], summary: {}, brandAssets: [] };
  const templates = data?.templates ?? [];

  const handleProjectSelect = (project) => {
    setActiveProject(project);
    setProjectDrawerOpen(true);
  };

  const handleOrderSelect = (order) => {
    setActiveOrder(order);
    setOrderDrawerOpen(true);
  };

  const handleTemplateUse = (template) => {
    setOrderPreset(buildTemplatePreset(template));
    setOrderModalOpen(true);
  };

  const managementFooter = (
    <DataStatus
      loading={loading}
      error={error}
      lastUpdated={data?.summaryUpdatedAt}
      onRefresh={reload}
      statusLabel={canManage ? 'Admin control' : 'Read only'}
      fromCache={data?.fromCache}
    />
  );

  return (
    <>
      <WorkspaceShell
        sections={SECTIONS}
        activeSection={section}
        onSectionChange={setSection}
        footer={managementFooter}
      >
        {section === 'overview' ? (
          <WorkspaceOverview
            summary={data?.summary ?? { totalProjects: 0, activeProjects: 0, budgetInPlay: 0, gigsInDelivery: 0, assetsSecured: 0 }}
            boardMetrics={board.metrics ?? {}}
            vendorStats={orderStats}
            reminders={reminders}
            storytelling={data?.storytelling}
          />
        ) : null}

        {section === 'projects' ? (
          <ProjectsPanel
            projects={projects}
            board={board}
            canManage={canManage}
            onCreate={() => setProjectWizardOpen(true)}
            onSelect={handleProjectSelect}
          />
        ) : null}

        {section === 'orders' ? (
          <GigOrdersPanel
            orders={orders}
            reminders={reminders}
            stats={orderStats}
            canManage={canManage}
            onCreate={() => {
              setOrderPreset(null);
              setOrderModalOpen(true);
            }}
            onSelect={handleOrderSelect}
          />
        ) : null}

        {section === 'assets' ? (
          <AssetsPanel
            assets={assets}
            projects={projects}
            canManage={canManage}
            onAdd={() => setAssetModalOpen(true)}
          />
        ) : null}

        {section === 'templates' ? (
          <TemplatesPanel templates={templates} onUse={handleTemplateUse} />
        ) : null}
      </WorkspaceShell>

      <ProjectDrawer
        open={projectDrawerOpen}
        project={activeProject}
        canManage={canManage}
        onClose={() => {
          setProjectDrawerOpen(false);
          setActiveProject(null);
        }}
        onSubmit={(projectId, payload) => actions.updateWorkspace(projectId, payload)}
      />

      <ProjectWizard
        open={projectWizardOpen}
        onClose={() => setProjectWizardOpen(false)}
        onSubmit={(payload) => actions.createProject(payload)}
      />

      <GigOrderDrawer
        open={orderDrawerOpen}
        order={activeOrder}
        canManage={canManage}
        onClose={() => {
          setOrderDrawerOpen(false);
          setActiveOrder(null);
        }}
        onSubmit={(orderId, payload) => actions.updateGigOrder(orderId, payload)}
      />

      <NewGigOrderModal
        open={orderModalOpen}
        onClose={() => {
          setOrderModalOpen(false);
          setOrderPreset(null);
        }}
        onSubmit={(payload) => actions.createGigOrder(payload)}
        preset={orderPreset}
      />

      <AssetModal
        open={assetModalOpen}
        projects={projects}
        onClose={() => setAssetModalOpen(false)}
        onSubmit={(projectId, payload) => actions.addAsset(projectId, payload)}
      />
    </>
  );
}

AdminGigManagementPanel.propTypes = {
  userId: PropTypes.number.isRequired,
};
