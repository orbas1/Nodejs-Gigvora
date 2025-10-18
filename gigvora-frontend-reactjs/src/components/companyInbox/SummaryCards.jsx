import { useMemo } from 'react';
import {
  BellAlertIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  InboxStackIcon,
  TagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const SUMMARY_ICONS = [InboxStackIcon, BellAlertIcon, ChatBubbleLeftRightIcon, ClockIcon, UsersIcon, TagIcon];

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString();
}

function formatDuration(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(1);
}

export default function SummaryCards({ metrics }) {
  const cards = useMemo(
    () => [
      { title: 'Threads', value: formatNumber(metrics?.totalThreads ?? 0) },
      { title: 'Unread', value: formatNumber(metrics?.unreadThreads ?? 0) },
      { title: 'Waiting', value: formatNumber(metrics?.awaitingResponse ?? 0) },
      { title: 'Avg reply (min)', value: formatDuration(metrics?.averageFirstResponseMinutes) },
      { title: 'Open cases', value: formatNumber(metrics?.supportOpen ?? 0) },
      { title: 'Resolved 7d', value: formatNumber(metrics?.supportResolvedLast7Days ?? 0) },
    ],
    [metrics],
  );

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => {
        const Icon = SUMMARY_ICONS[index % SUMMARY_ICONS.length];
        return (
          <div
            key={card.title}
            className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-5 shadow-sm"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.title}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            </div>
            <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
