import DashboardWorkspaceModules from '../../../../components/dashboard/shared/DashboardWorkspaceModules.jsx';
import {
  AgencyManagementSection,
  AgencyHrManagementSection,
  AgencyCrmLeadPipelineSection,
  AgencyPaymentsManagementSection,
  AgencyJobApplicationsSection,
  AgencyHubSection,
  AgencyCreationStudioWizardSection,
  ExecutiveSignalsSection,
  PipelineHealthSection,
  GigOperationsSection,
  EscrowManagementSection,
  FinanceManagementSection,
  OverviewSection,
} from './index.js';

export function buildAgencyDashboardSections(config) {
  return [
    {
      key: 'overview',
      Component: OverviewSection,
      props: config.overview,
    },
    {
      key: 'executive-signals',
      Component: ExecutiveSignalsSection,
      props: config.executive,
    },
    {
      key: 'pipeline-health',
      Component: PipelineHealthSection,
      props: config.pipeline,
    },
    {
      key: 'agency-management',
      Component: AgencyManagementSection,
      props: config.management,
    },
    {
      key: 'agency-hr',
      Component: AgencyHrManagementSection,
      props: config.hr,
    },
    {
      key: 'agency-crm',
      Component: AgencyCrmLeadPipelineSection,
      props: config.crm,
    },
    {
      key: 'agency-payments',
      Component: AgencyPaymentsManagementSection,
      props: config.payments,
    },
    {
      key: 'agency-job-applications',
      Component: AgencyJobApplicationsSection,
      props: config.jobs,
    },
    {
      key: 'agency-gig-operations',
      Component: GigOperationsSection,
      props: config.gigOperations,
    },
    {
      key: 'agency-escrow',
      Component: EscrowManagementSection,
      props: config.escrow,
    },
    {
      key: 'agency-finance',
      Component: FinanceManagementSection,
      props: config.finance,
    },
    {
      key: 'agency-workspace-modules',
      Component: DashboardWorkspaceModules,
      props: config.workspaceModules,
    },
    {
      key: 'agency-hub',
      Component: AgencyHubSection,
      props: config.hub,
    },
    {
      key: 'agency-creation-studio',
      Component: AgencyCreationStudioWizardSection,
      props: config.creationStudio,
    },
  ].filter((entry) => entry && entry.Component);
}

export default buildAgencyDashboardSections;
