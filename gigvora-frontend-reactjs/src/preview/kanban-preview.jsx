import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import ClientKanbanBoard from '../components/agency/clientKanban/ClientKanbanBoard.jsx';
import useAgencyClientKanban from '../hooks/useAgencyClientKanban.js';

const FALLBACK_BOARD = {
  columns: [
    {
      id: 'col-discovery',
      name: 'Discovery',
      color: '#38bdf8',
      wipLimit: 4,
      cards: [
        {
          id: 'card-atlas',
          title: 'Atlas Labs Onboarding',
          clientId: 'client-atlas',
          client: { id: 'client-atlas', name: 'Atlas Labs' },
          priority: 'high',
          riskLevel: 'low',
          healthStatus: 'healthy',
          valueAmount: 125000,
          valueCurrency: 'USD',
          dueDate: '2024-06-20',
          tags: ['AI retainer', 'Product'],
          checklistSummary: { total: 5, completed: 3 },
          collaborators: [
            { id: 'maya', name: 'Maya Torres', role: 'Account lead' },
            { id: 'leo', name: 'Leo Bryant', role: 'Solutions architect' },
          ],
          ownerName: 'Jordan Wells',
          ownerEmail: 'jordan@gigvora.test',
          updatedAt: '2024-05-12T14:30:00.000Z',
          lastActivityAt: '2024-05-12T14:30:00.000Z',
          projectName: 'AI Launchpad',
        },
        {
          id: 'card-terra',
          title: 'TerraFuel Pilot Scope',
          clientId: 'client-terra',
          client: { id: 'client-terra', name: 'TerraFuel' },
          priority: 'medium',
          riskLevel: 'medium',
          healthStatus: 'monitor',
          valueAmount: 48000,
          valueCurrency: 'USD',
          dueDate: '2024-05-24',
          tags: ['Growth', 'Pilot'],
          checklistSummary: { total: 4, completed: 1 },
          collaborators: [{ id: 'iman', name: 'Iman Rivers', role: 'Growth strategist' }],
          ownerName: 'Devon Price',
          ownerEmail: 'devon@gigvora.test',
          updatedAt: '2024-05-10T09:15:00.000Z',
          projectName: 'Expansion Lab',
        },
      ],
    },
    {
      id: 'col-delivery',
      name: 'Active delivery',
      color: '#818cf8',
      wipLimit: 3,
      cards: [
        {
          id: 'card-orbit',
          title: 'Orbit Media Launch Campaign',
          clientId: 'client-orbit',
          client: { id: 'client-orbit', name: 'Orbit Media' },
          priority: 'high',
          riskLevel: 'high',
          healthStatus: 'at_risk',
          valueAmount: 92000,
          valueCurrency: 'USD',
          dueDate: '2024-05-18',
          tags: ['Campaign', 'Paid media'],
          checklistSummary: { total: 6, completed: 2 },
          collaborators: [
            { id: 'sasha', name: 'Sasha Reed', role: 'Campaign manager' },
            { id: 'amir', name: 'Amir Boyd', role: 'Creative lead' },
          ],
          ownerName: 'Sasha Reed',
          ownerEmail: 'sasha@gigvora.test',
          updatedAt: '2024-05-13T11:45:00.000Z',
          lastActivityAt: '2024-05-13T11:45:00.000Z',
          projectName: 'Brand Momentum',
        },
        {
          id: 'card-vista',
          title: 'Vista Collective Renewal',
          clientId: 'client-vista',
          client: { id: 'client-vista', name: 'Vista Collective' },
          priority: 'medium',
          riskLevel: 'low',
          healthStatus: 'healthy',
          valueAmount: 60000,
          valueCurrency: 'USD',
          dueDate: '2024-06-05',
          tags: ['Retention'],
          checklistSummary: { total: 3, completed: 2 },
          collaborators: [{ id: 'mina', name: 'Mina Das', role: 'Client partner' }],
          ownerName: 'Mina Das',
          ownerEmail: 'mina@gigvora.test',
          updatedAt: '2024-05-09T16:20:00.000Z',
          projectName: 'Renewal Runway',
        },
      ],
    },
    {
      id: 'col-review',
      name: 'Review & close',
      color: '#34d399',
      wipLimit: 5,
      cards: [
        {
          id: 'card-nova',
          title: 'Nova Robotics Feedback Loop',
          clientId: 'client-nova',
          client: { id: 'client-nova', name: 'Nova Robotics' },
          priority: 'low',
          riskLevel: 'low',
          healthStatus: 'healthy',
          valueAmount: 54000,
          valueCurrency: 'USD',
          dueDate: '2024-06-30',
          tags: ['Feedback', 'Automation'],
          checklistSummary: { total: 2, completed: 2 },
          collaborators: [
            { id: 'owen', name: 'Owen Carver', role: 'Product strategist' },
            { id: 'haley', name: 'Haley Cross', role: 'Solutions engineer' },
          ],
          ownerName: 'Owen Carver',
          ownerEmail: 'owen@gigvora.test',
          updatedAt: '2024-05-08T12:10:00.000Z',
          projectName: 'Automation Lab',
        },
      ],
    },
  ],
  clients: [
    {
      id: 'client-atlas',
      name: 'Atlas Labs',
      tier: 'Flagship',
      healthStatus: 'healthy',
      primaryContactEmail: 'ops@atlaslabs.com',
      primaryContactName: 'Nina Patel',
      primaryContactPhone: '+1 (415) 555-1234',
      websiteUrl: 'atlaslabs.com',
      annualContractValue: 180000,
      tags: ['AI', 'Enterprise'],
      notes: 'Weekly executive briefing on Fridays.',
    },
    {
      id: 'client-terra',
      name: 'TerraFuel',
      tier: 'Growth',
      healthStatus: 'monitor',
      primaryContactEmail: 'hello@terrafuel.io',
      primaryContactName: 'Avery Flynn',
      primaryContactPhone: '+1 (347) 555-0199',
      websiteUrl: 'terrafuel.io',
      annualContractValue: 96000,
      tags: ['Clean energy'],
      notes: 'Quarterly business review scheduled for July.',
    },
    {
      id: 'client-orbit',
      name: 'Orbit Media',
      tier: 'Enterprise',
      healthStatus: 'at_risk',
      primaryContactEmail: 'marketing@orbitmedia.com',
      primaryContactName: 'Luciana Reyes',
      primaryContactPhone: '+44 20 1234 5678',
      websiteUrl: 'orbitmedia.com',
      annualContractValue: 95000,
      tags: ['Media', 'Campaign'],
      notes: 'Escalate creative approvals within 12 hours.',
    },
    {
      id: 'client-vista',
      name: 'Vista Collective',
      tier: 'Growth',
      healthStatus: 'healthy',
      primaryContactEmail: 'team@vistacollective.com',
      primaryContactName: 'Elias Navarro',
      primaryContactPhone: '+1 (503) 555-8890',
      websiteUrl: 'vistacollective.com',
      annualContractValue: 63000,
      tags: ['Retention'],
      notes: 'Renewal workshop aligned with fiscal planning.',
    },
    {
      id: 'client-nova',
      name: 'Nova Robotics',
      tier: 'Innovation',
      healthStatus: 'healthy',
      primaryContactEmail: 'partnerships@novarobotics.ai',
      primaryContactName: 'Riley Cho',
      primaryContactPhone: '+1 (312) 555-7784',
      websiteUrl: 'novarobotics.ai',
      annualContractValue: 57000,
      tags: ['Automation', 'R&D'],
      notes: 'Async review cycle every Wednesday.',
    },
  ],
  metrics: {
    totalClients: 5,
    totalActiveCards: 5,
    pipelineValue: 329000,
    dueSoon: 2,
    atRisk: 1,
    nextMeetings: [
      { id: 'card-terra', title: 'TerraFuel Pilot Scope', clientName: 'TerraFuel', at: '2024-05-24T15:00:00.000Z' },
      { id: 'card-nova', title: 'Nova Robotics Feedback Loop', clientName: 'Nova Robotics', at: '2024-05-26T17:00:00.000Z' },
    ],
    priorityBreakdown: [
      { priority: 'critical', count: 0 },
      { priority: 'high', count: 2 },
      { priority: 'medium', count: 2 },
      { priority: 'low', count: 1 },
    ],
  },
  columnSummary: [
    { id: 'col-discovery', name: 'Discovery', totalCards: 2 },
    { id: 'col-delivery', name: 'Active delivery', totalCards: 2 },
    { id: 'col-review', name: 'Review & close', totalCards: 1 },
  ],
};

