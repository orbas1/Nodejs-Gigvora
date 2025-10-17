import useSession from '../../hooks/useSession.js';
import MentoringWorkspace from '../../components/dashboard/agency/mentoring/MentoringWorkspace.jsx';

function resolveWorkspace(session) {
  if (!session) {
    return { id: null, slug: null };
  }
  const workspace = session.workspace || session.agencyWorkspace || null;
  if (workspace && typeof workspace === 'object') {
    return {
      id: workspace.id ?? null,
      slug: workspace.slug ?? null,
    };
  }
  return {
    id: session.workspaceId ?? null,
    slug: session.workspaceSlug ?? null,
  };
}

export default function AgencyMentoringPage() {
  const { session } = useSession();
  const workspace = resolveWorkspace(session);

  return <MentoringWorkspace workspaceId={workspace.id} workspaceSlug={workspace.slug} />;
}
