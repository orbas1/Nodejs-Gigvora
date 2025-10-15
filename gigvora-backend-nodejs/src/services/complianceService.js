import { randomUUID } from 'crypto';
import {
  IdentityVerification,
  CorporateVerification,
  QualificationCredential,
  WalletAccount,
  WalletLedgerEntry,
  EscrowAccount,
  ID_VERIFICATION_STATUSES,
  CORPORATE_VERIFICATION_STATUSES,
  QUALIFICATION_CREDENTIAL_STATUSES,
  WALLET_ACCOUNT_TYPES,
  WALLET_LEDGER_ENTRY_TYPES,
  ESCROW_INTEGRATION_PROVIDERS,
} from '../models/index.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { assertPaymentInfrastructureOperational } from './runtimeDependencyGuard.js';

const CLOSED_LOOP_CLASSIFICATION = 'closed_loop_non_cash';

function ensureHttpStatus(error) {
  if (error && error.statusCode && !error.status) {
    error.status = error.statusCode;
  }
  return error;
}

function normalizeId(value, label) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw ensureHttpStatus(new ValidationError(`${label} must be a positive integer.`));
  }
  return numeric;
}

function sanitizeString(
  value,
  { required = false, maxLength = 255, defaultValue = null, toUpperCase = false, toLowerCase = false } = {},
) {
  if (value == null) {
    if (required) {
      throw ensureHttpStatus(new ValidationError('A required field was not provided.'));
    }
    return defaultValue;
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    if (required) {
      throw ensureHttpStatus(new ValidationError('A required field was not provided.'));
    }
    return defaultValue;
  }
  let normalized = trimmed.slice(0, maxLength);
  if (toUpperCase) {
    normalized = normalized.toUpperCase();
  } else if (toLowerCase) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
}

function optionalDate(value, label, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) {
      throw ensureHttpStatus(new ValidationError(`${label} is required.`));
    }
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw ensureHttpStatus(new ValidationError(`${label} is not a valid date.`));
  }
  return date;
}

function assertInEnum(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw ensureHttpStatus(new ValidationError(`${label} must be one of: ${allowed.join(', ')}.`));
  }
  return value;
}