function resolveWorkspaceId() {
  const params = new URLSearchParams(window.location.search);
  const queryValue = params.get('workspaceId');
  if (queryValue && !Number.isNaN(Number.parseInt(queryValue, 10))) {
    return Number.parseInt(queryValue, 10);
  }

  try {
    const stored = window.localStorage.getItem('gigvora:preview:workspaceId');
    if (stored && !Number.isNaN(Number.parseInt(stored, 10))) {
      return Number.parseInt(stored, 10);
    }
  } catch (error) {
    console.warn('Unable to read stored preview workspace id.', error);
  }

  return null;
}

function storeWorkspaceId(value) {
  try {
    if (value == null) {
      window.localStorage.removeItem('gigvora:preview:workspaceId');
      return;
    }
    window.localStorage.setItem('gigvora:preview:workspaceId', String(value));
  } catch (error) {
    console.warn('Unable to persist preview workspace id.', error);
  }
}

function buildOfflineActions(actions, onReconnect) {
  return {
    async refresh() {
      onReconnect();
      await actions.refresh();
    },
    async createColumn() {
      throw new Error('Preview is offline. Reconnect to create columns.');
    },
    async updateColumn() {
      throw new Error('Preview is offline. Reconnect to update columns.');
    },
    async deleteColumn() {
      throw new Error('Preview is offline. Reconnect to manage columns.');
    },
    async createCard() {
      throw new Error('Preview is offline. Reconnect to create cards.');
    },
    async updateCard() {
      throw new Error('Preview is offline. Reconnect to update cards.');
    },
    async moveCard() {
      throw new Error('Preview is offline. Reconnect to move cards.');
    },
    async deleteCard() {
      throw new Error('Preview is offline. Reconnect to manage cards.');
    },
    async addChecklistItem() {
      throw new Error('Preview is offline. Reconnect to add checklist items.');
    },
    async updateChecklistItem() {
      throw new Error('Preview is offline. Reconnect to update checklist items.');
    },
    async deleteChecklistItem() {
      throw new Error('Preview is offline. Reconnect to manage checklist items.');
    },
    async createClient() {
      throw new Error('Preview is offline. Reconnect to create clients.');
    },
    async updateClient() {
      throw new Error('Preview is offline. Reconnect to update clients.');
    },
  };
}

