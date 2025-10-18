import { useEffect, useState } from 'react';
import { listCreationStudioItems } from '../../services/creationStudio.js';
import useSession from '../../hooks/useSession.js';
import { CREATION_TYPES } from './config.js';

export default function CreationStudioSnapshot() {
  const { session } = useSession();
  const ownerId = session?.id ?? 1;
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    listCreationStudioItems({ ownerId, pageSize: 5 })
      .then((response) => {
        if (mounted) {
          setItems(response?.items ?? []);
        }
      })
      .catch((error) => {
        console.error('Unable to load studio snapshot', error);
      });
    return () => {
      mounted = false;
    };
  }, [ownerId]);

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
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
