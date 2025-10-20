import UserAvatar from '../../UserAvatar.jsx';

function formatStatus(status) {
  if (!status) return 'Status';
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

function resolveAvatar(candidate) {
  const sources = [
    candidate?.candidate?.avatarUrl,
    candidate?.candidate?.photoUrl,
    candidate?.candidate?.profile?.avatarUrl,
    candidate?.avatarUrl,
    candidate?.photoUrl,
    candidate?.imageUrl,
  ];

  return sources.find((value) => typeof value === 'string' && value.length > 0) ?? null;
}

export default function CandidateList({ candidates, onSelect, selectedId }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Candidate</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Decision</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3">Interviews</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {(candidates ?? []).length ? (
            candidates.map((candidate) => {
              const isSelected = selectedId === candidate.id;
              return (
                <tr
                  key={candidate.id}
                  className={`cursor-pointer transition hover:bg-blue-50 ${isSelected ? 'bg-blue-50/80' : ''}`}
                  onClick={() => onSelect?.(candidate)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={candidate.candidate?.name ?? candidate.candidateName ?? 'Candidate'}
                        imageUrl={resolveAvatar(candidate)}
                        size="xs"
                        showGlow={false}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{candidate.candidate?.name ?? candidate.candidateName ?? 'Candidate'}</span>
                        <span className="text-xs text-slate-500">{candidate.jobTitle ?? 'Application'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatStatus(candidate.status)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(candidate.submittedAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(candidate.decisionAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{candidate.notes?.length ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">{candidate.interviews?.length ?? 0}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                No candidates.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
