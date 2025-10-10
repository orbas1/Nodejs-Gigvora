'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        firstName: 'Ava',
        lastName: 'Founder',
        email: 'ava@gigvora.com',
        password: '$2b$10$abcdefghijklmnopqrstuv',
        address: '123 Innovation Way',
        age: 32,
        userType: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        firstName: 'Leo',
        lastName: 'Freelancer',
        email: 'leo@gigvora.com',
        password: '$2b$10$abcdefghijklmnopqrstuv',
        address: '456 Remote Ave',
        age: 27,
        userType: 'freelancer',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('profiles', [
      {
        userId: 2,
        headline: 'Full Stack Developer',
        bio: 'Freelancer passionate about building platforms that connect talent.',
        skills: 'Node.js, React, Tailwind, MySQL',
        experience: '5 years building SaaS products',
        education: 'BSc Computer Science',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('feed_posts', [
      {
        userId: 2,
        content: 'Excited to join the Gigvora network! Looking for new collaborations.',
        visibility: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('jobs', [
      {
        title: 'Product Designer',
        description: 'Craft intuitive experiences for our marketplace teams.',
        location: 'Remote',
        employmentType: 'Full-time',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('gigs', [
      {
        title: 'Landing Page Revamp',
        description: 'Help refresh our marketing site in Tailwind CSS.',
        budget: '$1500',
        duration: '3 weeks',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('projects', [
      {
        title: 'Community Growth Initiative',
        description: 'Launch groups to connect freelancers across industries.',
        status: 'Ideation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('experience_launchpads', [
      {
        title: 'Emerging Leaders Fellowship',
        description: 'Mentorship-driven leadership journey for rising professionals.',
        track: 'Leadership',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('volunteering_roles', [
      {
        title: 'Open Source Mentor',
        organization: 'Gigvora Foundation',
        description: 'Support early career devs contributing to community projects.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('volunteering_roles', null, {});
    await queryInterface.bulkDelete('experience_launchpads', null, {});
    await queryInterface.bulkDelete('projects', null, {});
    await queryInterface.bulkDelete('gigs', null, {});
    await queryInterface.bulkDelete('jobs', null, {});
    await queryInterface.bulkDelete('feed_posts', null, {});
    await queryInterface.bulkDelete('profiles', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
