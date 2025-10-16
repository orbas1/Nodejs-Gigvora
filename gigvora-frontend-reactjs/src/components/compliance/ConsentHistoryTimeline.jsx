import { CheckCircleIcon, DocumentTextIcon, ExclamationTriangleIcon, ShieldCheckIcon, XCircleIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import formatDateTime from '../../utils/formatDateTime.js';

const ACTION_MAP = {
  policy_created: {
    label: 'Policy registered',
    description: 'Legal approved a new consent policy and published the baseline version.',
    icon: DocumentTextIcon,
    tone: 'info',
  },
  policy_updated: {
    label: 'Policy metadata updated',
    description: 'Metadata such as title, legal basis, or description changed.',
    icon: DocumentTextIcon,
    tone: 'info',
  },
  policy_version_created: {
    label: 'Version drafted',
    description: 'A new version has been prepared and activated for distribution.',
    icon: DocumentTextIcon,
    tone: 'info',
  },
  policy_version_activated: {
    label: 'Version activated',
    description: 'The version is now in effect for all targeted jurisdictions.',
    icon: CheckCircleIcon,
    tone: 'success',
  },
  policy_version_superseded: {
    label: 'Version superseded',
    description: 'Previous version retired after a new activation.',
    icon: ExclamationTriangleIcon,
    tone: 'warning',
  },
  consent_granted: {
    label: 'Consent granted',
    description: 'The user allowed Gigvora to process data for this policy.',
    icon: ShieldCheckIcon,
    tone: 'success',
  },
  consent_withdrawn: {
    label: 'Consent withdrawn',
    description: 'The user withdrew permission; remediation and alerts may be required.',
    icon: XCircleIcon,
    tone: 'danger',
  },
  policy_deleted: {
    label: 'Policy deleted',
    description: 'The consent policy was removed. Ensure exports and archives are updated.',
    icon: XCircleIcon,
    tone: 'danger',
  },
};

const TONE_STYLES = {
  success: {
    container: 'bg-emerald-50 text-emerald-700',
    icon: 'text-emerald-600',
  },
  warning: {
    container: 'bg-amber-50 text-amber-700',
    icon: 'text-amber-600',
  },
  danger: {
    container: 'bg-rose-50 text-rose-700',
    icon: 'text-rose-600',
  },
  info: {
    container: 'bg-slate-100 text-slate-700',
    icon: 'text-slate-600',
  },
};

function describeActor(actor) {
  if (!actor) return 'System';
  const actorType = actor.type ? actor.type.replace(/_/g, ' ') : 'system';
  const formatted = actorType.charAt(0).toUpperCase() + actorType.slice(1);
  if (!actor.id) return formatted;
  return `${formatted} • ${actor.id}`;
}

function renderMetadata(metadata = {}) {
  const entries = Object.entries(metadata).filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500"
        >
          <span className="font-semibold text-slate-600">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
          <span className="text-slate-700">{`${value}`}</span>
        </span>
      ))}
    </div>
  );
}

function renderVersion(version) {
  if (!version) return null;
  return (
    <p className="text-xs text-slate-500">
      Version v{version.version}
      {version.effectiveAt && (
        <span>
          {' '}
          • effective {formatDateTime(version.effectiveAt)}
        </span>
      )}
    </p>
  );
}

function renderConsentSnapshot(consent) {
  if (!consent) return null;
  const status = consent.status === 'granted' ? 'Granted' : 'Withdrawn';
  return (
    <p className="text-xs text-slate-500">
      {status}
      {consent.grantedAt && (
        <span>
          {' '}
          • granted {formatDateTime(consent.grantedAt)}
        </span>
      )}
      {consent.withdrawnAt && (
        <span>
          {' '}
          • withdrawn {formatDateTime(consent.withdrawnAt)}
        </span>
      )}
    </p>
  );
}

export default function ConsentHistoryTimeline({ events }) {
  if (!events?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No audit events recorded yet. Legal and compliance updates will appear once policies are activated or decisions change.
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-slate-200 pl-5">
      {events.map((event) => {
        const definition = ACTION_MAP[event.action] ?? {
          label: event.action,
          description: 'Audit event captured for this policy.',
          icon: DocumentTextIcon,
          tone: 'info',
        };
        const styles = TONE_STYLES[definition.tone] ?? TONE_STYLES.info;
        const Icon = definition.icon;

        return (
          <li key={event.id} className="relative">
            <span className="absolute -left-[22px] top-2 h-3 w-3 rounded-full bg-indigo-200" aria-hidden="true" />
            <div className="flex gap-3">
              <span className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full ${styles.container}`}>
                <Icon className={`h-5 w-5 ${styles.icon}`} />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{definition.label}</p>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {formatDateTime(event.occurredAt)} • {describeActor(event.actor)}
                </p>
                {definition.description && (
                  <p className="text-xs text-slate-600">{definition.description}</p>
                )}
                {event.reason && <p className="text-xs text-slate-500">Reason: {event.reason}</p>}
                {renderVersion(event.policyVersion)}
                {renderConsentSnapshot(event.userConsent)}
                {renderMetadata(event.metadata)}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

ConsentHistoryTimeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      action: PropTypes.string.isRequired,
      occurredAt: PropTypes.string,
      actor: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        type: PropTypes.string,
      }),
      metadata: PropTypes.object,
      reason: PropTypes.string,
      policyVersion: PropTypes.shape({
        id: PropTypes.number,
        version: PropTypes.number,
        effectiveAt: PropTypes.string,
        supersededAt: PropTypes.string,
      }),
      userConsent: PropTypes.shape({
        id: PropTypes.number,
        status: PropTypes.string,
        grantedAt: PropTypes.string,
        withdrawnAt: PropTypes.string,
      }),
    }),
  ),
};

ConsentHistoryTimeline.defaultProps = {
  events: [],
};
