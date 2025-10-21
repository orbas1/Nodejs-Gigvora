import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import {
  sanitizeParticipant,
  sanitizeThread,
} from '../messagingService.js';
import {
  storeIdentityDocument,
  readIdentityDocument,
} from '../identityDocumentStorageService.js';
import { readinessStatusToHttp } from '../healthService.js';

const buildParticipant = (overrides = {}) => {
  const base = {
    id: 42,
    threadId: 7,
    userId: 11,
    role: 'member',
    notificationsEnabled: true,
    mutedUntil: null,
    lastReadAt: '2024-01-01T00:00:00.000Z',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:05:00.000Z'),
  };
  return {
    get: () => ({ ...base, ...overrides }),
    user: {
      id: 11,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    },
  };
};

describe('messagingService sanitizers', () => {
  it('sanitizes participants from model instances and plain objects', () => {
    const participantInstance = buildParticipant();
    const sanitizedFromInstance = sanitizeParticipant(participantInstance);

    expect(sanitizedFromInstance).toEqual({
      id: 42,
      threadId: 7,
      userId: 11,
      role: 'member',
      notificationsEnabled: true,
      mutedUntil: null,
      lastReadAt: '2024-01-01T00:00:00.000Z',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:05:00.000Z'),
      user: {
        id: 11,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
      },
    });

    const sanitizedFromPlain = sanitizeParticipant({
      id: 55,
      threadId: 9,
      userId: 99,
      role: 'owner',
      notificationsEnabled: false,
      mutedUntil: null,
      lastReadAt: null,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:15:00.000Z',
      user: null,
    });

    expect(sanitizedFromPlain).toEqual({
      id: 55,
      threadId: 9,
      userId: 99,
      role: 'owner',
      notificationsEnabled: false,
      mutedUntil: null,
      lastReadAt: null,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:15:00.000Z',
      user: null,
    });
  });

  it('sanitizes threads with nested data and strips private metadata', () => {
    const participantInstance = buildParticipant();
    const labelInstance = {
      get: () => ({
        id: 1,
        name: 'Priority',
        slug: 'priority',
        color: '#ff0000',
        description: 'High priority thread',
        createdBy: 22,
        metadata: { visible: true, internalOnly: true },
        createdAt: new Date('2024-01-03T00:00:00.000Z'),
        updatedAt: new Date('2024-01-03T00:00:00.000Z'),
      }),
    };

    const supportCaseInstance = {
      get: () => ({
        id: 9,
        threadId: 123,
        status: 'open',
        priority: 'high',
        reason: 'support-request',
        metadata: { publicNote: 'visible', _internal: 'hidden' },
        escalatedBy: null,
        escalatedAt: null,
        assignedTo: null,
        assignedBy: null,
        assignedAt: null,
        firstResponseAt: null,
        resolvedAt: null,
        resolvedBy: null,
        resolutionSummary: null,
        satisfactionScore: null,
        feedback: null,
        createdAt: new Date('2024-01-03T00:00:00.000Z'),
        updatedAt: new Date('2024-01-03T00:00:00.000Z'),
      }),
    };

    const thread = {
      get: () => ({
        id: 123,
        subject: 'Support Request',
        channelType: 'support',
        state: 'open',
        createdBy: 77,
        lastMessageAt: new Date('2024-01-04T00:10:00.000Z'),
        lastMessagePreview: 'Can you help?',
        createdAt: new Date('2024-01-04T00:00:00.000Z'),
        updatedAt: new Date('2024-01-04T00:10:00.000Z'),
        metadata: {
          category: 'support',
          _internal: 'should-not-leak',
          privateNote: 'should-stay-hidden',
        },
      }),
      participants: [participantInstance],
      labels: [labelInstance],
      supportCase: supportCaseInstance,
    };

    const sanitizedThread = sanitizeThread(thread);

    expect(sanitizedThread.participants).toHaveLength(1);
    expect(sanitizedThread.participants?.[0].user.firstName).toBe('Ada');
    expect(sanitizedThread.metadata).toEqual({ category: 'support' });
    expect(sanitizedThread.supportCase?.metadata).toEqual({ publicNote: 'visible' });
    expect(sanitizedThread.labels?.[0]).toMatchObject({ name: 'Priority', slug: 'priority' });
  });
});

describe('identityDocumentStorageService', () => {
  const cleanups = [];

  afterAll(async () => {
    await Promise.all(
      cleanups.map(async (dir) => {
        try {
          await fs.rm(dir, { recursive: true, force: true });
        } catch (error) {
          // ignore cleanup errors
        }
      }),
    );
  });

  it('stores and retrieves identity documents with metadata integrity', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'gigvora-identity-'));
    cleanups.push(tmpRoot);

    const fileContents = Buffer.from('identity-document-binary');
    const base64Payload = fileContents.toString('base64');

    const metadata = await storeIdentityDocument(
      {
        data: `data:application/pdf;base64,${base64Payload}`,
        fileName: 'passport.pdf',
        contentType: 'application/pdf',
        actorId: 501,
      },
      { storageRoot: tmpRoot },
    );

    expect(metadata).toMatchObject({
      fileName: 'passport.pdf',
      contentType: 'application/pdf',
      actorId: 501,
    });
    expect(metadata.key.startsWith('identity/')).toBe(true);

    const document = await readIdentityDocument(metadata.key, { storageRoot: tmpRoot });

    expect(document.fileName).toBe('passport.pdf');
    expect(document.contentType).toBe('application/pdf');
    expect(document.actorId).toBe(501);
    expect(document.data).toBe(`data:application/pdf;base64,${base64Payload}`);
  });
});

describe('healthService readiness mapping', () => {
  it('converts readiness state to appropriate HTTP status codes', () => {
    expect(readinessStatusToHttp('ok')).toBe(200);
    expect(readinessStatusToHttp('starting')).toBe(503);
    expect(readinessStatusToHttp('error')).toBe(503);
    expect(readinessStatusToHttp('unknown')).toBe(503);
  });
});

describe('service index exports', () => {
  it('includes key domain services for the collaboration suite', async () => {
    const indexSource = await fs.readFile(new URL('../index.js', import.meta.url), 'utf8');
    const expectedExports = [
      "export { default as gigService } from './gigService.js';",
      "export { default as groupService } from './groupService.js';",
      "export { default as healthService } from './healthService.js';",
      "export { default as identityDocumentStorageService } from './identityDocumentStorageService.js';",
      "export { default as interviewOrchestrationService } from './interviewOrchestrationService.js';",
      "export { default as jobApplicationService } from './jobApplicationService.js';",
      "export { default as learningHubService } from './learningHubService.js';",
      "export { default as mentorshipService } from './mentorshipService.js';",
      "export { default as networkingService } from './networkingService.js';",
      "export { default as newsAggregationService } from './newsAggregationService.js';",
      "export { default as pageService } from './pageService.js';",
      "export { default as pageSettingsService } from './pageSettingsService.js';",
    ];

    for (const exportLine of expectedExports) {
      expect(indexSource.includes(exportLine)).toBe(true);
    }
  });
});
