import { useEffect } from 'react';
import { Conversation } from '@/types/chat';

const DEFAULT_TITLE = 'Convex Chat - t3-cloneathon';

export function useDynamicTitle(activeConversation: Conversation | null) {
  useEffect(() => {
    if (activeConversation?.title) {
      document.title = `${activeConversation.title} - Convex Chat`;
    } else {
      document.title = DEFAULT_TITLE;
    }
  }, [activeConversation]);
}
