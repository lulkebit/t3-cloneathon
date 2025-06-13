import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { OpenRouterService } from '@/lib/openrouter';
import { ConsensusResponse } from '@/types/chat';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, message, models, attachments = [] } = await request.json();

    if ((!message || message.trim() === '') && attachments.length === 0) {
      return NextResponse.json({ error: 'Message or attachments required' }, { status: 400 });
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json({ error: 'At least one model is required' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('openrouter_api_key')
      .eq('id', user.id)
      .single();

    if (!profile?.openrouter_api_key) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 400 });
    }

    let conversation = null;
    let messages = [];

    if (conversationId) {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (existingConversation) {
        conversation = existingConversation;
        
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        messages = existingMessages || [];
      }
    }

    if (!conversation) {
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          model: `consensus:${models.join(',')}`,
        })
        .select()
        .single();

      if (conversationError || !newConversation) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      conversation = newConversation;
    }

    const { data: userMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message || '',
      })
      .select()
      .single();

    if (messageError || !userMessage) {
      return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 });
    }

    // Save attachments if any
    if (attachments.length > 0) {
      const attachmentInserts = attachments.map((attachment: any) => ({
        message_id: userMessage.id,
        filename: attachment.filename,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        file_url: attachment.file_url,
      }));

      const { error: attachmentError } = await supabase
        .from('attachments')
        .insert(attachmentInserts);

      if (attachmentError) {
        console.error('Failed to save attachments:', attachmentError);
      }
    }

    // Build the current message content including attachments
    let currentMessageContent = message || '';
    if (attachments.length > 0) {
      const attachmentDescriptions = attachments.map((att: any) => 
        `[Attachment: ${att.filename} (${att.file_type})]`
      ).join('\n');
      currentMessageContent = `${currentMessageContent}\n\n${attachmentDescriptions}`;
    }

    // Build conversation history
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    conversationHistory.push({
      role: 'user',
      content: currentMessageContent,
    });

    const openRouter = new OpenRouterService(profile.openrouter_api_key);

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const consensusResponses: ConsensusResponse[] = models.map((model: string) => ({
            model,
            content: '',
            isLoading: true,
            responseTime: 0,
          }));

          // Send initial state
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'consensus_start',
            models: models,
            responses: consensusResponses
          })}\n\n`));

          // Create promises for all model requests
          const modelPromises = models.map(async (model: string, index: number) => {
            const startTime = Date.now();
            try {
              let fullResponse = '';
              
              await openRouter.createChatCompletion(
                model,
                conversationHistory,
                (chunk: string) => {
                  fullResponse += chunk;
                  consensusResponses[index] = {
                    ...consensusResponses[index],
                    content: fullResponse,
                    isStreaming: true,
                    isLoading: false,
                  };
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'consensus_update',
                    modelIndex: index,
                    model: model,
                    content: fullResponse,
                    isStreaming: true
                  })}\n\n`));
                },
                request.headers.get('referer') || undefined
              );

              const responseTime = Date.now() - startTime;
              consensusResponses[index] = {
                ...consensusResponses[index],
                content: fullResponse,
                isStreaming: false,
                isLoading: false,
                responseTime,
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'consensus_complete',
                modelIndex: index,
                model: model,
                content: fullResponse,
                responseTime
              })}\n\n`));

            } catch (error) {
              const responseTime = Date.now() - startTime;
              consensusResponses[index] = {
                ...consensusResponses[index],
                error: error instanceof Error ? error.message : 'Unknown error',
                isLoading: false,
                isStreaming: false,
                responseTime,
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'consensus_error',
                modelIndex: index,
                model: model,
                error: error instanceof Error ? error.message : 'Unknown error',
                responseTime
              })}\n\n`));
            }
          });

          // Wait for all models to complete
          await Promise.all(modelPromises);

          // Save the consensus message to database
          const consensusContent = JSON.stringify(consensusResponses);
          
          const { data: assistantMessage } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              role: 'assistant',
              content: consensusContent,
            })
            .select()
            .single();

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'consensus_final',
            messageId: assistantMessage?.id,
            responses: consensusResponses
          })}\n\n`));

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('Consensus error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in consensus endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 