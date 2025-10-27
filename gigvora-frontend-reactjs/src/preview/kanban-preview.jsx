import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import ClientKanbanBoard from '../components/agency/clientKanban/ClientKanbanBoard.jsx';

const sampleBoard = {
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
          collaborators: [
            { id: 'iman', name: 'Iman Rivers', role: 'Growth strategist' },
          ],
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
          collaborators: [
            { id: 'mina', name: 'Mina Das', role: 'Client partner' },
          ],
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
      primaryContactName: 'Zara Chen',
      primaryContactPhone: '+1 (212) 555-4022',
      websiteUrl: 'terrafuel.io',
      annualContractValue: 72000,
      tags: ['Energy', 'Scale'],
      notes: 'Pilot results shared every other Tuesday.',
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
    pipelineValue: 335000,
    totalActiveCards: 5,
    dueSoon: 3,
    atRisk: 1,
  },
  columnSummary: [
    { id: 'col-discovery', name: 'Discovery', totalCards: 2 },
    { id: 'col-delivery', name: 'Active delivery', totalCards: 2 },
    { id: 'col-review', name: 'Review & close', totalCards: 1 },
  ],
};

function KanbanPreview() {
  const actions = useMemo(
    () => ({
      refresh: async () => {},
      createColumn: async (payload = {}) => ({ id: `col-${Date.now()}`, ...payload }),
      updateColumn: async (columnId, payload = {}) => ({ id: columnId, ...payload }),
      deleteColumn: async () => {},
      createCard: async (payload = {}) => ({ id: `card-${Date.now()}`, ...payload }),
      updateCard: async (cardId, payload = {}) => ({ id: cardId, ...payload }),
      moveCard: async (cardId, payload = {}) => ({ id: cardId, ...payload }),
      deleteCard: async () => {},
      addChecklistItem: async () => ({ id: `item-${Date.now()}` }),
      updateChecklistItem: async (cardId, itemId, payload = {}) => ({ id: itemId, ...payload }),
      deleteChecklistItem: async () => {},
      createClient: async (payload = {}) => ({ id: `client-${Date.now()}`, ...payload }),
      updateClient: async (clientId, payload = {}) => ({ id: clientId, ...payload }),
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Agency collaboration workspace</h1>
          <p className="text-sm text-slate-500">
            Focus clients, track collaborator presence, and monitor pipeline health with a premium kanban surface.
          </p>
        </header>
        <ClientKanbanBoard data={sampleBoard} loading={false} error={null} actions={actions} />
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<KanbanPreview />);
