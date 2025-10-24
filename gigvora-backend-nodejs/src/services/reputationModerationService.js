const BANNED_TERMS = [
  'fraud',
  'scam',
  'illegal',
  'hate',
  'abuse',
  'violence',
];

const SUSPICIOUS_LINK_PATTERNS = [/https?:\/\//i, /www\./i, /bit\.ly/i];
const EXCESSIVE_PUNCTUATION = /(!|\?){3,}/g;

function extractFlaggedTerms(text) {
  if (!text) {
    return [];
  }
  const lower = text.toLowerCase();
  return BANNED_TERMS.filter((term) => lower.includes(term));
}

function countUrls(text) {
  if (!text) {
    return 0;
  }
  return SUSPICIOUS_LINK_PATTERNS.reduce((acc, pattern) => acc + (pattern.test(text) ? 1 : 0), 0);
}

function scoreTextQuality(text) {
  if (!text) {
    return 0;
  }
  const lengthScore = Math.min(1, text.trim().length / 600);
  const punctuationPenalty = EXCESSIVE_PUNCTUATION.test(text) ? 0.15 : 0;
  return Number(Math.max(0, lengthScore - punctuationPenalty).toFixed(4));
}

function buildModerationSummary({ flaggedTerms, urlCount, sentimentScore }) {
  const parts = [];
  if (flaggedTerms.length) {
    parts.push(`flagged terms: ${flaggedTerms.join(', ')}`);
  }
  if (urlCount > 0) {
    parts.push(`${urlCount} suspicious link${urlCount > 1 ? 's' : ''}`);
  }
  if (sentimentScore < 0.2) {
    parts.push('low sentiment score');
  }
  if (!parts.length) {
    return 'clean';
  }
  return parts.join('; ');
}

function analyseSubmission({ text, metadata }) {
  const flaggedTerms = extractFlaggedTerms(text);
  const urlCount = countUrls(text);
  const sentimentScore = scoreTextQuality(text);

  let status = 'approved';
  if (flaggedTerms.length > 0 || urlCount > 2) {
    status = 'rejected';
  } else if (urlCount > 0 || sentimentScore < 0.25) {
    status = 'needs_review';
  }

  const labels = [];
  if (flaggedTerms.length) {
    labels.push('contains_prohibited_terms');
  }
  if (urlCount > 0) {
    labels.push('contains_links');
  }
  if (sentimentScore < 0.25) {
    labels.push('low_quality_text');
  }
  if (metadata?.rating != null && Number(metadata.rating) < 3) {
    labels.push('negative_rating');
  }

  return {
    status,
    score: Number(Math.max(0, Math.min(1, sentimentScore)).toFixed(4)),
    labels,
    summary: buildModerationSummary({ flaggedTerms, urlCount, sentimentScore }),
  };
}

export function analyseTestimonial({ comment, metadata }) {
  return analyseSubmission({ text: comment, metadata });
}

export function analyseSuccessStory({ summary, content, metadata }) {
  const combined = [summary ?? '', content ?? ''].join(' ').trim();
  return analyseSubmission({ text: combined, metadata });
}

export function verifyClientIdentity({ clientName, clientEmail, company, sourceUrl }) {
  const response = {
    verified: false,
    metadata: {
      clientName: clientName ?? null,
      clientEmail: clientEmail ?? null,
      company: company ?? null,
      sourceUrl: sourceUrl ?? null,
    },
  };

  if (!clientEmail) {
    return response;
  }

  try {
    const parsed = new URL(clientEmail.includes('@') ? `mailto:${clientEmail}` : clientEmail);
    const domain = parsed.href.replace('mailto:', '').split('@')[1] ?? '';
    if (domain) {
      response.metadata.emailDomain = domain.toLowerCase();
      if (company) {
        const normalisedCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalisedDomain = domain.toLowerCase().split('.').slice(-2).join('');
        if (normalisedDomain.includes(normalisedCompany)) {
          response.verified = true;
        }
      }
    }
  } catch (error) {
    response.metadata.emailError = error.message;
  }

  return response;
}

export default {
  analyseTestimonial,
  analyseSuccessStory,
  verifyClientIdentity,
};
