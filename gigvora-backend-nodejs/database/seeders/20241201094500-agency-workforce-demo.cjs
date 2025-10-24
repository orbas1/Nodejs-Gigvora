'use strict';

const { QueryTypes } = require('sequelize');

const WORKSPACE_SLUG = 'alliance-studio-hq';
const SEED_TAG = 'agency-workforce-demo-v1';
const PAY_MEMO_PREFIX = 'Seed: agency-workforce-demo payroll - ';
const PROJECT_NOTE_PREFIX = 'Seed: agency-workforce-demo project - ';
const GIG_NOTE_PREFIX = 'Seed: agency-workforce-demo gig - ';
const CAPACITY_NOTE_PREFIX = 'Seed: agency-workforce-demo capacity snapshot';
const AVAILABILITY_REASON_PREFIX = 'Seed: agency-workforce-demo availability - ';

const MEMBERS = [
  {
    fullName: 'Avery Johnson',
    email: 'avery@gigvora.com',
    title: 'Delivery Director',
    employmentType: 'full_time',
    status: 'active',
    startDate: new Date('2022-01-10T00:00:00Z'),
    hourlyRate: 68.5,
    billableRate: 145,
    costCenter: 'OPS-DEL',
    capacityHoursPerWeek: 40,
    allocationPercent: 72.5,
    benchAllocationPercent: 10,
    location: 'New York, USA',
    phone: '+1-555-0198',
    skills: {
      domains: ['Product strategy', 'Analytics enablement'],
      certifications: ['PMP', 'CSM'],
    },
    notes: 'Seeded for agency workforce analytics demo.',
  },
  {
    fullName: 'Priya Desai',
    email: 'priya@gigvora.com',
    title: 'Senior Data Scientist',
    employmentType: 'contract',
    status: 'active',
    startDate: new Date('2023-03-06T00:00:00Z'),
    hourlyRate: 85,
    billableRate: 165,
    costCenter: 'DATA-SCI',
    capacityHoursPerWeek: 32,
    allocationPercent: 88,
    benchAllocationPercent: 5,
    location: 'Toronto, Canada',
    phone: '+1-437-555-2938',
    skills: {
      domains: ['Machine learning', 'Forecasting'],
      toolchain: ['Python', 'dbt', 'Snowflake'],
    },
    notes: 'Seeded for agency workforce analytics demo.',
  },
  {
    fullName: 'Mateo Alvarez',
    email: 'mateo@gigvora.com',
    title: 'Experience Designer',
    employmentType: 'vendor',
    status: 'on_leave',
    startDate: new Date('2021-08-16T00:00:00Z'),
    hourlyRate: 55,
    billableRate: 120,
    costCenter: 'CX-LAB',
    capacityHoursPerWeek: 30,
    allocationPercent: 35,
    benchAllocationPercent: 45,
    location: 'Madrid, Spain',
    phone: '+34-91-555-7723',
    skills: {
      domains: ['Service design', 'Design systems'],
      languages: ['Spanish', 'English'],
    },
    notes: 'Seeded for agency workforce analytics demo.',
  },
];

const PAYROLL = [
  {
    memberEmail: 'avery@gigvora.com',
    frequency: 'monthly',
    amount: 11400,
    currency: 'USD',
    status: 'scheduled',
    nextPayDate: () => {
      const next = new Date();
      next.setDate(next.getDate() + 5);
      return next;
    },
    payoutMethod: 'ach',
  },
  {
    memberEmail: 'priya@gigvora.com',
    frequency: 'biweekly',
    amount: 5440,
    currency: 'CAD',
    status: 'processing',
    nextPayDate: () => {
      const next = new Date();
      next.setDate(next.getDate() + 2);
      return next;
    },
    payoutMethod: 'wire',
  },
  {
    memberEmail: 'mateo@gigvora.com',
    frequency: 'monthly',
    amount: 3200,
    currency: 'EUR',
    status: 'paused',
    nextPayDate: () => {
      const next = new Date();
      next.setDate(next.getDate() + 12);
      return next;
    },
    payoutMethod: 'sepa',
  },
];

