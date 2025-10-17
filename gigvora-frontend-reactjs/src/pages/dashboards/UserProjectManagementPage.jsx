import ProjectGigManagementContainer from '../../components/projectGigManagement/ProjectGigManagementContainer.jsx';
import useSession from '../../hooks/useSession.js';

const DEFAULT_USER_ID = 1;

function resolveUserId(session) {
  if (!session) {
    return DEFAULT_USER_ID;
  }

  return session.userId ?? session.user?.id ?? session.id ?? DEFAULT_USER_ID;
}

export default function UserProjectManagementPage() {
  const session = useSession();
  const userId = resolveUserId(session);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        <ProjectGigManagementContainer userId={userId} />
      </div>
    </main>
  );
}