function KanbanPreviewApp() {
  const workspaceId = useMemo(resolveWorkspaceId, []);
  const { data, loading, error, actions } = useAgencyClientKanban({ workspaceId, enabled: true });
  const [usingFallback, setUsingFallback] = useState(false);
  const [fallbackError, setFallbackError] = useState(null);

  useEffect(() => {
    if (workspaceId != null) {
      storeWorkspaceId(workspaceId);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (error) {
      setUsingFallback(true);
      setFallbackError(error);
    } else {
      setUsingFallback(false);
      setFallbackError(null);
    }
  }, [error]);

  const boardData = usingFallback ? FALLBACK_BOARD : data;
  const boardError = usingFallback ? null : error;
  const boardLoading = usingFallback ? false : loading;

  const previewActions = useMemo(() => {
    if (!usingFallback) {
      return actions;
    }
    return buildOfflineActions(actions, () => {
      setUsingFallback(false);
      setFallbackError(null);
    });
  }, [actions, usingFallback]);

  const fallbackNotice = usingFallback ? (
    <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-700 shadow-sm">
      <p className="font-semibold">Offline preview</p>
      <p className="mt-1 text-xs text-amber-600">
        We couldn&apos;t reach the live workspace. Showing a sample board while keeping interactions read-only.
      </p>
      {fallbackError ? (
        <p className="mt-2 text-[0.7rem] text-amber-500">{fallbackError.message ?? 'Connection failed.'}</p>
      ) : null}
    </div>
  ) : null;

  return (
    <main className="min-h-screen bg-slate-100/80 p-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
        {fallbackNotice}
        <ClientKanbanBoard data={boardData} loading={boardLoading} error={boardError} actions={previewActions} />
      </div>
    </main>
  );
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<KanbanPreviewApp />);
