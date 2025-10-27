import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CalendarTab from '../components/projectWorkspace/tabs/CalendarTab.jsx';
import '../index.css';

const addHours = (base, hours) => {
  const value = new Date(base);
  value.setHours(value.getHours() + hours);
  return value;
};

const now = new Date();
const todayAt = (hours, minutes = 0) => {
  const value = new Date(now);
  value.setHours(hours, minutes, 0, 0);
  return value;
};

const inHours = (offset) => addHours(now, offset);
const toIso = (date) => new Date(date).toISOString();

const sampleProject = {
  id: 4815,
  calendarEvents: [
    {
      id: 'kickoff',
      title: 'Sprint kickoff & social sync',
      category: 'event',
      startAt: toIso(addHours(todayAt(9), 0)),
      endAt: toIso(addHours(todayAt(9), 1.5)),
      location: 'Hybrid · Atlas boardroom',
      metadata: {
        facilitator: 'Nora Chen',
        objective: 'Set sprint narrative and campaign assets',
      },
    },
    {
      id: 'content-desk',
      title: 'Content desk: hero story mapping',
      category: 'workshop',
      startAt: toIso(addHours(todayAt(13), 0)),
      endAt: toIso(addHours(todayAt(13), 2)),
      location: 'Studio 2',
      metadata: {
        squad: 'Storytelling',
        taskId: 'content-draft',
        taskStatus: 'in_progress',
      },
    },
    {
      id: 'brand-sprint',
      title: 'Brand experience lab (focus)',
      category: 'focus',
      startAt: toIso(addHours(todayAt(15), 0)),
      endAt: toIso(addHours(todayAt(15), 3)),
      metadata: {
        room: 'Innovation Hub',
        collaborators: ['Alex', 'Priya'],
      },
    },
    {
      id: 'launch-readiness',
      title: 'Launch readiness rehearsal',
      category: 'deadline',
      startAt: toIso(addHours(inHours(48), 0)),
      endAt: toIso(addHours(inHours(48), 1)),
      location: 'Virtual · Zoom',
      metadata: {
        taskId: 'launch-checklist',
        taskStatus: 'backlog',
        readiness: 'Requires legal sign-off',
      },
    },
    {
      id: 'executive-brief',
      title: 'Executive brief circulation',
      category: 'deadline',
      allDay: true,
      startAt: toIso(addHours(inHours(72), 0)),
      metadata: {
        taskId: 'executive-brief',
        taskStatus: 'in_review',
      },
    },
  ],
  tasks: [
    {
      id: 'content-draft',
      title: 'Draft hero story & voiceover',
      status: 'in_progress',
      priority: 'high',
      dueDate: toIso(addHours(inHours(72), 0)),
      estimatedHours: 4,
      description: 'Outline narrative arcs and capture approved testimonials.',
    },
    {
      id: 'launch-checklist',
      title: 'Complete launch readiness checklist',
      status: 'backlog',
      priority: 'urgent',
      dueDate: toIso(addHours(inHours(96), 0)),
      estimatedHours: 6,
      description: 'Cross-team rehearsal with risk scenario coverage.',
    },
    {
      id: 'executive-brief',
      title: 'Deliver executive sponsor brief',
      status: 'in_review',
      priority: 'medium',
      dueDate: toIso(addHours(inHours(120), 0)),
      estimatedHours: 2,
      description: 'Package sentiment insights and roadmap decisions for leadership.',
    },
    {
      id: 'post-campaign',
      title: 'Prepare post-campaign analytics deck',
      status: 'backlog',
      priority: 'medium',
      dueDate: toIso(addHours(inHours(192), 0)),
      estimatedHours: 5,
      description: 'Model engagement impact and forecast next sprint opportunities.',
    },
  ],
};

const loggingActions = {
  async createCalendarEvent(projectId, payload) {
    // eslint-disable-next-line no-console
    console.log('createCalendarEvent', projectId, payload);
  },
  async updateCalendarEvent(projectId, eventId, payload) {
    // eslint-disable-next-line no-console
    console.log('updateCalendarEvent', projectId, eventId, payload);
  },
  async deleteCalendarEvent(projectId, eventId) {
    // eslint-disable-next-line no-console
    console.log('deleteCalendarEvent', projectId, eventId);
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="min-h-screen w-full space-y-8 p-6">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Workspace preview</p>
        <h1 className="text-3xl font-semibold text-slate-900">Calendar &amp; Task Orchestration</h1>
        <p className="text-sm text-slate-500">
          Explore the proactive calendar shell with sprint timeline, task time-boxing, and rich metadata rendering.
        </p>
      </header>
      <CalendarTab project={sampleProject} actions={loggingActions} canManage />
    </div>
  </StrictMode>,
);