const PROJECT_ASSIGNMENTS = [
  {
    memberEmail: 'avery@gigvora.com',
    projectName: 'Atlas Labs Growth Retainer',
    clientName: 'Atlas Labs',
    assignmentType: 'retainer',
    status: 'active',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: null,
    allocationPercent: 70,
    billableRate: 155,
  },
  {
    memberEmail: 'priya@gigvora.com',
    projectName: 'Nova Commerce AI Accelerator',
    clientName: 'Nova Commerce',
    assignmentType: 'project',
    status: 'active',
    startDate: new Date('2024-04-15T00:00:00Z'),
    endDate: new Date('2024-12-20T00:00:00Z'),
    allocationPercent: 90,
    billableRate: 172.5,
  },
];

const GIG_ASSIGNMENTS = [
  {
    memberEmail: 'mateo@gigvora.com',
    gigName: 'Experience Audit Sprint',
    status: 'in_delivery',
    deliverables: 6,
    startDate: new Date('2024-09-02T00:00:00Z'),
    dueDate: new Date('2024-10-04T00:00:00Z'),
    allocationPercent: 40,
  },
];

const CAPACITY_SNAPSHOTS = [
  {
    recordedFor: new Date('2024-07-01T00:00:00Z'),
    totalHeadcount: 18,
    activeAssignments: 14,
    availableHours: 220,
    allocatedHours: 540,
    benchHours: 90,
    utilizationPercent: 73.4,
  },
  {
    recordedFor: new Date('2024-08-01T00:00:00Z'),
    totalHeadcount: 19,
    activeAssignments: 16,
    availableHours: 198,
    allocatedHours: 568,
    benchHours: 72,
    utilizationPercent: 76.8,
  },
  {
    recordedFor: new Date('2024-09-01T00:00:00Z'),
    totalHeadcount: 20,
    activeAssignments: 17,
    availableHours: 184,
    allocatedHours: 592,
    benchHours: 65,
    utilizationPercent: 79.6,
  },
];

const AVAILABILITY = [
  {
    memberEmail: 'avery@gigvora.com',
    entries: [
      { date: new Date('2024-09-30T00:00:00Z'), status: 'available', availableHours: 6 },
      { date: new Date('2024-10-01T00:00:00Z'), status: 'partial', availableHours: 4 },
    ],
  },
  {
    memberEmail: 'priya@gigvora.com',
    entries: [
      { date: new Date('2024-09-29T00:00:00Z'), status: 'available', availableHours: 7 },
      { date: new Date('2024-10-02T00:00:00Z'), status: 'available', availableHours: 6 },
    ],
  },
  {
    memberEmail: 'mateo@gigvora.com',
    entries: [
      { date: new Date('2024-09-28T00:00:00Z'), status: 'unavailable', availableHours: 0 },
      { date: new Date('2024-10-03T00:00:00Z'), status: 'on_leave', availableHours: 0 },
    ],
  },
];

async function getWorkspaceId(queryInterface, transaction) {
  const [workspace] = await queryInterface.sequelize.query(
    'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { slug: WORKSPACE_SLUG },
    },
  );
  return workspace?.id ?? null;
}

