import IdVerificationHub from './IdVerificationHub.jsx';
import useSession from '../../../hooks/useSession.js';
import { parseWorkspaceId } from './utils.js';

export default function AgencyIdVerificationSection({ workspaceId, workspaceSlug, sectionId = 'agency-id-verification' }) {
  const { session } = useSession();
  const membershipSet = new Set((session?.memberships ?? []).map((role) => role?.toLowerCase()).filter(Boolean));
  const canManage =
    membershipSet.has('agency_admin') ||
    membershipSet.has('admin') ||
    membershipSet.has('compliance') ||
    membershipSet.has('compliance_manager') ||
    membershipSet.has('trust_safety');

  const resolvedWorkspaceId = parseWorkspaceId(workspaceId);

  return (
    <section id={sectionId} className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
      <IdVerificationHub workspaceId={resolvedWorkspaceId} workspaceSlug={workspaceSlug} canManage={canManage} />
    </section>
  );
}