function safeNumber(value) {
  if (value == null) {
    return 0;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function generateLedgerReference(prefix = 'WL') {
  return `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 22).toUpperCase()}`;
}

function ensurePlainObject(value, label) {
  if (value == null) {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw ensureHttpStatus(new ValidationError(`${label} must be an object.`));
  }
  return { ...value };
}

function resolveCustodyProvider(accountType, requestedProvider) {
  if (requestedProvider) {
    return assertInEnum(requestedProvider, ESCROW_INTEGRATION_PROVIDERS, 'custodyProvider');
  }
  if (accountType === 'company' || accountType === 'agency') {
    return 'escrow_com';
  }
  return 'stripe';
}

export async function ensureWalletAccount({
  userId,
  profileId,
  accountType,
  custodyProvider,
  currencyCode = 'USD',
  transaction,
  logger,
  requestId,
  forceRefresh = false,
} = {}) {
  const numericUserId = normalizeId(userId, 'userId');
  const numericProfileId = normalizeId(profileId, 'profileId');
  const normalizedType = assertInEnum(accountType, WALLET_ACCOUNT_TYPES, 'accountType');
  const provider = resolveCustodyProvider(normalizedType, custodyProvider);

  await assertPaymentInfrastructureOperational({
    feature: `wallet_account:${normalizedType}`,
    logger,
    requestId,
    forceRefresh,
  });

  const [account] = await WalletAccount.findOrCreate({
    where: { userId: numericUserId, profileId: numericProfileId, accountType: normalizedType },
    defaults: {
      userId: numericUserId,
      profileId: numericProfileId,
      accountType: normalizedType,
      custodyProvider: provider,
      status: 'active',
      currencyCode: sanitizeString(currencyCode, { required: true, maxLength: 3, toUpperCase: true }),
      currentBalance: 0,
      availableBalance: 0,
      pendingHoldBalance: 0,
      lastReconciledAt: new Date(),
    },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (account.custodyProvider !== provider || account.status === 'pending') {
    await account.update(
      {
        custodyProvider: provider,
        status: account.status === 'pending' ? 'active' : account.status,
      },
      { transaction },
    );
  }

  return account;
}

export async function ensureProfileWallets(user, { transaction, logger, requestId, forceRefresh = false } = {}) {
  if (!user || !user.Profile) {
    return;
  }

  const { Profile: baseProfile, FreelancerProfile, CompanyProfile, AgencyProfile } = user;
  const tasks = [
    ensureWalletAccount({
      userId: user.id,
      profileId: baseProfile.id,
      accountType: 'user',
      transaction,
      logger,
      requestId,
      forceRefresh,
    }),
  ];

  if (FreelancerProfile) {
    tasks.push(
      ensureWalletAccount({
        userId: user.id,
        profileId: baseProfile.id,
        accountType: 'freelancer',
        transaction,
        logger,
        requestId,
      }),
    );
  }

  if (CompanyProfile) {
    tasks.push(
      ensureWalletAccount({
        userId: user.id,
        profileId: baseProfile.id,
        accountType: 'company',
        transaction,
        logger,
        requestId,
      }),
    );
  }

  if (AgencyProfile) {
    tasks.push(
      ensureWalletAccount({
        userId: user.id,
        profileId: baseProfile.id,
        accountType: 'agency',
        transaction,
        logger,
        requestId,
      }),
    );
  }

  const accounts = await Promise.all(tasks);
  const accountsByType = new Map(accounts.map((account) => [account.accountType, account]));

  const escrowAccounts = await EscrowAccount.findAll({
    where: { userId: user.id },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  await Promise.all(
    escrowAccounts.map(async (escrow) => {
      const plainProvider = sanitizeString(escrow.provider, { maxLength: 120, toLowerCase: true });
      let expectedType = 'user';
      if (plainProvider === 'escrow_com' && CompanyProfile) {
        expectedType = 'company';
      } else if (plainProvider === 'escrow_com' && !CompanyProfile && AgencyProfile) {
        expectedType = 'agency';
      }
      const linkedAccount = accountsByType.get(expectedType) ?? accountsByType.get('user');
      if (linkedAccount && escrow.walletAccountId !== linkedAccount.id) {
        await escrow.update({ walletAccountId: linkedAccount.id }, { transaction });
      }
    }),
  );
}

export async function upsertIdentityVerification(userId, payload = {}, { transaction } = {}) {
  const numericUserId = normalizeId(userId, 'userId');
  const profileId = normalizeId(payload.profileId ?? payload.profileID ?? payload.profile_id, 'profileId');
  const status = assertInEnum(
    sanitizeString(payload.status ?? 'submitted', { required: true, maxLength: 40, toLowerCase: true }),
    ID_VERIFICATION_STATUSES,
    'status',
  );

  const verificationProvider = sanitizeString(payload.verificationProvider ?? 'manual_review', {
    required: true,
    maxLength: 80,
  });

  const recordPayload = {
    userId: numericUserId,
    profileId,
    status,
    verificationProvider,
    typeOfId: sanitizeString(payload.typeOfId, { required: true, maxLength: 120 }),
    idNumberLast4: sanitizeString(payload.idNumberLast4, { maxLength: 16 }),
    issuingCountry: sanitizeString(payload.issuingCountry, { maxLength: 4, toUpperCase: true }),
    issuedAt: optionalDate(payload.issuedAt, 'issuedAt'),
    expiresAt: optionalDate(payload.expiresAt, 'expiresAt'),
    documentFrontKey: sanitizeString(payload.documentFrontKey ?? payload.idFrontKey, { maxLength: 500 }),
    documentBackKey: sanitizeString(payload.documentBackKey ?? payload.idBackKey, { maxLength: 500 }),
    selfieKey: sanitizeString(payload.selfieKey ?? payload.selfieImageKey, { maxLength: 500 }),
    fullName: sanitizeString(payload.fullName, { required: true, maxLength: 255 }),
    dateOfBirth: optionalDate(payload.dateOfBirth, 'dateOfBirth', { required: true }),
    addressLine1: sanitizeString(payload.addressLine1 ?? payload.address?.line1, { required: true, maxLength: 255 }),
    addressLine2: sanitizeString(payload.addressLine2 ?? payload.address?.line2, { maxLength: 255 }),
    city: sanitizeString(payload.city ?? payload.address?.city, { required: true, maxLength: 120 }),
    state: sanitizeString(payload.state ?? payload.address?.state, { maxLength: 120 }),
    postalCode: sanitizeString(payload.postalCode ?? payload.address?.postalCode, { required: true, maxLength: 40 }),
    country: sanitizeString(payload.country ?? payload.address?.country, { required: true, maxLength: 4, toUpperCase: true }),
    reviewNotes: sanitizeString(payload.reviewNotes, { maxLength: 2000 }),
    declinedReason: sanitizeString(payload.declinedReason, { maxLength: 2000 }),
    reviewerId: payload.reviewerId ? normalizeId(payload.reviewerId, 'reviewerId') : null,
    submittedAt: optionalDate(payload.submittedAt ?? new Date().toISOString(), 'submittedAt'),
    reviewedAt: optionalDate(payload.reviewedAt, 'reviewedAt'),
    metadata: payload.metadata ?? null,
  };

  const [record, created] = await IdentityVerification.findOrCreate({
    where: { userId: numericUserId, profileId },
    defaults: recordPayload,
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!created) {
    await record.update(recordPayload, { transaction });
  }

  return record;
}

export async function upsertCorporateVerification(userId, payload = {}, { transaction } = {}) {
  const numericUserId = normalizeId(userId, 'userId');
  const ownerType = sanitizeString(payload.ownerType ?? 'company', { required: true, maxLength: 40, toLowerCase: true });
  assertInEnum(ownerType, ['company', 'agency'], 'ownerType');

  const status = assertInEnum(
    sanitizeString(payload.status ?? 'submitted', { required: true, maxLength: 40, toLowerCase: true }),
    CORPORATE_VERIFICATION_STATUSES,
    'status',
  );

  const basePayload = {
    ownerType,
    companyProfileId:
      ownerType === 'company'
        ? normalizeId(payload.companyProfileId ?? payload.profileId ?? payload.companyProfile?.id, 'companyProfileId')
        : null,
    agencyProfileId:
      ownerType === 'agency'
        ? normalizeId(payload.agencyProfileId ?? payload.profileId ?? payload.agencyProfile?.id, 'agencyProfileId')
        : null,
    userId: numericUserId,
    status,
    companyName: sanitizeString(payload.companyName, { required: true, maxLength: 255 }),
    registrationNumber: sanitizeString(payload.registrationNumber, { maxLength: 160 }),
    registrationCountry: sanitizeString(payload.registrationCountry, { maxLength: 4, toUpperCase: true }),
    registeredAddressLine1: sanitizeString(payload.registeredAddressLine1 ?? payload.registeredAddress?.line1, {
      required: true,
      maxLength: 255,
    }),
    registeredAddressLine2: sanitizeString(payload.registeredAddressLine2 ?? payload.registeredAddress?.line2, {
      maxLength: 255,
    }),
    registeredCity: sanitizeString(payload.registeredCity ?? payload.registeredAddress?.city, {
      required: true,
      maxLength: 120,
    }),
    registeredState: sanitizeString(payload.registeredState ?? payload.registeredAddress?.state, { maxLength: 120 }),
    registeredPostalCode: sanitizeString(payload.registeredPostalCode ?? payload.registeredAddress?.postalCode, {
      required: true,
      maxLength: 40,
    }),
    registeredCountry: sanitizeString(payload.registeredCountry ?? payload.registeredAddress?.country, {
      required: true,
      maxLength: 4,
      toUpperCase: true,
    }),
    registrationDocumentKey: sanitizeString(payload.registrationDocumentKey, { maxLength: 500 }),
    authorizationDocumentKey: sanitizeString(payload.authorizationDocumentKey, { maxLength: 500 }),
    ownershipEvidenceKey: sanitizeString(payload.ownershipEvidenceKey, { maxLength: 500 }),
    domesticComplianceAttestation: Boolean(payload.domesticComplianceAttestation ?? false),
    domesticComplianceNotes: sanitizeString(payload.domesticComplianceNotes, { maxLength: 2000 }),
    authorizedRepresentativeName: sanitizeString(payload.authorizedRepresentativeName, { required: true, maxLength: 255 }),
    authorizedRepresentativeEmail: sanitizeString(payload.authorizedRepresentativeEmail, { required: true, maxLength: 255 }),
    authorizedRepresentativeTitle: sanitizeString(payload.authorizedRepresentativeTitle, { maxLength: 255 }),
    authorizationExpiresAt: optionalDate(payload.authorizationExpiresAt, 'authorizationExpiresAt'),
    submittedAt: optionalDate(payload.submittedAt ?? new Date().toISOString(), 'submittedAt'),
    reviewedAt: optionalDate(payload.reviewedAt, 'reviewedAt'),
    reviewerId: payload.reviewerId ? normalizeId(payload.reviewerId, 'reviewerId') : null,
    reviewNotes: sanitizeString(payload.reviewNotes, { maxLength: 2000 }),
    declineReason: sanitizeString(payload.declineReason, { maxLength: 2000 }),
    metadata: payload.metadata ?? null,
  };

  const where = ownerType === 'company'
    ? { ownerType, companyProfileId: basePayload.companyProfileId }
    : { ownerType, agencyProfileId: basePayload.agencyProfileId };

  const [record, created] = await CorporateVerification.findOrCreate({
    where,
    defaults: basePayload,
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!created) {
    await record.update(basePayload, { transaction });
  }

  return record;
}

export async function recordQualificationCredential(userId, payload = {}, { transaction } = {}) {
  const numericUserId = normalizeId(userId, 'userId');
  const profileId = normalizeId(payload.profileId ?? payload.profileID ?? payload.profile_id, 'profileId');
  const sourceType = sanitizeString(payload.sourceType ?? 'certificate', { required: true, maxLength: 40, toLowerCase: true });
  assertInEnum(sourceType, ['transcript', 'certificate', 'portfolio', 'other'], 'sourceType');

  const status = assertInEnum(
    sanitizeString(payload.status ?? 'unverified', { required: true, maxLength: 40, toLowerCase: true }),
    QUALIFICATION_CREDENTIAL_STATUSES,
    'status',
  );

  const defaults = {
    userId: numericUserId,
    profileId,
    sourceType,
    title: sanitizeString(payload.title, { required: true, maxLength: 255 }),
    issuer: sanitizeString(payload.issuer, { maxLength: 255 }),
    issuedAt: optionalDate(payload.issuedAt, 'issuedAt'),
    expiresAt: optionalDate(payload.expiresAt, 'expiresAt'),
    status,
    verificationNotes: sanitizeString(payload.verificationNotes, { maxLength: 2000 }),
    documentKey: sanitizeString(payload.documentKey ?? payload.evidenceKey, { maxLength: 500 }),
    evidenceMetadata: payload.evidenceMetadata ?? null,
    lastReviewedAt: optionalDate(payload.lastReviewedAt, 'lastReviewedAt'),
    reviewerId: payload.reviewerId ? normalizeId(payload.reviewerId, 'reviewerId') : null,
  };

  if (defaults.status === 'unverified' && !defaults.verificationNotes) {
    defaults.verificationNotes = 'Awaiting official documentation; currently marked as not verified.';
  }

  const [record, created] = await QualificationCredential.findOrCreate({
    where: {
      userId: numericUserId,
      profileId,
      title: defaults.title,
      issuer: defaults.issuer,
    },
    defaults,
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!created) {
    await record.update(defaults, { transaction });
  }

  return record;
}

export async function recordWalletLedgerEntry(
  walletAccountId,
  payload = {},
  { transaction, logger, requestId, forceRefresh = false } = {},
) {
  const account = await WalletAccount.findByPk(walletAccountId, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!account) {
    throw ensureHttpStatus(new NotFoundError('Wallet account not found.'));
  }

  const entryType = assertInEnum(
    sanitizeString(payload.entryType ?? 'credit', { required: true, maxLength: 32, toLowerCase: true }),
    WALLET_LEDGER_ENTRY_TYPES,
    'entryType',
  );

  await assertPaymentInfrastructureOperational({
    feature: `wallet_ledger:${entryType}`,
    logger,
    requestId,
    forceRefresh,
  });

  const rawAmount = safeNumber(payload.amount);
  const amount = Math.round(rawAmount * 10000) / 10000;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw ensureHttpStatus(new ValidationError('amount must be greater than zero.'));
  }

  let currentBalance = safeNumber(account.currentBalance);
  let availableBalance = safeNumber(account.availableBalance);
  let pendingHoldBalance = safeNumber(account.pendingHoldBalance);

  const metadata = ensurePlainObject(payload.metadata, 'metadata');
  const regulatoryClassification = metadata.regulatoryClassification ?? CLOSED_LOOP_CLASSIFICATION;
  if (regulatoryClassification !== CLOSED_LOOP_CLASSIFICATION) {
    throw ensureHttpStatus(
      new ValidationError(
        'Wallet ledger only supports closed-loop non-cash balances and cannot record FCA-regulated e-money classifications.',
      ),
    );
  }

  if (metadata.iosIapCompliant === false) {
    throw ensureHttpStatus(
      new ValidationError(
        'Ledger entries must remain compliant with Apple App Store guideline 3.1.5 and cannot depend on in-app purchase flows.',
      ),
    );
  }

  metadata.regulatoryClassification = CLOSED_LOOP_CLASSIFICATION;
  metadata.iosIapCompliant = true;
  metadata.iosIapJustification =
    metadata.iosIapJustification ??
    'Service marketplace transactions settle outside the iOS app in line with App Store Review Guideline 3.1.5.';
  metadata.fcaSupervisionRequired = false;
  metadata.complianceSummary =
    metadata.complianceSummary ??
    'Closed-loop wallet credit for on-platform services; Gigvora is not providing FCA-regulated e-money.';

  switch (entryType) {
    case 'credit':
      currentBalance += amount;
      availableBalance += amount;
      break;
    case 'debit':
      if (availableBalance < amount) {
        throw ensureHttpStatus(new ConflictError('Insufficient available balance for debit entry.'));
      }
      currentBalance -= amount;
      availableBalance -= amount;
      break;
    case 'hold':
      if (availableBalance < amount) {
        throw ensureHttpStatus(new ConflictError('Insufficient available balance to place on hold.'));
      }
      availableBalance -= amount;
      pendingHoldBalance += amount;
      break;
    case 'release':
      if (pendingHoldBalance < amount) {
        throw ensureHttpStatus(new ConflictError('No matching held funds to release.'));
      }
      pendingHoldBalance -= amount;
      availableBalance += amount;
      break;
    case 'adjustment':
      currentBalance += amount;
      availableBalance += amount;
      break;
    default:
      throw ensureHttpStatus(new ValidationError(`Unsupported ledger entry type: ${entryType}`));
  }

  if (currentBalance < 0 || availableBalance < 0 || pendingHoldBalance < 0) {
    throw ensureHttpStatus(new ConflictError('Ledger balances cannot be negative.'));
  }

  const occurredAt = optionalDate(payload.occurredAt ?? new Date().toISOString(), 'occurredAt', { required: true });
  const reference = sanitizeString(payload.reference, { maxLength: 160 }) ?? generateLedgerReference();

  const entry = await WalletLedgerEntry.create(
    {
      walletAccountId: account.id,
      entryType,
      amount,
      currencyCode: sanitizeString(payload.currencyCode ?? account.currencyCode ?? 'USD', {
        required: true,
        maxLength: 3,
        toUpperCase: true,
      }),
      reference,
      externalReference: sanitizeString(payload.externalReference, { maxLength: 160 }),
      description: sanitizeString(payload.description, { maxLength: 500 }),
      initiatedById: payload.initiatedById ? normalizeId(payload.initiatedById, 'initiatedById') : null,
      occurredAt,
      balanceAfter: currentBalance,
      metadata,
    },
    { transaction },
  );

  await account.update(
    {
      currentBalance,
      availableBalance,
      pendingHoldBalance,
      lastReconciledAt: new Date(),
    },
    { transaction },
  );

  return entry;
}

function buildIdentitySnapshot(record) {
  if (!record) {
    return {
      status: 'pending',
      submitted: false,
      complianceFlags: ['missing_identity_verification'],
      note: 'Identity verification not yet submitted. Please provide government-issued ID, selfie verification, and address proof.',
    };
  }

  const plain = record.get({ plain: true });
  const complianceFlags = [];
  if (plain.status !== 'verified') {
    complianceFlags.push('identity_requires_review');
  }
  if (!plain.documentFrontKey || !plain.selfieKey) {
    complianceFlags.push('identity_documents_incomplete');
  }

  return {
    id: plain.id,
    status: plain.status,
    verificationProvider: plain.verificationProvider,
    typeOfId: plain.typeOfId,
    nameOnId: plain.fullName,
    dateOfBirth: plain.dateOfBirth,
    address: {
      line1: plain.addressLine1,
      line2: plain.addressLine2,
      city: plain.city,
      state: plain.state,
      postalCode: plain.postalCode,
      country: plain.country,
    },
    documents: {
      front: plain.documentFrontKey,
      back: plain.documentBackKey,
      selfie: plain.selfieKey,
    },
    issuingCountry: plain.issuingCountry,
    issuedAt: plain.issuedAt,
    expiresAt: plain.expiresAt,
    submittedAt: plain.submittedAt,
    reviewedAt: plain.reviewedAt,
    reviewerId: plain.reviewerId,
    reviewNotes: plain.reviewNotes,
    declinedReason: plain.declinedReason,
    complianceFlags,
  };
}

function buildCorporateSnapshot(record, ownerType) {
  if (!record) {
    return {
      ownerType,
      status: 'pending',
      submitted: false,
      note: `${ownerType === 'agency' ? 'Agency' : 'Company'} documentation pending compliance review.`,
      complianceFlags: ['corporate_verification_missing'],
    };
  }

  const plain = record.get({ plain: true });
  const complianceFlags = [];
  if (!plain.domesticComplianceAttestation) {
    complianceFlags.push('domestic_compliance_not_attested');
  }
  if (plain.status !== 'verified') {
    complianceFlags.push('corporate_review_required');
  }

  return {
    id: plain.id,
    ownerType: plain.ownerType,
    status: plain.status,
    companyName: plain.companyName,
    registrationNumber: plain.registrationNumber,
    registeredAddress: {
      line1: plain.registeredAddressLine1,
      line2: plain.registeredAddressLine2,
      city: plain.registeredCity,
      state: plain.registeredState,
      postalCode: plain.registeredPostalCode,
      country: plain.registeredCountry,
    },
    documents: {
      registration: plain.registrationDocumentKey,
      authorization: plain.authorizationDocumentKey,
      ownership: plain.ownershipEvidenceKey,
    },
    domesticComplianceAttestation: plain.domesticComplianceAttestation,
    domesticComplianceNotes: plain.domesticComplianceNotes,
    authorizedRepresentative: {
      name: plain.authorizedRepresentativeName,
      email: plain.authorizedRepresentativeEmail,
      title: plain.authorizedRepresentativeTitle,
    },
    authorizationExpiresAt: plain.authorizationExpiresAt,
    submittedAt: plain.submittedAt,
    reviewedAt: plain.reviewedAt,
    reviewerId: plain.reviewerId,
    reviewNotes: plain.reviewNotes,
    declineReason: plain.declineReason,
    complianceFlags,
  };
}

function buildQualificationSnapshot(records) {
  const items = records.map((record) => {
    const plain = record.get({ plain: true });
    const isVerified = plain.status === 'verified';
    const needsDocs = plain.status === 'unverified';
    const defaultNote = needsDocs
      ? 'Official documentation not provided. Marked as not verified.'
      : null;

    return {
      id: plain.id,
      title: plain.title,
      issuer: plain.issuer,
      sourceType: plain.sourceType,
      status: plain.status,
      issuedAt: plain.issuedAt,
      expiresAt: plain.expiresAt,
      reviewerId: plain.reviewerId,
      verificationNotes: plain.verificationNotes ?? defaultNote,
      documentKey: plain.documentKey,
      evidenceMetadata: plain.evidenceMetadata ?? null,
      lastReviewedAt: plain.lastReviewedAt,
      complianceFlags: isVerified ? [] : ['qualification_not_verified'],
    };
  });

  const verifiedCount = items.filter((item) => item.status === 'verified').length;
  const pendingCount = items.filter((item) => item.status === 'pending_review').length;
  const unverifiedCount = items.filter((item) => item.status === 'unverified').length;
  const rejectedCount = items.filter((item) => item.status === 'rejected').length;

  let summaryNote = 'All submitted qualifications have been reviewed.';
  if (unverifiedCount > 0 || pendingCount > 0) {
    summaryNote = 'Qualifications marked as not verified until official transcripts or certificates are uploaded.';
  }
  if (rejectedCount > 0) {
    summaryNote = `${summaryNote} ${rejectedCount} item(s) were rejected and require updated evidence.`.trim();
  }

  return {
    items,
    totals: {
      verified: verifiedCount,
      pending: pendingCount,
      unverified: unverifiedCount,
      rejected: rejectedCount,
    },
    summaryNote,
  };
}

function buildWalletSnapshot(accounts, ledgerEntries) {
  const entriesByAccount = new Map();
  ledgerEntries.forEach((entry) => {
    const plain = entry.get({ plain: true });
    const list = entriesByAccount.get(plain.walletAccountId) ?? [];
    list.push(plain);
    entriesByAccount.set(plain.walletAccountId, list);
  });

  const accountSnapshots = accounts.map((account) => {
    const plain = account.get({ plain: true });
    const ledger = (entriesByAccount.get(plain.id) ?? []).sort((a, b) =>
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );
    const lastEntry = ledger[ledger.length - 1] ?? null;
    const currentBalance = safeNumber(plain.currentBalance);
    const availableBalance = safeNumber(plain.availableBalance);
    const pendingHoldBalance = safeNumber(plain.pendingHoldBalance);
    const ledgerBalanced = lastEntry
      ? safeNumber(lastEntry.balanceAfter) === currentBalance
      : currentBalance === 0;
    const holdsBalanced = Math.abs(currentBalance - (availableBalance + pendingHoldBalance)) < 0.0001;

    const hasLedgerActivity = ledger.length > 0;
    const missingComplianceMetadata = ledger.some(
      (entry) => !entry.metadata || !entry.metadata.regulatoryClassification,
    );
    const classificationMismatch = ledger.some((entry) => {
      const classification = entry.metadata?.regulatoryClassification;
      return classification && classification !== CLOSED_LOOP_CLASSIFICATION;
    });
    const iosNonCompliant = ledger.some((entry) => entry.metadata?.iosIapCompliant === false);

    let complianceStatus = 'inactive';
    let complianceNotes = 'No wallet activity yet. Closed-loop compliance confirmed once funds flow.';
    if (hasLedgerActivity) {
      if (classificationMismatch || iosNonCompliant) {
        complianceStatus = 'review_required';
        complianceNotes = classificationMismatch
          ? 'Ledger entry flagged as non closed-loop. Investigate before releasing funds.'
          : 'Ledger entry indicates Apple IAP non-compliance. Update payout policy immediately.';
      } else if (missingComplianceMetadata) {
        complianceStatus = 'verification_required';
        complianceNotes =
          'Ledger entries missing compliance metadata. Regenerate using the latest wallet service to enforce closed-loop rules.';
      } else {
        complianceStatus = 'closed_loop';
        complianceNotes =
          'Closed-loop wallet credits confirmed. App Store distribution remains compliant without IAP.';
      }
    }

    const ledgerSample = ledger.slice(-5).map((entry) => ({
      id: entry.id,
      entryType: entry.entryType,
      amount: safeNumber(entry.amount),
      reference: entry.reference,
      occurredAt: entry.occurredAt,
      balanceAfter: safeNumber(entry.balanceAfter),
    }));

    return {
      id: plain.id,
      accountType: plain.accountType,
      custodyProvider: plain.custodyProvider,
      providerAccountId: plain.providerAccountId,
      status: plain.status,
      currencyCode: plain.currencyCode,
      currentBalance,
      availableBalance,
      pendingHoldBalance,
      lastReconciledAt: plain.lastReconciledAt,
      entryCount: ledger.length,
      lastEntryAt: lastEntry?.occurredAt ?? null,
      ledgerBalanced: ledgerBalanced && holdsBalanced,
      ledgerNotes:
        ledgerBalanced && holdsBalanced
          ? 'Ledger reconciled with custodial balances.'
          : 'Ledger imbalance detected. Investigate before releasing funds.',
      complianceStatus,
      complianceNotes,
      appStoreCompliant: !iosNonCompliant && !classificationMismatch,
      ledgerSample,
    };
  });

  const ledgerIntegrity = accountSnapshots.every((account) => account.ledgerBalanced)
    ? 'good'
    : 'attention_required';

  let complianceStatus = 'closed_loop';
  if (accountSnapshots.some((account) => account.complianceStatus === 'review_required')) {
    complianceStatus = 'review_required';
  } else if (accountSnapshots.some((account) => account.complianceStatus === 'verification_required')) {
    complianceStatus = 'verification_required';
  } else if (accountSnapshots.every((account) => account.complianceStatus === 'inactive')) {
    complianceStatus = 'inactive';
  }

  const appStoreCompliant = accountSnapshots.every((account) => account.appStoreCompliant !== false);

  return {
    accounts: accountSnapshots,
    ledgerIntegrity,
    complianceStatus,
    appStoreCompliant,
  };
}

export async function getProfileComplianceSnapshot(user, { transaction } = {}) {
  if (!user || !user.Profile) {
    throw ensureHttpStatus(new NotFoundError('Profile context is required to build compliance snapshot.'));
  }

  const profileId = user.Profile.id;
  const identityRecord = await IdentityVerification.findOne({
    where: { profileId },
    order: [['createdAt', 'DESC']],
    transaction,
  });

  const qualifications = await QualificationCredential.findAll({
    where: { profileId },
    order: [['createdAt', 'ASC']],
    transaction,
  });

  const walletAccounts = await WalletAccount.findAll({
    where: { profileId },
    order: [['accountType', 'ASC']],
    transaction,
  });

  const walletLedgerEntries = walletAccounts.length
    ? await WalletLedgerEntry.findAll({
        where: { walletAccountId: walletAccounts.map((account) => account.id) },
        order: [['occurredAt', 'ASC']],
        transaction,
      })
    : [];

  const companyVerification = user.CompanyProfile
    ? await CorporateVerification.findOne({
        where: { ownerType: 'company', companyProfileId: user.CompanyProfile.id },
        order: [['createdAt', 'DESC']],
        transaction,
      })
    : null;

  const agencyVerification = user.AgencyProfile
    ? await CorporateVerification.findOne({
        where: { ownerType: 'agency', agencyProfileId: user.AgencyProfile.id },
        order: [['createdAt', 'DESC']],
        transaction,
      })
    : null;

  return {
    identity: buildIdentitySnapshot(identityRecord),
    corporate: {
      company: buildCorporateSnapshot(companyVerification, 'company'),
      agency: buildCorporateSnapshot(agencyVerification, 'agency'),
    },
    qualifications: buildQualificationSnapshot(qualifications),
    wallet: buildWalletSnapshot(walletAccounts, walletLedgerEntries),
  };
}

export default {
  ensureWalletAccount,
  ensureProfileWallets,
  upsertIdentityVerification,
  upsertCorporateVerification,
  recordQualificationCredential,
  recordWalletLedgerEntry,
  getProfileComplianceSnapshot,
};
