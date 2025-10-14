import { ModerationError } from '../utils/errors.js';

const DEFAULT_BANNED_TERMS = [
  'abuse',
  'adultwork',
  'anal',
  'anus',
  'ballsack',
  'bestiality',
  'bitch',
  'blowjob',
  'bollocks',
  'boner',
  'bukkake',
  'buttplug',
  'clit',
  'cock',
  'creampie',
  'cumshot',
  'cunt',
  'deepthroat',
  'dick',
  'dildo',
  'dogging',
  'ejaculate',
  'ejaculation',
  'escort',
  'faggot',
  'femdom',
  'fuck',
  'gangbang',
  'handjob',
  'hardcore',
  'hentai',
  'hooker',
  'incest',
  'jerkoff',
  'midget',
  'milf',
  'nazi',
  'nudity',
  'orgasm',
  'paedophile',
  'pegging',
  'penis',
  'porn',
  'prostitute',
  'pussy',
  'rape',
  'scat',
  'slut',
  'sodom',
  'stripper',
  'swinger',
  'threesome',
  'titfuck',
  'vibrator',
  'xxx',
];

const SPAM_PHRASES = [
  'buy followers',
  'buy now',
  'click here',
  'crypto giveaway',
  'double your money',
  'earn $$$',
  'exclusive offer',
  'limited time offer',
  'make money fast',
  'miracle cure',
  'no experience needed',
  'passive income hack',
  'risk free',
  'work from home and earn',
];

const BLOCKED_LINK_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  'grabify.link',
  'iplogger.org',
  '2no.co',
  'ulvis.net',
  'cut.ly',
  'cutt.ly',
  'shorte.st',
  'clk.sh',
];

const DEFAULT_RULES = {
  bannedTerms: DEFAULT_BANNED_TERMS,
  spamPhrases: SPAM_PHRASES,
  blockedDomains: BLOCKED_LINK_DOMAINS,
  maxLinks: 3,
  maxMentions: 8,
  maxCharacters: 2200,
  minWordCount: 3,
  minUniqueWordRatio: 0.35,
  maxUppercaseRatio: 0.65,
  maxRepeatedCharacterRun: 5,
};

const ALLOWED_ATTACHMENT_TYPES = new Set(['image', 'gif', 'video', 'document']);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripInvisibleCharacters(value) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function stripHtmlTags(value) {
  return value.replace(/<[^>]*>/g, ' ');
}

function normaliseWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function sanitiseText(value) {
  if (!value) {
    return '';
  }
  const stringified = `${value}`;
  return normaliseWhitespace(stripInvisibleCharacters(stripHtmlTags(stringified)));
}

