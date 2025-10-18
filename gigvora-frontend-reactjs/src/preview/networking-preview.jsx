import React from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import AgencyNetworkingSection from '../components/agency/networking/AgencyNetworkingSection.jsx';
import apiClient from '../services/apiClient.js';

const sampleOverview = {
  workspace: { id: 42, name: 'Atlas Agency', slug: 'atlas-agency' },
  summary: {
    workspaceId: 42,
    sessionsBooked: 4,
    upcomingSessions: 2,
    completedSessions: 2,
    totalSpendCents: 125000,
    pendingSpendCents: 25000,
    refundedCents: 0,
    averageSatisfaction: 4.6,
    checkedInCount: 3,
    connectionsTracked: 5,
    followStatusCounts: { saved: 3, 'follow-up': 1, won: 1 },
    currency: 'USD',
  },
  bookings: {
    total: 4,
    list: [
      {
        id: 101,
        sessionId: 701,
        participantId: 301,
        participantEmail: 'maya@atlas.agency',
        participantName: 'Maya Torres',
        status: 'confirmed',
        seatNumber: 11,
        checkedInAt: '2024-04-11T17:00:00.000Z',
        completedAt: '2024-04-11T18:30:00.000Z',
        connectionsSaved: 3,
        followUpsScheduled: 2,
        satisfactionScore: 4.9,
        metadata: { userNotes: 'Met great AI lead', purchaseCents: 45000, purchaseCurrency: 'USD' },
        session: {
          id: 701,
          title: 'AI Partner Roundtable',
          slug: 'ai-partner-roundtable',
          startTime: '2024-05-21T17:00:00.000Z',
          endTime: '2024-05-21T18:00:00.000Z',
          status: 'published',
          accessType: 'invite',
          priceCents: 45000,
          currency: 'USD',
        },
        createdAt: '2024-04-01T12:00:00.000Z',
        updatedAt: '2024-04-20T12:00:00.000Z',
      },
      {
        id: 102,
        sessionId: 702,
        participantId: 302,
        participantEmail: 'li@atlas.agency',
        participantName: 'Li Shen',
        status: 'confirmed',
        seatNumber: 7,
        checkedInAt: '2024-05-01T17:00:00.000Z',
        completedAt: null,
        connectionsSaved: 2,
        followUpsScheduled: 1,
        satisfactionScore: 4.3,
        metadata: { userNotes: 'Follow up with Terra Labs' },
        session: {
          id: 702,
          title: 'Scale Leaders Mixer',
          slug: 'scale-leaders-mixer',
          startTime: '2024-06-03T17:00:00.000Z',
          endTime: '2024-06-03T19:00:00.000Z',
          status: 'draft',
          accessType: 'public',
          priceCents: 30000,
          currency: 'USD',
        },
        createdAt: '2024-04-14T12:00:00.000Z',
        updatedAt: '2024-04-18T12:00:00.000Z',
      },
      {
        id: 103,
        sessionId: 703,
        participantId: 303,
        participantEmail: 'ari@atlas.agency',
        participantName: 'Ari Knowles',
        status: 'completed',
        seatNumber: 4,
        checkedInAt: '2024-03-15T17:00:00.000Z',
        completedAt: '2024-03-15T18:15:00.000Z',
        connectionsSaved: 4,
        followUpsScheduled: 3,
        satisfactionScore: 4.7,
        metadata: { userNotes: 'Send recap deck' },
        session: {
          id: 703,
          title: 'Fintech Partner Summit',
          slug: 'fintech-partner-summit',
          startTime: '2024-03-15T17:00:00.000Z',
          endTime: '2024-03-15T18:30:00.000Z',
          status: 'published',
          accessType: 'invite',
          priceCents: 20000,
          currency: 'USD',
        },
        createdAt: '2024-02-25T12:00:00.000Z',
        updatedAt: '2024-03-16T12:00:00.000Z',
      },
      {
        id: 104,
        sessionId: 704,
        participantId: 304,
        participantEmail: 'norah@atlas.agency',
        participantName: 'Norah Ortiz',
        status: 'completed',
        seatNumber: 9,
        checkedInAt: '2024-02-20T17:00:00.000Z',
        completedAt: '2024-02-20T18:00:00.000Z',
        connectionsSaved: 1,
        followUpsScheduled: 0,
        satisfactionScore: 3.8,
        metadata: { userNotes: 'Budget conversation' },
        session: {
          id: 704,
          title: 'Web3 Alliance Briefing',
          slug: 'web3-alliance-briefing',
          startTime: '2024-02-20T17:00:00.000Z',
          endTime: '2024-02-20T18:00:00.000Z',
          status: 'published',
          accessType: 'public',
          priceCents: 30000,
          currency: 'USD',
        },
        createdAt: '2024-02-01T12:00:00.000Z',
        updatedAt: '2024-02-21T12:00:00.000Z',
      },
    ],
  },
  purchases: {
    total: 3,
    totalSpendCents: 125000,
    currency: 'USD',
    list: [
      {
        id: 801,
        sessionId: 701,
        purchaserEmail: 'maya@atlas.agency',
        purchaserName: 'Maya Torres',
        status: 'paid',
        amountCents: 45000,
        currency: 'USD',
        purchasedAt: '2024-04-01T12:10:00.000Z',
        reference: 'INV-7021',
        metadata: { userNotes: 'Invoice reconciled' },
        session: {
          id: 701,
          title: 'AI Partner Roundtable',
          slug: 'ai-partner-roundtable',
          startTime: '2024-05-21T17:00:00.000Z',
          endTime: '2024-05-21T18:00:00.000Z',
          status: 'published',
          accessType: 'invite',
          priceCents: 45000,
          currency: 'USD',
        },
      },
      {
        id: 802,
        sessionId: 702,
        purchaserEmail: 'ops@atlas.agency',
        purchaserName: 'Ops Team',
        status: 'pending',
        amountCents: 25000,
        currency: 'USD',
        purchasedAt: '2024-04-15T12:10:00.000Z',
        reference: 'PO-9902',
        metadata: { userNotes: 'Awaiting approval' },
        session: {
          id: 702,
          title: 'Scale Leaders Mixer',
          slug: 'scale-leaders-mixer',
          startTime: '2024-06-03T17:00:00.000Z',
          endTime: '2024-06-03T19:00:00.000Z',
          status: 'draft',
          accessType: 'public',
          priceCents: 30000,
          currency: 'USD',
        },
      },
      {
        id: 803,
        sessionId: 703,
        purchaserEmail: 'finance@atlas.agency',
        purchaserName: 'Finance Desk',
        status: 'paid',
        amountCents: 55000,
        currency: 'USD',
        purchasedAt: '2024-03-01T12:10:00.000Z',
        reference: 'PAY-7761',
        metadata: { userNotes: 'Expensed to growth' },
        session: {
          id: 703,
          title: 'Fintech Partner Summit',
          slug: 'fintech-partner-summit',
          startTime: '2024-03-15T17:00:00.000Z',
          endTime: '2024-03-15T18:30:00.000Z',
          status: 'published',
          accessType: 'invite',
          priceCents: 20000,
          currency: 'USD',
        },
      },
    ],
  },
  connections: {
    total: 5,
    list: [
      {
        id: 901,
        ownerId: 201,
        sessionId: 701,
        connectionName: 'Jordan Blake',
        connectionEmail: 'jordan@signalcloud.io',
        connectionCompany: 'SignalCloud',
        followStatus: 'saved',
        connectedAt: '2024-04-11T18:00:00.000Z',
        lastContactedAt: '2024-04-14T16:00:00.000Z',
        notes: 'Send AI bundle deck',
        tags: ['ai', 'product'],
      },
      {
        id: 902,
        ownerId: 201,
        sessionId: 702,
        connectionName: 'Leena Patel',
        connectionEmail: 'leena@terracapital.com',
        connectionCompany: 'Terra Capital',
        followStatus: 'follow-up',
        connectedAt: '2024-04-18T18:00:00.000Z',
        lastContactedAt: null,
        notes: 'Schedule diligence call',
        tags: ['vc', 'growth'],
      },
      {
        id: 903,
        ownerId: 202,
        sessionId: 703,
        connectionName: 'Miguel Arroyo',
        connectionEmail: 'miguel@paygrid.io',
        connectionCompany: 'PayGrid',
        followStatus: 'won',
        connectedAt: '2024-03-15T18:15:00.000Z',
        lastContactedAt: '2024-03-20T16:00:00.000Z',
        notes: 'Signed partnership MOU',
        tags: ['payments', 'partner'],
      },
      {
        id: 904,
        ownerId: 203,
        sessionId: 703,
        connectionName: 'Shannon Lee',
        connectionEmail: 'shannon@revwise.io',
        connectionCompany: 'Revwise',
        followStatus: 'saved',
        connectedAt: '2024-03-15T18:10:00.000Z',
        lastContactedAt: null,
        notes: 'Intro to marketing lead',
        tags: ['marketing'],
      },
      {
        id: 905,
        ownerId: 204,
        sessionId: 704,
        connectionName: 'Nina Kaur',
        connectionEmail: 'nina@launchstack.io',
        connectionCompany: 'Launchstack',
        followStatus: 'saved',
        connectedAt: '2024-02-20T18:00:00.000Z',
        lastContactedAt: null,
        notes: 'Send incubator kit',
        tags: ['incubator'],
      },
    ],
  },
  meta: { workspaceId: 42 },
};

const sampleSessions = {
  sessions: [
    {
      id: 701,
      title: 'AI Partner Roundtable',
      status: 'published',
      startTime: '2024-05-21T17:00:00.000Z',
      endTime: '2024-05-21T18:00:00.000Z',
    },
    {
      id: 702,
      title: 'Scale Leaders Mixer',
      status: 'draft',
      startTime: '2024-06-03T17:00:00.000Z',
      endTime: '2024-06-03T19:00:00.000Z',
    },
    {
      id: 703,
      title: 'Fintech Partner Summit',
      status: 'published',
      startTime: '2024-03-15T17:00:00.000Z',
      endTime: '2024-03-15T18:30:00.000Z',
    },
  ],
};

const originalGet = apiClient.get.bind(apiClient);

apiClient.get = async (url, options = {}) => {
  if (url.includes('/agency/networking/overview')) {
    return { data: sampleOverview };
  }
  if (url.includes('/networking/sessions')) {
    return { data: sampleSessions };
  }
  return originalGet(url, options);
};

function PreviewApp() {
  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-8 shadow-xl">
        <AgencyNetworkingSection workspaceId={42} workspaceSlug="atlas-agency" />
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PreviewApp />);
}
