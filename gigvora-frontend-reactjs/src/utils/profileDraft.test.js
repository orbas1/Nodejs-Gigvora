import { describe, expect, it } from 'vitest';
import {
  buildAvailabilityDraft,
  buildAvailabilityPayload,
  buildIdentityDraft,
  buildProfileDraft,
  normalizeProfileDraft,
  profileDraftToAvailability,
  validateIdentityDraft,
} from './profileDraft.js';

describe('buildProfileDraft', () => {
  it('creates a rich editable draft', () => {
    const draft = buildProfileDraft({
      headline: 'Designer',
      experience: [
        { organization: 'Gigvora', role: 'Lead', startDate: '2023-01-01', highlights: ['Shipped product'] },
      ],
    });
    expect(draft.headline).toBe('Designer');
    expect(draft.experience[0]).toMatchObject({ organization: 'Gigvora', role: 'Lead' });
  });

  it('returns default structure when profile missing', () => {
    expect(buildProfileDraft(null)).toHaveProperty('skills');
  });
});

describe('normalizeProfileDraft', () => {
  it('validates entries and returns payload', () => {
    const draft = {
      headline: 'Designer',
      skills: ['React', 'React'],
      experience: [
        {
          organization: 'Gigvora',
          role: 'Lead',
          startDate: '2024-01-01',
          endDate: '',
          highlights: ['Delivery'],
        },
      ],
      qualifications: [
        { title: 'Certification', credentialUrl: 'https://example.com/cert' },
      ],
      portfolioLinks: [
        { label: 'Site', url: 'https://example.com' },
      ],
      references: [
        { name: 'Alex', email: 'alex@example.com', weight: 0.5 },
      ],
      collaborationRoster: [
        { name: 'Dana', role: 'PM' },
      ],
      impactHighlights: [
        { title: 'Revenue', value: '$1M' },
      ],
      pipelineInsights: [
        { project: 'Launch', payout: '$10k' },
      ],
    };

    const { payload, errors } = normalizeProfileDraft(draft);

    expect(errors).toHaveLength(0);
    expect(payload.skills).toEqual(['React']);
    expect(payload.experienceEntries[0].organization).toBe('Gigvora');
  });

  it('captures validation errors', () => {
    const { errors } = normalizeProfileDraft({
      references: [{ name: '', email: 'bad-email' }],
      qualifications: [{ credentialUrl: 'invalid-url', title: 'Title' }],
    });
    expect(errors).not.toHaveLength(0);
  });
});

describe('availability helpers', () => {
  it('builds availability drafts safely', () => {
    const profile = { availability: { status: 'open', hoursPerWeek: 20, timezone: 'UTC' } };
    expect(buildAvailabilityDraft(profile)).toMatchObject({ status: 'open', hoursPerWeek: 20 });
  });

  it('profileDraftToAvailability returns defaults when missing', () => {
    expect(profileDraftToAvailability({})).toMatchObject({ status: 'limited', openToRemote: true });
  });

  it('buildAvailabilityPayload merges focus areas', () => {
    const payload = buildAvailabilityPayload(
      { status: 'open', hoursPerWeek: '10', openToRemote: false, timezone: 'UTC', notes: 'Evenings' },
      { areasOfFocus: ['Design'], preferredEngagements: ['Contract'] },
    );
    expect(payload).toMatchObject({ availabilityStatus: 'open', availableHoursPerWeek: 10, openToRemote: false });
    expect(payload.areasOfFocus).toEqual(['Design']);
  });
});

describe('identity helpers', () => {
  it('buildIdentityDraft merges profile data', () => {
    const profile = { firstName: 'Alex', lastName: 'Doe', email: 'alex@example.com' };
    expect(buildIdentityDraft(profile)).toMatchObject({ firstName: 'Alex', email: 'alex@example.com' });
  });

  it('validateIdentityDraft enforces required fields', () => {
    const errors = validateIdentityDraft({ firstName: '', lastName: '', email: 'invalid' });
    expect(errors).toContain('First name is required.');
    expect(errors).toContain('Enter a valid email address.');
  });
});
