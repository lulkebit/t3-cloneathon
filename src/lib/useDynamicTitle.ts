import { useEffect } from 'react';
import { Conversation } from '@/types/chat';

const DEFAULT_TITLE = 'AI Chat - Modern Interface';

export function useDynamicTitle(activeConversation: Conversation | null) {
  useEffect(() => {
    if (activeConversation?.title) {
      // Set title to chat title with app name as suffix
      document.title = `${activeConversation.title} - AI Chat`;
    } else {
      // Reset to default title when no active conversation
      document.title = DEFAULT_TITLE;
    }
  }, [activeConversation]);
} 