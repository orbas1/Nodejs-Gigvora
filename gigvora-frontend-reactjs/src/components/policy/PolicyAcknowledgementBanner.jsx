import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSession from '../../hooks/useSession.js';
import analytics from '../../services/analytics.js';
import { fetchPolicyReleaseMetadata } from '../../services/policyUpdates.js';

const DEFAULT_METADATA = {
  version: '2024.11',
  headline: 'Updated legal terms now live',
  summary:
    'We have refreshed our Terms, Privacy Policy, Refund Policy, and Community Guidelines for the latest release. Review the updates and acknowledge to continue using collaboration tools.',
  effectiveAt: '2024-11-05T00:00:00Z',
  remindAfterDays: 180,
  links: [
    { href: '/terms', label: 'View terms' },
    { href: '/privacy', label: 'Privacy summary' },
  ],
  acknowledgeLabel: 'Acknowledge updates',
};

function resolveAcknowledgementExpiry(metadata) {
  if (metadata?.acknowledgeBy) {
    return metadata.acknowledgeBy;
  }
  if (metadata?.expiresAt) {
    return metadata.expiresAt;
  }
  if (metadata?.remindAfterDays) {
    const remindMs = Number(metadata.remindAfterDays) * 24 * 60 * 60 * 1000;
    if (!Number.isNaN(remindMs) && remindMs > 0) {
      return new Date(Date.now() + remindMs).toISOString();
    }
  }
  return null;
}

export default function PolicyAcknowledgementBanner() {
  const { session } = useSession();
  const [metadata, setMetadata] = useState(DEFAULT_METADATA);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const response = await fetchPolicyReleaseMetadata();
        if (!isMounted) {
          return;
        }
        if (response) {
          const merged = {
            ...DEFAULT_METADATA,
            ...(response ?? {}),
            links: Array.isArray(response?.links) && response.links.length ? response.links : DEFAULT_METADATA.links,
            acknowledgeLabel: response?.acknowledgeLabel ?? DEFAULT_METADATA.acknowledgeLabel,
          };
          setMetadata(merged);
        }
        setLoading(false);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err?.message ?? 'Unable to load the latest policy details. Showing cached version.');
        setMetadata(DEFAULT_METADATA);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const storageKey = useMemo(() => {
    const suffix = session?.id ? `:${session.id}` : '';
    return `gv-policy-ack:${metadata.version}${suffix}`;
  }, [metadata.version, session?.id]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setDismissed(false);
        return;
      }
      const payload = JSON.parse(raw);
      if (!payload || payload.version !== metadata.version) {
        setDismissed(false);
        return;
      }
      if (payload.expiresAt) {
        const expiry = new Date(payload.expiresAt);
        if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
          setDismissed(false);
          return;
        }
      }
      setDismissed(true);
    } catch (err) {
      setDismissed(false);
    }
  }, [storageKey, metadata.version]);

  const acknowledge = useCallback(() => {
    const payload = {
      version: metadata.version,
      acknowledgedAt: new Date().toISOString(),
      expiresAt: resolveAcknowledgementExpiry(metadata),
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (err) {
      // ignore storage write errors
    }
    analytics.track(
      'policy.acknowledged',
      {
        version: metadata.version,
        effectiveAt: metadata.effectiveAt ?? null,
        policies: (metadata.links ?? []).map((link) => link.label ?? link.href),
      },
      {
        userId: session?.id ?? null,
        actorType: session?.id ? 'user' : 'anonymous',
      },
    );
    setDismissed(true);
  }, [metadata, session?.id, storageKey]);

  if (loading && dismissed) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-[60] max-w-5xl rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-xl backdrop-blur"
      style={{
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        paddingLeft: 'calc(1.5rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1.5rem + env(safe-area-inset-right))',
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="space-y-1 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{metadata.headline}</p>
          <p>{metadata.summary}</p>
          {error ? <p className="text-xs text-amber-600">{error}</p> : null}
        </div>
        <div className="flex flex-col gap-2 text-sm font-semibold md:flex-row">
          {(metadata.links ?? []).map((link) => (
            <Link
              key={link.href ?? link.label}
              to={link.href ?? '#'}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {link.label ?? link.href}
            </Link>
          ))}
          <button
            type="button"
            onClick={acknowledge}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-white shadow-sm transition hover:bg-slate-700"
          >
            {metadata.acknowledgeLabel ?? 'Acknowledge updates'}
          </button>
        </div>
      </div>
    </div>
  );
}
