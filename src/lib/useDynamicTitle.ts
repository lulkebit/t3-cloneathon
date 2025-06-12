import { useEffect } from 'react';
import { Conversation } from '@/types/chat';

const DEFAULT_TITLE = 'AI Chat - Modern Interface';

export function useDynamicTitle(activeConversation: Conversation | null) {
  useEffect(() => {
    if (activeConversation?.title) {
      document.title = `${activeConversation.title} - AI Chat`;
    } else {
      document.title = DEFAULT_TITLE;
    }
  }, [activeConversation]);
} 