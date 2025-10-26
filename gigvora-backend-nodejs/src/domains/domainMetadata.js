export const domainMetadata = {
  auth: {
    ownerTeam: 'Identity & Access Engineering',
    dataSteward: 'Security & Compliance',
    dataClassification: 'Restricted',
    businessCriticality: 'Tier 0',
    dataResidency: {
      primaryRegion: 'eu-west-1',
      failoverRegion: 'us-east-1',
    },
    defaultRetention: 'Account lifetime + 7 years for audit obligations.',
    regulatoryFrameworks: ['GDPR', 'SOC 2', 'CCPA'],
    qualityChecks: [
      {
        name: 'Weekly credential rotation review',
        cadence: 'weekly',
        owner: 'Security Engineering',
      },
      {
        name: 'Automated duplicate account scan',
        cadence: 'daily',
        owner: 'Identity Operations',
      },
      {
        name: 'Quarterly privacy impact assessment',
        cadence: 'quarterly',
        owner: 'Compliance Office',
      },
    ],
    piiModels: {
      User: {
        fields: ['firstName', 'lastName', 'email', 'address', 'location', 'geoLocation', 'age'],
        retention: 'Account lifetime + 7 years',
        justification:
          'Personal identifiers are required to satisfy contract, fraud prevention, and employment verifications.',
      },
      UserLoginAudit: {
        fields: ['ipAddress', 'userAgent', 'metadata'],
        retention: '18 months',
        justification: 'Retained for anomaly detection and incident investigations.',
      },
      IdentityVerification: {
        fields: ['governmentIdType', 'governmentIdLastFour', 'countryCode'],
        retention: '6 years',
        justification: 'Identity evidence retained for Know Your Customer regulations.',
      },
      IdentityVerificationEvent: {
        fields: ['previousStatus', 'newStatus', 'notes', 'metadata'],
        retention: '6 years',
        justification: 'Audit trail of identity reviews maintained for regulatory reporting.',
      },
      CorporateVerification: {
        fields: ['companyNumber', 'registrationCountry', 'complianceNotes'],
        retention: '6 years',
        justification: 'Corporate verification records required for AML investigations.',
      },
      TwoFactorToken: {
        fields: ['contactMethod', 'destination'],
        retention: '30 days',
        justification: 'Temporary cache to rate limit OTP delivery.',
      },
      PasswordResetToken: {
        fields: ['requestedFromIp', 'requestedUserAgent', 'metadata'],
        retention: '90 days',
        justification: 'Audit trail for password reset requests and abuse investigations.',
      },
      TwoFactorPolicy: {
        fields: ['allowedMethods', 'ipAllowlist', 'notes'],
        retention: 'Policy lifetime + 3 years',
        justification: 'Records MFA enforcement rules for compliance and incident response audits.',
      },
      TwoFactorEnrollment: {
        fields: ['metadata'],
        retention: 'Device lifetime + 12 months',
        justification: 'Proof of possession for hardware tokens and authenticator approvals.',
      },
      TwoFactorBypass: {
        fields: ['reason', 'notes'],
        retention: '90 days',
        justification: 'Temporary MFA exceptions tracked for fraud and abuse investigations.',
      },
      TwoFactorAuditLog: {
        fields: ['metadata', 'notes'],
        retention: '3 years',
        justification: 'Supports change-management evidence for identity controls.',
      },
    },
    fieldDescriptions: {
      User: {
        geoLocation: 'Approximate lat/long resolved from the user\'s provided address for timezone calculations.',
        twoFactorMethod: 'Preferred second factor method for enforcing MFA coverage.',
      },
      IdentityVerification: {
        complianceNotes: 'Analyst-supplied remediation notes recorded during manual verification.',
      },
      TwoFactorPolicy: {
        ipAllowlist: 'Trusted CIDR ranges that may bypass additional challenges.',
      },
      TwoFactorEnrollment: {
        metadata: 'Hardware attestation or context captured during device review.',
      },
      TwoFactorBypass: {
        reason: 'Business justification captured when issuing temporary MFA bypass tokens.',
      },
      IdentityVerificationEvent: {
        metadata: 'Structured payload with reviewer assignments, file references, and automation signals.',
      },
    },
  },
  talent: {
    ownerTeam: 'Talent Experience',
    dataSteward: 'Marketplace Operations',
    dataClassification: 'Confidential',
    businessCriticality: 'Tier 1',
    dataResidency: {
      primaryRegion: 'us-east-2',
      failoverRegion: 'eu-central-1',
    },
    defaultRetention: 'Candidate lifecycle + 3 years.',
    regulatoryFrameworks: ['GDPR', 'EEOC'],
    qualityChecks: [
      {
        name: 'Portfolio moderation review',
        cadence: 'continuous',
        owner: 'Trust & Safety',
      },
      {
        name: 'Mentorship outcome survey audit',
        cadence: 'monthly',
        owner: 'Marketplace Insights',
      },
    ],
    piiModels: {
      Profile: {
        fields: ['firstName', 'lastName', 'headline', 'summary', 'location'],
        retention: 'Candidate lifecycle + 3 years',
        justification: 'Profile data powers matchmaking and interview orchestration.',
      },
      CareerDocument: {
        fields: ['title', 'sections', 'attachments'],
        retention: 'Candidate lifecycle + 2 years',
        justification: 'Portfolio assets required for dispute resolution and onboarding support.',
      },
      PeerMentoringSession: {
        fields: ['recordingUrl', 'notes'],
        retention: '24 months',
        justification: 'Stored for QA and policy compliance when mentors provide paid sessions.',
      },
    },
    fieldDescriptions: {
      Profile: {
        summary: 'Long-form biography displayed to recruiters and agencies when evaluating fit.',
      },
    },
  },
  marketplace: {
    ownerTeam: 'Marketplace Delivery',
    dataSteward: 'Programme Management Office',
    dataClassification: 'Confidential',
    businessCriticality: 'Tier 0',
    dataResidency: {
      primaryRegion: 'us-west-2',
      failoverRegion: 'eu-west-1',
    },
    defaultRetention: 'Engagement lifecycle + 7 years.',
    regulatoryFrameworks: ['GDPR', 'SOC 2', 'ISO 27001'],
    qualityChecks: [
      {
        name: 'Milestone variance reconciliation',
        cadence: 'weekly',
        owner: 'Programme Management Office',
      },
      {
        name: 'Workspace export retention audit',
        cadence: 'monthly',
        owner: 'Product Operations',
      },
    ],
    piiModels: {
      Project: {
        fields: ['title', 'clientSummary', 'confidentialNotes'],
        retention: 'Engagement lifecycle + 7 years',
        justification: 'Project context is required for dispute evidence and regulatory reporting.',
      },
      GigOrder: {
        fields: ['clientContactName', 'clientContactEmail'],
        retention: 'Engagement lifecycle + 7 years',
        justification: 'Contact details needed for deliverable acceptance and payout approvals.',
      },
      WorkspaceOperatingBlueprint: {
        fields: ['documentationUrl', 'handoverNotes'],
        retention: 'Engagement lifecycle + 3 years',
        justification: 'Operational playbooks retained for success coaching and retrospectives.',
      },
    },
    fieldDescriptions: {
      Project: {
        confidentialNotes: 'Restricted to core engagement team for handling escalations and legal flags.',
      },
      GigOrder: {
        clientContactEmail: 'Preferred contact for deliverable approvals; validated against workspace membership.',
      },
    },
  },
  discovery: {
    ownerTeam: 'Discovery Platform',
    dataSteward: 'Growth Operations',
    dataClassification: 'Confidential',
    businessCriticality: 'Tier 1',
    dataResidency: {
      primaryRegion: 'eu-west-1',
      failoverRegion: 'us-east-1',
    },
    defaultRetention: 'Engagement lifecycle + 2 years.',
    regulatoryFrameworks: ['GDPR', 'SOC 2'],
    qualityChecks: [
      {
        name: 'Weekly recommendation quality audit',
        cadence: 'weekly',
        owner: 'Marketplace Insights',
      },
      {
        name: 'Suggestion engagement anomaly detection',
        cadence: 'daily',
        owner: 'Data Science',
      },
      {
        name: 'Trending topics sentiment review',
        cadence: 'bi-weekly',
        owner: 'Community Experience',
      },
    ],
    piiModels: {
      DiscoverySuggestionSubscription: {
        fields: ['metadata'],
        retention: 'User lifecycle',
        justification: 'Tracks opt-in preferences for curated discovery follow-ups.',
      },
      DiscoverySuggestionEngagement: {
        fields: ['metadata'],
        retention: '18 months',
        justification: 'Supports ranking audits, abuse investigations, and consent tracking for discovery actions.',
      },
      DiscoveryConnectionProfile: {
        fields: ['fullName', 'headline', 'location', 'metadata'],
        retention: 'Profile lifecycle + 2 years',
        justification: 'Required to surface curated introductions and honour right-to-be-forgotten obligations.',
      },
    },
    fieldDescriptions: {
      DiscoverySuggestion: {
        metadata:
          'Structured payload with scoring inputs, rollout cohort flags, and contextual reason copy used by the ranking engine.',
        targetSegments: 'Persona and industry segments that the suggestion is prioritised for within the explorer.',
      },
      DiscoveryTrendingTopic: {
        metrics: 'Aggregated counts for follows, shares, mentions, and engagement deltas powering the trending rank.',
      },
      DiscoveryConnectionProfile: {
        sharedContexts:
          'Common groups, programmes, or mutual partners that establish trust between the profiled member and the viewer.',
      },
    },
  },
  volunteering: {
    ownerTeam: 'Community Operations',
    dataSteward: 'Social Impact Programmes',
    dataClassification: 'Confidential',
    businessCriticality: 'Tier 1',
    dataResidency: {
      primaryRegion: 'us-east-1',
      failoverRegion: 'eu-west-1',
    },
    defaultRetention: 'Volunteer engagement lifecycle + 3 years.',
    regulatoryFrameworks: ['GDPR', 'SOC 2', 'CCPA'],
    qualityChecks: [
      {
        name: 'Volunteer workspace reconciliation audit',
        cadence: 'monthly',
        owner: 'Community Operations',
      },
      {
        name: 'Opportunity content moderation review',
        cadence: 'weekly',
        owner: 'Trust & Safety',
      },
      {
        name: 'Contract spend attestation',
        cadence: 'quarterly',
        owner: 'Finance Operations',
      },
    ],
    piiModels: {
      VolunteeringPost: {
        fields: ['title', 'summary', 'contactEmail', 'location'],
        retention: 'Opportunity lifetime + 2 years',
        justification: 'Volunteer roles require contact information and logistics for audit trails and support.',
      },
      VolunteeringApplication: {
        fields: ['candidateName', 'candidateEmail', 'candidatePhone', 'resumeUrl', 'portfolioUrl'],
        retention: 'Application lifetime + 3 years',
        justification: 'Applicant details retained for onboarding, duty-of-care, and dispute resolution obligations.',
      },
      VolunteeringContract: {
        fields: ['title', 'status', 'stipendAmount', 'currency', 'deliverables'],
        retention: 'Contract lifetime + 7 years',
        justification: 'Contract terms and stipend data required for legal compliance and financial controls.',
      },
      VolunteeringContractSpend: {
        fields: ['amount', 'currency', 'category', 'description', 'receiptUrl'],
        retention: 'Contract lifetime + 7 years',
        justification: 'Spend records maintained for grant reporting, audits, and reimbursement validation.',
      },
      VolunteerApplication: {
        fields: ['motivation', 'availabilityStart', 'availabilityHoursPerWeek'],
        retention: 'Volunteer relationship + 3 years',
        justification: 'Personal preferences retained to support repeat placements and safeguarding reviews.',
      },
      VolunteerContractReview: {
        fields: ['summary', 'description', 'location', 'rating', 'feedback'],
        retention: 'Review lifetime + 4 years',
        justification: 'Feedback evidences programme impact and is used for continuous improvement and compliance.',
      },
    },
    fieldDescriptions: {
      VolunteeringPost: {
        contactEmail: 'Designated coordinator email for applicants and programme escalation.',
        applicationDeadline: 'Final submission date to be surfaced on candidate portals.',
      },
      VolunteeringApplication: {
        resumeUrl: 'Secure file reference hosted in the compliance-controlled document vault.',
        portfolioUrl: 'Optional creative portfolio link reviewed during screening.',
      },
      VolunteeringContract: {
        deliverables: 'Structured deliverable plan outlining expectations agreed with the partner organisation.',
      },
      VolunteeringContractSpend: {
        receiptUrl: 'Immutable document reference for expenses claimed against the volunteer contract.',
      },
      VolunteerApplication: {
        motivation: 'Statement of intent supporting selection and safeguarding due diligence.',
      },
      VolunteerContractReview: {
        visibility: 'Controls whether the review is internal-only, partner-facing, or public.',
      },
    },
  },
  finance: {
    ownerTeam: 'Financial Operations',
    dataSteward: 'Controller Group',
    dataClassification: 'Highly Confidential',
    businessCriticality: 'Tier 0',
    dataResidency: {
      primaryRegion: 'eu-west-2',
      failoverRegion: 'us-east-1',
    },
    defaultRetention: 'Financial year + 10 years.',
    regulatoryFrameworks: ['PCI DSS', 'SOX', 'GDPR'],
    qualityChecks: [
      {
        name: 'Daily ledger reconciliation',
        cadence: 'daily',
        owner: 'Controller Group',
      },
      {
        name: 'Automated sanction screening',
        cadence: 'per transaction',
        owner: 'Financial Operations',
      },
      {
        name: 'Quarterly payout QA review',
        cadence: 'quarterly',
        owner: 'Payments Compliance',
      },
    ],
    piiModels: {
      WalletAccount: {
        fields: ['providerAccountId', 'currencyCode'],
        retention: 'Financial year + 10 years',
        justification: 'Needed for regulator audits and payout traceability.',
      },
      WalletLedgerEntry: {
        fields: ['reference', 'externalReference'],
        retention: 'Financial year + 10 years',
        justification: 'Ledger entries form the system of record for payouts and disputes.',
      },
      WalletFundingSource: {
        fields: ['externalReference', 'lastFour', 'provider'],
        retention: 'Financial year + 10 years',
        justification: 'Funding source fingerprints are required for audit trails and consent revocation.',
      },
      AgencyWalletFundingSource: {
        fields: ['accountNumberLast4', 'provider'],
        retention: 'Financial year + 10 years',
        justification: 'Workspace payout funding sources must be auditable for compliance and treasury reviews.',
      },
      WalletTransferRule: {
        fields: ['name', 'metadata'],
        retention: 'Active membership + 7 years',
        justification: 'Automation policies demonstrate payout approvals during compliance reviews.',
      },
      AgencyWalletTransferRule: {
        fields: ['name', 'metadata'],
        retention: 'Active membership + 7 years',
        justification: 'Workspace sweep automations evidence dual-control approvals for regulators.',
      },
      WalletTransferRequest: {
        fields: ['reference', 'notes'],
        retention: 'Financial year + 10 years',
        justification: 'Transfer requests underpin dispute resolution and tax evidence.',
      },
      EscrowAccount: {
        fields: ['providerEscrowId', 'status'],
        retention: 'Financial year + 10 years',
        justification: 'Escrow details required for AML checks and release approvals.',
      },
      EscrowTransaction: {
        fields: ['providerTransactionId', 'counterpartyName', 'counterpartyEmail'],
        retention: 'Financial year + 10 years',
        justification: 'Retained for reconciliation, fraud analytics, and dispute evidence.',
      },
      FinancePayoutBatch: {
        fields: ['name', 'status', 'totalAmount', 'currencyCode'],
        retention: 'Financial year + 10 years',
        justification: 'Statutory requirement for tax filing, withholding, and audit defence.',
      },
      FinancePayoutSplit: {
        fields: ['teammateName', 'teammateRole', 'recipientEmail'],
        retention: 'Financial year + 10 years',
        justification: 'Retained so split payouts can be reconciled against contractor tax statements and compliance checks.',
      },
      DisputeCase: {
        fields: ['claimantName', 'claimantEmail'],
        retention: 'Dispute lifecycle + 10 years',
        justification: 'Evidence for card network disputes and legal defence.',
      },
    },
    fieldDescriptions: {
      EscrowTransaction: {
        counterpartyEmail: 'Encrypted email alias referencing the external payment processor contact.',
      },
      FinancePayoutSplit: {
        recipientEmail: 'Encrypted recipient email used for 1099 delivery and payout troubleshooting.',
      },
    },
  },
  communications: {
    ownerTeam: 'Engagement Platform',
    dataSteward: 'Trust & Safety',
    dataClassification: 'Confidential',
    businessCriticality: 'Tier 1',
    dataResidency: {
      primaryRegion: 'us-east-1',
      failoverRegion: 'eu-west-2',
    },
    defaultRetention: 'Message lifecycle + 2 years.',
    regulatoryFrameworks: ['GDPR', 'CAN-SPAM', 'ePrivacy'],
    qualityChecks: [
      {
        name: 'Spam classifier precision audit',
        cadence: 'weekly',
        owner: 'Trust & Safety',
      },
      {
        name: 'Notification deliverability monitoring',
        cadence: 'continuous',
        owner: 'Engagement Platform',
      },
    ],
    piiModels: {
      Message: {
        fields: ['body', 'attachments'],
        retention: 'Message lifecycle + 18 months',
        justification: 'Stored for harassment investigations and compliance escalations.',
      },
      NotificationPreference: {
        fields: ['email', 'phoneNumber'],
        retention: 'Active subscription + 12 months',
        justification: 'Contact channels required for opt-in proof and suppression lists.',
      },
      SupportCase: {
        fields: ['requesterEmail', 'requesterPhone'],
        retention: 'Case lifecycle + 5 years',
        justification: 'Support history required for quality audits and regulatory responses.',
      },
    },
    fieldDescriptions: {
      Message: {
        attachments: 'Encrypted file metadata including checksum, stored in object storage.',
      },
    },
  },
  governance: {
    ownerTeam: 'Risk & Compliance',
    dataSteward: 'Legal Operations',
    dataClassification: 'Restricted',
    businessCriticality: 'Tier 1',
    dataResidency: {
      primaryRegion: 'eu-central-1',
      failoverRegion: 'us-east-2',
    },
    defaultRetention: 'Policy lifecycle + 10 years.',
    regulatoryFrameworks: ['GDPR', 'ISO 27001', 'SOC 2'],
    qualityChecks: [
      {
        name: 'Quarterly policy attestation audit',
        cadence: 'quarterly',
        owner: 'Legal Operations',
      },
      {
        name: 'Risk register sanitisation',
        cadence: 'monthly',
        owner: 'Risk & Compliance',
      },
    ],
    piiModels: {
      ComplianceDocument: {
        fields: ['documentTitle', 'signedBy', 'signedEmail'],
        retention: 'Policy lifecycle + 10 years',
        justification: 'Audit evidence for regulatory inspections.',
      },
      ConsentPolicy: {
        fields: ['title', 'description', 'legalBasis', 'required', 'revocable', 'retentionPeriodDays', 'metadata'],
        retention: 'Policy lifecycle + 10 years',
        justification: 'Policy metadata required for regulatory attestation and audit trails.',
      },
      UserConsent: {
        fields: ['status', 'grantedAt', 'withdrawnAt', 'source', 'ipAddress', 'userAgent', 'metadata'],
        retention: 'User lifecycle + 2 years after withdrawal',
        justification: 'Consent evidence required for GDPR compliance and incident investigations.',
      },
      ConsentAuditEvent: {
        fields: ['actorId', 'actorType', 'action', 'reason', 'metadata'],
        retention: 'Policy lifecycle + 10 years',
        justification: 'Maintains non-repudiation for policy maintenance actions and consent overrides.',
      },
      GovernanceRiskRegister: {
        fields: ['ownerEmail', 'mitigationPlan'],
        retention: 'Risk lifecycle + 7 years',
        justification: 'Historical risk treatments required for assurance reporting.',
      },
      DomainGovernanceReview: {
        fields: ['reviewedBy', 'notes'],
        retention: 'Permanent',
        justification: 'Primary record for data catalog governance decisions.',
      },
    },
    fieldDescriptions: {
      DomainGovernanceReview: {
        reviewStatus: 'Workflow status indicating whether remediation actions are complete.',
      },
      UserConsent: {
        status:
          'Represents the latest consent decision recorded for the user. Grants are timestamped for proof-of-consent and withdrawals capture revocation moments for compliance analytics.',
        metadata:
          'Structured payload storing locale, session identifiers, or device context that substantiates the consent capture channel.',
      },
    },
  },
  platform: {
    ownerTeam: 'Platform Core',
    dataSteward: 'Site Reliability Engineering',
    dataClassification: 'Internal',
    businessCriticality: 'Tier 2',
    dataResidency: {
      primaryRegion: 'us-east-1',
      failoverRegion: 'ap-southeast-1',
    },
    defaultRetention: 'Feature lifecycle + 2 years.',
    regulatoryFrameworks: ['SOC 2'],
    qualityChecks: [
      {
        name: 'Feature flag rollout review',
        cadence: 'per release',
        owner: 'Platform Core',
      },
      {
        name: 'Platform setting drift detection',
        cadence: 'hourly',
        owner: 'Site Reliability Engineering',
      },
    ],
    piiModels: {
      FeatureFlagAssignment: {
        fields: ['targetType', 'targetIdentifier'],
        retention: 'Feature lifecycle + 90 days',
        justification: 'Retained to debug rollout regressions and revert flags safely.',
      },
      PlatformSetting: {
        fields: ['value'],
        retention: 'Permanent',
        justification: 'Authoritative configuration for platform behaviour.',
      },
      RuntimeAnnouncement: {
        fields: ['title', 'message'],
        retention: 'Maintenance window + 12 months',
        justification: 'Used for incident retrospectives and policy reviews.',
      },
    },
    fieldDescriptions: {
      FeatureFlagAssignment: {
        targetIdentifier: 'Cohort identifier hashed on write to avoid leaking direct user IDs.',
      },
    },
  },
};

export default domainMetadata;
