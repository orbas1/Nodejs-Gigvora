'use strict';

const { Op } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const yesterday = new Date(now.getTime() - dayMs);
      const twoDaysAgo = new Date(now.getTime() - 2 * dayMs);
      const threeDaysAgo = new Date(now.getTime() - 3 * dayMs);
      const fiveDaysAgo = new Date(now.getTime() - 5 * dayMs);
      const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs);
      const tenDaysAgo = new Date(now.getTime() - 10 * dayMs);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * dayMs);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs);

      const userId = 2;
      const mentorId = 3;
      const recruiterId = 4;

      const documentIds = [1, 2, 3, 4, 5, 6];

      const documents = [
        {
          id: 1,
          userId,
          documentType: 'cv',
          title: 'Baseline Product Manager CV',
          slug: 'leo-freelancer-product-manager-baseline',
          status: 'approved',
          roleTag: 'Product Manager',
          geographyTag: 'EMEA',
          aiAssisted: true,
          baselineVersionId: null,
          latestVersionId: null,
          tags: ['product strategy', 'market entry'],
          shareUrl: 'https://share.gigvora.com/portfolio/leo-freelancer/cv/baseline',
          metadata: { isBaseline: true, persona: 'product_management' },
          createdAt: thirtyDaysAgo,
          updatedAt: twoDaysAgo,
        },
        {
          id: 2,
          userId,
          documentType: 'cv',
          title: 'Fintech Scaleup CV Variant',
          slug: 'leo-freelancer-fintech-variant',
          status: 'in_review',
          roleTag: 'Product Manager',
          geographyTag: 'APAC',
          aiAssisted: true,
          baselineVersionId: null,
          latestVersionId: null,
          tags: ['fintech', 'payments'],
          shareUrl: 'https://share.gigvora.com/portfolio/leo-freelancer/cv/fintech',
          metadata: { variantOf: 1, focus: 'fintech_payments' },
          createdAt: sevenDaysAgo,
          updatedAt: yesterday,
        },
        {
          id: 3,
          userId,
          documentType: 'cv',
          title: 'Remote US Product CV',
          slug: 'leo-freelancer-remote-us',
          status: 'approved',
          roleTag: 'Product Manager',
          geographyTag: 'North America',
          aiAssisted: false,
          baselineVersionId: null,
          latestVersionId: null,
          tags: ['remote', 'distributed teams'],
          shareUrl: 'https://share.gigvora.com/portfolio/leo-freelancer/cv/us-remote',
          metadata: { variantOf: 1, interviewPrep: true },
          createdAt: fourteenDaysAgo,
          updatedAt: threeDaysAgo,
        },
        {
          id: 4,
          userId,
          documentType: 'cover_letter',
          title: 'Lead Product Cover Letter Template',
          slug: 'leo-freelancer-cover-letter-template',
          status: 'approved',
          roleTag: 'Product Manager',
          geographyTag: 'Global',
          aiAssisted: true,
          baselineVersionId: null,
          latestVersionId: null,
          tags: ['leadership', 'storytelling'],
          shareUrl: 'https://share.gigvora.com/portfolio/leo-freelancer/cover-letter/lead',
          metadata: { reusable: true, tonePreset: 'warm' },
          createdAt: sevenDaysAgo,
          updatedAt: yesterday,
        },
        {
          id: 5,
          userId,
          documentType: 'cover_letter',
          title: 'Fintech Venture Cover Letter',
          slug: 'leo-freelancer-cover-letter-fintech',
          status: 'in_review',
          roleTag: 'Product Manager',
          geographyTag: 'APAC',
          aiAssisted: true,
          baselineVersionId: null,
          latestVersionId: null,
          tags: ['fintech', 'growth'],
          shareUrl: 'https://share.gigvora.com/portfolio/leo-freelancer/cover-letter/fintech',
          metadata: { variantOf: 4, tonePreset: 'executive' },
          createdAt: threeDaysAgo,
          updatedAt: now,
        },
        {
          id: 6,
          userId,
          documentType: 'portfolio',
          title: 'Case Study: Marketplace Transformation',
          slug: 'leo-freelancer-case-study-marketplace',
          status: 'approved',
          roleTag: 'Product Manager',
          geographyTag: 'Global',
          aiAssisted: false,
          baselineVersionId: null,
          latestVersionId: null,
          tags: ['marketplace', 'transformation'],
          shareUrl: 'https://share.gigvora.com/portfolio/leo-freelancer/case-studies/marketplace',
          metadata: { impact: 'GMV +42%', approvedForPublic: true },
          createdAt: thirtyDaysAgo,
          updatedAt: sevenDaysAgo,
        },
      ];

      await queryInterface.bulkInsert('career_documents', documents, { transaction });

      const versions = [
        {
          id: 1,
          documentId: 1,
          versionNumber: 1,
          title: 'Baseline Product Manager CV v1',
          summary: 'Baseline CV outlining core product leadership achievements.',
          contentPath: 's3://gigvora-documents/users/2/cv/baseline-v1.pdf',
          aiSummary: 'Highlights marketplace launch and cross-functional leadership.',
          changeSummary: 'Initial baseline authored from mentoring session.',
          diffHighlights: { additions: ['Introduced mission-driven personal summary.'] },
          metrics: {
            aiCopyScore: 0.74,
            recruiterAnnotations: [
              { reviewer: recruiterId, note: 'Emphasise ARR impact in summary.' },
            ],
            keywords: ['roadmap', 'stakeholder'],
          },
          aiSuggestionUsed: true,
          approvalStatus: 'approved',
          createdById: userId,
          approvedById: recruiterId,
          approvedAt: thirtyDaysAgo,
          createdAt: thirtyDaysAgo,
          updatedAt: thirtyDaysAgo,
        },
        {
          id: 2,
          documentId: 1,
          versionNumber: 2,
          title: 'Baseline Product Manager CV v2',
          summary: 'Updated baseline with quantified adoption metrics and employer branding.',
          contentPath: 's3://gigvora-documents/users/2/cv/baseline-v2.pdf',
          aiSummary: 'Adds 12-month adoption metrics and ecosystem partnerships.',
          changeSummary: 'Refined summary and emphasised adoption metrics.',
          diffHighlights: ['+ Added adoption KPIs', '+ Refined leadership narrative'],
          metrics: {
            aiCopyScore: 0.82,
            recruiterAnnotations: [
              { reviewer: recruiterId, note: 'Great focus on activation; keep for enterprise variants.' },
            ],
            trackedEdits: 7,
          },
          aiSuggestionUsed: true,
          approvalStatus: 'approved',
          createdById: userId,
          approvedById: recruiterId,
          approvedAt: twoDaysAgo,
          createdAt: sevenDaysAgo,
          updatedAt: twoDaysAgo,
        },
        {
          id: 3,
          documentId: 2,
          versionNumber: 1,
          title: 'Fintech Scaleup CV v1',
          summary: 'Tailored for fintech scaleups with compliance and payments delivery.',
          contentPath: 's3://gigvora-documents/users/2/cv/fintech-v1.pdf',
          aiSummary: 'Positions global payments experience and PSD2 compliance.',
          changeSummary: 'Converted baseline into fintech positioning.',
          diffHighlights: ['+ Added PSD2 compliance achievements'],
          metrics: {
            aiCopyScore: 0.69,
            recruiterAnnotations: [],
            keywords: ['fintech', 'payments', 'compliance'],
          },
          aiSuggestionUsed: true,
          approvalStatus: 'pending_review',
          createdById: userId,
          approvedById: null,
          approvedAt: null,
          createdAt: sevenDaysAgo,
          updatedAt: fiveDaysAgo,
        },
        {
          id: 4,
          documentId: 2,
          versionNumber: 2,
          title: 'Fintech Scaleup CV v2',
          summary: 'Incorporated growth metrics and banking partnerships.',
          contentPath: 's3://gigvora-documents/users/2/cv/fintech-v2.pdf',
          aiSummary: 'Strengthens banking alliance outcomes and regulatory readiness.',
          changeSummary: 'Added growth metrics and emphasised regulatory collaboration.',
          diffHighlights: { updates: ['+ Added 26% activation improvement KPI'] },
          metrics: {
            aiCopyScore: 0.78,
            recruiterAnnotations: [
              { reviewer: recruiterId, note: 'Ready for APAC payments hiring sprint.' },
            ],
            trackedEdits: 5,
          },
          aiSuggestionUsed: true,
          approvalStatus: 'pending_review',
          createdById: userId,
          approvedById: null,
          approvedAt: null,
          createdAt: threeDaysAgo,
          updatedAt: yesterday,
        },
        {
          id: 5,
          documentId: 3,
          versionNumber: 1,
          title: 'Remote US Product CV v1',
          summary: 'Remote-first CV emphasising distributed leadership and async rituals.',
          contentPath: 's3://gigvora-documents/users/2/cv/us-remote-v1.pdf',
          aiSummary: 'Highlights remote ceremonies and fully-distributed roadmap wins.',
          changeSummary: 'Created US variant with remote work evidence.',
          diffHighlights: ['+ Added async ritual showcase', '+ Added remote onboarding metrics'],
          metrics: {
            aiCopyScore: 0.76,
            recruiterAnnotations: [
              { reviewer: mentorId, note: 'Include testimonial snippet for remote onboarding.' },
            ],
          },
          aiSuggestionUsed: false,
          approvalStatus: 'approved',
          createdById: userId,
          approvedById: mentorId,
          approvedAt: threeDaysAgo,
          createdAt: fiveDaysAgo,
          updatedAt: threeDaysAgo,
        },
        {
          id: 6,
          documentId: 4,
          versionNumber: 1,
          title: 'Lead Product Cover Letter v1',
          summary: 'Template leveraging reusable story blocks and warm tone guidance.',
          contentPath: 's3://gigvora-documents/users/2/cover-letters/lead-template-v1.docx',
          aiSummary: 'Balances leadership narrative with quantifiable growth metrics.',
          changeSummary: 'Composed template using approved story blocks.',
          diffHighlights: ['+ Added leadership spotlight story block'],
          metrics: {
            toneScore: 0.86,
            qualityScore: 0.9,
            storyBlocksUsed: [1, 2],
            aiCopyScore: 0.81,
          },
          aiSuggestionUsed: true,
          approvalStatus: 'approved',
          createdById: userId,
          approvedById: mentorId,
          approvedAt: yesterday,
          createdAt: fiveDaysAgo,
          updatedAt: yesterday,
        },
        {
          id: 7,
          documentId: 5,
          versionNumber: 1,
          title: 'Fintech Venture Cover Letter v1',
          summary: 'Variant emphasising fintech GTM and regulatory partnership wins.',
          contentPath: 's3://gigvora-documents/users/2/cover-letters/fintech-venture-v1.docx',
          aiSummary: 'Aligns growth story with compliance readiness for venture-backed teams.',
          changeSummary: 'Adapted template to fintech venture tone and metrics.',
          diffHighlights: { updates: ['+ Integrated fintech traction story block'] },
          metrics: {
            toneScore: 0.79,
            qualityScore: 0.84,
            storyBlocksUsed: [1, 3],
            aiCopyScore: 0.8,
          },
          aiSuggestionUsed: true,
          approvalStatus: 'pending_review',
          createdById: userId,
          approvedById: null,
          approvedAt: null,
          createdAt: twoDaysAgo,
          updatedAt: now,
        },
        {
          id: 8,
          documentId: 6,
          versionNumber: 1,
          title: 'Marketplace Transformation Case Study v1',
          summary: 'Deep-dive case study covering marketplace GMV uplift and trust redesign.',
          contentPath: 's3://gigvora-documents/users/2/case-studies/marketplace.pdf',
          aiSummary: 'Details 42% GMV growth, NPS +18, and trust center overhaul.',
          changeSummary: 'Initial draft published to personal brand hub.',
          diffHighlights: ['+ Added testimonial from VP Growth'],
          metrics: {
            readTimeMinutes: 6,
            storyBlocksUsed: [2],
          },
          aiSuggestionUsed: false,
          approvalStatus: 'approved',
          createdById: userId,
          approvedById: mentorId,
          approvedAt: sevenDaysAgo,
          createdAt: tenDaysAgo,
          updatedAt: sevenDaysAgo,
        },
      ];

      await queryInterface.bulkInsert('career_document_versions', versions, { transaction });

      await queryInterface.bulkUpdate(
        'career_documents',
        { baselineVersionId: 1, latestVersionId: 2, updatedAt: twoDaysAgo },
        { id: 1 },
        { transaction },
      );
      await queryInterface.bulkUpdate(
        'career_documents',
        { baselineVersionId: 3, latestVersionId: 4, updatedAt: yesterday },
        { id: 2 },
        { transaction },
      );
      await queryInterface.bulkUpdate(
        'career_documents',
        { baselineVersionId: 5, latestVersionId: 5, updatedAt: threeDaysAgo },
        { id: 3 },
        { transaction },
      );
      await queryInterface.bulkUpdate(
        'career_documents',
        { baselineVersionId: 6, latestVersionId: 6, updatedAt: yesterday },
        { id: 4 },
        { transaction },
      );
      await queryInterface.bulkUpdate(
        'career_documents',
        { baselineVersionId: 7, latestVersionId: 7, updatedAt: now },
        { id: 5 },
        { transaction },
      );
      await queryInterface.bulkUpdate(
        'career_documents',
        { baselineVersionId: 8, latestVersionId: 8, updatedAt: sevenDaysAgo },
        { id: 6 },
        { transaction },
      );

      const collaborators = [
        {
          id: 1,
          documentId: 1,
          collaboratorId: mentorId,
          role: 'mentor',
          permissions: { canComment: true, canApprove: true },
          lastActiveAt: twoDaysAgo,
          addedAt: thirtyDaysAgo,
          createdAt: thirtyDaysAgo,
          updatedAt: twoDaysAgo,
        },
        {
          id: 2,
          documentId: 2,
          collaboratorId: recruiterId,
          role: 'reviewer',
          permissions: { canComment: true, canRequestChanges: true },
          lastActiveAt: yesterday,
          addedAt: sevenDaysAgo,
          createdAt: sevenDaysAgo,
          updatedAt: yesterday,
        },
        {
          id: 3,
          documentId: 4,
          collaboratorId: mentorId,
          role: 'mentor',
          permissions: { canComment: true },
          lastActiveAt: yesterday,
          addedAt: fiveDaysAgo,
          createdAt: fiveDaysAgo,
          updatedAt: yesterday,
        },
      ];

      await queryInterface.bulkInsert('career_document_collaborators', collaborators, { transaction });

      const exports = [
        {
          id: 1,
          documentId: 1,
          versionId: 2,
          format: 'pdf',
          exportedById: userId,
          exportedAt: twoDaysAgo,
          deliveryUrl: 'https://deliver.gigvora.com/documents/cv-baseline-v2.pdf',
          metadata: { trigger: 'one_click', destination: 'download' },
          createdAt: twoDaysAgo,
          updatedAt: twoDaysAgo,
        },
        {
          id: 2,
          documentId: 2,
          versionId: 4,
          format: 'docx',
          exportedById: userId,
          exportedAt: yesterday,
          deliveryUrl: 'https://deliver.gigvora.com/documents/cv-fintech-v2.docx',
          metadata: { trigger: 'share', destination: 'email', recipient: 'recruiter@fintechlabs.io' },
          createdAt: yesterday,
          updatedAt: yesterday,
        },
        {
          id: 3,
          documentId: 4,
          versionId: 6,
          format: 'pdf',
          exportedById: mentorId,
          exportedAt: yesterday,
          deliveryUrl: 'https://deliver.gigvora.com/documents/cover-letter-lead.pdf',
          metadata: { tone: 'warm', collaborative: true },
          createdAt: yesterday,
          updatedAt: yesterday,
        },
        {
          id: 4,
          documentId: 5,
          versionId: 7,
          format: 'web',
          exportedById: userId,
          exportedAt: now,
          deliveryUrl: 'https://pages.gigvora.com/leo-freelancer/cover-letter/fintech',
          metadata: { trigger: 'profile_sync', destination: 'gigvora_profile' },
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('career_document_exports', exports, { transaction });

      const analytics = [
        {
          id: 1,
          documentId: 1,
          versionId: 2,
          viewerId: recruiterId,
          viewerType: 'recruiter',
          opens: 18,
          downloads: 6,
          shares: 2,
          lastOpenedAt: yesterday,
          lastDownloadedAt: twoDaysAgo,
          geographyTag: 'EMEA',
          seniorityTag: 'Senior IC',
          outcomes: { interviews: 3, offers: 1 },
          createdAt: twoDaysAgo,
          updatedAt: yesterday,
        },
        {
          id: 2,
          documentId: 2,
          versionId: 4,
          viewerId: null,
          viewerType: 'recruiter',
          opens: 12,
          downloads: 5,
          shares: 1,
          lastOpenedAt: yesterday,
          lastDownloadedAt: yesterday,
          geographyTag: 'APAC',
          seniorityTag: 'Lead',
          outcomes: { interviews: 2, offers: 0 },
          createdAt: yesterday,
          updatedAt: yesterday,
        },
        {
          id: 3,
          documentId: 3,
          versionId: 5,
          viewerId: null,
          viewerType: 'recruiter',
          opens: 9,
          downloads: 3,
          shares: 0,
          lastOpenedAt: threeDaysAgo,
          lastDownloadedAt: threeDaysAgo,
          geographyTag: 'North America',
          seniorityTag: 'Director',
          outcomes: { interviews: 2, offers: 0 },
          createdAt: threeDaysAgo,
          updatedAt: threeDaysAgo,
        },
        {
          id: 4,
          documentId: 4,
          versionId: 6,
          viewerId: recruiterId,
          viewerType: 'recruiter',
          opens: 9,
          downloads: 3,
          shares: 1,
          lastOpenedAt: yesterday,
          lastDownloadedAt: yesterday,
          geographyTag: 'Global',
          seniorityTag: 'Senior IC',
          outcomes: { interviews: 1, offers: 0 },
          createdAt: yesterday,
          updatedAt: yesterday,
        },
        {
          id: 5,
          documentId: 5,
          versionId: 7,
          viewerId: mentorId,
          viewerType: 'mentor',
          opens: 6,
          downloads: 0,
          shares: 0,
          lastOpenedAt: now,
          lastDownloadedAt: null,
          geographyTag: 'APAC',
          seniorityTag: 'Senior IC',
          outcomes: { feedbackScore: 0.92 },
          createdAt: now,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('career_document_analytics', analytics, { transaction });

      const storyBlocks = [
        {
          id: 1,
          userId,
          title: 'Product Transformation Story',
          tone: 'executive',
          content:
            'Scaled multi-sided marketplace from seed to Series B, orchestrating roadmap, hiring pods, and experiment velocity.',
          metrics: { avgImpactScore: 0.86, reuseCount: 7 },
          approvalStatus: 'approved',
          useCount: 7,
          lastUsedAt: yesterday,
          createdAt: thirtyDaysAgo,
          updatedAt: yesterday,
        },
        {
          id: 2,
          userId,
          title: 'Growth Metrics Highlight',
          tone: 'bold',
          content: 'Grew activation to 47% within 60 days by rebuilding onboarding and GTM rituals.',
          metrics: { avgReplyRate: 0.64, reuseCount: 5 },
          approvalStatus: 'approved',
          useCount: 5,
          lastUsedAt: twoDaysAgo,
          createdAt: fourteenDaysAgo,
          updatedAt: twoDaysAgo,
        },
        {
          id: 3,
          userId,
          title: 'Culture Fit Reflection',
          tone: 'warm',
          content: 'Champion inclusive rituals and async documentation to empower global teams.',
          metrics: { avgToneScore: 0.81 },
          approvalStatus: 'draft',
          useCount: 2,
          lastUsedAt: threeDaysAgo,
          createdAt: sevenDaysAgo,
          updatedAt: threeDaysAgo,
        },
      ];

      await queryInterface.bulkInsert('career_story_blocks', storyBlocks, { transaction });

      const brandAssets = [
        {
          id: 1,
          userId,
          assetType: 'testimonial',
          title: 'Founder Testimonial',
          description: '“Leo rebuilt our product culture and doubled adoption within a quarter.”',
          mediaUrl: 'https://cdn.gigvora.com/brand/leo/testimonial-founder.mp4',
          thumbnailUrl: 'https://cdn.gigvora.com/brand/leo/testimonial-founder.jpg',
          status: 'published',
          featured: true,
          approvalsStatus: 'approved',
          approvedById: mentorId,
          approvedAt: twoDaysAgo,
          tags: ['product strategy', 'founder praise'],
          metrics: { views: 320, conversions: 5 },
          metadata: { source: 'Gigvora Launchpad' },
          createdAt: fourteenDaysAgo,
          updatedAt: twoDaysAgo,
        },
        {
          id: 2,
          userId,
          assetType: 'case_study',
          title: 'Enterprise Payments Rollout',
          description: 'Case study covering enterprise payments redesign and compliance uplift.',
          mediaUrl: 'https://cdn.gigvora.com/brand/leo/case-study-payments.pdf',
          thumbnailUrl: 'https://cdn.gigvora.com/brand/leo/case-study-payments.jpg',
          status: 'published',
          featured: false,
          approvalsStatus: 'approved',
          approvedById: mentorId,
          approvedAt: sevenDaysAgo,
          tags: ['fintech', 'enterprise'],
          metrics: { reads: 124, shares: 8 },
          metadata: { linkedDocumentId: 2 },
          createdAt: tenDaysAgo,
          updatedAt: sevenDaysAgo,
        },
        {
          id: 3,
          userId,
          assetType: 'banner',
          title: 'Personal Brand Banner',
          description: 'Hero banner used across Gigvora public profile and proposals.',
          mediaUrl: 'https://cdn.gigvora.com/brand/leo/banner-2024.png',
          thumbnailUrl: 'https://cdn.gigvora.com/brand/leo/banner-thumb.png',
          status: 'published',
          featured: true,
          approvalsStatus: 'approved',
          approvedById: mentorId,
          approvedAt: yesterday,
          tags: ['branding', 'profile'],
          metrics: { impressions: 540 },
          metadata: { dimensions: '1440x540' },
          createdAt: sevenDaysAgo,
          updatedAt: yesterday,
        },
        {
          id: 4,
          userId,
          assetType: 'video',
          title: 'Video Introduction',
          description: '90-second video intro embedded on Gigvora profile.',
          mediaUrl: 'https://cdn.gigvora.com/brand/leo/video-intro.mp4',
          thumbnailUrl: 'https://cdn.gigvora.com/brand/leo/video-intro.jpg',
          status: 'published',
          featured: false,
          approvalsStatus: 'approved',
          approvedById: mentorId,
          approvedAt: yesterday,
          tags: ['video', 'introduction'],
          metrics: { viewTimeSeconds: 450 },
          metadata: { transcriptAvailable: true },
          createdAt: sevenDaysAgo,
          updatedAt: yesterday,
        },
        {
          id: 5,
          userId,
          assetType: 'press',
          title: 'Press Mention – Future of Work Weekly',
          description: 'Feature in Future of Work Weekly spotlighting Gigvora launchpad alumni.',
          mediaUrl: 'https://press.futureofworkweekly.com/articles/leo-freelancer',
          thumbnailUrl: null,
          status: 'draft',
          featured: false,
          approvalsStatus: 'in_review',
          approvedById: null,
          approvedAt: null,
          tags: ['press', 'thought leadership'],
          metrics: { potentialReach: 18000 },
          metadata: { submissionDeadline: now.toISOString() },
          createdAt: twoDaysAgo,
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('career_brand_assets', brandAssets, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const documentIds = [1, 2, 3, 4, 5, 6];
      const storyBlockIds = [1, 2, 3];
      const brandAssetIds = [1, 2, 3, 4, 5];

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
        'career_story_blocks',
        { id: { [Op.in]: storyBlockIds } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'career_brand_assets',
        { id: { [Op.in]: brandAssetIds } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'career_documents',
        { id: { [Op.in]: documentIds } },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
