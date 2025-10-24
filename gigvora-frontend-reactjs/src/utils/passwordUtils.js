const MIN_LENGTH = 8;

export function calculatePasswordStrength(password) {
  if (typeof password !== 'string' || !password.length) {
    return { score: 0, label: 'empty', requirementsMet: [] };
  }

  const checks = [
    { id: 'length', test: (value) => value.length >= MIN_LENGTH },
    { id: 'upper', test: (value) => /[A-Z]/.test(value) },
    { id: 'lower', test: (value) => /[a-z]/.test(value) },
    { id: 'number', test: (value) => /\d/.test(value) },
    { id: 'symbol', test: (value) => /[^A-Za-z0-9]/.test(value) },
  ];

  const requirementsMet = checks.filter((check) => check.test(password)).map((check) => check.id);
  const score = requirementsMet.length;

  let label = 'weak';
  if (score >= 4 && password.length >= 12) {
    label = 'strong';
  } else if (score >= 3) {
    label = 'fair';
  }

  return { score, label, requirementsMet };
}

export function passwordsMatch(password, confirmPassword) {
  return `${password ?? ''}` === `${confirmPassword ?? ''}`;
}

export default {
  calculatePasswordStrength,
  passwordsMatch,
};
