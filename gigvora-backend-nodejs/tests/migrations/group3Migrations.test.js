import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Sequelize, DataTypes } from 'sequelize';

let sequelize;
let queryInterface;
let migrations;

const migrationSpecs = [
  {
    key: 'headhunterPartnershipsInsights',
    path: '../../database/migrations/20240915093000-headhunter-partnerships-insights.cjs',
    expectedTables: [
      'client_engagements',
      'client_engagement_mandates',
      'issue_resolution_cases',
    ],
  },
  {
    key: 'supportDeskEnhancements',
    path: '../../database/migrations/20240915093000-support-desk-enhancements.cjs',
    expectedTables: [
      'support_playbooks',
      'support_case_links',
      'support_case_satisfactions',
    ],
  },
  {
    key: 'volunteeringManagement',
    path: '../../database/migrations/20240915093050-volunteering-management.cjs',
    expectedTables: ['volunteer_applications', 'volunteer_contracts'],
  },
  {
    key: 'agencyCollaborationSuite',
    path: '../../database/migrations/20240915094500-agency-collaboration-suite.cjs',
    expectedTables: ['agency_collaborations', 'agency_rate_cards', 'agency_retainer_negotiations'],
  },
  {
    key: 'blogOperations',
    path: '../../database/migrations/20240915094500-blog-operations.cjs',
    expectedTables: ['blog_post_metrics', 'blog_post_comments'],
  },
  {
    key: 'communityManagement',
    path: '../../database/migrations/20240915094500-community-management.cjs',
    expectedTables: ['group_invites', 'group_posts', 'page_memberships'],
  },
  {
    key: 'deliverableVault',
    path: '../../database/migrations/20240915094500-deliverable-vault.cjs',
    expectedTables: ['deliverable_vaults', 'deliverable_vault_items', 'deliverable_versions'],
  },
  {
    key: 'interviewExperienceSuite',
    path: '../../database/migrations/20240915094500-interview-experience-suite.cjs',
    expectedTables: ['interview_panel_templates', 'interviewer_availabilities', 'candidate_prep_portals'],
  },
  {
    key: 'profileEngagementMetrics',
    path: '../../database/migrations/20240915094500-profile-engagement-metrics.cjs',
    expectedTables: ['profile_appreciations', 'profile_followers', 'profile_engagement_jobs'],
  },
  {
    key: 'projectBlueprint',
    path: '../../database/migrations/20240915094500-project-blueprint.cjs',
    expectedTables: ['project_blueprints', 'project_blueprint_sprints', 'project_blueprint_risks'],
  },
  {
    key: 'agencyAiAutomation',
    path: '../../database/migrations/20240915095000-agency-ai-automation.cjs',
    expectedTables: ['agency_ai_configurations', 'agency_auto_bid_templates'],
  },
  {
    key: 'siteManagement',
    path: '../../database/migrations/20240915095000-site-management.cjs',
    expectedTables: ['site_settings', 'site_pages', 'site_navigation_links'],
  },
  {
    key: 'projectWorkspaceDashboard',
    path: '../../database/migrations/20240915100000-project-workspace-dashboard.cjs',
    expectedTables: ['project_workspace_dashboards', 'project_workspace_health_snapshots', 'project_workspace_activity_logs'],
  },
  {
    key: 'userDashboardOverview',
    path: '../../database/migrations/20240915100000-user-dashboard-overview.cjs',
    expectedTables: ['user_dashboard_overviews'],
  },
  {
    key: 'careerPipelineAutomation',
    path: '../../database/migrations/20240915103000-career-pipeline-automation.cjs',
    expectedTables: ['career_pipeline_boards', 'career_pipeline_stages', 'career_opportunities'],
  },
  {
    key: 'financeControlTower',
    path: '../../database/migrations/20240915103000-finance-control-tower.cjs',
    expectedTables: ['finance_control_tower_configs', 'finance_control_tower_snapshots', 'finance_payout_batches'],
  },
  {
    key: 'platformSettings',
    path: '../../database/migrations/20240915103000-platform-settings.cjs',
    expectedTables: ['platform_settings'],
  },
  {
    key: 'workspaceTemplateTables',
    path: '../../database/migrations/20240915103000-workspace-template-tables.cjs',
    expectedTables: ['workspace_template_categories', 'workspace_templates', 'workspace_template_resources'],
  },
  {
    key: 'clientSuccessAutomation',
    path: '../../database/migrations/20240915110000-client-success-automation.cjs',
    expectedTables: ['client_success_playbooks', 'client_success_enrollments', 'client_success_review_nudges'],
  },
  {
    key: 'eventManagementSettings',
    path: '../../database/migrations/20240915110000-event-management-settings.cjs',
    expectedTables: ['user_event_workspace_settings'],
  },
];

function normalizeTableNames(tables) {
  return tables.map((table) => {
    if (typeof table === 'string') {
      return table;
    }
    if (table && typeof table === 'object') {
      return table.tableName || table.name || table.tbl_name || table.tblName;
    }
    return table;
  });
}

async function createBaseTables() {
  const baseTables = [
    'users',
    'provider_workspaces',
    'support_cases',
    'escrow_transactions',
    'volunteering_roles',
    'blog_posts',
    'groups',
    'profiles',
    'projects',
    'project_workspaces',
    'gigs',
    'interview_schedules',
  ];

  for (const tableName of baseTables) {
    await queryInterface.createTable(tableName, {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
    });
  }
}

async function resetSchema() {
  await queryInterface.dropAllTables();
  await createBaseTables();
}

async function expectTablesToExist(expectedTables) {
  if (!expectedTables?.length) {
    return;
  }
  const tables = normalizeTableNames(await queryInterface.showAllTables());
  for (const table of expectedTables) {
    expect(tables).toContain(table);
  }
}

async function expectTablesToBeAbsent(expectedTables) {
  if (!expectedTables?.length) {
    return;
  }
  const tables = normalizeTableNames(await queryInterface.showAllTables());
  for (const table of expectedTables) {
    expect(tables).not.toContain(table);
  }
}

describe('Group 3 database migrations', () => {
  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    queryInterface = sequelize.getQueryInterface();
    migrations = await Promise.all(
      migrationSpecs.map(async (spec) => {
        const module = await import(spec.path);
        return {
          ...spec,
          migration: module.default ?? module,
        };
      }),
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await resetSchema();
  });

  it('applies and rolls back each migration in isolation', async () => {
    for (const spec of migrations) {
      await expect(spec.migration.up(queryInterface, Sequelize)).resolves.not.toThrow();
      await expectTablesToExist(spec.expectedTables);
      await expect(spec.migration.down(queryInterface, Sequelize)).resolves.not.toThrow();
      await expectTablesToBeAbsent(spec.expectedTables);
      await resetSchema();
    }
  });

  it('runs the full group sequence and reverses it cleanly', async () => {
    await resetSchema();

    for (const spec of migrations) {
      await expect(spec.migration.up(queryInterface, Sequelize)).resolves.not.toThrow();
    }

    const tablesAfterAllUp = normalizeTableNames(await queryInterface.showAllTables());
    for (const spec of migrations) {
      for (const table of spec.expectedTables) {
        expect(tablesAfterAllUp).toContain(table);
      }
    }

    for (const spec of [...migrations].reverse()) {
      await expect(spec.migration.down(queryInterface, Sequelize)).resolves.not.toThrow();
    }

    await expectTablesToBeAbsent(migrationSpecs.flatMap((spec) => spec.expectedTables));
  });
});
