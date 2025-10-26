const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function isNonEmpty(value) {
  if (value == null) {
    return false;
  }
  return String(value).trim().length > 0;
}

export function isValidEmail(value) {
  if (!isNonEmpty(value)) {
    return false;
  }
  return EMAIL_REGEX.test(String(value).trim());
}

export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
};

export const PASSWORD_STRENGTH_REQUIREMENTS = [
  {
    id: 'length',
    label: `Use at least ${PASSWORD_POLICY.minLength} characters.`,
    shortLabel: `At least ${PASSWORD_POLICY.minLength} characters`,
    test: (value) => value.length >= PASSWORD_POLICY.minLength,
  },
  {
    id: 'uppercase',
    label: 'Include an uppercase letter.',
    shortLabel: 'Includes an uppercase letter',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: 'lowercase',
    label: 'Include a lowercase letter.',
    shortLabel: 'Includes a lowercase letter',
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: 'number',
    label: 'Include a number.',
    shortLabel: 'Includes a number',
    test: (value) => /\d/.test(value),
  },
  {
    id: 'symbol',
    label: 'Add a symbol for extra security.',
    shortLabel: 'Includes a symbol',
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export function describePasswordPolicy(policy = PASSWORD_POLICY) {
  if (!policy) {
    return '';
  }
  const segments = [];
  if (Number.isFinite(policy.minLength) && policy.minLength > 0) {
    segments.push(`at least ${policy.minLength} characters`);
  }
  const inclusions = [];
  if (policy.requireUppercase) {
    inclusions.push('an uppercase letter');
  }
  if (policy.requireLowercase) {
    inclusions.push('a lowercase letter');
  }
  if (policy.requireNumber) {
    inclusions.push('a number');
  }
  if (policy.requireSymbol) {
    inclusions.push('a symbol');
  }
  let description = '';
  if (segments.length) {
    description = `Use ${segments[0]}`;
  }
  if (inclusions.length) {
    const last = inclusions[inclusions.length - 1];
    const initial = inclusions.slice(0, -1).join(', ');
    const inclusionText = inclusions.length > 1 ? `${initial}${initial ? ', and ' : ''}${last}` : last;
    description = description ? `${description} and include ${inclusionText}.` : `Include ${inclusionText}.`;
  } else if (description) {
    description = `${description}.`;
  }
  return description;
}

export function validatePasswordStrength(password) {
  const value = typeof password === 'string' ? password.trim() : '';
  const evaluations = PASSWORD_STRENGTH_REQUIREMENTS.map((rule) => ({
    id: rule.id,
    label: rule.label,
    shortLabel: rule.shortLabel,
    met: rule.test(value),
  }));
  const recommendations = evaluations.filter((rule) => !rule.met).map((rule) => rule.label);

  return {
    valid: recommendations.length === 0,
    recommendations,
    rules: evaluations,
  };
}

export function validateRequiredFields(form, fields) {
  const errors = {};
  fields.forEach((field) => {
    if (!isNonEmpty(form[field])) {
      errors[field] = 'This field is required.';
    }
  });
  return { valid: Object.keys(errors).length === 0, errors };
}
