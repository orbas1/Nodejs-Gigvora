import { classNames } from '../../utils/classNames.js';
import {
  formatMessageSender,
  formatMessageTimestamp,
  getCallMetadata,
  isCallActive,
  isCallEvent,
  messageBelongsToUser,
  formatReadReceiptSummary,
} from '../../utils/messaging.js';

export default function ConversationMessage({ message, actorId, onJoinCall, joiningCall, activeCallId }) {
  const own = messageBelongsToUser(message, actorId);
  const timestamp = formatMessageTimestamp(message);
  const readReceiptSummary = own ? formatReadReceiptSummary(message?.readReceipts, actorId) : null;

  if (isCallEvent(message)) {
    const callMetadata = getCallMetadata(message);
    const callActive = isCallActive(callMetadata);
    const participants = Array.isArray(callMetadata?.participants) ? callMetadata.participants : [];
    const joinDisabled = !callActive || joiningCall || (activeCallId && activeCallId !== callMetadata?.id);

    return (
      <div className="flex flex-col items-start gap-1 text-sm">
        <p className="text-xs text-slate-400">
          {formatMessageSender(message)} • {timestamp}
        </p>
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">
            {callMetadata?.type === 'voice' ? 'Voice call' : 'Video call'}{' '}
            <span className={classNames('ml-2 text-xs font-semibold uppercase tracking-wide', callActive ? 'text-emerald-600' : 'text-slate-400')}>
              {callActive ? 'Active' : 'Ended'}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Started by {formatMessageSender(message)} {timestamp}
          </p>
          {participants.length ? (
            <p className="mt-2 text-xs text-slate-500">
              Participants:{' '}
              {participants
                .map((participant) =>
                  Number(participant.userId) === Number(actorId) ? 'You' : `User ${participant.userId}`,
                )
                .join(', ')}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={joinDisabled}
              onClick={() => onJoinCall?.(callMetadata)}
              className={classNames(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                joinDisabled
                  ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'border border-accent bg-accent text-white hover:border-accentDark hover:bg-accentDark',
              )}
            >
              {activeCallId === callMetadata?.id ? 'Return to call' : callActive ? 'Join call' : 'Call ended'}
            </button>
            {callMetadata?.expiresAt ? (
              <span className="text-xs text-slate-400">
                Expires {formatMessageTimestamp({ createdAt: callMetadata.expiresAt })}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames('flex flex-col gap-1 text-sm', own ? 'items-end' : 'items-start')}>
      <p className="text-xs text-slate-400">
        {formatMessageSender(message)} • {timestamp}
      </p>
      <div
        className={classNames(
          'max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 shadow-sm',
          own ? 'bg-accent text-white' : 'bg-slate-100 text-slate-800',
        )}
      >
        {message.body ? message.body : <span className="italic text-slate-500">No message body</span>}
      </div>
      {readReceiptSummary ? (
        <p className="text-[11px] font-medium text-slate-400">Read by {readReceiptSummary}</p>
      ) : null}
    </div>
  );
}
