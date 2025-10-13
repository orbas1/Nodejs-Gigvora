import { useSession as useSessionContext } from '../context/SessionContext.jsx';

export default function useSession() {
  return useSessionContext();
}
