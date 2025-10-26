import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useDataFetchingLayer } from '../../context/DataFetchingLayer.js';
import { useTheme } from '../../context/ThemeProvider.tsx';
import analytics from '../../services/analytics.js';
import { useSession } from '../../context/SessionContext.jsx';

const STORAGE_KEY = 'gigvora:web:feedback-pulse:v1';
const MAX_MESSAGE_LENGTH = 480;

const defaultReactions = [
  { value: 'delighted', label: 'Delighted', emoji: '😍', description: 'Everything feels premium' },
  { value: 'happy', label: 'Happy', emoji: '😊', description: 'It is going well' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', description: 'It is okay' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😕', description: 'I hit friction' },
  { value: 'blocked', label: 'Blocked', emoji: '😣', description: 'I am blocked' },
];

function loadPulseState() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    if (parsed.snoozeUntil && Number.isNaN(Date.parse(parsed.snoozeUntil))) {
      delete parsed.snoozeUntil;
    }
    if (parsed.respondedAt && Number.isNaN(Date.parse(parsed.respondedAt))) {
      delete parsed.respondedAt;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to load feedback pulse state', error);
    return null;
  }
}

function persistPulseState(state) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    if (!state) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to persist feedback pulse state', error);
  }
}

function isSnoozed(state) {
  if (!state || !state.snoozeUntil) {
    return false;
  }
  const until = new Date(state.snoozeUntil);
  return !Number.isNaN(until.getTime()) && until > new Date();
}

function isRecentlyResponded(state, promptId) {
  if (!state || !state.respondedAt) {
    return false;
  }
  if (promptId && state.promptId && state.promptId !== promptId) {
    return false;
  }
  const respondedAt = new Date(state.respondedAt);
  if (Number.isNaN(respondedAt.getTime())) {
    return false;
  }
  const hoursSince = (Date.now() - respondedAt.getTime()) / (1000 * 60 * 60);
  return hoursSince < 168; // 7 days
}

function normaliseEligibility(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      eligible: true,
      prompt: null,
      reason: null,
    };
  }
  const eligible = payload.eligible !== false;
  const prompt = payload.prompt ?? payload.preset ?? null;
  const reason = payload.reason ?? null;
  return { eligible, prompt, reason };
}

