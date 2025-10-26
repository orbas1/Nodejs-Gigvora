'use strict';

const { QueryTypes } = require('sequelize');

const BLUEPRINT_KEY = 'company_workspace_request';

const STEP_DEFINITIONS = [
  {
    stepKey: 'workspace_profile',
    title: 'Workspace profile',
    description: 'Introduce your brand, focus area, and visibility preferences so we can tailor the onboarding experience.',
    orderIndex: 0,
    gatingRules: {
      requiredFields: ['companyName', 'focusArea'],
      analyticsStep: 'profile',
    },
    metadata: {
      progressCopy: 'Share how your organisation collaborates with the Gigvora network.',
    },
  },
  {
    stepKey: 'security_controls',
    title: 'Security & access',
    description: 'Confirm the primary contact, security preferences, and platform credentials for your workspace.',
    orderIndex: 1,
    gatingRules: {
      requiredFields: ['contactName', 'contactEmail', 'password', 'confirmPassword', 'termsAccepted'],
      analyticsStep: 'security',
    },
    metadata: {
      progressCopy: 'Set up authentication so your team can access admin dashboards immediately.',
    },
  },
];

const FIELD_DEFINITIONS = [
  {
    name: 'companyName',
    stepKey: 'workspace_profile',
    label: 'Workspace or company name',
    placeholder: 'E.g. Northern Lights Studio',
    helpText: 'Shown across dashboards, invoices, and partner invites. Use your trading name if different from legal entity.',
    component: 'text',
    dataType: 'string',
    required: true,
    orderIndex: 0,
    normalizers: ['trim'],
    analytics: { funnelKey: 'workspace_name' },
    metadata: { icon: 'building-office', autoSlugTarget: 'workspaceSlug' },
  },
  {
    name: 'focusArea',
    stepKey: 'workspace_profile',
    label: 'Primary focus area',
    placeholder: 'Choose the focus that best matches your current priorities',
    helpText: 'We tailor templates, reporting, and community intros based on your focus area.',
    component: 'select',
    dataType: 'string',
    required: true,
    orderIndex: 1,
    options: [
      { value: 'talent', label: 'Talent acquisition & hiring programmes' },
      { value: 'gig_programmes', label: 'Gig programmes & scoped projects' },
      { value: 'mentoring', label: 'Mentoring and capability building' },
      { value: 'partnerships', label: 'Partnerships & employer branding' },
      { value: 'operations', label: 'Operational excellence & workforce analytics' },
    ],
    analytics: { funnelKey: 'focus_area' },
    metadata: { layout: 'grid' },
  },
  {
    name: 'website',
    stepKey: 'workspace_profile',
    label: 'Public website',
    placeholder: 'https://example.com',
    helpText: 'Optional but recommended so talent and partners can review your brand assets.',
    component: 'text',
    dataType: 'url',
    required: false,
    orderIndex: 2,
    normalizers: ['trim'],
    analytics: { funnelKey: 'website' },
    metadata: { icon: 'globe-alt' },
  },
  {
    name: 'teamSize',
    stepKey: 'workspace_profile',
    label: 'Approximate team size',
    placeholder: 'Select a range',
    component: 'select',
    dataType: 'string',
    required: false,
    orderIndex: 3,
    options: [
      { value: '1-10', label: '1-10 people' },
      { value: '11-50', label: '11-50 people' },
      { value: '51-200', label: '51-200 people' },
      { value: '201-500', label: '201-500 people' },
      { value: '500+', label: '500+ people' },
    ],
    analytics: { funnelKey: 'team_size' },
  },
  {
    name: 'location',
    stepKey: 'workspace_profile',
    label: 'Primary location',
    placeholder: 'City, country',
    component: 'text',
    dataType: 'string',
    required: false,
    orderIndex: 4,
    normalizers: ['trim'],
    analytics: { funnelKey: 'location' },
    metadata: { icon: 'map-pin' },
  },
  {
    name: 'contactName',
    stepKey: 'security_controls',
    label: 'Primary contact name',
    placeholder: 'Avery Johnson',
    helpText: 'We use this for onboarding updates and security notifications.',
    component: 'text',
    dataType: 'string',
    required: true,
    orderIndex: 0,
    normalizers: ['trim'],
    analytics: { funnelKey: 'contact_name' },
  },
  {
    name: 'contactEmail',
    stepKey: 'security_controls',
    label: 'Work email',
    placeholder: 'you@example.com',
    helpText: 'Must be monitored so we can deliver account access and compliance alerts.',
    component: 'text',
    dataType: 'email',
    required: true,
    orderIndex: 1,
    normalizers: ['trim', 'toLowerCase'],
    analytics: { funnelKey: 'contact_email' },
  },
  {
    name: 'password',
    stepKey: 'security_controls',
    label: 'Admin password',
    placeholder: 'Create a strong password',
    component: 'password',
    dataType: 'password',
    required: true,
    orderIndex: 2,
    analytics: { funnelKey: 'password' },
    metadata: { strengthMeter: true },
  },
  {
    name: 'confirmPassword',
    stepKey: 'security_controls',
    label: 'Confirm password',
    placeholder: 'Retype your password',
    component: 'password',
    dataType: 'password',
    required: true,
    orderIndex: 3,
    analytics: { funnelKey: 'confirm_password' },
  },
  {
    name: 'twoFactorEnabled',
    stepKey: 'security_controls',
    label: 'Require two-factor authentication for workspace admins',
    helpText: 'Recommended to protect payouts, contracts, and private candidate data.',
    component: 'toggle',
    dataType: 'boolean',
    required: false,
    orderIndex: 4,
    defaultValue: 'true',
    analytics: { funnelKey: 'two_factor_enabled' },
    metadata: { defaultOn: true },
  },
  {
    name: 'termsAccepted',
    stepKey: 'security_controls',
    label: 'I agree to the Gigvora customer terms and data processing addendum',
    component: 'checkbox',
    dataType: 'boolean',
    required: true,
    orderIndex: 5,
    defaultValue: 'false',
    analytics: { funnelKey: 'terms_acceptance' },
    metadata: {
      legalUrl: 'https://gigvora.com/legal/customer-terms',
      privacyUrl: 'https://gigvora.com/legal/privacy',
    },
  },
];

