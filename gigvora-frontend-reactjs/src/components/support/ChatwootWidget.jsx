import useChatwoot from '../../hooks/useChatwoot.js';
import useSession from '../../hooks/useSession.js';

export default function ChatwootWidget() {
  const { isAuthenticated } = useSession();
  useChatwoot({ enabled: isAuthenticated });
  return null;
}
