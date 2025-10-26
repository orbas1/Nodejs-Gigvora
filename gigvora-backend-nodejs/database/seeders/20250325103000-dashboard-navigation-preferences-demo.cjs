'use strict';

const TABLE = 'user_dashboard_navigation_preferences';

const USERS = [
  {
    email: 'ava@gigvora.com',
    dashboardKey: 'admin',
    collapsed: false,
    order: ['overview', 'governance', 'ads'],
    hidden: ['ads'],
    pinned: ['overview'],
  },
  {
    email: 'mia@gigvora.com',
    dashboardKey: 'company',
    collapsed: false,
    order: ['company-overview', 'timeline-management', 'gigvora-ads'],
    hidden: [],
    pinned: ['company-overview'],
  },
  {
    email: 'noah@gigvora.com',
    dashboardKey: 'agency',
    collapsed: true,
    order: ['agency-overview', 'pipeline', 'alliances'],
    hidden: ['alliances'],
    pinned: ['pipeline'],
  },
  {
    email: 'leo@gigvora.com',
    dashboardKey: 'freelancer',
    collapsed: false,
    order: ['overview', 'projects', 'networking'],
    hidden: [],
    pinned: ['projects'],
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id, email FROM users WHERE email IN (:emails)`,
        { transaction, replacements: { emails: USERS.map((entry) => entry.email) } },
      );

      const emailToId = new Map(rows.map((row) => [row.email, row.id]));
      const now = new Date();

      const inserts = USERS.reduce((acc, entry) => {
        const userId = emailToId.get(entry.email);
        if (!userId) {
          return acc;
        }
        acc.push({
          userId,
          dashboardKey: entry.dashboardKey,
          collapsed: entry.collapsed,
          order: Array.isArray(entry.order) ? entry.order : [],
          hidden: Array.isArray(entry.hidden) ? entry.hidden : [],
          pinned: Array.isArray(entry.pinned) ? entry.pinned : [],
          createdAt: now,
          updatedAt: now,
        });
        return acc;
      }, []);

      if (inserts.length) {
        await queryInterface.bulkInsert(TABLE, inserts, { transaction, ignoreDuplicates: true });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      TABLE,
      {
        dashboardKey: USERS.map((entry) => entry.dashboardKey),
      },
      {},
    );
  },
};
