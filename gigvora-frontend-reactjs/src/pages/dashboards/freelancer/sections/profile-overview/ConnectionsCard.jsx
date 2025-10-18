export default function ConnectionsCard({ connections = {}, onOpen }) {
  const pending = (connections.pendingIncoming || []).length + (connections.pendingOutgoing || []).length;
  const accepted = (connections.accepted || []).length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 text-sm text-slate-600">
          <p className="text-sm font-semibold text-slate-900">Connections</p>
          <p>{accepted} active</p>
          <p>{pending} pending</p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          Network
        </button>
      </div>
    </div>
  );
}
