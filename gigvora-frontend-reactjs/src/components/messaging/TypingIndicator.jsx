import { useMemo } from 'react';
import { formatTypingParticipants } from '../../utils/messaging.js';

export default function TypingIndicator({ participants, actorId }) {
  const label = useMemo(() => formatTypingParticipants(participants, actorId), [participants, actorId]);

  if (!label) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
      <span className="relative inline-flex h-2 w-2 flex-none">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/40" aria-hidden="true" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
      </span>
      <span>{label}</span>
    </div>
  );
}
