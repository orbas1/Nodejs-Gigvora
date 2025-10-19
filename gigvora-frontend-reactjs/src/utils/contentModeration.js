const BANNED_TERMS = [
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

const BLOCKED_DOMAINS = [
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

export class ContentModerationError extends Error {
  constructor(message, { reasons = [], signals = [] } = {}) {
    super(message);
    this.name = 'ContentModerationError';
    this.reasons = reasons;
    this.signals = signals;
  }
}

const DEFAULT_RULES = {
  maxCharacters: 2200,
  maxLinks: 3,
  maxMentions: 8,
  minWordCount: 3,
  maxUppercaseRatio: 0.65,
  minUniqueWordRatio: 0.35,
};

const ALLOWED_ATTACHMENT_TYPES = new Set(['image', 'gif', 'video', 'document']);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripInvisibleCharacters(value) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, ' ');
}

function normaliseWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function sanitiseText(value) {
  if (!value) {
    return '';
  }
  return normaliseWhitespace(stripInvisibleCharacters(stripHtml(`${value}`)));
}

function normaliseForAnalysis(value) {
  return sanitiseText(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function buildObfuscationPattern(term) {
  const escapedCharacters = term.split('').map((character) => escapeRegExp(character));
  return new RegExp(escapedCharacters.join('[^a-z0-9]*'), 'i');
}

function detectBannedTerms(content) {
  const analysed = normaliseForAnalysis(content);
  const matches = [];
  for (const term of BANNED_TERMS) {
    const trimmed = term.trim();
    if (!trimmed) continue;
    const wordPattern = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, 'i');
    if (wordPattern.test(content) || buildObfuscationPattern(trimmed).test(analysed)) {
      matches.push(trimmed);
    }
  }
  return matches;
}

function countLinks(value) {
  const matches = value.match(/https?:\/\//gi);
  return matches ? matches.length : 0;
}

function countMentions(value) {
  const matches = value.match(/@[a-z0-9_.-]{2,}/gi);
  return matches ? matches.length : 0;
}

function calculateUppercaseRatio(value) {
  const letters = value.replace(/[^a-zA-Z]/g, '');
  if (!letters) return 0;
  const uppercase = letters.replace(/[^A-Z]/g, '').length;
  return uppercase / letters.length;
}

function detectSpamSignals({ content, summary, title, link }) {
  const combined = [content, summary, title].filter(Boolean).join(' ');
  const analysed = normaliseForAnalysis(combined);
  const words = analysed.split(/\s+/).filter(Boolean);
  const signals = [];

  if (/(.)\1{5,}/.test(combined)) {
    signals.push({
      type: 'repeated_characters',
      severity: 'high',
      message: 'Please remove excessive repeated characters.',
    });
  }

  const uniqueWords = new Set(words.filter((word) => word.length > 2));
  if (words.length >= 4 && uniqueWords.size / words.length < DEFAULT_RULES.minUniqueWordRatio) {
    signals.push({
      type: 'repetitive_content',
      severity: 'medium',
      message: 'The update repeats the same words. Add more variety for clarity.',
    });
  }

  const linkCount = countLinks(combined) + (link ? 1 : 0);
  if (linkCount > DEFAULT_RULES.maxLinks) {
    signals.push({
      type: 'excessive_links',
      severity: 'high',
      message: `Posts can include up to ${DEFAULT_RULES.maxLinks} links.`,
    });
  }

  const mentionCount = countMentions(combined);
  if (mentionCount > DEFAULT_RULES.maxMentions) {
    signals.push({
      type: 'excessive_mentions',
      severity: 'medium',
      message: `Tag up to ${DEFAULT_RULES.maxMentions} handles in a single update.`,
    });
  }

  const uppercaseRatio = calculateUppercaseRatio(combined);
  if (uppercaseRatio > DEFAULT_RULES.maxUppercaseRatio && combined.length > 32) {
    signals.push({
      type: 'shouting',
      severity: 'medium',
      message: 'Avoid using all caps throughout the update.',
    });
  }

  for (const phrase of SPAM_PHRASES) {
    if (analysed.includes(phrase)) {
      signals.push({
        type: 'spam_phrase',
        severity: 'high',
        message: `The phrase "${phrase}" is associated with spam and is not allowed.`,
      });
    }
  }

  if (link && isBlockedDomain(link)) {
    signals.push({
      type: 'blocked_domain',
      severity: 'high',
      message: 'Links from this domain are blocked for safety reasons.',
    });
  }

  return signals;
}

function isBlockedDomain(link) {
  if (!link) return false;
  try {
    const hostname = new URL(link).hostname.replace(/^www\./, '');
    return BLOCKED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch (error) {
    return false;
  }
}

function sanitiseAttachments(attachments = []) {
  if (!Array.isArray(attachments)) {
    return [];
  }
  return attachments
    .filter((attachment) => attachment && typeof attachment === 'object' && typeof attachment.url === 'string')
    .slice(0, 4)
    .map((attachment, index) => ({
      id: attachment.id ?? `attachment-${index + 1}`,
      type: ALLOWED_ATTACHMENT_TYPES.has(`${attachment.type}`.toLowerCase())
        ? `${attachment.type}`.toLowerCase()
        : 'image',
      url: attachment.url.trim(),
      alt: sanitiseText(attachment.alt ?? attachment.caption ?? '').slice(0, 180),
    }));
}

export function moderateFeedComposerPayload(input) {
  const content = sanitiseText(input.content);
  const summary = sanitiseText(input.summary ?? '');
  const title = sanitiseText(input.title ?? '');
  const link = input.link ?? null;
  const attachments = sanitiseAttachments(input.mediaAttachments ?? input.attachments);

  if (!content) {
    throw new ContentModerationError('Add more detail before publishing to the timeline.', {
      reasons: ['Share at least three words so the community understands your update.'],
    });
  }

  if (content.length > DEFAULT_RULES.maxCharacters) {
    throw new ContentModerationError(`Posts can contain up to ${DEFAULT_RULES.maxCharacters} characters.`, {
      reasons: [`Reduce your update to within ${DEFAULT_RULES.maxCharacters} characters.`],
    });
  }

  const bannedMatches = detectBannedTerms([content, summary, title].join(' '));
  if (bannedMatches.length > 0) {
    throw new ContentModerationError('Your update contains language that is not permitted on the community feed.', {
      reasons: bannedMatches.map((term) => `The term "${term}" is not allowed on Gigvora.`),
    });
  }

  const signals = detectSpamSignals({ content, summary, title, link });
  const severeSignals = signals.filter((signal) => signal.severity === 'high');
  if (severeSignals.length > 0) {
    throw new ContentModerationError('We detected spam indicators in your update.', {
      reasons: severeSignals.map((signal) => signal.message),
      signals,
    });
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount < DEFAULT_RULES.minWordCount) {
    throw new ContentModerationError('Add more context before publishing to the timeline.', {
      reasons: ['Share at least three words so the community understands your update.'],
    });
  }

  return {
    content,
    summary,
    title,
    link,
    attachments,
    signals,
  };
}

export function sanitiseExternalLink(raw) {
  if (!raw) {
    return null;
  }
  const trimmed = `${raw}`.trim();
  if (!trimmed) {
    return null;
  }
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    if (isBlockedDomain(parsed.toString())) {
      return null;
    }
    return parsed.toString();
  } catch (error) {
    return null;
  }
}

export default {
  moderateFeedComposerPayload,
  ContentModerationError,
  sanitiseExternalLink,
};
