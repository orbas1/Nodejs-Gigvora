import { useContext } from 'react';
import { MessagingContext } from '../context/MessagingContext.jsx';

export default function useMessaging() {
  return useContext(MessagingContext);
}
