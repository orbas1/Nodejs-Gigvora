'use strict';

const createEnum = async (queryInterface, enumName, values) => {
  const dialect = queryInterface.sequelize.getDialect();
  if ((dialect === 'postgres' || dialect === 'postgresql') && values?.length) {
    const escapedValues = values.map((value) => `'${value.replace(/'/g, "''")}'`).join(', ');
    await queryInterface.sequelize.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName}') THEN CREATE TYPE "${enumName}" AS ENUM (${escapedValues}); END IF; END $$;`,
    );
  }
};

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    const IDENTITY_STATUSES = ['pending', 'submitted', 'in_review', 'verified', 'rejected', 'expired'];
    const CORPORATE_STATUSES = [
      'pending',
      'submitted',
      'in_review',
      'verified',
      'rejected',
      'requires_update',
      'suspended',
    ];
    const QUALIFICATION_STATUSES = ['unverified', 'pending_review', 'verified', 'rejected'];
    const WALLET_ACCOUNT_STATUSES = ['pending', 'active', 'suspended', 'closed'];
    const WALLET_ACCOUNT_TYPES = ['user', 'freelancer', 'company', 'agency'];
    const WALLET_LEDGER_ENTRY_TYPES = ['credit', 'debit', 'hold', 'release', 'adjustment'];
    const ESCROW_INTEGRATIONS = ['stripe', 'escrow_com'];

    await createEnum(queryInterface, 'enum_identity_verifications_status', IDENTITY_STATUSES);
    await createEnum(queryInterface, 'enum_corporate_verifications_status', CORPORATE_STATUSES);
    await createEnum(queryInterface, 'enum_qualification_credentials_status', QUALIFICATION_STATUSES);
    await createEnum(queryInterface, 'enum_wallet_accounts_status', WALLET_ACCOUNT_STATUSES);
    await createEnum(queryInterface, 'enum_wallet_accounts_accountType', WALLET_ACCOUNT_TYPES);
    await createEnum(queryInterface, 'enum_wallet_accounts_custodyProvider', ESCROW_INTEGRATIONS);
    await createEnum(queryInterface, 'enum_wallet_ledger_entries_entryType', WALLET_LEDGER_ENTRY_TYPES);

    await queryInterface.createTable('identity_verifications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      profileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM(...IDENTITY_STATUSES),
        allowNull: false,
        defaultValue: 'pending',
      },
      verificationProvider: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'manual_review' },
      typeOfId: { type: Sequelize.STRING(120), allowNull: true },
      idNumberLast4: { type: Sequelize.STRING(16), allowNull: true },
      issuingCountry: { type: Sequelize.STRING(4), allowNull: true },
      issuedAt: { type: Sequelize.DATE, allowNull: true },
      expiresAt: { type: Sequelize.DATE, allowNull: true },
      documentFrontKey: { type: Sequelize.STRING(500), allowNull: true },
      documentBackKey: { type: Sequelize.STRING(500), allowNull: true },
      selfieKey: { type: Sequelize.STRING(500), allowNull: true },
      fullName: { type: Sequelize.STRING(255), allowNull: false },
      dateOfBirth: { type: Sequelize.DATE, allowNull: false },
      addressLine1: { type: Sequelize.STRING(255), allowNull: false },
      addressLine2: { type: Sequelize.STRING(255), allowNull: true },
      city: { type: Sequelize.STRING(120), allowNull: false },
      state: { type: Sequelize.STRING(120), allowNull: true },
      postalCode: { type: Sequelize.STRING(40), allowNull: false },
      country: { type: Sequelize.STRING(4), allowNull: false },
      reviewNotes: { type: Sequelize.TEXT, allowNull: true },
      declinedReason: { type: Sequelize.TEXT, allowNull: true },
      reviewerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      submittedAt: { type: Sequelize.DATE, allowNull: true },
      reviewedAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('identity_verifications', ['userId']);
    await queryInterface.addIndex('identity_verifications', ['profileId']);
    await queryInterface.addIndex('identity_verifications', ['status']);
    await queryInterface.addIndex('identity_verifications', ['verificationProvider']);

    await queryInterface.createTable('corporate_verifications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      ownerType: {
        type: Sequelize.ENUM('company', 'agency'),
        allowNull: false,
        defaultValue: 'company',
      },
      companyProfileId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'company_profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      agencyProfileId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'agency_profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM(...CORPORATE_STATUSES),
        allowNull: false,
        defaultValue: 'pending',
      },
      companyName: { type: Sequelize.STRING(255), allowNull: false },
      registrationNumber: { type: Sequelize.STRING(160), allowNull: true },
      registrationCountry: { type: Sequelize.STRING(4), allowNull: true },
      registeredAddressLine1: { type: Sequelize.STRING(255), allowNull: false },
      registeredAddressLine2: { type: Sequelize.STRING(255), allowNull: true },
      registeredCity: { type: Sequelize.STRING(120), allowNull: false },
      registeredState: { type: Sequelize.STRING(120), allowNull: true },
      registeredPostalCode: { type: Sequelize.STRING(40), allowNull: false },
      registeredCountry: { type: Sequelize.STRING(4), allowNull: false },
      registrationDocumentKey: { type: Sequelize.STRING(500), allowNull: true },
      authorizationDocumentKey: { type: Sequelize.STRING(500), allowNull: true },
      ownershipEvidenceKey: { type: Sequelize.STRING(500), allowNull: true },
      domesticComplianceAttestation: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      domesticComplianceNotes: { type: Sequelize.TEXT, allowNull: true },
      authorizedRepresentativeName: { type: Sequelize.STRING(255), allowNull: false },
      authorizedRepresentativeEmail: { type: Sequelize.STRING(255), allowNull: false },
      authorizedRepresentativeTitle: { type: Sequelize.STRING(255), allowNull: true },
      authorizationExpiresAt: { type: Sequelize.DATE, allowNull: true },
      submittedAt: { type: Sequelize.DATE, allowNull: true },
      reviewedAt: { type: Sequelize.DATE, allowNull: true },
      reviewerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      reviewNotes: { type: Sequelize.TEXT, allowNull: true },
      declineReason: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('corporate_verifications', ['ownerType']);
    await queryInterface.addIndex('corporate_verifications', ['companyProfileId']);
    await queryInterface.addIndex('corporate_verifications', ['agencyProfileId']);
    await queryInterface.addIndex('corporate_verifications', ['status']);

    await queryInterface.createTable('qualification_credentials', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      profileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      sourceType: {
        type: Sequelize.ENUM('transcript', 'certificate', 'portfolio', 'other'),
        allowNull: false,
        defaultValue: 'certificate',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      issuer: { type: Sequelize.STRING(255), allowNull: true },
      issuedAt: { type: Sequelize.DATE, allowNull: true },
      expiresAt: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM(...QUALIFICATION_STATUSES),
        allowNull: false,
        defaultValue: 'unverified',
      },
      verificationNotes: { type: Sequelize.TEXT, allowNull: true },
      documentKey: { type: Sequelize.STRING(500), allowNull: true },
      evidenceMetadata: { type: jsonType, allowNull: true },
      lastReviewedAt: { type: Sequelize.DATE, allowNull: true },
      reviewerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('qualification_credentials', ['userId']);
    await queryInterface.addIndex('qualification_credentials', ['profileId']);
    await queryInterface.addIndex('qualification_credentials', ['status']);
    await queryInterface.addIndex('qualification_credentials', ['sourceType']);

    await queryInterface.createTable('wallet_accounts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      profileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      accountType: {
        type: Sequelize.ENUM(...WALLET_ACCOUNT_TYPES),
        allowNull: false,
        defaultValue: 'user',
      },
      custodyProvider: {
        type: Sequelize.ENUM(...ESCROW_INTEGRATIONS),
        allowNull: false,
        defaultValue: 'stripe',
      },
      providerAccountId: { type: Sequelize.STRING(160), allowNull: true },
      status: {
        type: Sequelize.ENUM(...WALLET_ACCOUNT_STATUSES),
        allowNull: false,
        defaultValue: 'pending',
      },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      currentBalance: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      availableBalance: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      pendingHoldBalance: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      lastReconciledAt: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('wallet_accounts', ['userId']);
    await queryInterface.addIndex('wallet_accounts', ['profileId']);
    await queryInterface.addIndex('wallet_accounts', ['accountType']);
    await queryInterface.addIndex('wallet_accounts', ['custodyProvider']);
    await queryInterface.addIndex('wallet_accounts', ['status']);
    await queryInterface.addConstraint('wallet_accounts', {
      type: 'unique',
      name: 'wallet_accounts_profile_accountType_unique',
      fields: ['profileId', 'accountType'],
    });

    await queryInterface.createTable('wallet_ledger_entries', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      walletAccountId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'wallet_accounts', key: 'id' },
        onDelete: 'CASCADE',
      },
      entryType: {
        type: Sequelize.ENUM(...WALLET_LEDGER_ENTRY_TYPES),
        allowNull: false,
      },
      amount: { type: Sequelize.DECIMAL(18, 4), allowNull: false },
      currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      reference: { type: Sequelize.STRING(160), allowNull: false },
      externalReference: { type: Sequelize.STRING(160), allowNull: true },
      description: { type: Sequelize.STRING(500), allowNull: true },
      initiatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      occurredAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      balanceAfter: { type: Sequelize.DECIMAL(18, 4), allowNull: false },
      metadata: { type: jsonType, allowNull: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('wallet_ledger_entries', ['walletAccountId']);
    await queryInterface.addIndex('wallet_ledger_entries', ['reference'], {
      unique: true,
      name: 'wallet_ledger_entries_reference_unique',
    });
    await queryInterface.addIndex('wallet_ledger_entries', ['entryType']);

    await queryInterface.addColumn('escrow_accounts', 'walletAccountId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'wallet_accounts', key: 'id' },
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('escrow_accounts', ['walletAccountId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('escrow_accounts', ['walletAccountId']);
    await queryInterface.removeColumn('escrow_accounts', 'walletAccountId');

    await queryInterface.dropTable('wallet_ledger_entries');
    await queryInterface.dropTable('wallet_accounts');
    await queryInterface.dropTable('qualification_credentials');
    await queryInterface.dropTable('corporate_verifications');
    await queryInterface.dropTable('identity_verifications');

    await dropEnum(queryInterface, 'enum_wallet_ledger_entries_entryType');
    await dropEnum(queryInterface, 'enum_wallet_accounts_custodyProvider');
    await dropEnum(queryInterface, 'enum_wallet_accounts_accountType');
    await dropEnum(queryInterface, 'enum_wallet_accounts_status');
    await dropEnum(queryInterface, 'enum_qualification_credentials_status');
    await dropEnum(queryInterface, 'enum_corporate_verifications_status');
    await dropEnum(queryInterface, 'enum_identity_verifications_status');
  },
};
