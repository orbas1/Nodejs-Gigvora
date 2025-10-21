import * as constants from '../../../src/models/constants/index.js';

describe('models/constants', () => {
  it('exposes frozen string enums without duplicates', () => {
    const seenArrays = new Set();
    for (const value of Object.values(constants)) {
      if (!Array.isArray(value)) {
        continue;
      }

      expect(Object.isFrozen(value)).toBe(true);
      expect(() => value.push('mutated')).toThrow(TypeError);
      expect(value.every((entry) => typeof entry === 'string')).toBe(true);

      const duplicates = value.filter((entry, index) => value.indexOf(entry) !== index);
      expect(duplicates).toHaveLength(0);

      if (seenArrays.has(value)) {
        continue;
      }

      seenArrays.add(value);
    }
  });

  it('defines identity verification event enumerations', () => {
    expect(constants.ID_VERIFICATION_EVENT_TYPES).toEqual(
      Object.freeze(['status_change', 'note', 'assignment', 'document_request', 'escalation', 'reminder']),
    );
    expect(constants.IDENTITY_VERIFICATION_EVENT_TYPES).toEqual(
      Object.freeze([
        'submission_created',
        'status_changed',
        'assignment_updated',
        'document_updated',
        'note_recorded',
        'metadata_updated',
      ]),
    );
  });

  it('shares talent pool source types with the master pool types', () => {
    expect(constants.TALENT_POOL_MEMBER_SOURCE_TYPES).toBe(constants.TALENT_POOL_TYPES);
  });

  it('tracks the canonical workspace calendar enumerations', () => {
    expect(constants.CALENDAR_EVENT_TYPES).toEqual(
      Object.freeze([
        'interview',
        'job_interview',
        'networking',
        'project',
        'project_milestone',
        'gig',
        'mentorship',
        'volunteering',
        'event',
        'wellbeing',
        'deadline',
        'ritual',
      ]),
    );

    expect(constants.FOCUS_SESSION_TYPES).toEqual(
      Object.freeze([
        'interview_prep',
        'networking',
        'application',
        'deep_work',
        'wellbeing',
        'mentorship',
        'volunteering',
      ]),
    );
  });
});
