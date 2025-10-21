'use strict';

const { QueryTypes, Op } = require('sequelize');

const documentSlugs = ['demo-cv-staff-engineer', 'demo-cover-letter-product'];
const storyBlockTitle = 'Demo: Marketplace transformation story';
const brandAssetTitle = 'Demo: Marketplace case study banner';

async function findUserId(queryInterface, transaction, email) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );
  return row?.id ?? null;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const userId = await findUserId(queryInterface, transaction, 'leo@gigvora.com');
      const mentorId = await findUserId(queryInterface, transaction, 'mentor@gigvora.com');
      const reviewerId = await findUserId(queryInterface, transaction, 'recruiter@gigvora.com');

      if (!userId || !mentorId || !reviewerId) {
        throw new Error('Document studio demo requires leo, mentor, and recruiter demo users.');
      }

      const documents = [
        {
          documentType: 'cv',
          title: 'Demo CV: Staff Engineer',
          slug: documentSlugs[0],
          status: 'approved',
          roleTag: 'Product Engineer',
          geographyTag: 'Global',
          aiAssisted: true,
          tags: ['marketplace', 'growth'],
          shareUrl: 'https://share.gigvora.example.com/demo/leo/cv',
        },
        {
          documentType: 'cover_letter',
          title: 'Demo Cover Letter: Product Lead',
          slug: documentSlugs[1],
          status: 'in_review',
          roleTag: 'Product Manager',
          geographyTag: 'North America',
          aiAssisted: true,
          tags: ['leadership', 'storytelling'],
          shareUrl: 'https://share.gigvora.example.com/demo/leo/cover-letter',
        },
      ];

      const documentIds = new Map();
      for (const doc of documents) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM career_documents WHERE userId = :userId AND slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, slug: doc.slug },
          },
        );
        if (existing?.id) {
          documentIds.set(doc.slug, existing.id);
          continue;
        }
        await queryInterface.bulkInsert(
          'career_documents',
          [
            {
              userId,
              ...doc,
              metadata: { seed: 'document-studio-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM career_documents WHERE userId = :userId AND slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, slug: doc.slug },
          },
        );
        if (inserted?.id) {
          documentIds.set(doc.slug, inserted.id);
        }
      }

      for (const [slug, documentId] of documentIds.entries()) {
        const [existingVersion] = await queryInterface.sequelize.query(
          'SELECT id FROM career_document_versions WHERE documentId = :documentId AND versionNumber = :version LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { documentId, version: 1 },
          },
        );
        let versionId = existingVersion?.id ?? null;
        if (!versionId) {
          await queryInterface.bulkInsert(
            'career_document_versions',
            [
              {
                documentId,
                versionNumber: 1,
                title: `Version 1 for ${slug}`,
                summary: 'Initial baseline authored from mentoring session.',
                contentPath: `s3://gigvora-demo/documents/${documentId}/v1.pdf`,
                aiSummary: 'Highlights marketplace launch and cross-functional leadership.',
                changeSummary: 'Baseline version created for demo.',
                diffHighlights: ['+ Added executive summary'],
                metrics: { aiCopyScore: 0.8 },
                aiSuggestionUsed: true,
                approvalStatus: 'approved',
                createdById: userId,
                approvedById: reviewerId,
                approvedAt: now,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
          const [insertedVersion] = await queryInterface.sequelize.query(
            'SELECT id FROM career_document_versions WHERE documentId = :documentId AND versionNumber = :version LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { documentId, version: 1 },
            },
          );
          versionId = insertedVersion?.id ?? null;
        }

        if (versionId) {
          await queryInterface.bulkUpdate(
            'career_documents',
            { baselineVersionId: versionId, latestVersionId: versionId },
            { id: documentId },
            { transaction },
          );
        }

        const [existingCollaborator] = await queryInterface.sequelize.query(
          'SELECT id FROM career_document_collaborators WHERE documentId = :documentId AND collaboratorId = :collaboratorId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { documentId, collaboratorId: mentorId },
          },
        );
        if (!existingCollaborator?.id) {
          await queryInterface.bulkInsert(
            'career_document_collaborators',
            [
              {
                documentId,
                collaboratorId: mentorId,
                role: 'mentor',
                permissions: { comment: true, edit: false },
                lastActiveAt: now,
                addedAt: now,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }

        const [existingExport] = await queryInterface.sequelize.query(
          'SELECT id FROM career_document_exports WHERE documentId = :documentId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { documentId },
          },
        );
        if (!existingExport?.id) {
          await queryInterface.bulkInsert(
            'career_document_exports',
            [
              {
                documentId,
                versionId,
                format: 'pdf',
                exportedById: mentorId,
                exportedAt: now,
                deliveryUrl: `https://share.gigvora.example.com/demo/export/${documentId}.pdf`,
                metadata: { seed: 'document-studio-demo' },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }

        const [existingAnalytics] = await queryInterface.sequelize.query(
          'SELECT id FROM career_document_analytics WHERE documentId = :documentId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { documentId },
          },
        );
        if (!existingAnalytics?.id) {
          await queryInterface.bulkInsert(
            'career_document_analytics',
            [
              {
                documentId,
                versionId,
                viewerId: reviewerId,
                viewerType: 'recruiter',
                opens: 5,
                downloads: 2,
                shares: 1,
                lastOpenedAt: now,
                lastDownloadedAt: now,
                geographyTag: 'Global',
                seniorityTag: 'Director',
                outcomes: { interviews: 2 },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const [existingStory] = await queryInterface.sequelize.query(
        'SELECT id FROM career_story_blocks WHERE userId = :userId AND title = :title LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId, title: storyBlockTitle },
        },
      );
      if (!existingStory?.id) {
        await queryInterface.bulkInsert(
          'career_story_blocks',
          [
            {
              userId,
              title: storyBlockTitle,
              tone: 'executive',
              content:
                'Led a global marketplace relaunch delivering +42% GMV and 30% faster onboarding with compliance guardrails.',
              metrics: { gmvLift: 42, onboardingAcceleration: 30 },
              approvalStatus: 'approved',
              useCount: 3,
              lastUsedAt: now,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingAsset] = await queryInterface.sequelize.query(
        'SELECT id FROM career_brand_assets WHERE userId = :userId AND title = :title LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId, title: brandAssetTitle },
        },
      );
      if (!existingAsset?.id) {
        await queryInterface.bulkInsert(
          'career_brand_assets',
          [
            {
              userId,
              assetType: 'case_study',
              title: brandAssetTitle,
              description: 'Banner summarising the marketplace transformation case study.',
              mediaUrl: 'https://cdn.gigvora.example.com/demo/brand-assets/marketplace-banner.png',
              thumbnailUrl: 'https://cdn.gigvora.example.com/demo/brand-assets/marketplace-thumb.png',
              status: 'published',
              featured: true,
              approvalsStatus: 'approved',
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const userId = await findUserId(queryInterface, transaction, 'leo@gigvora.com');
      if (!userId) return;

      await queryInterface.bulkDelete(
        'career_brand_assets',
        { userId, title: brandAssetTitle },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'career_story_blocks',
        { userId, title: storyBlockTitle },
        { transaction },
      );

      const documentIds = [];
      for (const slug of documentSlugs) {
        const [row] = await queryInterface.sequelize.query(
          'SELECT id FROM career_documents WHERE userId = :userId AND slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, slug },
          },
        );
        if (row?.id) {
          documentIds.push(row.id);
        }
      }

      if (documentIds.length) {
        await queryInterface.bulkDelete(
          'career_document_analytics',
          { documentId: { [Op.in]: documentIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'career_document_exports',
          { documentId: { [Op.in]: documentIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'career_document_collaborators',
          { documentId: { [Op.in]: documentIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'career_document_versions',
          { documentId: { [Op.in]: documentIds } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'career_documents',
          { id: { [Op.in]: documentIds } },
          { transaction },
        );
      }
    });
  },
};
