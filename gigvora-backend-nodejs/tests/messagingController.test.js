import request from 'supertest';
import app from '../src/app.js';
import { createUser } from './helpers/factories.js';

describe('messagingController HTTP flow', () => {
  it('handles conversation creation, support escalation, and resolution lifecycle', async () => {
    const requester = await createUser({ email: 'http-requester@gigvora.test', userType: 'user' });
    const collaborator = await createUser({ email: 'http-collaborator@gigvora.test', userType: 'user' });
    const agent = await createUser({ email: 'http-agent@gigvora.test', userType: 'admin' });

    const createResponse = await request(app)
      .post('/api/messaging/threads')
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

    const messages = await request(app)
      .get(`/api/messaging/threads/${threadId}/messages`)
      .query({ pageSize: 10 })
      .expect(200);

    expect(messages.body.data).toHaveLength(1);
    expect(messages.body.pagination.total).toBe(1);

    const escalationResponse = await request(app)
      .post(`/api/messaging/threads/${threadId}/escalate`)
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
      .send({ userId: requester.id })
      .expect(200, { success: true });

    const inboxResponse = await request(app)
      .get('/api/messaging/threads')
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
      .query({ includeParticipants: true, includeSupport: true })
      .expect(200);

    expect(threadResponse.body.participants).toHaveLength(2);
    expect(threadResponse.body.supportCase).toMatchObject({ status: 'resolved' });
  });
});
