'use strict';

const { QueryTypes } = require('sequelize');

const SEED_TAG = 'ats-fairness-demo';

const SNAPSHOT_SERIES = [
  {
    daysAgo: 150,
    fairnessScore: 71.5,
    automationCoverage: 56.2,
    newcomerShare: 33.4,
    rotationHealthScore: 61.1,
    biasAlertCount: 7,
    flaggedStagesCount: 5,
    notes: [
      'Launch fairness calibration for screening rubric.',
      'Backfill interviewer diversity data for Q2 hires.',
    ],
  },
  {
    daysAgo: 120,
    fairnessScore: 74.8,
    automationCoverage: 59.4,
    newcomerShare: 35.6,
    rotationHealthScore: 65.3,
    biasAlertCount: 6,
    flaggedStagesCount: 4,
    notes: ['Bias alerts trending down after guide refresh.'],
  },
  {
    daysAgo: 90,
    fairnessScore: 77.9,
    automationCoverage: 63.8,
    newcomerShare: 38.2,
    rotationHealthScore: 70.6,
    biasAlertCount: 5,
    flaggedStagesCount: 3,
    notes: ['Expanded prep portal boosted candidate sentiment.'],
  },
  {
    daysAgo: 60,
    fairnessScore: 79.6,
    automationCoverage: 69.2,
    newcomerShare: 40.7,
    rotationHealthScore: 75.8,
    biasAlertCount: 4,
    flaggedStagesCount: 3,
    notes: ['Rotation programme distributing interviews evenly.'],
  },
  {
    daysAgo: 30,
    fairnessScore: 81.1,
    automationCoverage: 73.5,
    newcomerShare: 41.9,
    rotationHealthScore: 79.2,
    biasAlertCount: 3,
    flaggedStagesCount: 2,
    notes: ['Department partnership reducing re-opened tickets.'],
  },
  {
    daysAgo: 7,
    fairnessScore: 82.7,
    automationCoverage: 78.4,
    newcomerShare: 43.6,
    rotationHealthScore: 83.4,
    biasAlertCount: 2,
    flaggedStagesCount: 1,
    notes: ['Weekly fairness stand-up cleared backlog of escalations.'],
  },
];

function buildDepartmentBreakdown(seedOffset = 0) {
  const base = [
    { label: 'Product', count: 18 + seedOffset },
    { label: 'Design', count: 12 },
    { label: 'Engineering', count: 26 + seedOffset },
    { label: 'Operations', count: 9 },
  ];
  const total = base.reduce((sum, entry) => sum + entry.count, 0);
  return base.map((entry) => ({
    id: entry.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label: entry.label,
    count: entry.count,
    share: Number(((entry.count / total) * 100).toFixed(1)),
  }));
}

function buildRecruiterBreakdown(seedOffset = 0) {
  const base = [
    { label: 'Lena Howard', count: 22 + seedOffset },
    { label: 'Ibrahim Ortiz', count: 18 },
    { label: 'Sasha Almeida', count: 14 },
    { label: 'Priya Banerjee', count: 11 },
  ];
  const total = base.reduce((sum, entry) => sum + entry.count, 0);
  return base.map((entry, index) => ({
    id: `${entry.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`,
    label: entry.label,
    count: entry.count,
    share: Number(((entry.count / total) * 100).toFixed(1)),
  }));
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const workspaces = await queryInterface.sequelize.query(
        "SELECT id FROM provider_workspaces WHERE type = 'company' ORDER BY id ASC LIMIT 5",
        { type: QueryTypes.SELECT, transaction },
      );

      if (!workspaces.length) {
        return;
      }

      const now = Date.now();

      for (const [index, workspace] of workspaces.entries()) {
        const [{ count: existingCount }] = await queryInterface.sequelize.query(
          'SELECT COUNT(*) AS count FROM ats_fairness_snapshots WHERE workspaceId = :workspaceId',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId: workspace.id },
          },
        );

        if (Number(existingCount) > 0) {
          continue;
        }

        const departmentBreakdown = buildDepartmentBreakdown(index % 3);
        const recruiterBreakdown = buildRecruiterBreakdown(index % 2);

        const rows = SNAPSHOT_SERIES.map((snapshot) => {
          const recordedAt = new Date(now - snapshot.daysAgo * 24 * 60 * 60 * 1000);
          const adjustment = (index % 3) * 0.9;
          return {
            workspaceId: workspace.id,
            recordedAt,
            fairnessScore: Number((snapshot.fairnessScore + adjustment).toFixed(1)),
            automationCoverage: Number((snapshot.automationCoverage + adjustment).toFixed(1)),
            newcomerShare: Number((snapshot.newcomerShare + (index % 2) * 0.8).toFixed(1)),
            rotationHealthScore: Number((snapshot.rotationHealthScore + adjustment).toFixed(1)),
            biasAlertCount: Math.max(snapshot.biasAlertCount - index, 0),
            flaggedStagesCount: Math.max(snapshot.flaggedStagesCount - Math.floor(index / 2), 0),
            departmentBreakdown,
            recruiterBreakdown,
            notes: snapshot.notes,
            metadata: { seedTag: SEED_TAG, baselineVersion: 1 },
            createdAt: recordedAt,
            updatedAt: recordedAt,
          };
        });

        await queryInterface.bulkInsert('ats_fairness_snapshots', rows, { transaction });
      }
    });
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    let deleteSql;
    if (['postgres', 'postgresql'].includes(dialect)) {
      deleteSql = "DELETE FROM ats_fairness_snapshots WHERE metadata ->> 'seedTag' = :seedTag";
    } else if (['mysql', 'mariadb'].includes(dialect)) {
      deleteSql = "DELETE FROM ats_fairness_snapshots WHERE JSON_EXTRACT(metadata, '$.seedTag') = :seedTag";
    } else {
      deleteSql = "DELETE FROM ats_fairness_snapshots WHERE json_extract(metadata, '$.seedTag') = :seedTag";
    }

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(deleteSql, {
        transaction,
        replacements: { seedTag: SEED_TAG },
      });
    });
  },
};
