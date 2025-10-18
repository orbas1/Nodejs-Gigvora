import { useCallback, useEffect, useMemo, useState } from 'react';
import MentoringSummaryBar from './MentoringSummaryBar.jsx';
import MentoringSessionsPanel from './MentoringSessionsPanel.jsx';
import MentoringPackagesPanel from './MentoringPackagesPanel.jsx';
import MentoringPeoplePanel from './MentoringPeoplePanel.jsx';
import MentoringReviewsPanel from './MentoringReviewsPanel.jsx';
import MentoringSessionDrawer from './MentoringSessionDrawer.jsx';
import MentoringSessionForm from './MentoringSessionForm.jsx';
import MentorshipPurchaseForm from './MentorshipPurchaseForm.jsx';
import MentorReviewForm from './MentorReviewForm.jsx';
import {
  createMentoringSession,
  updateMentoringSession,
  recordMentorshipPurchase,
  updateMentorshipPurchase,
  addFavouriteMentor,
  removeFavouriteMentor,
  submitMentorReview,
} from '../../../services/userMentoring.js';

const PANEL_DEFINITIONS = [
  { id: 'mentoring-sessions', label: 'Sessions' },
  { id: 'mentoring-packages', label: 'Packages' },
  { id: 'mentoring-people', label: 'People' },
  { id: 'mentoring-reviews', label: 'Reviews' },
];

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function uniqueMentorsFrom(mentoring) {
  const map = new Map();
  if (!mentoring) return [];
  const sources = [
    mentoring.favourites ?? [],
    mentoring.suggestions ?? [],
    mentoring.sessions?.all ?? [],
    mentoring.purchases?.orders ?? [],
  ];
  sources.flat().forEach((record) => {
    const mentor = record?.mentor ?? record;
    if (mentor && mentor.id && !map.has(mentor.id)) {
      map.set(mentor.id, mentor);
    }
  });
  return Array.from(map.values());
}

