'use strict';

const MENU_KEY = 'marketing';

function timestamp() {
  return new Date();
}

function buildMenu({ label, description, orderIndex, metadata }) {
  return {
    menuKey: MENU_KEY,
    label,
    description,
    displayType: 'menu',
    metadata,
    orderIndex,
    allowedRoles: ['guest'],
    isExternal: false,
    openInNewTab: false,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
}

function buildSection({ label, description, parentId, orderIndex }) {
  return {
    menuKey: MENU_KEY,
    label,
    description,
    displayType: 'section',
    parentId,
    orderIndex,
    allowedRoles: ['guest'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
}

function buildLink({ label, description, to, icon, parentId, orderIndex }) {
  return {
    menuKey: MENU_KEY,
    label,
    description,
    url: to,
    icon,
    displayType: 'link',
    parentId,
    orderIndex,
    allowedRoles: ['guest'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
}

function buildSearch({ label, placeholder, ariaLabel, orderIndex }) {
  return {
    menuKey: MENU_KEY,
    label,
    url: '/search',
    displayType: 'search',
    metadata: {
      placeholder,
      ariaLabel,
      id: 'marketing-search',
      to: '/search',
    },
    orderIndex,
    allowedRoles: ['guest'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete('site_navigation_links', { menuKey: MENU_KEY }, { transaction });

      const menus = [
        buildMenu({
          label: 'Discover',
          description: 'Find the people, organisations, and signals that grow your marketplace reach.',
          orderIndex: 10,
          metadata: {
            identifier: 'discover',
            theme: { button: 'bg-slate-900/5 hover:bg-slate-900/10', icon: 'text-slate-900' },
          },
        }),
        buildMenu({
          label: 'Collaborate',
          description: 'Coordinate delivery workstreams with dashboards built for hybrid teams.',
          orderIndex: 20,
          metadata: {
            identifier: 'collaborate',
            theme: { button: 'bg-accent/5 hover:bg-accent/10', icon: 'text-accent' },
          },
        }),
        buildMenu({
          label: 'Resources',
          description: 'Stay informed with platform updates, billing guides, and customer stories.',
          orderIndex: 30,
          metadata: {
            identifier: 'resources',
            theme: { button: 'bg-amber-500/5 hover:bg-amber-500/10', icon: 'text-amber-500' },
          },
        }),
      ];

      await queryInterface.bulkInsert('site_navigation_links', menus, { transaction });

      const [menuRows] = await queryInterface.sequelize.query(
        "SELECT id, label FROM site_navigation_links WHERE menuKey = ? AND displayType = 'menu'",
        { replacements: [MENU_KEY], transaction },
      );

      const menuIdByLabel = Object.fromEntries(menuRows.map((row) => [row.label, row.id]));

      const sections = [
        buildSection({
          label: 'People & relationships',
          description: 'Relationships and communities to deepen your reach.',
          parentId: menuIdByLabel.Discover,
          orderIndex: 0,
        }),
        buildSection({
          label: 'Communities',
          description: 'Spaces to host discussions and events.',
          parentId: menuIdByLabel.Discover,
          orderIndex: 1,
        }),
        buildSection({
          label: 'Team workspaces',
          description: 'Dashboards to run hybrid teams.',
          parentId: menuIdByLabel.Collaborate,
          orderIndex: 0,
        }),
        buildSection({
          label: 'Automation',
          description: 'Automations that accelerate launches.',
          parentId: menuIdByLabel.Collaborate,
          orderIndex: 1,
        }),
        buildSection({
          label: 'Learn',
          description: 'Education resources and guides.',
          parentId: menuIdByLabel.Resources,
          orderIndex: 0,
        }),
        buildSection({
          label: 'Policies & support',
          description: 'Operational policies and billing resources.',
          parentId: menuIdByLabel.Resources,
          orderIndex: 1,
        }),
      ];

      await queryInterface.bulkInsert('site_navigation_links', sections, { transaction });

      const [sectionRows] = await queryInterface.sequelize.query(
        "SELECT id, label FROM site_navigation_links WHERE menuKey = ? AND displayType = 'section'",
        { replacements: [MENU_KEY], transaction },
      );

      const sectionIdByLabel = Object.fromEntries(sectionRows.map((row) => [row.label, row.id]));

      const links = [
        buildLink({
          label: 'Connections',
          description: 'View introductions, track touch-points, and stay top of mind.',
          to: '/connections',
          icon: 'UsersIcon',
          parentId: sectionIdByLabel['People & relationships'],
          orderIndex: 0,
        }),
        buildLink({
          label: 'Mentors & advisors',
          description: 'Invite strategic partners to support upcoming launches.',
          to: '/mentors',
          icon: 'LightBulbIcon',
          parentId: sectionIdByLabel['People & relationships'],
          orderIndex: 1,
        }),
        buildLink({
          label: 'Company pages',
          description: 'Showcase announcements and hiring signals from one branded hub.',
          to: '/pages',
          icon: 'BuildingOffice2Icon',
          parentId: sectionIdByLabel['People & relationships'],
          orderIndex: 2,
        }),
        buildLink({
          label: 'Professional groups',
          description: 'Host curated discussions and drops for your teams and partners.',
          to: '/groups',
          icon: 'Squares2X2Icon',
          parentId: sectionIdByLabel.Communities,
          orderIndex: 0,
        }),
        buildLink({
          label: 'Opportunities Explorer',
          description: 'Filter the network for people, teams, and organisations ready to collaborate.',
          to: '/search',
          icon: 'MegaphoneIcon',
          parentId: sectionIdByLabel.Communities,
          orderIndex: 1,
        }),
        buildLink({
          label: 'Freelancer pipeline',
          description: 'Manage briefs, nurture candidates, and convert offers together.',
          to: '/dashboard/freelancer/pipeline',
          icon: 'BriefcaseIcon',
          parentId: sectionIdByLabel['Team workspaces'],
          orderIndex: 0,
        }),
        buildLink({
          label: 'Company analytics',
          description: 'Monitor revenue, growth, and retention across business units.',
          to: '/dashboard/company/analytics',
          icon: 'ChartBarIcon',
          parentId: sectionIdByLabel['Team workspaces'],
          orderIndex: 1,
        }),
        buildLink({
          label: 'Agency CRM',
          description: 'Align accounts, collaborators, and delivery playbooks in real time.',
          to: '/dashboard/agency/crm-pipeline',
          icon: 'GlobeAltIcon',
          parentId: sectionIdByLabel['Team workspaces'],
          orderIndex: 2,
        }),
        buildLink({
          label: 'Experience Launchpad',
          description: 'Automate onboarding, playbooks, and launch readiness in one hub.',
          to: '/experience-launchpad',
          icon: 'RocketLaunchIcon',
          parentId: sectionIdByLabel.Automation,
          orderIndex: 0,
        }),
        buildLink({
          label: 'Trust centre',
          description: 'Keep compliance, privacy, and risk controls transparent for partners.',
          to: '/trust-center',
          icon: 'ShieldCheckIcon',
          parentId: sectionIdByLabel.Automation,
          orderIndex: 1,
        }),
        buildLink({
          label: 'Product blog',
          description: 'Discover the latest Gigvora releases and customer spotlights.',
          to: '/blog',
          icon: 'ChartBarIcon',
          parentId: sectionIdByLabel.Learn,
          orderIndex: 0,
        }),
        buildLink({
          label: 'Resource hub',
          description: 'Guides, templates, and launch kits to support every team moment.',
          to: '/resources',
          icon: 'SparklesIcon',
          parentId: sectionIdByLabel.Learn,
          orderIndex: 1,
        }),
        buildLink({
          label: 'Billing & subscriptions',
          description: 'Manage invoices, renewals, and plan usage in one place.',
          to: '/billing',
          icon: 'BriefcaseIcon',
          parentId: sectionIdByLabel['Policies & support'],
          orderIndex: 0,
        }),
        buildLink({
          label: 'Policy centre',
          description: 'Review security, privacy, and community standards anytime.',
          to: '/policies',
          icon: 'ShieldCheckIcon',
          parentId: sectionIdByLabel['Policies & support'],
          orderIndex: 1,
        }),
      ];

      await queryInterface.bulkInsert('site_navigation_links', links, { transaction });

      const searchEntry = buildSearch({
        label: 'Search Gigvora',
        placeholder: 'Search projects, people, and teams',
        ariaLabel: 'Search the Gigvora workspace catalogue',
        orderIndex: 0,
      });

      await queryInterface.bulkInsert('site_navigation_links', [searchEntry], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete('site_navigation_links', { menuKey: MENU_KEY }, { transaction });
    });
  },
};
