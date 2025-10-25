import PropTypes from 'prop-types';
import { classNames } from '../../utils/classNames.js';

function formatTypingCopy(participants) {
  if (!participants.length) {
    return '';
  }
  if (participants.length === 1) {
    return `${participants[0].name ?? 'Someone'} is typing…`;
  }
  if (participants.length === 2) {
    return `${participants[0].name ?? 'Someone'} and ${participants[1].name ?? 'someone else'} are typing…`;
  }
  return `${participants.length} people are typing…`;
}

export default function TypingIndicator({ participants, className }) {
  const copy = formatTypingCopy(participants);
  if (!copy) {
    return null;
  }
  return (
    <div
      className={classNames(
        'inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500',
        className,
      )}
    >
      <span className="flex h-2 w-2 items-center justify-center">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
      </span>
      {copy}
    </div>
  );
}

TypingIndicator.propTypes = {
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
  ),
  className: PropTypes.string,
};

TypingIndicator.defaultProps = {
  participants: [],
  className: '',
};