function normaliseForAnalysis(value) {
  return sanitiseText(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function buildObfuscationPattern(term) {
  const escapedCharacters = term.split('').map((character) => escapeRegExp(character));
  return new RegExp(escapedCharacters.join('[^a-z0-9]*'), 'i');
}

function countLinks(value) {
  if (!value) {
    return 0;
  }
  const matches = `${value}`.match(/https?:\/\//gi);
  return matches ? matches.length : 0;
}

function countMentions(value) {
  if (!value) {
    return 0;
  }
  const matches = `${value}`.match(/@[a-z0-9_.-]{2,}/gi);
  return matches ? matches.length : 0;
}

function calculateUppercaseRatio(value) {
  if (!value) {
    return 0;
  }
  const letters = value.replace(/[^a-zA-Z]/g, '');
  if (!letters) {
    return 0;
  }
  const uppercase = letters.replace(/[^A-Z]/g, '').length;
  return uppercase / letters.length;
}

function detectBannedTerms(text, bannedTerms) {
  const matches = [];
  const analysed = normaliseForAnalysis(text);
  bannedTerms.forEach((term) => {
    const trimmed = term.trim();
    if (!trimmed) {
      return;
    }
    const boundaryPattern = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, 'i');
    if (boundaryPattern.test(text) || buildObfuscationPattern(trimmed).test(analysed)) {
      matches.push(trimmed);
    }
  });
  return matches;
}

function detectSpamSignals({ content, summary, title, link, rules }) {
  const combined = [content, summary, title].filter(Boolean).join(' ');
  const analysed = normaliseForAnalysis(combined);
  const signals = [];

  const words = analysed.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.filter((word) => word.length > 2));
  if (words.length >= 4 && uniqueWords.size / words.length < rules.minUniqueWordRatio) {
    signals.push({
      type: 'repetitive_content',
      severity: 'medium',
      message: 'The update repeats the same words. Add more variety for clarity.',
    });
  }

  if (/(.)\1{5,}/.test(combined)) {
    signals.push({
      type: 'repeated_characters',
      severity: 'high',
      message: 'Please remove excessive repeated characters.',
    });
  }

  const linkCount = countLinks(combined) + (link ? 1 : 0);
  if (linkCount > rules.maxLinks) {
    signals.push({
      type: 'excessive_links',
      severity: 'high',
      message: `Posts can include up to ${rules.maxLinks} links.`,
    });
  }

  const mentionCount = countMentions(combined);
  if (mentionCount > rules.maxMentions) {
    signals.push({
      type: 'excessive_mentions',
      severity: 'medium',
      message: `Tag up to ${rules.maxMentions} handles in a single update.`,
    });
  }

  const uppercaseRatio = calculateUppercaseRatio(combined);
  if (uppercaseRatio > rules.maxUppercaseRatio && combined.length > 32) {
    signals.push({
      type: 'shouting',
      severity: 'medium',
      message: 'Avoid using all caps throughout the update.',
    });
  }

  for (const phrase of rules.spamPhrases) {
    if (analysed.includes(phrase)) {
      signals.push({
        type: 'spam_phrase',
        severity: 'high',
        message: `The phrase "${phrase}" is associated with spam and is not allowed.`,
      });
    }
  }

  return signals;
}

function validateAttachments(attachments = []) {
  if (!Array.isArray(attachments)) {
    return [];
  }
  return attachments
    .filter((attachment) => attachment && typeof attachment === 'object')
    .slice(0, 4)
    .map((attachment, index) => {
      const safeAlt = sanitiseText(attachment.alt ?? attachment.caption ?? '');
      return {
        id: attachment.id ?? `attachment-${index + 1}`,
        type: ALLOWED_ATTACHMENT_TYPES.has(`${attachment.type}`.toLowerCase())
          ? `${attachment.type}`.toLowerCase()
          : 'image',
        url: typeof attachment.url === 'string' ? attachment.url.trim() : null,
        alt: safeAlt.slice(0, 180),
      };
    });
}

function isBlockedDomain(link, blockedDomains) {
  if (!link) {
    return false;
  }
  try {
    const hostname = new URL(link).hostname.replace(/^www\./, '');
    return blockedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch (error) {
    return false;
  }
}

export function evaluateFeedPostContent(input, options = {}) {
  const rules = { ...DEFAULT_RULES, ...options.rules };
  const bannedTerms = Array.isArray(options.bannedTerms) ? options.bannedTerms : rules.bannedTerms;
  const spamPhrases = Array.isArray(options.spamPhrases) ? options.spamPhrases : rules.spamPhrases;
  const blockedDomains = Array.isArray(options.blockedDomains)
    ? options.blockedDomains
    : rules.blockedDomains;

  const content = sanitiseText(input.content);
  const summary = sanitiseText(input.summary);
  const title = sanitiseText(input.title);
  const link = input.link ?? null;
  const attachments = validateAttachments(input.attachments);

  if (!content) {
    return {
      decision: 'reject',
      reasons: ['Add more detail before publishing to the live feed.'],
      signals: [],
      content,
      summary,
      title,
      link,
      attachments,
    };
  }

  if (content.length > rules.maxCharacters) {
    return {
      decision: 'reject',
      reasons: [`Posts can contain up to ${rules.maxCharacters} characters.`],
      signals: [],
      content,
      summary,
      title,
      link,
      attachments,
    };
  }

  const bannedMatches = detectBannedTerms([content, summary, title].join(' '), bannedTerms);
  if (bannedMatches.length > 0) {
    return {
      decision: 'reject',
      reasons: bannedMatches.map((term) => `The term "${term}" is not permitted on the community feed.`),
      signals: [],
      content,
      summary,
      title,
      link,
      attachments,
    };
  }

  const analysedSpamSignals = detectSpamSignals({
    content,
    summary,
    title,
    link,
    rules: { ...rules, spamPhrases },
  });

  if (isBlockedDomain(link, blockedDomains)) {
    analysedSpamSignals.push({
      type: 'blocked_domain',
      severity: 'high',
      message: 'Links from this domain are blocked for safety reasons.',
    });
  }

  const severeSignals = analysedSpamSignals.filter((signal) => signal.severity === 'high');
  if (severeSignals.length > 0) {
    return {
      decision: 'reject',
      reasons: severeSignals.map((signal) => signal.message),
      signals: analysedSpamSignals,
      content,
      summary,
      title,
      link,
      attachments,
    };
  }

  if (analysedSpamSignals.length > 0 && !options.allowWarnings) {
    return {
      decision: 'reject',
      reasons: analysedSpamSignals.map((signal) => signal.message),
      signals: analysedSpamSignals,
      content,
      summary,
      title,
      link,
      attachments,
    };
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount < rules.minWordCount) {
    return {
      decision: 'reject',
      reasons: ['Share at least three words so the community understands your update.'],
      signals: analysedSpamSignals,
      content,
      summary,
      title,
      link,
      attachments,
    };
  }

  return {
    decision: 'approve',
    reasons: [],
    signals: analysedSpamSignals,
    content,
    summary,
    title,
    link,
    attachments,
  };
}

export function enforceFeedPostPolicies(input, options = {}) {
  const evaluation = evaluateFeedPostContent(input, options);
  if (evaluation.decision !== 'approve') {
    const message =
      options.errorMessage ||
      'Your update cannot be published because it violates Gigvora community standards.';
    throw new ModerationError(message, {
      reasons: evaluation.reasons,
      signals: evaluation.signals,
    });
  }
  return evaluation;
}

export default {
  evaluateFeedPostContent,
  enforceFeedPostPolicies,
  DEFAULT_RULES,
};