export default function UserMentoringSection({
  mentoring,
  userId,
  onRefresh,
  canEdit = true,
  activePanelId,
  onPanelChange,
}) {
  const summary = mentoring?.summary ?? {
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    cancelledSessions: 0,
    totalSpend: 0,
    currency: 'USD',
    activePackages: 0,
    sessionsRemaining: 0,
  };

  const [activePanel, setActivePanel] = useState(activePanelId ?? PANEL_DEFINITIONS[0].id);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [reviewSession, setReviewSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [feedbackTone, setFeedbackTone] = useState('success');
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (activePanelId && activePanelId !== activePanel) {
      setActivePanel(activePanelId);
    }
  }, [activePanelId, activePanel]);

  const mentors = useMemo(() => uniqueMentorsFrom(mentoring), [mentoring]);
  const orders = mentoring?.purchases?.orders ?? [];
  const sessions = mentoring?.sessions ?? { upcoming: [], requested: [], completed: [], cancelled: [], all: [] };
  const favourites = mentoring?.favourites ?? [];
  const suggestions = mentoring?.suggestions ?? [];
  const pendingReviews = mentoring?.reviews?.pending ?? [];
  const recentReviews = mentoring?.reviews?.recent ?? [];

  const closeAllForms = useCallback(() => {
    setSessionModalOpen(false);
    setPurchaseModalOpen(false);
    setReviewModalOpen(false);
    setEditingSession(null);
    setEditingOrder(null);
    setReviewSession(null);
    setSelectedSession(null);
  }, []);

  const handlePanelSelect = useCallback(
    (panelId) => {
      setActivePanel(panelId);
      onPanelChange?.(panelId);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#${panelId}`);
      }
    },
    [onPanelChange],
  );

  const withFeedback = useCallback(
    async (action, { successMessage } = {}) => {
      try {
        setSubmitting(true);
        setFeedbackMessage(null);
        await action();
        if (successMessage) {
          setFeedbackTone('success');
          setFeedbackMessage(successMessage);
        }
        closeAllForms();
        await onRefresh?.({ force: true });
      } catch (error) {
        setFeedbackTone('error');
        setFeedbackMessage(error?.message || 'Something went wrong. Please try again.');
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [closeAllForms, onRefresh],
  );

  const handleCreateSession = useCallback(
    (payload) =>
      withFeedback(() => createMentoringSession(userId, payload), {
        successMessage: 'Session saved.',
      }),
    [userId, withFeedback],
  );

  const handleUpdateSession = useCallback(
    (sessionId, payload) =>
      withFeedback(() => updateMentoringSession(userId, sessionId, payload), {
        successMessage: 'Session updated.',
      }),
    [userId, withFeedback],
  );

  const handleCreatePurchase = useCallback(
    (payload) =>
      withFeedback(() => recordMentorshipPurchase(userId, payload), {
        successMessage: 'Package saved.',
      }),
    [userId, withFeedback],
  );

  const handleUpdatePurchase = useCallback(
    (orderId, payload) =>
      withFeedback(() => updateMentorshipPurchase(userId, orderId, payload), {
        successMessage: 'Package updated.',
      }),
    [userId, withFeedback],
  );

  const handleAddFavourite = useCallback(
    (mentorId) =>
      withFeedback(() => addFavouriteMentor(userId, { mentorId }), {
        successMessage: 'Mentor saved.',
      }),
    [userId, withFeedback],
  );

  const handleRemoveFavourite = useCallback(
    (mentorId) =>
      withFeedback(() => removeFavouriteMentor(userId, mentorId), {
        successMessage: 'Mentor removed.',
      }),
    [userId, withFeedback],
  );

  const handleSubmitReview = useCallback(
    (payload) =>
      withFeedback(() => submitMentorReview(userId, payload), {
        successMessage: 'Review sent.',
      }),
    [userId, withFeedback],
  );

  const openSessionForm = useCallback(
    (sessionData = null) => {
      setEditingSession(sessionData);
      setSessionModalOpen(true);
      handlePanelSelect('mentoring-sessions');
    },
    [handlePanelSelect],
  );

  const openPurchaseForm = useCallback(
    (order = null) => {
      setEditingOrder(order);
      setPurchaseModalOpen(true);
      handlePanelSelect('mentoring-packages');
    },
    [handlePanelSelect],
  );

  const openReviewForm = useCallback(
    (sessionData) => {
      setReviewSession(sessionData);
      setReviewModalOpen(true);
      handlePanelSelect('mentoring-reviews');
    },
    [handlePanelSelect],
  );

  const handleSessionSelect = useCallback(
    (sessionData) => {
      if (!sessionData) {
        setSelectedSession(null);
        return;
      }
      const enrichedMentor = sessionData.mentor ?? mentors.find((mentor) => mentor.id === sessionData.mentorId);
      const enrichedOrder = sessionData.order ?? orders.find((order) => order.id === sessionData.orderId);
      setSelectedSession({ ...sessionData, mentor: enrichedMentor ?? sessionData.mentor, order: enrichedOrder ?? sessionData.order });
    },
    [mentors, orders],
  );

  const handleCompleteSession = useCallback(
    (sessionData) => handleUpdateSession(sessionData.id, { status: 'completed' }),
    [handleUpdateSession],
  );

  const handleCancelSession = useCallback(
    (sessionData) => handleUpdateSession(sessionData.id, { status: 'cancelled' }),
    [handleUpdateSession],
  );

  const handleReviewFromDrawer = useCallback(
    (sessionData) => {
      openReviewForm({
        id: sessionData.id,
        mentorId: sessionData.mentorId,
        topic: sessionData.topic,
        scheduledAt: sessionData.scheduledAt,
      });
    },
    [openReviewForm],
  );

  const handleBookFromMentor = useCallback(
    (mentor) => {
      openSessionForm({
        mentorId: mentor?.id ?? mentor?.mentorId ?? '',
        meetingType: 'Virtual',
        status: 'scheduled',
      });
    },
    [openSessionForm],
  );

  const renderPanel = (panelId) => {
    switch (panelId) {
      case 'mentoring-sessions':
        return (
          <MentoringSessionsPanel
            sessions={sessions}
            canEdit={canEdit}
            onCreate={() => openSessionForm(null)}
            onSelect={handleSessionSelect}
          />
        );
      case 'mentoring-packages':
        return (
          <MentoringPackagesPanel
            orders={orders}
            canEdit={canEdit}
            onCreate={() => openPurchaseForm(null)}
            onEdit={(order) => openPurchaseForm(order)}
            currencyFormatter={(value, currency) => formatCurrency(value, currency ?? summary.currency)}
            dateFormatter={formatDate}
          />
        );
      case 'mentoring-people':
        return (
          <MentoringPeoplePanel
            favourites={favourites}
            suggestions={suggestions}
            canEdit={canEdit}
            onAddFavourite={handleAddFavourite}
            onRemoveFavourite={handleRemoveFavourite}
            onBook={handleBookFromMentor}
          />
        );
      case 'mentoring-reviews':
      default:
        return (
          <MentoringReviewsPanel
            pending={pendingReviews}
            recent={recentReviews}
            canEdit={canEdit}
            onReview={(sessionData) =>
              openReviewForm({
                id: sessionData.id,
                mentorId: sessionData.mentorId,
                topic: sessionData.topic,
                scheduledAt: sessionData.scheduledAt,
              })
            }
          />
        );
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-accentSoft/30 p-6 shadow-sm">
      <div className="grid gap-6 xl:grid-cols-[220px,1fr]">
        <aside className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mentoring</p>
          {PANEL_DEFINITIONS.map((panel) => {
            const isActive = panel.id === activePanel;
            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => handlePanelSelect(panel.id)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'border-accent bg-accent text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:text-accent'
                }`}
              >
                <span>{panel.label}</span>
                <span className="text-xs uppercase tracking-wide">{isActive ? 'Active' : ''}</span>
              </button>
            );
          })}
        </aside>

        <div className="space-y-6">
          <MentoringSummaryBar
            summary={summary}
            currencyFormatter={(value) => formatCurrency(value, summary.currency)}
          />

          {feedbackMessage ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                feedbackTone === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {feedbackMessage}
            </div>
          ) : null}

          {PANEL_DEFINITIONS.map((panel) => (
            <div
              key={panel.id}
              id={panel.id}
              className={activePanel === panel.id ? 'block' : 'hidden'}
              aria-hidden={activePanel === panel.id ? 'false' : 'true'}
            >
              {renderPanel(panel.id)}
            </div>
          ))}
        </div>
      </div>

      {selectedSession ? (
        <MentoringSessionDrawer
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onEdit={(sessionData) => openSessionForm(sessionData)}
          onComplete={handleCompleteSession}
          onCancel={handleCancelSession}
          onReview={handleReviewFromDrawer}
          canEdit={canEdit}
          isBusy={submitting}
          dateFormatter={formatDate}
          currencyFormatter={(value, currency) => formatCurrency(value, currency ?? summary.currency)}
        />
      ) : null}

      {sessionModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingSession && editingSession.id ? 'Edit session' : 'Book session'}
              </h3>
              <button
                type="button"
                onClick={closeAllForms}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent/40 hover:text-accent"
                aria-label="Close session form"
              >
                ×
              </button>
            </div>
            <div className="mt-4">
              <MentoringSessionForm
                mentors={mentors}
                orders={orders}
                initialValues={editingSession ?? {}}
                submitting={submitting}
                onCancel={closeAllForms}
                onSubmit={(payload) =>
                  editingSession && editingSession.id
                    ? handleUpdateSession(editingSession.id, payload)
                    : handleCreateSession(payload)
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {purchaseModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingOrder && editingOrder.id ? 'Edit package' : 'Add package'}
              </h3>
              <button
                type="button"
                onClick={closeAllForms}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent/40 hover:text-accent"
                aria-label="Close package form"
              >
                ×
              </button>
            </div>
            <div className="mt-4">
              <MentorshipPurchaseForm
                mentors={mentors}
                initialValues={editingOrder ?? {}}
                submitting={submitting}
                onCancel={closeAllForms}
                onSubmit={(payload) =>
                  editingOrder && editingOrder.id
                    ? handleUpdatePurchase(editingOrder.id, payload)
                    : handleCreatePurchase(payload)
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {reviewModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Leave review</h3>
              <button
                type="button"
                onClick={closeAllForms}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent/40 hover:text-accent"
                aria-label="Close review form"
              >
                ×
              </button>
            </div>
            <div className="mt-4">
              <MentorReviewForm
                session={reviewSession}
                submitting={submitting}
                onCancel={closeAllForms}
                onSubmit={(payload) => handleSubmitReview(payload)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