async function findMemberId(queryInterface, transaction, workspaceId, email) {
  const [member] = await queryInterface.sequelize.query(
    'SELECT id FROM agency_workforce_members WHERE workspace_id = :workspaceId AND email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { workspaceId, email },
    },
  );
  return member?.id ?? null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const workspaceId = await getWorkspaceId(queryInterface, transaction);
      if (!workspaceId) {
        return;
      }

      const now = new Date();
      const memberIds = {};

      for (const member of MEMBERS) {
        const record = {
          workspace_id: workspaceId,
          full_name: member.fullName,
          title: member.title,
          email: member.email,
          phone: member.phone,
          location: member.location,
          employment_type: member.employmentType,
          status: member.status,
          start_date: member.startDate,
          end_date: null,
          hourly_rate: member.hourlyRate,
          billable_rate: member.billableRate,
          cost_center: member.costCenter,
          capacity_hours_per_week: member.capacityHoursPerWeek,
          allocation_percent: member.allocationPercent,
          bench_allocation_percent: member.benchAllocationPercent,
          skills: { ...member.skills, seedTag: SEED_TAG },
          avatar_url: null,
          notes: member.notes,
          metadata: { seedTag: SEED_TAG },
          updated_at: now,
        };

        const existingId = await findMemberId(queryInterface, transaction, workspaceId, member.email);
        if (existingId) {
          await queryInterface.bulkUpdate(
            'agency_workforce_members',
            record,
            { id: existingId },
            { transaction },
          );
          memberIds[member.email] = existingId;
        } else {
          await queryInterface.bulkInsert(
            'agency_workforce_members',
            [
              {
                ...record,
                created_at: now,
              },
            ],
            { transaction },
          );
          const insertedId = await findMemberId(queryInterface, transaction, workspaceId, member.email);
          memberIds[member.email] = insertedId;
        }
      }

      const memberEmails = Object.keys(memberIds);
      if (memberEmails.length === 0) {
        return;
      }

      await queryInterface.sequelize.query(
        'DELETE FROM agency_pay_delegations WHERE workspace_id = :workspaceId AND memo LIKE :memo',
        {
          transaction,
          replacements: { workspaceId, memo: `${PAY_MEMO_PREFIX}%` },
        },
      );
      await queryInterface.sequelize.query(
        'DELETE FROM agency_project_delegations WHERE workspace_id = :workspaceId AND notes LIKE :note',
        {
          transaction,
          replacements: { workspaceId, note: `${PROJECT_NOTE_PREFIX}%` },
        },
      );
      await queryInterface.sequelize.query(
        'DELETE FROM agency_gig_delegations WHERE workspace_id = :workspaceId AND notes LIKE :note',
        {
          transaction,
          replacements: { workspaceId, note: `${GIG_NOTE_PREFIX}%` },
        },
      );
      await queryInterface.sequelize.query(
        'DELETE FROM agency_capacity_snapshots WHERE workspace_id = :workspaceId AND notes = :note',
        {
          transaction,
          replacements: { workspaceId, note: CAPACITY_NOTE_PREFIX },
        },
      );
      await queryInterface.sequelize.query(
        'DELETE FROM agency_availability_entries WHERE workspace_id = :workspaceId AND reason LIKE :reason',
        {
          transaction,
          replacements: { workspaceId, reason: `${AVAILABILITY_REASON_PREFIX}%` },
        },
      );

      const payrollRows = PAYROLL.map((entry) => {
        const memberId = memberIds[entry.memberEmail];
        if (!memberId) return null;
        return {
          workspace_id: workspaceId,
          member_id: memberId,
          frequency: entry.frequency,
          amount: entry.amount,
          currency: entry.currency,
          status: entry.status,
          next_pay_date: entry.nextPayDate(),
          payout_method: entry.payoutMethod,
          approver_id: null,
          memo: `${PAY_MEMO_PREFIX}${entry.memberEmail}`,
          metadata: { seedTag: SEED_TAG },
          created_at: now,
          updated_at: now,
        };
      }).filter(Boolean);

      if (payrollRows.length) {
        await queryInterface.bulkInsert('agency_pay_delegations', payrollRows, { transaction });
      }

      const projectRows = PROJECT_ASSIGNMENTS.map((assignment) => {
        const memberId = memberIds[assignment.memberEmail];
        if (!memberId) return null;
        return {
          workspace_id: workspaceId,
          member_id: memberId,
          project_id: null,
          project_name: assignment.projectName,
          client_name: assignment.clientName,
          assignment_type: assignment.assignmentType,
          status: assignment.status,
          start_date: assignment.startDate,
          end_date: assignment.endDate,
          allocation_percent: assignment.allocationPercent,
          billable_rate: assignment.billableRate,
          notes: `${PROJECT_NOTE_PREFIX}${assignment.projectName}`,
          metadata: { seedTag: SEED_TAG },
          created_at: now,
          updated_at: now,
        };
      }).filter(Boolean);

      if (projectRows.length) {
        await queryInterface.bulkInsert('agency_project_delegations', projectRows, { transaction });
      }

      const gigRows = GIG_ASSIGNMENTS.map((assignment) => {
        const memberId = memberIds[assignment.memberEmail];
        if (!memberId) return null;
        return {
          workspace_id: workspaceId,
          member_id: memberId,
          gig_id: null,
          gig_name: assignment.gigName,
          status: assignment.status,
          deliverables: assignment.deliverables,
          start_date: assignment.startDate,
          due_date: assignment.dueDate,
          allocation_percent: assignment.allocationPercent,
          notes: `${GIG_NOTE_PREFIX}${assignment.gigName}`,
          metadata: { seedTag: SEED_TAG },
          created_at: now,
          updated_at: now,
        };
      }).filter(Boolean);

      if (gigRows.length) {
        await queryInterface.bulkInsert('agency_gig_delegations', gigRows, { transaction });
      }

      const capacityRows = CAPACITY_SNAPSHOTS.map((snapshot) => ({
        workspace_id: workspaceId,
        recorded_for: snapshot.recordedFor,
        total_headcount: snapshot.totalHeadcount,
        active_assignments: snapshot.activeAssignments,
        available_hours: snapshot.availableHours,
        allocated_hours: snapshot.allocatedHours,
        bench_hours: snapshot.benchHours,
        utilization_percent: snapshot.utilizationPercent,
        notes: CAPACITY_NOTE_PREFIX,
        metadata: { seedTag: SEED_TAG },
        created_at: now,
        updated_at: now,
      }));

      if (capacityRows.length) {
        await queryInterface.bulkInsert('agency_capacity_snapshots', capacityRows, { transaction });
      }

      const availabilityRows = [];
      for (const entry of AVAILABILITY) {
        const memberId = memberIds[entry.memberEmail];
        if (!memberId) continue;
        for (const availability of entry.entries) {
          availabilityRows.push({
            workspace_id: workspaceId,
            member_id: memberId,
            date: availability.date,
            status: availability.status,
            available_hours: availability.availableHours,
            reason: `${AVAILABILITY_REASON_PREFIX}${entry.memberEmail}`,
            metadata: { seedTag: SEED_TAG },
            created_at: now,
            updated_at: now,
          });
        }
      }

      if (availabilityRows.length) {
        await queryInterface.bulkInsert('agency_availability_entries', availabilityRows, { transaction });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const workspaceId = await getWorkspaceId(queryInterface, transaction);
      if (!workspaceId) {
        return;
      }

      await queryInterface.sequelize.query(
        'DELETE FROM agency_availability_entries WHERE workspace_id = :workspaceId AND reason LIKE :reason',
        {
          transaction,
          replacements: { workspaceId, reason: `${AVAILABILITY_REASON_PREFIX}%` },
        },
      );

      await queryInterface.sequelize.query(
        'DELETE FROM agency_capacity_snapshots WHERE workspace_id = :workspaceId AND notes = :note',
        {
          transaction,
          replacements: { workspaceId, note: CAPACITY_NOTE_PREFIX },
        },
      );

      await queryInterface.sequelize.query(
        'DELETE FROM agency_gig_delegations WHERE workspace_id = :workspaceId AND notes LIKE :note',
        {
          transaction,
          replacements: { workspaceId, note: `${GIG_NOTE_PREFIX}%` },
        },
      );

      await queryInterface.sequelize.query(
        'DELETE FROM agency_project_delegations WHERE workspace_id = :workspaceId AND notes LIKE :note',
        {
          transaction,
          replacements: { workspaceId, note: `${PROJECT_NOTE_PREFIX}%` },
        },
      );

      await queryInterface.sequelize.query(
        'DELETE FROM agency_pay_delegations WHERE workspace_id = :workspaceId AND memo LIKE :memo',
        {
          transaction,
          replacements: { workspaceId, memo: `${PAY_MEMO_PREFIX}%` },
        },
      );

      const memberEmails = MEMBERS.map((member) => member.email);
      await queryInterface.sequelize.query(
        'DELETE FROM agency_workforce_members WHERE workspace_id = :workspaceId AND email IN (:emails)',
        {
          transaction,
          replacements: { workspaceId, emails: memberEmails },
        },
      );
    });
  },
};
