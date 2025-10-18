import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import TimelineAnalyticsSection from './TimelineAnalyticsSection.jsx';

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function SelectedPostPanel({ selectedAnalytics, onClear }) {
  if (!selectedAnalytics) {
    return null;
  }
  if (selectedAnalytics.error) {
    return (
      <div className="space-y-2 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-600">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{selectedAnalytics.post.title}</p>
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            Clear
          </button>
        </div>
        <p className="text-xs">{selectedAnalytics.error}</p>
      </div>
    );
  }

  const totals = selectedAnalytics.analytics?.totals ?? {};

  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{selectedAnalytics.post.title}</p>
          <p className="text-xs text-slate-500">Post detail</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-accent hover:text-accentDark"
        >
          Clear
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Views</p>
          <p className="text-lg font-semibold text-slate-900">{totals.impressions?.toLocaleString?.() ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Clicks</p>
          <p className="text-lg font-semibold text-slate-900">{totals.clicks?.toLocaleString?.() ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Eng%</p>
          <p className="text-lg font-semibold text-slate-900">{formatPercent(totals.engagementRate)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Conv%</p>
          <p className="text-lg font-semibold text-slate-900">{formatPercent(totals.conversionRate)}</p>
        </div>
      </div>
    </div>
  );
}

SelectedPostPanel.propTypes = {
  selectedAnalytics: PropTypes.shape({
    post: PropTypes.shape({
      title: PropTypes.string.isRequired,
    }).isRequired,
    analytics: PropTypes.shape({
      totals: PropTypes.shape({
        impressions: PropTypes.number,
        clicks: PropTypes.number,
        engagementRate: PropTypes.number,
        conversionRate: PropTypes.number,
      }),
    }),
    error: PropTypes.string,
  }),
  onClear: PropTypes.func.isRequired,
};

SelectedPostPanel.defaultProps = {
  selectedAnalytics: null,
};

export default function TimelineInsightsDrawer({
  open,
  onClose,
  totals,
  trend,
  channelBreakdown,
  topPosts,
  onSelectPost,
  loading,
  selectedAnalytics,
  onClearSelected,
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-stretch justify-end p-6">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex h-full flex-col">
                  <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">Insights</Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </header>

                  <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <TimelineAnalyticsSection
                      totals={totals}
                      trend={trend}
                      channelBreakdown={channelBreakdown}
                      topPosts={topPosts}
                      onSelectPost={onSelectPost}
                      loading={loading}
                    />

                    <SelectedPostPanel selectedAnalytics={selectedAnalytics} onClear={onClearSelected} />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

TimelineInsightsDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  totals: PropTypes.object,
  trend: PropTypes.array,
  channelBreakdown: PropTypes.array,
  topPosts: PropTypes.array,
  onSelectPost: PropTypes.func,
  loading: PropTypes.bool,
  selectedAnalytics: PropTypes.shape({
    post: PropTypes.object.isRequired,
    analytics: PropTypes.object,
    error: PropTypes.string,
  }),
  onClearSelected: PropTypes.func.isRequired,
};

TimelineInsightsDrawer.defaultProps = {
  totals: {},
  trend: [],
  channelBreakdown: [],
  topPosts: [],
  onSelectPost: undefined,
  loading: false,
  selectedAnalytics: null,
};
