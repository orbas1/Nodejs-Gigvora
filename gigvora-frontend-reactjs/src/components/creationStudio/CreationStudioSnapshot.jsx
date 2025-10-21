import { useEffect, useMemo, useState } from 'react';
import { listCreationStudioItems } from '../../services/creationStudio.js';
import useSession from '../../hooks/useSession.js';
import { CREATION_TYPES, evaluateCreationAccess } from './config.js';

const SNAPSHOT_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  UNAUTHENTICATED: 'unauthenticated',
  FORBIDDEN: 'forbidden',
  ERROR: 'error',
  READY: 'ready',
};

export default function CreationStudioSnapshot() {
  const { session, isAuthenticated } = useSession();
  const { ownerId, hasAccess } = useMemo(() => evaluateCreationAccess(session), [session]);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(SNAPSHOT_STATES.IDLE);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setStatus(SNAPSHOT_STATES.UNAUTHENTICATED);
      return undefined;
    }
    if (!hasAccess || !ownerId) {
      setItems([]);
      setStatus(SNAPSHOT_STATES.FORBIDDEN);
      return undefined;
    }

    const controller = new AbortController();
    setStatus(SNAPSHOT_STATES.LOADING);

    listCreationStudioItems(
      { ownerId, pageSize: 5 },
      { signal: controller.signal },
    )
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }
        setItems(response?.items ?? []);
        setStatus(SNAPSHOT_STATES.READY);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Unable to load studio snapshot', error);
        setItems([]);
        setStatus(SNAPSHOT_STATES.ERROR);
      });

    return () => {
      controller.abort();
    };
  }, [ownerId, hasAccess, isAuthenticated]);

  if (status === SNAPSHOT_STATES.UNAUTHENTICATED) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Sign in to view your creation studio snapshot.
      </div>
    );
  }

  if (status === SNAPSHOT_STATES.FORBIDDEN) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Your account doesn&apos;t have creation studio access yet. Ask an admin to enable it.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {status === SNAPSHOT_STATES.ERROR ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
          Unable to load your recent creations. Try again shortly.
        </div>
      ) : null}
      {status === SNAPSHOT_STATES.LOADING ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading your recent creations...
        </div>
      ) : null}
      {items.length === 0 && status === SNAPSHOT_STATES.READY ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          No launches yet. Open Creation Studio to start one.
        </div>
      ) : null}
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const type = CREATION_TYPES.find((definition) => definition.id === item.type);
          return (
            <li key={item.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <span className="text-xs font-semibold uppercase text-slate-500">{item.status}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{type?.name ?? item.type}</p>
              {item.updatedAt ? (
                <p className="mt-4 text-xs text-slate-400">Updated {new Date(item.updatedAt).toLocaleDateString()}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
