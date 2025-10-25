'use strict';

const { QueryTypes } = require('sequelize');

const OWNER_EMAIL = 'mia@gigvora.com';
const PROJECT_TITLE = 'Enterprise marketing revamp demo';
const ORDER_NUMBER = 'ORD-DEMO-ENTERPRISE-MKT';
const CLIENT_SLUG = 'aurora-analytics-demo';
const KANBAN_COLUMN_SLUG = 'activation-demo';
const SEED_ORIGIN = 'seed:pgm-demo';

const withOrigin = (value = {}) => JSON.stringify({ ...value, origin: SEED_ORIGIN });

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [owner] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { email: OWNER_EMAIL } },
      );

      if (!owner) {
        await transaction.commit();
        return;
      }

      const ownerId = owner.id;
      await queryInterface.bulkInsert(
        'pgm_projects',
        [
          {
            owner_id: ownerId,
            title: PROJECT_TITLE,
            description: 'Demo project aligning campaign analytics, creative refresh, and funnel automation across teams.',
            category: 'Marketing operations',
            skills: JSON.stringify(['analytics', 'marketing-automation', 'project-management']),
            duration_weeks: 12,
            status: 'in_progress',
            lifecycle_state: 'open',
            start_date: new Date('2024-06-03T10:00:00Z'),
            due_date: new Date('2024-08-30T18:00:00Z'),
            budget_currency: 'USD',
            budget_allocated: 85000,
            budget_spent: 23500,
            auto_match_enabled: true,
            auto_match_accept_enabled: false,
            auto_match_reject_enabled: false,
            auto_match_budget_min: 5000,
            auto_match_budget_max: 15000,
            auto_match_weekly_hours_min: 10,
            auto_match_weekly_hours_max: 35,
            auto_match_duration_weeks_min: 4,
            auto_match_duration_weeks_max: 12,
            auto_match_skills: JSON.stringify(['seo', 'journey-analytics', 'b2b-content']),
            auto_match_notes: 'Focus on experiment velocity and coordinated campaign QA.',
            auto_match_updated_by: ownerId,
            metadata: withOrigin({ tag: 'project-gig-demo' }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      const [project] = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_projects WHERE owner_id = :ownerId AND title = :title ORDER BY id DESC LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { ownerId, title: PROJECT_TITLE } },
      );

      if (!project) {
        await transaction.commit();
        return;
      }

      await queryInterface.bulkInsert(
        'pgm_project_workspaces',
        [
          {
            project_id: project.id,
            status: 'in_progress',
            progress_percent: 42.5,
            risk_level: 'medium',
            next_milestone: 'Campaign creative QA sprint',
            next_milestone_due_at: new Date('2024-07-08T15:00:00Z'),
            notes: 'Leadership sign-off required before media launch.',
            metrics: JSON.stringify({ activeTracks: 3, approvalsPending: 2 }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      const [workspace] = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_project_workspaces WHERE project_id = :projectId LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { projectId: project.id } },
      );

      if (!workspace) {
        await transaction.commit();
        return;
      }

      await queryInterface.bulkInsert(
        'pgm_project_milestones',
        [
          {
            project_id: project.id,
            title: 'Analytics blueprint sign-off',
            description: 'Approve revised attribution modelling and dashboards.',
            ordinal: 1,
            due_date: new Date('2024-06-21T17:00:00Z'),
            status: 'in_progress',
            budget: 12000,
            metrics: JSON.stringify({ owner: 'Analytics lead', deliverables: 5 }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_collaborators',
        [
          {
            project_id: project.id,
            full_name: 'Lena Torres',
            email: 'lena@gigvora.com',
            role: 'Program Manager',
            status: 'active',
            hourly_rate: 145,
            permissions: JSON.stringify({ canManageEscrow: true, canInvite: true }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_gig_orders',
        [
          {
            owner_id: ownerId,
            order_number: ORDER_NUMBER,
            vendor_name: 'Studio Northlight',
            service_name: 'Creative refresh & landing page optimization',
            status: 'in_delivery',
            progress_percent: 55.2,
            amount: 32000,
            currency: 'USD',
            kickoff_at: new Date('2024-06-10T14:00:00Z'),
            due_at: new Date('2024-08-02T18:00:00Z'),
            metadata: withOrigin({ workspaceId: workspace.id, stream: 'creative' }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      const [order] = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_gig_orders WHERE owner_id = :ownerId AND order_number = :number LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { ownerId, number: ORDER_NUMBER } },
      );

      if (!order) {
        await transaction.commit();
        return;
      }

      await queryInterface.bulkInsert(
        'pgm_gig_order_requirements',
        [
          {
            order_id: order.id,
            title: 'Provide revised brand guidelines',
            status: 'received',
            due_at: new Date('2024-06-14T12:00:00Z'),
            notes: 'Include mobile typography rules.',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            order_id: order.id,
            title: 'Submit analytics QA checklist',
            status: 'pending',
            due_at: new Date('2024-07-01T12:00:00Z'),
            notes: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      const timelineType = 'checkpoint';
      await queryInterface.bulkInsert(
        'pgm_gig_timeline_events',
        [
          {
            order_id: order.id,
            event_type: timelineType,
            title: 'Creative mid-point review',
            summary: 'Validate hero concepts and CTA matrix before motion deliverables.',
            status: 'scheduled',
            scheduled_at: new Date('2024-07-05T16:30:00Z'),
            completed_at: null,
            created_by_id: ownerId,
            visibility: 'client',
            metadata: withOrigin({ agenda: ['Hero creative', 'Messaging variants'], durationMinutes: 45 }),
            occurred_at: new Date('2024-07-05T16:30:00Z'),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_gig_submissions',
        [
          {
            order_id: order.id,
            title: 'Landing page v1',
            description: 'First pass creative with motion notes.',
            status: 'under_review',
            asset_url: 'https://assets.gigvora.test/demo/landing-v1.pdf',
            asset_type: 'pdf',
            attachments: JSON.stringify([{ label: 'Prototype', url: 'https://figma.test/file/landing-demo' }]),
            submitted_at: new Date('2024-06-28T20:15:00Z'),
            approved_at: null,
            submitted_by_id: ownerId,
            reviewed_by_id: null,
            submitted_by: 'Studio Northlight',
            submitted_by_email: 'projects@northlight.example',
            notes: 'Includes hero animation guidelines.',
            reviewNotes: null,
            metadata: withOrigin({ version: 1 }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_gig_chat_messages',
        [
          {
            order_id: order.id,
            sender_id: ownerId,
            sender_role: 'operations_lead',
            author_name: 'Mia Operations',
            body: 'Please confirm analytics QA assets before Tuesday.',
            attachments: JSON.stringify([]),
            visibility: 'client',
            sent_at: new Date('2024-06-25T18:45:00Z'),
            acknowledged_at: null,
            acknowledged_by_id: null,
            metadata: withOrigin({ source: 'seed' }),
            pinned: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_gig_order_messages',
        [
          {
            order_id: order.id,
            author_id: ownerId,
            author_name: 'Mia Operations',
            role_label: 'Program Manager',
            body: 'Escalation-ready timeline shared with leadership.',
            attachments: JSON.stringify([]),
            visibility: 'private',
            posted_at: new Date('2024-06-26T14:10:00Z'),
            metadata: withOrigin({ category: 'status-update' }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_gig_order_activities',
        [
          {
            order_id: order.id,
            freelancer_id: null,
            actor_id: ownerId,
            activity_type: 'communication',
            title: 'Shared mid-point review agenda',
            description: 'Agenda posted in workspace chat for client preview.',
            occurred_at: new Date('2024-06-27T09:25:00Z'),
            metadata: withOrigin({ relatedMessage: true }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_gig_order_escrows',
        [
          {
            order_id: order.id,
            label: 'Kickoff funding',
            amount: 12000,
            currency: 'USD',
            status: 'funded',
            approval_requirement: 'Program manager approval',
            csat_threshold: 4.2,
            released_at: null,
            released_by_id: null,
            payout_reference: null,
            notes: 'Release when analytics QA passes review.',
            metadata: withOrigin({ milestone: 'analytics-blueprint' }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_bids',
        [
          {
            owner_id: ownerId,
            project_id: project.id,
            title: 'Northlight proposal',
            vendor_name: 'Studio Northlight',
            vendor_email: 'hello@northlight.example',
            amount: 32000,
            currency: 'USD',
            status: 'awarded',
            submitted_at: new Date('2024-05-30T12:00:00Z'),
            valid_until: new Date('2024-06-10T12:00:00Z'),
            notes: 'Awarded after creative concept round.',
            metadata: withOrigin({ proposalVersion: 'v2' }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_invitations',
        [
          {
            owner_id: ownerId,
            project_id: project.id,
            freelancer_name: 'Jordan Malik',
            freelancer_email: 'jordan@gigvora.com',
            role: 'Analytics strategist',
            message: 'Assist with multi-touch attribution updates and dashboard QA.',
            status: 'accepted',
            invite_sent_at: new Date('2024-05-28T09:00:00Z'),
            responded_at: new Date('2024-05-29T14:00:00Z'),
            metadata: withOrigin({ source: 'seed' }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_auto_match_settings',
        [
          {
            owner_id: ownerId,
            enabled: true,
            matching_window_days: 21,
            budget_min: 4000,
            budget_max: 16000,
            target_roles: JSON.stringify(['Creative studio', 'Marketing analytics']),
            focus_skills: JSON.stringify(['motion design', 'kpi instrumentation']),
            geo_preferences: JSON.stringify(['Americas', 'Europe']),
            seniority: 'Senior',
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_auto_match_candidates',
        [
          {
            owner_id: ownerId,
            project_id: project.id,
            freelancer_name: 'Atlas Creative Guild',
            freelancer_email: 'team@atlasguild.example',
            match_score: 87.4,
            status: 'engaged',
            matched_at: new Date('2024-06-05T11:00:00Z'),
            channel: 'auto_match',
            notes: 'Strong portfolio in product storytelling.',
            metadata: withOrigin({ shortlisted: true }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_reviews',
        [
          {
            owner_id: ownerId,
            order_id: order.id,
            project_id: project.id,
            subject_type: 'vendor',
            subject_name: 'Studio Northlight',
            rating_overall: 4.6,
            rating_quality: 4.8,
            rating_communication: 4.4,
            rating_professionalism: 4.7,
            would_recommend: true,
            comments: 'High quality concepting with proactive communication.',
            submitted_at: new Date('2024-08-05T10:00:00Z'),
            metadata: withOrigin({ source: 'seed' }),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_escrow_accounts',
        [
          {
            owner_id: ownerId,
            currency: 'USD',
            balance: 52000,
            auto_release_days: 7,
            last_audit_at: new Date('2024-06-15T12:00:00Z'),
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      const [account] = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_escrow_accounts WHERE owner_id = :ownerId LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { ownerId } },
      );

      if (account) {
        await queryInterface.bulkInsert(
          'pgm_escrow_transactions',
          [
            {
              account_id: account.id,
              reference: 'ESC-DEMO-01',
              type: 'deposit',
              status: 'completed',
              amount: 25000,
              currency: 'USD',
              occurred_at: new Date('2024-06-09T10:00:00Z'),
              description: 'Initial project funding deposit.',
              metadata: withOrigin({ projectId: project.id }),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          { transaction },
        );
      }

      await queryInterface.bulkInsert(
        'pgm_client_accounts',
        [
          {
            owner_id: ownerId,
            workspace_id: workspace.id,
            name: 'Aurora Analytics Co.',
            slug: CLIENT_SLUG,
            website_url: 'https://aurora-analytics.example',
            logo_url: null,
            industry: 'SaaS',
            tier: 'strategic',
            status: 'active',
            health_status: 'monitor',
            annual_contract_value: 240000,
            timezone: 'America/New_York',
            primary_contact_name: 'Dana Rivers',
            primary_contact_email: 'dana@aurora-analytics.example',
            primary_contact_phone: '+1-555-0199',
            account_manager_name: 'Mia Operations',
            account_manager_email: 'mia@gigvora.com',
            last_interaction_at: new Date('2024-06-24T18:00:00Z'),
            next_review_at: new Date('2024-07-15T16:00:00Z'),
            tags: JSON.stringify(['enterprise', 'marketing']),
            notes: 'High growth account monitoring creative refresh outcomes.',
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      const [clientAccount] = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_client_accounts WHERE owner_id = :ownerId AND slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { ownerId, slug: CLIENT_SLUG } },
      );

      if (clientAccount) {
        await queryInterface.bulkInsert(
          'pgm_client_kanban_columns',
          [
            {
              owner_id: ownerId,
              workspace_id: workspace.id,
              name: 'Activation',
              slug: KANBAN_COLUMN_SLUG,
              wip_limit: 4,
              sort_order: 1,
              color: '#4f46e5',
              metadata: withOrigin(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          { transaction },
        );

        const [column] = await queryInterface.sequelize.query(
          'SELECT id FROM pgm_client_kanban_columns WHERE owner_id = :ownerId AND slug = :slug LIMIT 1',
          { type: QueryTypes.SELECT, transaction, replacements: { ownerId, slug: KANBAN_COLUMN_SLUG } },
        );

        if (column) {
          await queryInterface.bulkInsert(
            'pgm_client_kanban_cards',
            [
              {
                owner_id: ownerId,
                client_id: clientAccount.id,
                column_id: column.id,
                title: 'Lifecycle experiment rollout',
                summary: 'Deploy refreshed nurture journey and QA reporting sync.',
                priority: 'high',
                risk_level: 'medium',
                value: 88000,
                renewal_date: new Date('2024-09-15T00:00:00Z'),
                metadata: withOrigin({ workspaceId: workspace.id }),
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
            { transaction },
          );

          const [card] = await queryInterface.sequelize.query(
            'SELECT id FROM pgm_client_kanban_cards WHERE column_id = :columnId LIMIT 1',
            { type: QueryTypes.SELECT, transaction, replacements: { columnId: column.id } },
          );

          if (card) {
            await queryInterface.bulkInsert(
              'pgm_client_kanban_checklist_items',
              [
                {
                  card_id: card.id,
                  label: 'Enable campaign reporting in Looker',
                  completed: true,
                  completed_at: new Date('2024-06-22T13:00:00Z'),
                  metadata: withOrigin({ assignee: 'Analytics team' }),
                  created_at: new Date(),
                  updated_at: new Date(),
                },
                {
                  card_id: card.id,
                  label: 'QA lifecycle email sequencing',
                  completed: false,
                  completed_at: null,
                  metadata: withOrigin({ assignee: 'CRM squad' }),
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              ],
              { transaction },
            );
          }
        }
      }

      await queryInterface.bulkInsert(
        'pgm_project_workspace_budget_lines',
        [
          {
            workspace_id: workspace.id,
            category: 'Creative services',
            label: 'Motion graphics sprint',
            description: 'Allocated spend for motion systems and QA.',
            planned_amount: 15000,
            actual_amount: 5200,
            currency: 'USD',
            status: 'in_progress',
            owner_name: 'Mia Operations',
            notes: null,
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_tasks',
        [
          {
            workspace_id: workspace.id,
            title: 'Consolidate creative feedback',
            description: 'Aggregate stakeholder notes before next creative iteration.',
            status: 'in_progress',
            priority: 'high',
            lane: 'Creative',
            assignee_name: 'Lena Torres',
            assignee_email: 'lena@gigvora.com',
            start_date: new Date('2024-06-20T09:00:00Z'),
            due_date: new Date('2024-06-27T22:00:00Z'),
            estimated_hours: 18,
            logged_hours: 9,
            progress_percent: 60,
            dependencies: JSON.stringify(['Gather analytics QA notes']),
            tags: JSON.stringify(['creative', 'review']),
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_meetings',
        [
          {
            workspace_id: workspace.id,
            title: 'Weekly marketing ops sync',
            agenda: 'Status across creative, analytics, and paid teams.',
            status: 'scheduled',
            scheduled_at: new Date('2024-06-28T16:00:00Z'),
            duration_minutes: 45,
            location: 'Zoom',
            meeting_link: 'https://meet.gigvora.test/demo-sync',
            organizer_name: 'Mia Operations',
            notes: null,
            follow_up_items: JSON.stringify([]),
            recurrence_rule: 'FREQ=WEEKLY;BYDAY=FR',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_calendar_events',
        [
          {
            workspace_id: workspace.id,
            title: 'Creative QA window',
            event_type: 'milestone',
            start_at: new Date('2024-07-02T13:00:00Z'),
            end_at: new Date('2024-07-02T17:00:00Z'),
            visibility: 'team',
            location: 'Hybrid',
            description: 'Review creative outputs with analytics inputs.',
            attendees: JSON.stringify(['Mia', 'Lena', 'Jordan']),
            reminder_minutes_before: 60,
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_role_assignments',
        [
          {
            workspace_id: workspace.id,
            role_name: 'Lifecycle analytics',
            description: 'Coordinate attribution updates and QA.',
            member_name: 'Jordan Malik',
            member_email: 'jordan@gigvora.com',
            status: 'active',
            allocation_percent: 40,
            permissions: JSON.stringify({ canEditReports: true }),
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_submissions',
        [
          {
            workspace_id: workspace.id,
            title: 'Lifecycle nurture sequence',
            submission_type: 'deliverable',
            status: 'in_review',
            due_at: new Date('2024-07-03T20:00:00Z'),
            submitted_at: new Date('2024-06-26T18:30:00Z'),
            submitted_by_name: 'CRM Squad',
            submitted_by_email: 'crm@gigvora.com',
            asset_url: 'https://docs.gigvora.test/nurture-sequence',
            notes: 'Awaiting compliance QA sign-off.',
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_invites',
        [
          {
            workspace_id: workspace.id,
            email: 'agency.partner@example.com',
            role: 'Creative Director',
            status: 'accepted',
            invited_by_name: 'Mia Operations',
            invited_by_email: 'mia@gigvora.com',
            message: 'Jump in for motion QA and storytelling alignment.',
            invited_at: new Date('2024-06-12T11:00:00Z'),
            responded_at: new Date('2024-06-13T10:00:00Z'),
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_hr_records',
        [
          {
            workspace_id: workspace.id,
            member_name: 'Ava Founder',
            role_title: 'Executive Sponsor',
            employment_type: 'contract',
            status: 'active',
            start_date: new Date('2024-06-01T08:00:00Z'),
            end_date: null,
            hourly_rate: 0,
            weekly_capacity_hours: 5,
            allocation_percent: 10,
            notes: 'Oversees executive comms.',
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_time_entries',
        [
          {
            workspace_id: workspace.id,
            member_name: 'Lena Torres',
            entry_date: new Date('2024-06-24T00:00:00Z'),
            hours: 6.5,
            billable: true,
            status: 'submitted',
            notes: 'Creative sync prep and stakeholder review.',
            approved_by_name: null,
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_objects',
        [
          {
            workspace_id: workspace.id,
            object_type: 'deliverable',
            label: 'Analytics QA checklist',
            description: 'Checklist to validate creative data capture.',
            owner_name: 'Jordan Malik',
            quantity: 1,
            unit: null,
            status: 'in_progress',
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_documents',
        [
          {
            workspace_id: workspace.id,
            name: 'Creative QA Runbook',
            category: 'playbook',
            storage_url: 'https://docs.gigvora.test/creative-qa-runbook',
            thumbnail_url: null,
            size_bytes: 245760,
            visibility: 'team',
            owner_name: 'Lena Torres',
            version: '1.0',
            notes: 'Shared with vendor for alignment.',
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'pgm_project_workspace_chat_messages',
        [
          {
            workspace_id: workspace.id,
            channel: 'creative',
            author_name: 'Jordan Malik',
            author_role: 'Analytics strategist',
            body: 'Reminder: QA scripts updated for new hero video.',
            posted_at: new Date('2024-06-24T15:00:00Z'),
            pinned: true,
            metadata: withOrigin(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [owner] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { email: OWNER_EMAIL } },
      );

      if (!owner) {
        await transaction.commit();
        return;
      }

      const ownerId = owner.id;

      const [project] = await queryInterface.sequelize.query(
        `SELECT id FROM pgm_projects WHERE owner_id = :ownerId AND title = :title AND metadata->>'origin' = :origin ORDER BY id DESC LIMIT 1`,
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { ownerId, title: PROJECT_TITLE, origin: SEED_ORIGIN },
        },
      );

      const projectId = project ? project.id : null;

      let workspaceId = null;
      if (projectId) {
        const [workspace] = await queryInterface.sequelize.query(
          'SELECT id FROM pgm_project_workspaces WHERE project_id = :projectId ORDER BY id DESC LIMIT 1',
          { type: QueryTypes.SELECT, transaction, replacements: { projectId } },
        );
        workspaceId = workspace ? workspace.id : null;
      }

      const [order] = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_gig_orders WHERE owner_id = :ownerId AND order_number = :orderNumber LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { ownerId, orderNumber: ORDER_NUMBER } },
      );

      const orderId = order ? order.id : null;

      if (orderId) {
        await queryInterface.bulkDelete('pgm_gig_order_requirements', { order_id: orderId }, { transaction });
        await queryInterface.bulkDelete(
          'pgm_gig_timeline_events',
          { order_id: orderId, title: 'Creative mid-point review' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_gig_submissions',
          { order_id: orderId, title: 'Landing page v1' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_gig_chat_messages',
          { order_id: orderId, body: 'Please confirm analytics QA assets before Tuesday.' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_gig_order_messages',
          { order_id: orderId, body: 'Escalation-ready timeline shared with leadership.' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_gig_order_activities',
          { order_id: orderId, title: 'Shared mid-point review agenda' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_gig_order_escrows',
          { order_id: orderId, label: 'Kickoff funding' },
          { transaction },
        );
        await queryInterface.bulkDelete('pgm_gig_orders', { id: orderId }, { transaction });
      }

      if (projectId) {
        await queryInterface.bulkDelete(
          'pgm_project_reviews',
          { project_id: projectId, owner_id: ownerId, subject_name: 'Studio Northlight' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_invitations',
          { project_id: projectId, freelancer_email: 'jordan@gigvora.com' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_bids',
          { project_id: projectId, vendor_email: 'hello@northlight.example' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_collaborators',
          { project_id: projectId, email: 'lena@gigvora.com' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_milestones',
          { project_id: projectId, title: 'Analytics blueprint sign-off' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_auto_match_candidates',
          { project_id: projectId, owner_id: ownerId, freelancer_email: 'team@atlasguild.example' },
          { transaction },
        );
      }

      const autoMatchSettings = await queryInterface.sequelize.query(
        `SELECT id FROM pgm_auto_match_settings WHERE owner_id = :ownerId AND metadata->>'origin' = :origin`,
        { type: QueryTypes.SELECT, transaction, replacements: { ownerId, origin: SEED_ORIGIN } },
      );

      if (autoMatchSettings.length) {
        await queryInterface.bulkDelete(
          'pgm_auto_match_settings',
          { id: autoMatchSettings.map((row) => row.id) },
          { transaction },
        );
      }

      const [escrowAccount] = await queryInterface.sequelize.query(
        `SELECT id FROM pgm_escrow_accounts WHERE owner_id = :ownerId AND metadata->>'origin' = :origin LIMIT 1`,
        { type: QueryTypes.SELECT, transaction, replacements: { ownerId, origin: SEED_ORIGIN } },
      );

      if (escrowAccount) {
        await queryInterface.bulkDelete(
          'pgm_escrow_transactions',
          { account_id: escrowAccount.id, reference: 'ESC-DEMO-01' },
          { transaction },
        );
        await queryInterface.bulkDelete('pgm_escrow_accounts', { id: escrowAccount.id }, { transaction });
      }

      const [clientAccount] = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_client_accounts WHERE owner_id = :ownerId AND slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { ownerId, slug: CLIENT_SLUG } },
      );

      const clientAccountId = clientAccount ? clientAccount.id : null;

      const [kanbanColumn] = await queryInterface.sequelize.query(
        'SELECT id FROM pgm_client_kanban_columns WHERE owner_id = :ownerId AND slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { ownerId, slug: KANBAN_COLUMN_SLUG } },
      );

      const columnId = kanbanColumn ? kanbanColumn.id : null;

      if (columnId) {
        const [card] = await queryInterface.sequelize.query(
          'SELECT id FROM pgm_client_kanban_cards WHERE column_id = :columnId AND client_id = :clientId AND title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: {
              columnId,
              clientId: clientAccountId,
              title: 'Lifecycle experiment rollout',
            },
          },
        );

        if (card) {
          await queryInterface.bulkDelete('pgm_client_kanban_checklist_items', { card_id: card.id }, { transaction });
          await queryInterface.bulkDelete('pgm_client_kanban_cards', { id: card.id }, { transaction });
        }

        await queryInterface.bulkDelete('pgm_client_kanban_columns', { id: columnId }, { transaction });
      }

      if (clientAccountId) {
        await queryInterface.bulkDelete('pgm_client_accounts', { id: clientAccountId }, { transaction });
      }

      if (workspaceId) {
        await queryInterface.bulkDelete(
          'pgm_project_workspace_chat_messages',
          { workspace_id: workspaceId, posted_at: new Date('2024-06-24T15:00:00Z') },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_documents',
          { workspace_id: workspaceId, name: 'Creative QA Runbook' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_objects',
          { workspace_id: workspaceId, label: 'Analytics QA checklist' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_time_entries',
          { workspace_id: workspaceId, member_name: 'Lena Torres', entry_date: new Date('2024-06-24T00:00:00Z') },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_hr_records',
          { workspace_id: workspaceId, member_name: 'Ava Founder' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_invites',
          { workspace_id: workspaceId, email: 'agency.partner@example.com' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_submissions',
          { workspace_id: workspaceId, title: 'Lifecycle nurture sequence' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_role_assignments',
          { workspace_id: workspaceId, member_email: 'jordan@gigvora.com' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_calendar_events',
          { workspace_id: workspaceId, title: 'Creative QA window' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_meetings',
          { workspace_id: workspaceId, title: 'Weekly marketing ops sync' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_tasks',
          { workspace_id: workspaceId, title: 'Consolidate creative feedback' },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'pgm_project_workspace_budget_lines',
          { workspace_id: workspaceId, label: 'Motion graphics sprint' },
          { transaction },
        );
        await queryInterface.bulkDelete('pgm_project_workspaces', { id: workspaceId }, { transaction });
      }

      if (projectId) {
        await queryInterface.bulkDelete('pgm_projects', { id: projectId }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
