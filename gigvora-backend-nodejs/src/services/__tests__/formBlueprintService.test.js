import {
  listFormBlueprints,
  getFormBlueprintByKey,
  validateFormBlueprintField,
} from '../formBlueprintService.js';
import {
  FormBlueprint,
  FormBlueprintStep,
  FormBlueprintField,
  FormBlueprintValidation,
} from '../../models/formBlueprintModels.js';

jest.mock('../../models/index.js', () => {
  const mockProviderWorkspace = { findOne: jest.fn() };
  const mockUser = { findOne: jest.fn() };
  return {
    __esModule: true,
    default: {
      ProviderWorkspace: mockProviderWorkspace,
      User: mockUser,
    },
  };
});

const { ProviderWorkspace } = jest.requireMock('../../models/index.js').default;

describe('formBlueprintService', () => {
  beforeAll(async () => {
    await FormBlueprint.sync({ force: true });
    await FormBlueprintStep.sync({ force: true });
    await FormBlueprintField.sync({ force: true });
    await FormBlueprintValidation.sync({ force: true });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await FormBlueprintValidation.destroy({ where: {} });
    await FormBlueprintField.destroy({ where: {} });
    await FormBlueprintStep.destroy({ where: {} });
    await FormBlueprint.destroy({ where: {} });
  });

  it('lists blueprints with steps, fields, and initial values', async () => {
    const blueprint = await FormBlueprint.create({
      key: 'test_blueprint',
      name: 'Test Blueprint',
      status: 'active',
      analyticsChannel: 'forms.test',
    });

    const step = await FormBlueprintStep.create({
      blueprintId: blueprint.id,
      stepKey: 'details',
      title: 'Company Details',
      orderIndex: 0,
    });

    const nameField = await FormBlueprintField.create({
      blueprintId: blueprint.id,
      stepId: step.id,
      name: 'companyName',
      label: 'Company name',
      component: 'text',
      dataType: 'string',
      required: true,
      orderIndex: 0,
      normalizers: ['trim'],
    });

    const toggleField = await FormBlueprintField.create({
      blueprintId: blueprint.id,
      stepId: step.id,
      name: 'twoFactorEnabled',
      label: 'Require two-factor authentication',
      component: 'toggle',
      dataType: 'boolean',
      required: false,
      orderIndex: 1,
      defaultValue: 'true',
    });

    await FormBlueprintValidation.bulkCreate([
      { fieldId: nameField.id, type: 'required', message: 'Name is required.', orderIndex: 0 },
      {
        fieldId: nameField.id,
        type: 'min_length',
        config: { min: 3 },
        message: 'Name must be at least 3 characters.',
        orderIndex: 1,
      },
      {
        fieldId: nameField.id,
        type: 'unique_workspace_name',
        message: 'Name already exists.',
        orderIndex: 2,
      },
      {
        fieldId: toggleField.id,
        type: 'recommended_toggle',
        severity: 'warning',
        message: 'Keep this enabled for security.',
        haltOnFail: false,
        orderIndex: 0,
      },
    ]);

    const result = await listFormBlueprints({ includeSteps: true, includeFields: true });
    expect(result.count).toBe(1);
    const [item] = result.items;
    expect(item.key).toBe('test_blueprint');
    expect(item.steps[0].fields).toHaveLength(2);
    expect(item.initialValues.companyName).toBeNull();
    expect(item.initialValues.twoFactorEnabled).toBe(true);
  });

  it('fetches a blueprint by key with merged defaults', async () => {
    const blueprint = await FormBlueprint.create({
      key: 'company_onboarding',
      name: 'Company onboarding',
      status: 'active',
      analyticsChannel: 'forms.company',
    });

    const step = await FormBlueprintStep.create({
      blueprintId: blueprint.id,
      stepKey: 'security',
      title: 'Security',
      orderIndex: 0,
    });

    await FormBlueprintField.create({
      blueprintId: blueprint.id,
      stepId: step.id,
      name: 'termsAccepted',
      label: 'Accept terms',
      component: 'checkbox',
      dataType: 'boolean',
      required: true,
      orderIndex: 0,
    });

    const response = await getFormBlueprintByKey('company_onboarding', {
      includeSteps: true,
      includeFields: true,
    });

    expect(response).not.toBeNull();
    expect(response.key).toBe('company_onboarding');
    expect(response.initialValues.termsAccepted).toBe(false);
  });

  it('validates field rules and integrates remote uniqueness checks', async () => {
    const blueprint = await FormBlueprint.create({
      key: 'company_request',
      name: 'Company request',
      status: 'active',
    });

    const step = await FormBlueprintStep.create({
      blueprintId: blueprint.id,
      stepKey: 'profile',
      title: 'Profile',
      orderIndex: 0,
    });

    const nameField = await FormBlueprintField.create({
      blueprintId: blueprint.id,
      stepId: step.id,
      name: 'companyName',
      label: 'Company name',
      component: 'text',
      dataType: 'string',
      required: true,
      orderIndex: 0,
      normalizers: ['trim'],
    });

    await FormBlueprintValidation.bulkCreate([
      { fieldId: nameField.id, type: 'required', message: 'Name is required.', orderIndex: 0 },
      {
        fieldId: nameField.id,
        type: 'unique_workspace_name',
        message: 'Workspace already exists.',
        orderIndex: 1,
      },
    ]);

    ProviderWorkspace.findOne.mockResolvedValue(null);

    const missingResult = await validateFormBlueprintField('company_request', 'companyName', '');
    expect(missingResult.valid).toBe(false);
    expect(missingResult.errors[0].message).toContain('Name is required');

    const okResult = await validateFormBlueprintField('company_request', 'companyName', 'Acme Inc');
    expect(okResult.valid).toBe(true);
    expect(okResult.value).toBe('Acme Inc');

    ProviderWorkspace.findOne.mockResolvedValue({ id: 42 });
    const duplicateResult = await validateFormBlueprintField('company_request', 'companyName', 'Acme Inc');
    expect(duplicateResult.valid).toBe(false);
    expect(duplicateResult.errors[0].message).toContain('Workspace already exists');
  });

  it('returns warnings for recommended toggles without blocking submission', async () => {
    const blueprint = await FormBlueprint.create({
      key: 'security_profile',
      name: 'Security profile',
      status: 'active',
    });

    const step = await FormBlueprintStep.create({
      blueprintId: blueprint.id,
      stepKey: 'security',
      title: 'Security',
      orderIndex: 0,
    });

    const toggleField = await FormBlueprintField.create({
      blueprintId: blueprint.id,
      stepId: step.id,
      name: 'twoFactorEnabled',
      label: 'Two-factor',
      component: 'toggle',
      dataType: 'boolean',
      required: false,
      orderIndex: 0,
      defaultValue: 'true',
    });

    await FormBlueprintValidation.create({
      fieldId: toggleField.id,
      type: 'recommended_toggle',
      severity: 'warning',
      message: 'Enable this to protect access.',
      haltOnFail: false,
      orderIndex: 0,
    });

    const warningResult = await validateFormBlueprintField('security_profile', 'twoFactorEnabled', false);
    expect(warningResult.valid).toBe(true);
    expect(warningResult.warnings).toHaveLength(1);
    expect(warningResult.warnings[0].message).toContain('Enable this to protect access');
  });
});
