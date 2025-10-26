import { useMemo, useState, useCallback } from 'react';
import useSession from '../../../../../hooks/useSession.js';
import useFreelancerMentoring from '../../../../../hooks/useFreelancerMentoring.js';
import MentoringSummaryCards from './MentoringSummaryCards.jsx';
import MentoringSessionForm from './MentoringSessionForm.jsx';
import MentoringSessionsPanel from './MentoringSessionsPanel.jsx';
import MentoringPurchasesPanel from './MentoringPurchasesPanel.jsx';
import MentoringMentorPanels from './MentoringMentorPanels.jsx';
import MentoringAnalyticsOverlay from './MentoringAnalyticsOverlay.jsx';
import MentorPreviewModal from './MentorPreviewModal.jsx';
import { calculateMentorAnalytics, getMentorAnalyticsForId } from '../../../../../utils/mentoring.js';

export default function FreelancerMentoringSection() {
  const { session } = useSession();
  const userId = session?.id ?? null;
  const {
    data,
    summary,
    mentorLookup,
    loading,
    error,
    pending,
    createSession,
    updateSession,
    recordPurchase,
    updatePurchase,
    addFavourite,
    removeFavourite,
    refreshRecommendations,
  } = useFreelancerMentoring({ userId, enabled: Boolean(userId) });
  const [prefillMentorId, setPrefillMentorId] = useState(null);
  const [activeMentorId, setActiveMentorId] = useState(null);

  const currency = summary?.currency ?? 'USD';
  const sessions = data?.sessions?.all ?? [];
  const purchases = data?.purchases ?? { orders: [] };
  const favourites = data?.favourites ?? [];
  const suggestions = data?.suggestions ?? [];

  const analytics = useMemo(
    () =>
      calculateMentorAnalytics({
        sessions,
        orders: purchases?.orders ?? [],
        favourites,
        summary,
      }),
    [sessions, purchases, favourites, summary],
  );

  const selectedMentor = activeMentorId ? mentorLookup.get(Number(activeMentorId)) ?? null : null;
  const selectedMentorAnalytics = useMemo(
    () => getMentorAnalyticsForId(analytics, activeMentorId),
    [analytics, activeMentorId],
  );

  const headerSubtitle = useMemo(
    () =>
      summary
        ? `${summary.upcomingSessions ?? 0} upcoming • ${summary.sessionsPurchased ?? 0} purchased • ${summary.sessionsRedeemed ?? 0} completed`
        : 'Book, track, and review your mentoring partnerships.',
    [summary],
  );

  const handleCreateSession = async (payload) => {
    await createSession(payload);
    setPrefillMentorId(null);
  };

  const viewerTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      return 'UTC';
    }
  }, []);

  const handleScheduleFromPreview = useCallback(
    async (payload) => {
      if (!payload?.mentorId || !payload?.scheduledAt) {
        throw new Error('Select a slot to schedule this session.');
      }

      const sessionPayload = {
        mentorId: Number(payload.mentorId ?? payload.mentor?.id ?? selectedMentor?.id),
        topic: payload.topic ?? selectedMentor?.headline ?? 'Mentorship session',
        agenda: payload.agenda ?? undefined,
        scheduledAt: payload.scheduledAt,
        durationMinutes: payload.durationMinutes ?? 60,
        meetingType: payload.meetingType ?? 'virtual',
        meetingUrl: payload.meetingUrl ?? undefined,
        status: 'scheduled',
      };

      await createSession(sessionPayload);
      setPrefillMentorId(sessionPayload.mentorId);
      setActiveMentorId(null);
    },
    [createSession, selectedMentor?.headline, selectedMentor?.id],
  );

  const handleFavourite = async (mentorId, notes) => {
    if (!mentorId) return;
    await addFavourite({ mentorId, notes });
  };

  const handleSuggestionStart = (mentorId) => {
    setPrefillMentorId(mentorId);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenMentor = (mentorId) => {
    if (!mentorId) return;
    setActiveMentorId(Number(mentorId));
  };

  const handleCloseMentorModal = () => {
    setActiveMentorId(null);
  };

  const openMentorDirectory = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.open('/mentors', '_blank', 'noopener');
  };

  const renderBody = () => {
    if (loading && !data) {
      return (
        <div className="mt-6 space-y-4">
          <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error.message || 'Unable to load mentoring workspace.'}
        </div>
      );
    }

    return (
      <div className="mt-8 space-y-10">
        <MentoringSummaryCards summary={summary} currency={currency} />

        <MentoringAnalyticsOverlay
          analytics={analytics}
          currency={currency}
          loading={loading}
          onOpenMentor={handleOpenMentor}
        />

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Create</p>
            <h3 className="text-lg font-semibold text-slate-900">Create mentoring session</h3>
            <p className="mt-2 text-xs text-slate-500">
              Capture paid and pro-bono sessions so your rituals, spend, and feedback stay aligned with your goals.
            </p>
            <div className="mt-4">
              <MentoringSessionForm
                mentorLookup={mentorLookup}
                onSubmit={handleCreateSession}
                submitting={pending}
                prefillMentorId={prefillMentorId}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-900">Mentor rituals</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li>Share agendas 48 hours before each call so mentors can prepare async notes.</li>
              <li>Record highlights and feedback right after sessions to unlock smart recommendations.</li>
              <li>Use packages to keep longer mentorships on track with clear budgets.</li>
            </ul>
            <a
              href="/dashboard/freelancer/planner"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              Open planner
            </a>
          </div>
        </div>

        <MentoringSessionsPanel
          sessions={sessions}
          mentorLookup={mentorLookup}
          onUpdate={updateSession}
          pending={pending}
          loading={loading}
          onOpenMentor={handleOpenMentor}
        />

        <MentoringPurchasesPanel
          purchases={purchases}
          mentorLookup={mentorLookup}
          onCreate={recordPurchase}
          onUpdate={updatePurchase}
          pending={pending}
          loading={loading}
          onOpenMentor={handleOpenMentor}
        />

        <MentoringMentorPanels
          favourites={favourites}
          suggestions={suggestions}
          onFavourite={(mentorId, notes) => handleFavourite(mentorId, notes)}
          onRemoveFavourite={removeFavourite}
          onStartSession={handleSuggestionStart}
          pending={pending}
          loading={loading}
          onOpenMentor={handleOpenMentor}
          onRefreshRecommendations={refreshRecommendations}
        />
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Mentor desk</p>
            <h2 className="text-2xl font-semibold text-slate-900">Mentoring session management</h2>
            <p className="mt-2 text-sm text-slate-600">{headerSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={openMentorDirectory}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            Browse mentors
          </button>
        </div>
      </header>

      {renderBody()}

      {selectedMentor ? (
        <MentorPreviewModal
          mentor={selectedMentor}
          analytics={selectedMentorAnalytics}
          onClose={handleCloseMentorModal}
          onSchedule={handleScheduleFromPreview}
          pending={pending}
          viewerTimezone={viewerTimezone}
        />
      ) : null}
    </section>
  );
}
