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

export function validatePasswordStrength(password) {
  const value = typeof password === 'string' ? password.trim() : '';
  const hasMinLength = value.length >= 8;
  const hasNumber = /\d/.test(value);
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasSymbol = /[^\da-zA-Z]/.test(value);
  const valid = hasMinLength && hasNumber && hasLetter;
  const recommendations = [];

  if (!hasMinLength) {
    recommendations.push('Use at least 8 characters.');
  }
  if (!hasNumber) {
    recommendations.push('Include at least one number.');
  }
  if (!hasLetter) {
    recommendations.push('Include at least one letter.');
  }
  if (!hasSymbol) {
    recommendations.push('Add a symbol for extra security.');
  }

  return { valid, recommendations };
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