const VALIDATION_DEFINITIONS = {
  companyName: [
    { type: 'required', message: 'Add the workspace or company name so we can set things up.' },
    { type: 'min_length', config: { min: 3 }, message: 'Use at least 3 characters so your name is searchable.' },
    {
      type: 'pattern',
      config: { pattern: '^[A-Za-z0-9 .&-]{3,}$' },
      message: 'Use letters, numbers, spaces, periods, ampersands, or hyphens only.',
    },
    { type: 'unique_workspace_name', message: 'A workspace with this name already exists on Gigvora.' },
  ],
  focusArea: [{ type: 'required', message: 'Select the focus area that best describes your current programmes.' }],
  website: [
    {
      type: 'url',
      severity: 'warning',
      message: 'Share a valid URL so teams can verify your brand faster.',
      config: { allowProtocolRelative: false },
    },
  ],
  teamSize: [
    {
      type: 'enum',
      message: 'Choose a value from the provided ranges.',
      config: { options: ['1-10', '11-50', '51-200', '201-500', '500+'] },
    },
  ],
  contactName: [{ type: 'required', message: 'Add the primary contact so we can provision access securely.' }],
  contactEmail: [
    { type: 'required', message: 'Add the monitored work email for onboarding updates.' },
    { type: 'email', message: 'Enter a valid email address.' },
    { type: 'unique_workspace_contact', message: 'This email already manages a workspace on Gigvora.' },
  ],
  password: [
    { type: 'required', message: 'Create a password for the primary administrator account.' },
    {
      type: 'password_strength',
      message: 'Use at least 12 characters including a number, a letter, and a symbol.',
      config: { minLength: 12, requireNumber: true, requireLetter: true, requireSymbol: true },
    },
  ],
  confirmPassword: [
    { type: 'required', message: 'Re-enter the password so we can verify the match.' },
    { type: 'matches_field', config: { otherField: 'password' }, message: 'Passwords do not match.' },
  ],
  twoFactorEnabled: [
    {
      type: 'recommended_toggle',
      severity: 'warning',
      message: 'Keep two-factor authentication enabled to protect payouts and contracts.',
      config: { recommended: true },
    },
  ],
  termsAccepted: [
    {
      type: 'accepted',
      message: 'Accept the customer terms to continue.',
    },
  ],
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [existing] = await queryInterface.sequelize.query(
        'SELECT id FROM form_blueprints WHERE key = :key LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { key: BLUEPRINT_KEY },
        },
      );

      if (existing?.id) {
        return;
      }

      const now = new Date();

      await queryInterface.bulkInsert(
        'form_blueprints',
        [
          {
            key: BLUEPRINT_KEY,
            name: 'Company workspace onboarding',
            description:
              'Guided onboarding flow for company and agency workspaces, covering profile, security, and legal acceptance.',
            persona: 'company_operations',
            version: 1,
            status: 'active',
            analyticsChannel: 'forms.company_onboarding',
            metadata: {
              submissionEndpoint: '/auth/register/company',
              alternateSubmissionEndpoint: '/auth/register/agency',
              reviewSlaHours: 24,
              ownerTeam: 'Marketplace Operations',
            },
            settings: { multiStep: true, progressiveDisclosure: true },
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const [blueprintRow] = await queryInterface.sequelize.query(
        'SELECT id FROM form_blueprints WHERE key = :key LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { key: BLUEPRINT_KEY },
        },
      );

      if (!blueprintRow?.id) {
        throw new Error('Failed to resolve form_blueprints record for company onboarding.');
      }

      const blueprintId = blueprintRow.id;

      const stepRows = STEP_DEFINITIONS.map((step) => ({
        blueprintId,
        stepKey: step.stepKey,
        title: step.title,
        description: step.description,
        orderIndex: step.orderIndex,
        gatingRules: step.gatingRules,
        metadata: step.metadata,
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkInsert('form_blueprint_steps', stepRows, { transaction });

      const stepRecords = await queryInterface.sequelize.query(
        'SELECT id, step_key FROM form_blueprint_steps WHERE blueprint_id = :blueprintId',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { blueprintId },
        },
      );

      const stepIdByKey = Object.fromEntries(stepRecords.map((record) => [record.step_key, record.id]));

      const fieldRows = FIELD_DEFINITIONS.map((field) => ({
        blueprintId,
        stepId: stepIdByKey[field.stepKey] ?? null,
        name: field.name,
        label: field.label,
        placeholder: field.placeholder ?? null,
        helpText: field.helpText ?? null,
        component: field.component,
        dataType: field.dataType,
        required: field.required,
        defaultValue: field.defaultValue ?? null,
        options: field.options ?? null,
        normalizers: field.normalizers ?? null,
        analytics: field.analytics ?? null,
        orderIndex: field.orderIndex,
        visibility: field.visibility ?? null,
        metadata: field.metadata ?? null,
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkInsert('form_blueprint_fields', fieldRows, { transaction });

      const fieldRecords = await queryInterface.sequelize.query(
        'SELECT id, name FROM form_blueprint_fields WHERE blueprint_id = :blueprintId',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { blueprintId },
        },
      );

      const fieldIdByName = Object.fromEntries(fieldRecords.map((record) => [record.name, record.id]));

      const validationRows = [];
      Object.entries(VALIDATION_DEFINITIONS).forEach(([fieldName, validations]) => {
        const fieldId = fieldIdByName[fieldName];
        if (!fieldId) {
          return;
        }
        validations.forEach((validation, index) => {
          validationRows.push({
            fieldId,
            type: validation.type,
            message: validation.message,
            severity: validation.severity ?? 'error',
            haltOnFail: validation.haltOnFail ?? true,
            config: validation.config ?? null,
            orderIndex: index,
            createdAt: now,
            updatedAt: now,
          });
        });
      });

      if (validationRows.length) {
        await queryInterface.bulkInsert('form_blueprint_validations', validationRows, { transaction });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [blueprintRow] = await queryInterface.sequelize.query(
        'SELECT id FROM form_blueprints WHERE key = :key LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { key: BLUEPRINT_KEY },
        },
      );

      if (!blueprintRow?.id) {
        return;
      }

      const blueprintId = blueprintRow.id;

      const fieldRows = await queryInterface.sequelize.query(
        'SELECT id FROM form_blueprint_fields WHERE blueprint_id = :blueprintId',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { blueprintId },
        },
      );

      const fieldIds = fieldRows.map((row) => row.id);
      if (fieldIds.length) {
        await queryInterface.bulkDelete('form_blueprint_validations', { fieldId: fieldIds }, { transaction });
      }

      await queryInterface.bulkDelete('form_blueprint_fields', { blueprintId }, { transaction });
      await queryInterface.bulkDelete('form_blueprint_steps', { blueprintId }, { transaction });
      await queryInterface.bulkDelete('form_blueprints', { id: blueprintId }, { transaction });
    });
  },
};
