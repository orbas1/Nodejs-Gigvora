import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { formatMentorName, formatMentorContactLine } from '../../../../../utils/mentoring.js';
import SessionScheduler from '../../../../../components/mentor/SessionScheduler.jsx';

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

function MentorPreviewModal({ mentor, analytics, onClose, onSchedule, pending, viewerTimezone }) {
  const mentorName = formatMentorName(mentor);
  const mentorContact = formatMentorContactLine(mentor);
  const avatarInitial = mentorName?.charAt(0)?.toUpperCase() ?? '?';
  const [scheduleStatus, setScheduleStatus] = useState(null);

  useEffect(() => {
    if (!scheduleStatus || scheduleStatus.tone !== 'success' || typeof window === 'undefined') {
      return undefined;
    }
    const timer = window.setTimeout(() => setScheduleStatus(null), 6000);
    return () => window.clearTimeout(timer);
  }, [scheduleStatus]);

  const handleOpenProfile = () => {
    if (!mentor?.id) {
      return;
    }
    const target = `/mentors?mentorId=${mentor.id}`;
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(target, '_blank', 'noopener');
    }
  };

  const handleSchedule = async (payload) => {
    if (!onSchedule) {
      return;
    }
    try {
      setScheduleStatus({ tone: 'pending', message: 'Scheduling session…' });
      await onSchedule(payload);
      setScheduleStatus({ tone: 'success', message: 'Session scheduled. Check your mentoring desk for details.' });
    } catch (error) {
      setScheduleStatus({
        tone: 'error',
        message: error?.message || 'Unable to schedule session. Please try again in a moment.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
        >
          Close
        </button>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
            {avatarInitial}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900">{mentorName}</h3>
            <p className="text-sm text-slate-600">{mentorContact}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Completed sessions</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{analytics?.completed ?? analytics?.sessionsRedeemed ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Upcoming sessions</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{analytics?.upcoming ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Packages</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{analytics?.purchases ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total spend</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(analytics?.totalSpend, analytics?.currency ?? 'USD')}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              {analytics?.favourited
                ? 'You have this mentor saved as a favourite.'
                : 'Save this mentor to favourites to keep them handy.'}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOpenProfile}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                Open full profile
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
            {scheduleStatus ? (
              <div
                className={`rounded-2xl border px-3 py-2 text-xs ${
                  scheduleStatus.tone === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : scheduleStatus.tone === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-600'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {scheduleStatus.message}
              </div>
            ) : null}
          </div>

          <SessionScheduler
            mentor={mentor}
            availability={mentor?.availability?.slots}
            defaultTimezone={mentor?.availability?.timezone}
            viewerTimezone={viewerTimezone}
            sessionTemplates={mentor?.sessionTemplates}
            onSchedule={handleSchedule}
            pending={pending || scheduleStatus?.tone === 'pending'}
          />
        </div>
      </div>
    </div>
  );
}

MentorPreviewModal.propTypes = {
  mentor: PropTypes.object,
  analytics: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSchedule: PropTypes.func,
  pending: PropTypes.bool,
  viewerTimezone: PropTypes.string,
};

export default MentorPreviewModal;
