import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import messagingRoutes from '../src/routes/messagingRoutes.js';
import errorHandler from '../src/middleware/errorHandler.js';
import { createUser } from './helpers/factories.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/messaging', messagingRoutes);
  app.use(errorHandler);
  return app;
}

const app = createTestApp();

describe('messagingController HTTP flow', () => {
  it('handles conversation creation, support escalation, and resolution lifecycle', async () => {
    const originalAppId = process.env.AGORA_APP_ID;
    const originalCertificate = process.env.AGORA_APP_CERTIFICATE;
    const originalTtl = process.env.AGORA_TOKEN_TTL;

    process.env.AGORA_APP_ID = '12345678901234567890123456789012';
    process.env.AGORA_APP_CERTIFICATE = 'abcdef1234567890abcdef1234567890';
    process.env.AGORA_TOKEN_TTL = '900';

    try {
      const requester = await createUser({ email: 'http-requester@gigvora.test', userType: 'user' });
      const collaborator = await createUser({ email: 'http-collaborator@gigvora.test', userType: 'user' });
      const agent = await createUser({ email: 'http-agent@gigvora.test', userType: 'admin' });

      const requesterToken = jwt.sign({ id: requester.id, roles: ['user'] }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      const collaboratorToken = jwt.sign({ id: collaborator.id, roles: ['user'] }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      const agentToken = jwt.sign({ id: agent.id, roles: ['admin'] }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      const createResponse = await request(app)
        .post('/api/messaging/threads')
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          userId: requester.id,
          subject: 'Escalation via HTTP',
          channelType: 'direct',
          participantIds: [collaborator.id],
          metadata: { projectId: 908, origin: 'controller-test' },
        })
        .expect(201);

      expect(createResponse.body).toMatchObject({
        subject: 'Escalation via HTTP',
        participants: expect.arrayContaining([
          expect.objectContaining({ userId: requester.id, role: 'owner' }),
          expect.objectContaining({ userId: collaborator.id, role: 'participant' }),
        ]),
      });

      const threadId = createResponse.body.id;

      const messageResponse = await request(app)
        .post(`/api/messaging/threads/${threadId}/messages`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          userId: requester.id,
          messageType: 'text',
          body: 'Initial HTTP message',
        })
        .expect(201);

      expect(messageResponse.body).toMatchObject({
        messageType: 'text',
        sender: expect.objectContaining({ id: requester.id }),
        body: 'Initial HTTP message',
      });

      const callResponse = await request(app)
        .post(`/api/messaging/threads/${threadId}/calls`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({
          userId: requester.id,
          callType: 'video',
        })
        .expect(201);

      expect(callResponse.body).toMatchObject({
        threadId,
        callType: 'video',
        agoraAppId: process.env.AGORA_APP_ID,
      });

      const joinResponse = await request(app)
        .post(`/api/messaging/threads/${threadId}/calls`)
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          userId: collaborator.id,
          callType: 'video',
          callId: callResponse.body.callId,
        })
        .expect(200);

      expect(joinResponse.body.isNew).toBe(false);
      expect(joinResponse.body.callId).toBe(callResponse.body.callId);

      const messages = await request(app)
        .get(`/api/messaging/threads/${threadId}/messages`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .query({ pageSize: 10 })
        .expect(200);

      expect(messages.body.data).toHaveLength(2);
      expect(messages.body.pagination.total).toBe(2);

      const escalationResponse = await request(app)
        .post(`/api/messaging/threads/${threadId}/escalate`)
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          userId: collaborator.id,
          reason: 'Payment stalled',
          priority: 'urgent',
          metadata: { channel: 'inbox', severity: 'p1' },
        })
        .expect(202);

      expect(escalationResponse.body).toMatchObject({
        status: 'triage',
        priority: 'urgent',
        escalatedBy: collaborator.id,
      });

      const assignmentResponse = await request(app)
        .post(`/api/messaging/threads/${threadId}/assign-support`)
        .set('Authorization', `Bearer ${collaboratorToken}`)
        .send({
          userId: collaborator.id,
          agentId: agent.id,
        })
        .expect(200);

      expect(assignmentResponse.body).toMatchObject({
        status: 'in_progress',
        assignedTo: agent.id,
      });

      const resolutionResponse = await request(app)
        .post(`/api/messaging/threads/${threadId}/support-status`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          userId: agent.id,
          status: 'resolved',
          resolutionSummary: 'Ledger reconciled and payout issued.',
        })
        .expect(200);

      expect(resolutionResponse.body).toMatchObject({
        status: 'resolved',
        resolutionSummary: 'Ledger reconciled and payout issued.',
      });

      await request(app)
        .post(`/api/messaging/threads/${threadId}/read`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .send({ userId: requester.id })
        .expect(200, { success: true });

      const inboxResponse = await request(app)
        .get('/api/messaging/threads')
        .set('Authorization', `Bearer ${requesterToken}`)
        .query({
          userId: requester.id,
          includeParticipants: true,
          includeSupport: true,
          pageSize: 5,
        })
        .expect(200);

      expect(inboxResponse.body.data[0]).toMatchObject({
        id: threadId,
        unreadCount: 0,
        supportCase: expect.objectContaining({
          status: 'resolved',
          assignedTo: agent.id,
        }),
      });

      const threadResponse = await request(app)
        .get(`/api/messaging/threads/${threadId}`)
        .set('Authorization', `Bearer ${requesterToken}`)
        .query({ includeParticipants: true, includeSupport: true })
        .expect(200);

      expect(threadResponse.body.participants).toHaveLength(2);
      expect(threadResponse.body.supportCase).toMatchObject({ status: 'resolved' });
    } finally {
      process.env.AGORA_APP_ID = originalAppId;
      process.env.AGORA_APP_CERTIFICATE = originalCertificate;
      if (originalTtl === undefined) {
        delete process.env.AGORA_TOKEN_TTL;
      } else {
        process.env.AGORA_TOKEN_TTL = originalTtl;
      }
    }
  });
});
