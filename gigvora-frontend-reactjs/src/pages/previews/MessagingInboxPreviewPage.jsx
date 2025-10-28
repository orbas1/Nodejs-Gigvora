import SessionContext from '../../context/SessionContext.jsx';
import MessagingInboxPreview, {
  MESSAGING_INBOX_SAMPLE_THREADS,
} from '../../preview/messaging-inbox-preview.jsx';

const DEMO_SESSION = {
  id: 'demo-collaborator',
  name: 'Demo Collaborator',
  email: 'demo-collaborator@gigvora.com',
  memberships: ['company'],
  roles: ['company'],
  isAuthenticated: true,
};

export default function MessagingInboxPreviewPage() {
  return (
    <SessionContext.Provider value={{ session: DEMO_SESSION, isAuthenticated: true }}>
      <MessagingInboxPreview initialThreads={MESSAGING_INBOX_SAMPLE_THREADS} />
    </SessionContext.Provider>
  );
}
