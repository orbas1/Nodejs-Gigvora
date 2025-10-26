'use strict';

const POLICY_CODE = 'marketing_communications';
const POLICY_TITLE = 'Marketing Communications';
const POLICY_DESCRIPTION =
  'Allows Gigvora to send product updates, feature announcements, event invitations, and personalised recommendations to members who opt in.';
const POLICY_SUMMARY =
  'Stay in the loop with curated Gigvora updates, product launches, event invites, and community highlights tailored to your persona.';
const SEED_ACTOR = 'seed:auth-marketing-consent';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      let policyId = await queryInterface.rawSelect(
        'consent_policies',
        { where: { code: POLICY_CODE }, transaction },
        ['id'],
      );

      if (!policyId) {
        await queryInterface.bulkInsert(
          'consent_policies',
          [
            {
              code: POLICY_CODE,
              title: POLICY_TITLE,
              description: POLICY_DESCRIPTION,
              audience: 'user',
              region: 'global',
              legalBasis: 'consent',
              required: false,
              revocable: true,
              retentionPeriodDays: 1095,
              metadata: JSON.stringify({ channels: ['email', 'in_app'], category: 'marketing' }),
              createdBy: SEED_ACTOR,
              updatedBy: SEED_ACTOR,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        policyId = await queryInterface.rawSelect(
          'consent_policies',
          { where: { code: POLICY_CODE }, transaction },
          ['id'],
        );
      } else {
        await queryInterface.bulkUpdate(
          'consent_policies',
          {
            title: POLICY_TITLE,
            description: POLICY_DESCRIPTION,
            legalBasis: 'consent',
            retentionPeriodDays: 1095,
            metadata: JSON.stringify({ channels: ['email', 'in_app'], category: 'marketing' }),
            updatedBy: SEED_ACTOR,
            updatedAt: now,
          },
          { id: policyId },
          { transaction },
        );
      }

      if (!policyId) {
        throw new Error('Unable to seed marketing communications consent policy.');
      }

      const existingVersionId = await queryInterface.rawSelect(
        'consent_policy_versions',
        { where: { policyId, version: 1 }, transaction },
        ['id'],
      );

      if (!existingVersionId) {
        await queryInterface.bulkInsert(
          'consent_policy_versions',
          [
            {
              policyId,
              version: 1,
              documentUrl: 'https://compliance.gigvora.com/policies/marketing-communications',
              content: POLICY_DESCRIPTION,
              summary: POLICY_SUMMARY,
              effectiveAt: now,
              supersededAt: null,
              createdBy: SEED_ACTOR,
              metadata: JSON.stringify({ channels: ['email', 'in_app'], preferenceKey: 'marketing_updates' }),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      } else {
        await queryInterface.bulkUpdate(
          'consent_policy_versions',
          {
            documentUrl: 'https://compliance.gigvora.com/policies/marketing-communications',
            content: POLICY_DESCRIPTION,
            summary: POLICY_SUMMARY,
            effectiveAt: now,
            supersededAt: null,
            metadata: JSON.stringify({ channels: ['email', 'in_app'], preferenceKey: 'marketing_updates' }),
            updatedAt: now,
          },
          { id: existingVersionId },
          { transaction },
        );
      }

      const versionId = await queryInterface.rawSelect(
        'consent_policy_versions',
        { where: { policyId, version: 1 }, transaction },
        ['id'],
      );

      if (!versionId) {
        throw new Error('Unable to seed marketing communications consent policy version.');
      }

      await queryInterface.bulkUpdate(
        'consent_policies',
        { activeVersionId: versionId, updatedAt: now },
        { id: policyId },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const policyId = await queryInterface.rawSelect(
        'consent_policies',
        { where: { code: POLICY_CODE }, transaction },
        ['id'],
      );

      if (!policyId) {
        return;
      }

      await queryInterface.bulkDelete('consent_audit_events', { policyId }, { transaction });
      await queryInterface.bulkDelete('user_consents', { policyId }, { transaction });
      await queryInterface.bulkDelete('consent_policy_versions', { policyId }, { transaction });
      await queryInterface.bulkDelete('consent_policies', { id: policyId }, { transaction });
    });
  },
};
