const COMMON_PATTERNS = [
  /(password|letmein|gigvora|welcome|qwerty)/i,
  /(1234|2345|3456|4567|5678|6789|7890)/,
  /(abcd|bcde|cdef|defg|ghij|ijkl|klmn|mnop|qrst|tuvw|wxyz)/i,
];

const PASSWORD_REQUIREMENTS = Object.freeze([
  {
    id: 'length',
    label: 'At least 12 characters',
    hint: 'Use a minimum of 12 characters so brute force attempts take dramatically longer.',
    test: (value) => value.length >= 12,
  },
  {
    id: 'lowercase',
    label: 'Includes a lowercase letter',
    hint: 'Add a lowercase letter to avoid predictable casing.',
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: 'uppercase',
    label: 'Includes an uppercase letter',
    hint: 'Mix in an uppercase letter to improve entropy.',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: 'number',
    label: 'Includes a number',
    hint: 'Include at least one number to diversify characters.',
    test: (value) => /\d/.test(value),
  },
  {
    id: 'symbol',
    label: 'Includes a symbol',
    hint: 'Add a symbol to create additional permutations.',
    test: (value) => /[^0-9a-zA-Z]/.test(value),
  },
]);

const BONUS_RULES = Object.freeze([
  {
    id: 'length16',
    weight: 1,
    test: (value) => value.length >= 16,
  },
  {
    id: 'length20',
    weight: 1,
    test: (value) => value.length >= 20,
  },
  {
    id: 'uniqueCharacters',
    weight: 1,
    test: (value) => new Set(value.toLowerCase()).size >= Math.min(10, value.length),
  },
  {
    id: 'noTriples',
    weight: 1,
    test: (value) => !/(.)\1{2,}/.test(value),
  },
]);

const MAX_PASSWORD_STRENGTH_SCORE = 4;

const PASSWORD_STRENGTH_LEVELS = Object.freeze([
  { id: 'weak', label: 'Needs work', minScore: 0 },
  { id: 'fair', label: 'On track', minScore: 2 },
  { id: 'strong', label: 'Strong', minScore: 3 },
  { id: 'elite', label: 'Elite', minScore: 4 },
]);

function clampScore(score) {
  if (!Number.isFinite(score)) {
    return 0;
  }
  return Math.max(0, Math.min(MAX_PASSWORD_STRENGTH_SCORE, Math.round(score)));
}

export function resolvePasswordStrengthLevel(score) {
  const normalised = clampScore(score);
  for (let index = PASSWORD_STRENGTH_LEVELS.length - 1; index >= 0; index -= 1) {
    const level = PASSWORD_STRENGTH_LEVELS[index];
    if (normalised >= level.minScore) {
      return level;
    }
  }
  return PASSWORD_STRENGTH_LEVELS[0];
}

export function evaluatePasswordStrength(password) {
  const value = typeof password === 'string' ? password.trim() : '';
  const lower = value.toLowerCase();
  const requirements = PASSWORD_REQUIREMENTS.map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    hint: requirement.hint,
    met: requirement.test(value),
  }));
  const unmet = requirements.filter((requirement) => !requirement.met);
  const recommendations = unmet.map((requirement) => requirement.hint);

  const compromisedSignals = [];
  for (const pattern of COMMON_PATTERNS) {
    if (pattern.test(lower)) {
      compromisedSignals.push('Avoid common words or sequences such as “password” or straight keyboard runs.');
      break;
    }
  }

  if (/^[0-9]+$/.test(value) || /^[a-z]+$/i.test(value)) {
    compromisedSignals.push('Combine letters, numbers, and symbols so automated attacks cannot guess patterns.');
  }

  const bonusScore = BONUS_RULES.reduce((score, rule) => (rule.test(value) ? score + rule.weight : score), 0);
  const baseScore = requirements.reduce((score, requirement) => (requirement.met ? score + 1 : score), 0);
  const normalisedScore = clampScore((baseScore + bonusScore) / (PASSWORD_REQUIREMENTS.length + BONUS_RULES.length) * MAX_PASSWORD_STRENGTH_SCORE);

  const valid = unmet.length === 0 && compromisedSignals.length === 0;

  return {
    score: normalisedScore,
    valid,
    recommendations,
    requirements,
    compromised: compromisedSignals,
    length: value.length,
  };
}

export { PASSWORD_REQUIREMENTS, PASSWORD_STRENGTH_LEVELS, MAX_PASSWORD_STRENGTH_SCORE };

