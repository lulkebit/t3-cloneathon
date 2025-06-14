export class TitleGenerator {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateTitle(userMessage: string, assistantResponse?: string): Promise<string> {
    try {
      const prompt = this.buildTitlePrompt(userMessage, assistantResponse);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'AI Chat Title Generator',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free', // Fast and cheap model for title generation
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 20,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedTitle = data.choices?.[0]?.message?.content?.trim();
      
      if (!generatedTitle) {
        throw new Error('No title generated');
      }

      // Clean up the title - remove quotes and ensure it's not too long
      const cleanTitle = generatedTitle
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .substring(0, 60) // Max 60 characters
        .trim();

      return cleanTitle || this.getFallbackTitle(userMessage);
    } catch (error) {
      console.error('Error generating title:', error);
      return this.getFallbackTitle(userMessage);
    }
  }

  private buildTitlePrompt(userMessage: string, assistantResponse?: string): string {
    const context = assistantResponse 
      ? `User: ${userMessage}\n\nAssistant: ${assistantResponse.substring(0, 200)}...`
      : `User: ${userMessage}`;

    return `Generate a very short, concise title (max 6 words) for this conversation. The title should capture the main topic or task. Do not use quotes or punctuation. Examples:
- "Python data analysis help"
- "React component debugging"
- "Travel planning for Japan"
- "Math homework assistance"

Conversation:
${context}

Title:`;
  }

  private getFallbackTitle(userMessage: string): string {
    // Clean fallback - remove common prefixes and create a meaningful short title
    const cleaned = userMessage
      .replace(/^(hi|hello|hey|can you|could you|please|help me|i need|how do i|what is|explain)/i, '')
      .trim();
    
    const words = cleaned.split(' ').slice(0, 6); // Max 6 words
    const title = words.join(' ');
    
    return title.length > 3 
      ? title.substring(0, 50) + (title.length > 50 ? '...' : '')
      : userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
  }
} 