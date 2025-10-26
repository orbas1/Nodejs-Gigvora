import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  MegaphoneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import ReputationScorecard from './ReputationScorecard.jsx';
import ReviewComposer from './ReviewComposer.jsx';
import EndorsementWall from './EndorsementWall.jsx';
import { createFreelancerReview } from '../../services/reputation.js';
import { formatRelativeTime } from '../../utils/date.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function ReputationEngineShowcase({ data, loading, error, onRefresh, fromCache, lastUpdated }) {
  const scorecard = data?.scorecard ?? null;
  const reviewComposerConfig = data?.reviewComposer ?? null;
  const endorsementWall = data?.endorsementWall ?? { endorsements: [], stats: [] };
  const automationPlaybooks = data?.automationPlaybooks ?? [];
  const integrationTouchpoints = data?.integrationTouchpoints ?? [];
  const shareableLinks = data?.shareableLinks ?? [];
  const summary = data?.summary ?? null;
  const freelancerId = data?.freelancer?.id ?? null;

  const [shareFeedback, setShareFeedback] = useState(null);
  const [composerState, setComposerState] = useState({ state: 'idle', message: null });
  const composerSectionRef = useRef(null);
  const shareFeedbackTimeoutRef = useRef(null);

  const personaPrompts = reviewComposerConfig?.personaPrompts ?? {
    general: {
      label: 'General',
      summary: 'Celebrate impact, collaboration, and measurable outcomes.',
      prompts: [],
    },
  };

  const defaultPersona = reviewComposerConfig?.defaultPersona ?? Object.keys(personaPrompts)[0];

  const automationList = useMemo(() => automationPlaybooks.slice(0, 6), [automationPlaybooks]);
  const integrationList = useMemo(() => integrationTouchpoints.slice(0, 10), [integrationTouchpoints]);

  const pushShareFeedback = useCallback((message) => {
    if (shareFeedbackTimeoutRef.current) {
      clearTimeout(shareFeedbackTimeoutRef.current);
    }
    setShareFeedback(message);
    shareFeedbackTimeoutRef.current = setTimeout(() => {
      setShareFeedback(null);
      shareFeedbackTimeoutRef.current = null;
    }, 5000);
  }, []);

  useEffect(() => () => {
    if (shareFeedbackTimeoutRef.current) {
      clearTimeout(shareFeedbackTimeoutRef.current);
    }
  }, []);

  const handleScorecardShare = useCallback(async () => {
    if (!shareableLinks.length) {
      pushShareFeedback('No shareable links are available yet. Publish a testimonial to unlock sharing.');
      return;
    }
    const primaryLink = shareableLinks[0].url;
    if (!primaryLink) {
      pushShareFeedback('Shareable link missing a URL. Refresh the page and try again.');
      return;
    }
    try {
      await navigator.clipboard.writeText(primaryLink);
      pushShareFeedback('Scorecard link copied to clipboard.');
    } catch (clipboardError) {
      pushShareFeedback('Clipboard permissions blocked. Copy the link manually from the share menu.');
    }
  }, [shareableLinks, pushShareFeedback]);

  const handleScorecardExport = useCallback(() => {
    if (!scorecard) {
      pushShareFeedback('Scorecard data is still loading.');
      return;
    }
    const exportPayload = {
      generatedAt: new Date().toISOString(),
      scorecard,
      summary,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gigvora-reputation-${freelancerId ?? 'profile'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushShareFeedback('Scorecard export downloaded.');
  }, [scorecard, summary, freelancerId, pushShareFeedback]);

  const handleReviewSubmit = useCallback(
    async (form) => {
      if (!freelancerId) {
        setComposerState({ state: 'error', message: 'Freelancer context missing. Please refresh and try again.' });
        return;
      }
      setComposerState({ state: 'submitting', message: 'Submitting review…' });
      try {
        const payload = {
          title: form.title,
          body: form.body,
          rating: form.rating,
          tags: (form.tags ?? []).map((tag) => (typeof tag === 'string' ? tag : tag.label ?? tag.id)).filter(Boolean),
          visibility: form.visibility,
          requestFollowUp: form.requestFollowUp,
          shareToProfile: form.shareToProfile,
          persona: form.persona,
          endorsementHighlights: (form.tags ?? [])
            .map((tag) => (typeof tag === 'string' ? tag : tag.label ?? tag.id))
            .filter(Boolean),
          status: 'pending',
          metadata: { submittedFrom: 'profile_reputation_showcase' },
        };
        await createFreelancerReview(freelancerId, payload);
        setComposerState({ state: 'success', message: 'Review submitted for moderation. Thank you!' });
        await onRefresh?.();
      } catch (submitError) {
        setComposerState({
          state: 'error',
          message: submitError?.message ?? 'Unable to submit review right now. Please try again shortly.',
        });
      }
    },
    [freelancerId, onRefresh],
  );

  const handleReviewSaveDraft = useCallback(
    async (form) => {
      if (!freelancerId) {
        setComposerState({ state: 'error', message: 'Freelancer context missing. Unable to save draft.' });
        return;
      }
      setComposerState({ state: 'submitting', message: 'Saving draft…' });
      try {
        const payload = {
          title: form.title,
          body: form.body,
          rating: form.rating,
          tags: (form.tags ?? []).map((tag) => (typeof tag === 'string' ? tag : tag.label ?? tag.id)).filter(Boolean),
          visibility: form.visibility,
          requestFollowUp: form.requestFollowUp,
          shareToProfile: form.shareToProfile,
          persona: form.persona,
          endorsementHighlights: (form.tags ?? [])
            .map((tag) => (typeof tag === 'string' ? tag : tag.label ?? tag.id))
            .filter(Boolean),
          status: 'draft',
          metadata: { submittedFrom: 'profile_reputation_showcase' },
        };
        await createFreelancerReview(freelancerId, payload);
        setComposerState({ state: 'success', message: 'Draft saved. You can continue editing before publishing.' });
        await onRefresh?.();
      } catch (draftError) {
        setComposerState({
          state: 'error',
          message: draftError?.message ?? 'Unable to save draft right now.',
        });
      }
    },
    [freelancerId, onRefresh],
  );

  const handleReviewCancel = useCallback(() => {
    setComposerState({ state: 'idle', message: null });
    composerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleRequestEndorsements = useCallback(() => {
    composerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleShareEndorsements = useCallback(async () => {
    const spotlight = endorsementWall?.spotlight;
    const text = spotlight
      ? `“${spotlight.quote}” — ${spotlight.endorser.name}`
      : shareableLinks[0]?.url ?? null;
    if (!text) {
      pushShareFeedback('No endorsement spotlight ready to share yet.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      pushShareFeedback('Endorsement spotlight copied to clipboard.');
    } catch (copyError) {
      pushShareFeedback('Clipboard permissions blocked. Copy the spotlight text manually.');
    }
  }, [endorsementWall?.spotlight, shareableLinks, pushShareFeedback]);

  const composerMessage = composerState.state === 'success' || composerState.state === 'error' || composerState.state === 'submitting'
    ? composerState.message
    : null;

  const composerMessageTone = composerState.state === 'success'
    ? 'success'
    : composerState.state === 'error'
      ? 'error'
      : composerState.state === 'submitting'
        ? 'info'
        : null;

  const lastVerifiedLabel = summary?.lastVerifiedAt ? formatRelativeTime(summary.lastVerifiedAt) : null;

  return (
    <div className="space-y-12">
      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(30,64,175,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600/70">Reputation intelligence</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Executive trust telemetry</h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              Track delivery credibility, client advocacy, and brand amplification from a single scorecard that mirrors live
              Gigvora data.
            </p>
          </div>
          {lastVerifiedLabel ? (
            <p className="text-xs text-slate-400">Metrics verified {lastVerifiedLabel}</p>
          ) : null}
        </div>
        <div className="mt-6">
          <ReputationScorecard
            profile={scorecard?.profile}
            overallScore={scorecard?.overallScore ?? 0}
            scoreLabel={scorecard?.scoreLabel ?? 'Reputation overview'}
            scoreDeltaLabel={scorecard?.scoreDeltaLabel}
            scoreDeltaDirection={scorecard?.scoreDeltaDirection ?? 'up'}
            milestone={scorecard?.milestone}
            personaFocus={scorecard?.personaFocus}
            trend={scorecard?.trend}
            segments={scorecard?.segments ?? []}
            benchmarks={scorecard?.benchmarks ?? []}
            achievements={scorecard?.achievements ?? []}
            recommendations={scorecard?.recommendations ?? []}
            milestones={scorecard?.milestones ?? []}
            personaInsight={scorecard?.personaInsight}
            highlight={scorecard?.highlight}
            loading={loading}
            error={error}
            lastUpdated={lastUpdated}
            fromCache={fromCache}
            onRefresh={onRefresh}
            onShare={handleScorecardShare}
            onExport={handleScorecardExport}
          />
        </div>
        {shareFeedback ? (
          <p className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700">{shareFeedback}</p>
        ) : null}
      </section>

      <section ref={composerSectionRef} className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600/70">Compose endorsement</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Invite premium reviews</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Curate persona-specific prompts, add evidence, and publish polished endorsements that match enterprise expectations.
            </p>
          </div>
        </div>
        {composerMessage && composerMessageTone ? (
          <div
            className={classNames(
              'mt-6 rounded-2xl px-4 py-3 text-sm',
              composerMessageTone === 'success' && 'border border-emerald-300/40 bg-emerald-500/10 text-emerald-700',
              composerMessageTone === 'error' && 'border border-rose-300/40 bg-rose-50 text-rose-700',
              composerMessageTone === 'info' && 'border border-blue-200 bg-blue-50 text-blue-700',
            )}
          >
            {composerMessage}
          </div>
        ) : null}
        {reviewComposerConfig ? (
          <div className="mt-6">
            <ReviewComposer
              profile={reviewComposerConfig?.profile}
              personaPrompts={personaPrompts}
              defaultPersona={defaultPersona}
              tagLibrary={reviewComposerConfig?.tagLibrary ?? []}
              guidelines={reviewComposerConfig?.guidelines ?? []}
              attachmentsEnabled={reviewComposerConfig?.attachmentsEnabled ?? true}
              maxAttachmentSize={reviewComposerConfig?.maxAttachmentSize ?? 15 * 1024 * 1024}
              characterLimit={reviewComposerConfig?.characterLimit ?? 1200}
              defaultVisibility={reviewComposerConfig?.defaultVisibility ?? 'public'}
              onSubmit={handleReviewSubmit}
              onCancel={handleReviewCancel}
              onSaveDraft={handleReviewSaveDraft}
            />
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-sm text-slate-600">
            Review composer will unlock once reputation automation is configured for this profile.
          </div>
        )}
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <EndorsementWall
          endorsements={endorsementWall?.endorsements ?? []}
          spotlight={endorsementWall?.spotlight}
          stats={endorsementWall?.stats ?? []}
          loading={loading}
          error={error}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          onRequest={handleRequestEndorsements}
          onShare={handleShareEndorsements}
        />
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <header className="flex items-center gap-3">
              <MegaphoneIcon className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600/70">Automation playbooks</p>
                <h3 className="text-xl font-semibold text-slate-900">Keep social proof on autopilot</h3>
              </div>
            </header>
            <div className="mt-6 space-y-3">
              {automationList.length ? (
                automationList.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <SparklesIcon className="mt-1 h-4 w-4 text-blue-500" />
                    <span>{item}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Configure automation triggers to keep testimonials, badges, and widgets current.
                </p>
              )}
            </div>
          </div>
          <div>
            <header className="flex items-center gap-3">
              <GlobeAltIcon className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600/70">Integration touchpoints</p>
                <h3 className="text-xl font-semibold text-slate-900">Broadcast credibility everywhere</h3>
              </div>
            </header>
            <div className="mt-6 grid gap-2 text-sm text-slate-600">
              {integrationList.length ? (
                integrationList.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500" />
                    <span>{item}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Publish success stories and review widgets to proposals, deal rooms, and marketing sites to maximise reach.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

ReputationEngineShowcase.propTypes = {
  data: PropTypes.shape({
    freelancer: PropTypes.shape({ id: PropTypes.number }),
    summary: PropTypes.shape({
      lastVerifiedAt: PropTypes.string,
    }),
    scorecard: PropTypes.shape({
      profile: PropTypes.object,
      overallScore: PropTypes.number,
      scoreLabel: PropTypes.string,
      scoreDeltaLabel: PropTypes.string,
      scoreDeltaDirection: PropTypes.oneOf(['up', 'down']),
      milestone: PropTypes.string,
      personaFocus: PropTypes.string,
      trend: PropTypes.shape({ history: PropTypes.array }),
      segments: PropTypes.array,
      benchmarks: PropTypes.array,
      achievements: PropTypes.array,
      recommendations: PropTypes.array,
      milestones: PropTypes.array,
      personaInsight: PropTypes.object,
      highlight: PropTypes.object,
    }),
    reviewComposer: PropTypes.shape({
      profile: PropTypes.object,
      personaPrompts: PropTypes.object,
      defaultPersona: PropTypes.string,
      tagLibrary: PropTypes.array,
      guidelines: PropTypes.array,
      attachmentsEnabled: PropTypes.bool,
      maxAttachmentSize: PropTypes.number,
      characterLimit: PropTypes.number,
      defaultVisibility: PropTypes.oneOf(['public', 'members', 'private']),
    }),
    endorsementWall: PropTypes.shape({
      endorsements: PropTypes.array,
      spotlight: PropTypes.object,
      stats: PropTypes.array,
    }),
    automationPlaybooks: PropTypes.arrayOf(PropTypes.string),
    integrationTouchpoints: PropTypes.arrayOf(PropTypes.string),
    shareableLinks: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        url: PropTypes.string,
        publishedAt: PropTypes.string,
      }),
    ),
  }),
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  onRefresh: PropTypes.func,
  fromCache: PropTypes.bool,
  lastUpdated: PropTypes.instanceOf(Date),
};

ReputationEngineShowcase.defaultProps = {
  data: null,
  loading: false,
  error: null,
  onRefresh: undefined,
  fromCache: false,
  lastUpdated: undefined,
};
