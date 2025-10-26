import {
  evaluatePasswordStrength as sharedEvaluatePasswordStrength,
} from '@shared-contracts/security/passwordStrength.js';

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
  return sharedEvaluatePasswordStrength(password);
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