export function FeedbackPulse({
  promptId = 'global-platform-health',
  className,
  question,
  summaryEndpoint = '/platform/feedback/pulse/eligibility',
  submitEndpoint = '/platform/feedback/pulse',
  reactionOptions = defaultReactions,
  initialDelay = 8000,
  snoozeMinutes = 240,
  thankYouMessage = 'Thank you for helping us design a world-class experience.',
}) {
  const { fetchResource, mutateResource, buildKey, subscribe } = useDataFetchingLayer();
  const { tokens, resolveComponentTokens } = useTheme();
  let sessionContext;
  try {
    sessionContext = useSession();
  } catch (error) {
    sessionContext = { session: null };
  }

  const [eligibility, setEligibility] = useState({ eligible: true, prompt: null, reason: null, loaded: false });
  const [pulseState, setPulseState] = useState(() => loadPulseState());
  const [uiState, setUiState] = useState({
    isOpen: false,
    stage: 'idle',
    rating: null,
    message: '',
    error: null,
  });
  const autoOpenRef = useRef(null);
  const messageRef = useRef(null);

  const themeTokens = useMemo(
    () => resolveComponentTokens('FeedbackPulse') ?? { colors: { accent: tokens.colors?.accent ?? '#6366f1' } },
    [resolveComponentTokens, tokens.colors?.accent],
  );

  const accentColor = themeTokens.colors?.accent ?? tokens.colors?.accent ?? '#6366f1';

  const cacheKey = useMemo(
    () => buildKey('GET', summaryEndpoint, { promptId }),
    [buildKey, promptId, summaryEndpoint],
  );

  useEffect(() => {
    let mounted = true;
    fetchResource(summaryEndpoint, {
      key: cacheKey,
      strategy: 'stale-while-revalidate',
      ttl: 1000 * 60 * 30,
      metadata: { origin: 'FeedbackPulse', promptId },
    })
      .then((payload) => {
        if (!mounted) {
          return;
        }
        const normalised = normaliseEligibility(payload);
        setEligibility({ ...normalised, loaded: true });
      })
      .catch((error) => {
        console.debug('Unable to fetch feedback pulse eligibility', error);
        if (mounted) {
          setEligibility((previous) => ({ ...previous, loaded: true }));
        }
      });

    const unsubscribe = subscribe(cacheKey, (payload) => {
      if (!payload?.data) {
        return;
      }
      setEligibility((previous) => ({ ...previous, ...normaliseEligibility(payload.data), loaded: true }));
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [cacheKey, fetchResource, promptId, subscribe, summaryEndpoint]);

  useEffect(() => {
    if (!eligibility.loaded) {
      return;
    }
    if (!eligibility.eligible || isRecentlyResponded(pulseState, promptId) || isSnoozed(pulseState)) {
      return;
    }
    if (autoOpenRef.current || typeof window === 'undefined') {
      return;
    }
    autoOpenRef.current = window.setTimeout(() => {
      autoOpenRef.current = null;
      setUiState((previous) => ({ ...previous, isOpen: true, stage: 'prompt' }));
      analytics.track('feedback_pulse_opened', {
        context: {
          promptId,
          auto: true,
          reason: eligibility.reason,
        },
        userId: sessionContext.session?.id ?? null,
      });
    }, initialDelay);

    return () => {
      if (autoOpenRef.current && typeof window !== 'undefined') {
        window.clearTimeout(autoOpenRef.current);
        autoOpenRef.current = null;
      }
    };
  }, [eligibility, initialDelay, promptId, pulseState, sessionContext.session?.id]);

  useEffect(() => () => {
    if (autoOpenRef.current && typeof window !== 'undefined') {
      window.clearTimeout(autoOpenRef.current);
      autoOpenRef.current = null;
    }
  }, []);

  const closePanel = (options = {}) => {
    setUiState((previous) => ({ ...previous, isOpen: false, stage: 'idle', error: null }));
    if (options.snooze) {
      const snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
      const next = { ...pulseState, snoozeUntil, promptId };
      setPulseState(next);
      persistPulseState(next);
      analytics.track('feedback_pulse_snoozed', {
        context: { promptId, snoozeMinutes },
        userId: sessionContext.session?.id ?? null,
      });
    }
  };

  const openPanel = () => {
    if (!eligibility.eligible) {
      return;
    }
    setUiState((previous) => ({ ...previous, isOpen: true, stage: 'prompt', error: null }));
    analytics.track('feedback_pulse_opened', {
      context: {
        promptId,
        auto: false,
        reason: eligibility.reason,
      },
      userId: sessionContext.session?.id ?? null,
    });
  };

  const handleReactionSelect = (value) => {
    setUiState((previous) => ({ ...previous, rating: value, stage: 'form', error: null }));
    analytics.track('feedback_pulse_reaction_selected', {
      context: { promptId, rating: value },
      userId: sessionContext.session?.id ?? null,
    });
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        messageRef.current?.focus();
      });
    } else {
      messageRef.current?.focus();
    }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (!uiState.rating) {
      setUiState((previous) => ({ ...previous, error: 'Choose how you feel before sharing feedback.' }));
      return;
    }
    const trimmed = uiState.message.trim();
    setUiState((previous) => ({ ...previous, stage: 'submitting', error: null }));
    try {
      await mutateResource(submitEndpoint, {
        method: 'POST',
        body: {
          promptId,
          rating: uiState.rating,
          comment: trimmed || null,
        },
        metadata: { origin: 'FeedbackPulse' },
      });
      const respondedAt = new Date().toISOString();
      const nextState = { promptId, respondedAt, snoozeUntil: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() };
      setPulseState(nextState);
      persistPulseState(nextState);
      setUiState((previous) => ({ ...previous, stage: 'submitted', error: null }));
      analytics.track('feedback_pulse_submitted', {
        context: { promptId, rating: uiState.rating, messageLength: trimmed.length },
        userId: sessionContext.session?.id ?? null,
      });
    } catch (error) {
      console.warn('Failed to submit feedback pulse', error);
      setUiState((previous) => ({ ...previous, stage: 'form', error: error?.message ?? 'We could not save your feedback. Try again.' }));
      analytics.track('feedback_pulse_submit_failed', {
        context: { promptId, rating: uiState.rating },
        userId: sessionContext.session?.id ?? null,
      });
    }
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;
    if (value.length > MAX_MESSAGE_LENGTH) {
      return;
    }
    setUiState((previous) => ({ ...previous, message: value }));
  };

  const ratingLabel = useMemo(() => {
    if (!uiState.rating) {
      return null;
    }
    const matched = reactionOptions.find((option) => option.value === uiState.rating);
    return matched?.label ?? null;
  }, [reactionOptions, uiState.rating]);

  const resolvedQuestion =
    question || eligibility.prompt?.question || 'How is your Gigvora experience going right now?';

  if (!eligibility.eligible && !uiState.isOpen) {
    return null;
  }

  return (
    <div
      className={clsx(
        'pointer-events-none fixed bottom-6 right-6 z-[1040] flex max-w-md flex-col items-end gap-3',
        className,
      )}
    >
      {!uiState.isOpen ? (
        <button
          type="button"
          onClick={openPanel}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(15,23,42,0.35)] transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
        >
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          Share feedback
        </button>
      ) : null}

      {uiState.isOpen ? (
        <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 p-5 shadow-[0_25px_70px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-color,#6366f1)]/20 text-[color:var(--accent-color,#6366f1)]">
                <ChatBubbleBottomCenterTextIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Feedback pulse</p>
                <h3 className="mt-1 text-base font-semibold text-white">{resolvedQuestion}</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => closePanel({ snooze: true })}
              className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Hide feedback pulse</span>
            </button>
          </div>

          {uiState.stage === 'submitted' ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white/5 p-4 text-sm text-white/80">
              <div className="flex items-center gap-2 text-white">
                <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                <span className="font-semibold">We received your feedback</span>
              </div>
              <p>{thankYouMessage}</p>
              <button
                type="button"
                onClick={() => closePanel()}
                className="self-start rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
              >
                Close
              </button>
            </div>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-wrap gap-2">
                {reactionOptions.map((option) => {
                  const isActive = uiState.rating === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleReactionSelect(option.value)}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60',
                        isActive
                          ? 'border-[color:var(--accent-color,#6366f1)] bg-[color:var(--accent-color,#6366f1)]/20 text-white'
                          : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10',
                      )}
                    >
                      <span aria-hidden="true" className="text-base">
                        {option.emoji}
                      </span>
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {uiState.rating ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white/80" htmlFor="feedback-pulse-message">
                    {ratingLabel ? `${ratingLabel} · Anything we should know?` : 'Tell us more'}
                  </label>
                  <textarea
                    id="feedback-pulse-message"
                    ref={messageRef}
                    value={uiState.message}
                    onChange={handleMessageChange}
                    rows={4}
                    maxLength={MAX_MESSAGE_LENGTH}
                    placeholder="Be specific so our product, design, and engineering teams can act quickly."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder:text-white/40 focus:border-[color:var(--accent-color,#6366f1)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-color,#6366f1)]/50"
                  />
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>We read every response within 24 hours.</span>
                    <span>
                      {uiState.message.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                </div>
              ) : null}

              {uiState.error ? (
                <p className="rounded-2xl bg-rose-500/20 px-3 py-2 text-sm text-rose-100">{uiState.error}</p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => closePanel({ snooze: true })}
                  className="text-sm font-medium text-white/60 underline-offset-4 transition hover:text-white"
                >
                  Maybe later
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-color,#6366f1)] px-4 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(99,102,241,0.35)] transition hover:bg-[color:var(--accent-color,#6366f1)]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-color,#6366f1)]"
                  disabled={uiState.stage === 'submitting'}
                >
                  {uiState.stage === 'submitting' ? (
                    <span className="relative flex h-4 w-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-white" />
                    </span>
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  Send feedback
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

FeedbackPulse.propTypes = {
  promptId: PropTypes.string,
  className: PropTypes.string,
  question: PropTypes.string,
  summaryEndpoint: PropTypes.string,
  submitEndpoint: PropTypes.string,
  reactionOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      emoji: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  initialDelay: PropTypes.number,
  snoozeMinutes: PropTypes.number,
  thankYouMessage: PropTypes.string,
};

export default FeedbackPulse;
