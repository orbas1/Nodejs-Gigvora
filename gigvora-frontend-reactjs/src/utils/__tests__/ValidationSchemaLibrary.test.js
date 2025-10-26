import { describe, expect, it } from 'vitest';

import {
  createSchemaFromBlueprint,
  createValidationSchema,
  validators,
} from '../ValidationSchemaLibrary.js';

describe('validators.url', () => {
  it('accepts valid urls and rejects invalid ones', async () => {
    const validator = validators.url();
    await expect(validator.run('https://gigvora.com', {})).resolves.toBeNull();
    await expect(validator.run('ftp://files.gigvora.com', {})).resolves.toBeNull();
    await expect(validator.run('notaurl', {})).resolves.toEqual('Enter a valid URL.');
  });
});

describe('validators.passwordStrength', () => {
  it('enforces strength requirements', async () => {
    const validator = validators.passwordStrength({ requireNumber: true, requireSymbol: true });
    await expect(validator.run('Strong1!', {})).resolves.toBeNull();
    await expect(validator.run('weakpassword', {})).resolves.toEqual('Include at least one number.');
    await expect(validator.run('NoSymbol1', {})).resolves.toEqual('Include at least one symbol.');
  });
});

describe('validators.booleanTrue', () => {
  it('accepts truthy confirmations and rejects negatives', async () => {
    const validator = validators.booleanTrue('Please accept the terms.');
    await expect(validator.run(true, {})).resolves.toBeNull();
    await expect(validator.run('YES', {})).resolves.toBeNull();
    await expect(validator.run(false, {})).resolves.toEqual('Please accept the terms.');
  });
});

describe('createValidationSchema', () => {
  it('applies message catalog lookups when resolving validation output', async () => {
    const schema = createValidationSchema(
      {
        email: {
          validators: [validators.required('errors.required')],
        },
      },
      {
        messageCatalog: {
          'errors.required': 'Please complete this field.',
        },
      },
    );

    const result = await schema.validateField('email', '', { email: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['Email: Please complete this field.']);
  });
});

describe('createSchemaFromBlueprint', () => {
  it('builds schemas with validators, warnings, and normalisers from blueprints', async () => {
    const blueprint = {
      fields: [
        {
          name: 'termsAccepted',
          label: 'Terms',
          dataType: 'boolean',
          defaultValue: false,
          normalizers: ['toBoolean'],
          validations: [
            {
              type: 'accepted',
              messageKey: 'errors.accepted',
            },
          ],
        },
        {
          name: 'portfolioUrl',
          label: 'Portfolio URL',
          defaultValue: '',
          validations: [
            {
              type: 'url',
              severity: 'warning',
              messageKey: 'warnings.url',
            },
          ],
        },
      ],
      steps: [
        {
          key: 'profile',
          fields: [
            {
              name: 'displayName',
              label: 'Display Name',
              defaultValue: '',
              validations: [
                {
                  type: 'required',
                  messageKey: 'errors.required',
                },
              ],
            },
          ],
        },
      ],
    };

    const schema = createSchemaFromBlueprint(blueprint, {
      messageCatalog: {
        'errors.required': 'Please add your display name.',
        'errors.accepted': 'Please accept the latest terms.',
        'warnings.url': 'Add a complete URL so clients can review your work.',
      },
    });

    expect(schema).not.toBeNull();
    expect(schema.fieldNames.sort()).toEqual(['displayName', 'portfolioUrl', 'termsAccepted']);

    const termsField = schema.getField('termsAccepted');
    expect(Array.isArray(termsField.normalizers)).toBe(true);
    expect(termsField.normalizers).toHaveLength(1);

    const normalizedValue = schema.normalizeFieldValue('termsAccepted', 'yes', {}, {});
    expect(normalizedValue).toBe(true);

    const displayNameResult = await schema.validateField('displayName', '', { displayName: '' });
    expect(displayNameResult.errors).toEqual(['Display Name: Please add your display name.']);

    const termsResult = await schema.validateField('termsAccepted', false, { termsAccepted: false });
    expect(termsResult.errors).toEqual(['Terms: Please accept the latest terms.']);

    const portfolioResult = await schema.validateField(
      'portfolioUrl',
      'portfolio',
      { portfolioUrl: 'portfolio' },
    );
    expect(portfolioResult.errors).toEqual([]);
    expect(portfolioResult.warnings).toEqual([
      'Portfolio URL: Add a complete URL so clients can review your work.',
    ]);
  });
});
