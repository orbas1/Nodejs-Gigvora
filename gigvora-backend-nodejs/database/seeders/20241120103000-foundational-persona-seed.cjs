'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const { Op } = Sequelize;
      const now = new Date();
      const baseUserId = 5001;
      const userSeeds = [
        {
          firstName: 'Lara',
          lastName: 'Nguyen',
          email: 'lara.operations@gigvora.com',
          password: 'S3cure!Admin1',
          userType: 'admin',
          address: 'Operations HQ, Remote',
          jobTitle: 'Director of Platform Operations',
        },
        {
          firstName: 'Jonah',
          lastName: 'Barrett',
          email: 'jonah.freelancer@gigvora.com',
          password: 'Craft#Freelance88',
          userType: 'freelancer',
          address: 'San Diego, USA',
          jobTitle: 'Lead Product Designer',
        },
        {
          firstName: 'Marisol',
          lastName: 'Khan',
          email: 'marisol.agency@gigvora.com',
          password: 'Agency$Prime2024',
          userType: 'agency',
          address: 'Austin, USA',
          jobTitle: 'Managing Partner',
        },
        {
          firstName: 'Haruto',
          lastName: 'Sato',
          email: 'haruto.company@gigvora.com',
          password: 'Company@Growth55',
          userType: 'company',
          address: 'Tokyo, Japan',
          jobTitle: 'VP of Talent Acquisition',
        },
        {
          firstName: 'Noemi',
          lastName: 'Velasquez',
          email: 'noemi.mentor@gigvora.com',
          password: 'Mentor&Guidance77',
          userType: 'user',
          address: 'Lisbon, Portugal',
          jobTitle: 'Mentorship Strategist',
        },
        {
          firstName: 'Babatunde',
          lastName: 'Okoye',
          email: 'babatunde.volunteer@gigvora.com',
          password: 'Volunteer!Impact33',
          userType: 'user',
          address: 'Lagos, Nigeria',
          jobTitle: 'Community Lead',
        },
      ];

      const emails = userSeeds.map((seed) => seed.email);
      await queryInterface.bulkDelete(
        'users',
        { email: { [Op.in]: emails } },
        { transaction },
      );

      const users = await Promise.all(
        userSeeds.map(async (seed, index) => ({
          id: baseUserId + index,
          firstName: seed.firstName,
          lastName: seed.lastName,
          email: seed.email,
          password: await bcrypt.hash(seed.password, 12),
          address: seed.address,
          age: 34 + index,
          userType: seed.userType,
          jobTitle: seed.jobTitle,
          status: 'active',
          memberships: JSON.stringify(['core']),
          primaryDashboard: seed.userType === 'admin' ? 'admin_ops' : null,
          createdAt: now,
          updatedAt: now,
        })),
      );

      await queryInterface.bulkInsert('users', users, { transaction });

      const userByEmail = users.reduce((acc, user) => {
        acc[user.email] = user.id;
        return acc;
      }, {});

      const profileRecords = [
        {
          userId: userByEmail['jonah.freelancer@gigvora.com'],
          headline: 'Design systems architect for multi-brand teams',
          bio: 'Leads cross-functional discovery and prototypes inclusive design systems for SaaS rollouts.',
          skills: JSON.stringify(['Design Systems', 'Figma', 'User Research', 'Accessibility Audits']),
          experience: '10 years scaling design teams at remote-first companies.',
          education: 'BFA, Human-Centered Design',
        },
        {
          userId: userByEmail['noemi.mentor@gigvora.com'],
          headline: 'Mentor for cross-border launchpad cohorts',
          bio: 'Helps early stage talent package experience portfolios and launch community programs.',
          skills: JSON.stringify(['Mentorship', 'Career Coaching', 'Curriculum Design']),
          experience: 'Built mentorship guilds with >90% completion rates.',
          education: 'MA, Organizational Leadership',
        },
        {
          userId: userByEmail['babatunde.volunteer@gigvora.com'],
          headline: 'Volunteer community accelerator',
          bio: 'Coordinates civic tech and climate volunteering sprints across Africa and Europe.',
          skills: JSON.stringify(['Community Strategy', 'Volunteer Management', 'Impact Reporting']),
          experience: 'Scaled volunteering network to 12,000 active members.',
          education: 'MBA, Sustainable Development',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete(
        'profiles',
        { userId: { [Op.in]: profileRecords.map((record) => record.userId) } },
        { transaction },
      );
      if (profileRecords.length > 0) {
        await queryInterface.bulkInsert('profiles', profileRecords, { transaction });
      }

      const companyProfiles = [
        {
          userId: userByEmail['haruto.company@gigvora.com'],
          companyName: 'Orbital Robotics',
          description:
            'Global engineering firm delivering robotics automation for manufacturing and life sciences with 24/7 managed services.',
          website: 'https://orbital-robotics.example.com',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete(
        'company_profiles',
        { userId: { [Op.in]: companyProfiles.map((record) => record.userId) } },
        { transaction },
      );
      if (companyProfiles.length > 0) {
        await queryInterface.bulkInsert('company_profiles', companyProfiles, { transaction });
      }

      const agencyProfiles = [
        {
          userId: userByEmail['marisol.agency@gigvora.com'],
          agencyName: 'Atlas Collective',
          focusArea: 'Product, growth, and data science pods for venture-backed startups.',
          website: 'https://atlascollective.example.com',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete(
        'agency_profiles',
        { userId: { [Op.in]: agencyProfiles.map((record) => record.userId) } },
        { transaction },
      );
      if (agencyProfiles.length > 0) {
        await queryInterface.bulkInsert('agency_profiles', agencyProfiles, { transaction });
      }

      const freelancerProfiles = [
        {
          userId: userByEmail['jonah.freelancer@gigvora.com'],
          title: 'Principal Product Designer',
          hourlyRate: 145.5,
          availability: '25 hrs/week — fractional discovery & design leadership',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete(
        'freelancer_profiles',
        { userId: { [Op.in]: freelancerProfiles.map((record) => record.userId) } },
        { transaction },
      );
      if (freelancerProfiles.length > 0) {
        await queryInterface.bulkInsert('freelancer_profiles', freelancerProfiles, { transaction });
      }

      const feedPosts = [
        {
          id: 7001,
          userId: userByEmail['lara.operations@gigvora.com'],
          content: 'Platform maintenance window scheduled for Saturday 02:00 UTC. Expect upgraded analytics and audit dashboards.',
          visibility: 'public',
        },
        {
          id: 7002,
          userId: userByEmail['jonah.freelancer@gigvora.com'],
          content: 'Wrapping an onboarding sprint for a climate fintech. Sharing Figma assets and research ops template this week.',
          visibility: 'connections',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete('feed_posts', { id: { [Op.in]: feedPosts.map((record) => record.id) } }, { transaction });
      await queryInterface.bulkInsert('feed_posts', feedPosts, { transaction });

      const gigRecords = [
        {
          id: 7101,
          title: 'Fractional Head of Product Design',
          description:
            'Lead design strategy, run discovery sprints, and consolidate component libraries across three venture portfolio brands.',
          budget: 'Fixed $28,500',
          duration: '12 weeks',
        },
        {
          id: 7102,
          title: 'Agency partnership: GTM analytics pod',
          description: 'Data science and revenue ops squad to launch attribution dashboards for B2B SaaS expansion.',
          budget: 'Retainer $14,000/mo',
          duration: '6 months',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete('gigs', { id: { [Op.in]: gigRecords.map((record) => record.id) } }, { transaction });
      await queryInterface.bulkInsert('gigs', gigRecords, { transaction });

      const jobRecords = [
        {
          id: 7201,
          title: 'Lead Robotics Program Manager',
          description: 'Own client onboarding, compliance, and uptime analytics for robotics deployments in regulated industries.',
          location: 'Hybrid — Tokyo & Remote',
          employmentType: 'Full-time',
        },
        {
          id: 7202,
          title: 'Senior Customer Lifecycle Marketer',
          description: 'Design full-funnel nurture journeys and retention experiments across SaaS, education, and community surfaces.',
          location: 'Remote — Americas',
          employmentType: 'Full-time',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete('jobs', { id: { [Op.in]: jobRecords.map((record) => record.id) } }, { transaction });
      await queryInterface.bulkInsert('jobs', jobRecords, { transaction });

      const projectRecords = [
        {
          id: 7301,
          title: 'Mentorship analytics rollout',
          description: 'Deliver cross-role dashboards measuring mentor capacity, learner outcomes, and compliance readiness.',
          status: 'in_progress',
        },
        {
          id: 7302,
          title: 'Volunteer impact studio',
          description: 'Build pipeline for global volunteer cohorts including onboarding wizard, background checks, and reporting exports.',
          status: 'planning',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete('projects', { id: { [Op.in]: projectRecords.map((record) => record.id) } }, { transaction });
      await queryInterface.bulkInsert('projects', projectRecords, { transaction });

      const launchpadRecords = [
        {
          id: 7401,
          title: 'Experience Launchpad — Climate Product Ops',
          description: '6-week accelerator for operations professionals transitioning into climate tech roles with portfolio partners.',
          track: 'Climate Tech',
        },
        {
          id: 7402,
          title: 'Experience Launchpad — AI Safety Fellows',
          description: 'Curated labs focusing on AI audit, safety reviews, and compliance instrumentation for enterprise systems.',
          track: 'AI Safety',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete(
        'experience_launchpads',
        { id: { [Op.in]: launchpadRecords.map((record) => record.id) } },
        { transaction },
      );
      await queryInterface.bulkInsert('experience_launchpads', launchpadRecords, { transaction });

      const volunteeringRecords = [
        {
          id: 7501,
          title: 'Civic Tech Sprint Lead',
          organization: 'Urban Future Coalition',
          description: 'Coordinate weekend sprints building accessibility tools and open data visualisations with multi-city teams.',
        },
        {
          id: 7502,
          title: 'Climate Finance Research Analyst',
          organization: 'Global Green Fund',
          description: 'Support grant diligence and reporting for renewable energy microgrids and community-driven climate adaptation.',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete(
        'volunteering_roles',
        { id: { [Op.in]: volunteeringRecords.map((record) => record.id) } },
        { transaction },
      );
      await queryInterface.bulkInsert('volunteering_roles', volunteeringRecords, { transaction });

      const groupRecords = [
        {
          id: 7601,
          name: 'Gigvora Operations Guild',
          description: 'Ops, security, and compliance leaders sharing runbooks, observability dashboards, and release war stories.',
        },
        {
          id: 7602,
          name: 'Global Mentorship Circle',
          description: 'Mentors coordinating cohort launch schedules, content calendars, and readiness rubrics.',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete('groups', { id: { [Op.in]: groupRecords.map((record) => record.id) } }, { transaction });
      await queryInterface.bulkInsert('groups', groupRecords, { transaction });

      const membershipRecords = [
        {
          id: 7701,
          userId: userByEmail['lara.operations@gigvora.com'],
          groupId: 7601,
          role: 'owner',
        },
        {
          id: 7702,
          userId: userByEmail['noemi.mentor@gigvora.com'],
          groupId: 7602,
          role: 'moderator',
        },
        {
          id: 7703,
          userId: userByEmail['jonah.freelancer@gigvora.com'],
          groupId: 7601,
          role: 'contributor',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete(
        'group_memberships',
        { id: { [Op.in]: membershipRecords.map((record) => record.id) } },
        { transaction },
      );
      await queryInterface.bulkInsert('group_memberships', membershipRecords, { transaction });

      const connectionRecords = [
        {
          id: 7801,
          requesterId: userByEmail['haruto.company@gigvora.com'],
          addresseeId: userByEmail['marisol.agency@gigvora.com'],
          status: 'accepted',
        },
        {
          id: 7802,
          requesterId: userByEmail['noemi.mentor@gigvora.com'],
          addresseeId: userByEmail['babatunde.volunteer@gigvora.com'],
          status: 'pending',
        },
      ].map((record) => ({ ...record, createdAt: now, updatedAt: now }));

      await queryInterface.bulkDelete(
        'connections',
        { id: { [Op.in]: connectionRecords.map((record) => record.id) } },
        { transaction },
      );
      await queryInterface.bulkInsert('connections', connectionRecords, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete(
      'connections',
      { id: { [Op.in]: [7801, 7802] } },
      {},
    );
    await queryInterface.bulkDelete(
      'group_memberships',
      { id: { [Op.in]: [7701, 7702, 7703] } },
      {},
    );
    await queryInterface.bulkDelete(
      'groups',
      { id: { [Op.in]: [7601, 7602] } },
      {},
    );
    await queryInterface.bulkDelete(
      'volunteering_roles',
      { id: { [Op.in]: [7501, 7502] } },
      {},
    );
    await queryInterface.bulkDelete(
      'experience_launchpads',
      { id: { [Op.in]: [7401, 7402] } },
      {},
    );
    await queryInterface.bulkDelete(
      'projects',
      { id: { [Op.in]: [7301, 7302] } },
      {},
    );
    await queryInterface.bulkDelete(
      'jobs',
      { id: { [Op.in]: [7201, 7202] } },
      {},
    );
    await queryInterface.bulkDelete(
      'gigs',
      { id: { [Op.in]: [7101, 7102] } },
      {},
    );
    await queryInterface.bulkDelete(
      'feed_posts',
      { id: { [Op.in]: [7001, 7002] } },
      {},
    );
    await queryInterface.bulkDelete(
      'freelancer_profiles',
      { userId: { [Op.in]: [5002] } },
      {},
    );
    await queryInterface.bulkDelete(
      'agency_profiles',
      { userId: { [Op.in]: [5003] } },
      {},
    );
    await queryInterface.bulkDelete(
      'company_profiles',
      { userId: { [Op.in]: [5004] } },
      {},
    );
    await queryInterface.bulkDelete(
      'profiles',
      { userId: { [Op.in]: [5002, 5005, 5006] } },
      {},
    );
    await queryInterface.bulkDelete(
      'users',
      { id: { [Op.in]: [5001, 5002, 5003, 5004, 5005, 5006] } },
      {},
    );
  },
};
