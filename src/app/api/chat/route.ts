import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { OpenRouterService } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      conversationId,
      message,
      model,
      attachments = [],
    } = await request.json();

    if ((!message || message.trim() === '') && attachments.length === 0) {
      return NextResponse.json(
        { error: 'Message or attachments required' },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('openrouter_api_key')
      .eq('id', user.id)
      .single();

    if (!profile?.openrouter_api_key) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 400 }
      );
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
          .select(
            `
            *,
            attachments (
              id,
              filename,
              file_type,
              file_size,
              file_url,
              created_at
            )
          `
          )
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
          title: 'New Chat',
          model,
        })
        .select()
        .single();

      if (conversationError || !newConversation) {
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
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
      return NextResponse.json(
        { error: 'Failed to save user message' },
        { status: 500 }
      );
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
        // Continue anyway, don't fail the entire request
      }
    }

    // Build the current message content array format for OpenRouter Vision API
    const contentParts: any[] = [];

    // Add text content if present
    if (message && message.trim()) {
      contentParts.push({
        type: 'text',
        text: message,
      });
    }

    // Add attachments in proper OpenRouter format
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.file_type.startsWith('image/')) {
          // For images, use image_url format
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: attachment.file_url,
            },
          });
        } else if (attachment.file_type === 'application/pdf') {
          // For PDFs, we need to fetch and encode as base64
          try {
            const response = await fetch(attachment.file_url);
            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:application/pdf;base64,${base64Data}`;

            contentParts.push({
              type: 'file',
              file: {
                filename: attachment.filename,
                file_data: dataUrl,
              },
            });
          } catch (error) {
            console.error('Failed to process PDF attachment:', error);
            // Fallback to text description if PDF processing fails
            contentParts.push({
              type: 'text',
              text: `[PDF Document: ${attachment.filename} - Unable to process file content]`,
            });
          }
        } else {
          // For other file types, add as text description
          contentParts.push({
            type: 'text',
            text: `[File: ${attachment.filename}]`,
          });
        }
      }
    }

    // Helper function to format message content with attachments
    const formatMessageContent = async (msg: any) => {
      if (
        msg.role === 'assistant' ||
        !msg.attachments ||
        msg.attachments.length === 0
      ) {
        return msg.content;
      }

      const msgContentParts: any[] = [];

      // Add text content if present
      if (msg.content && msg.content.trim()) {
        msgContentParts.push({
          type: 'text',
          text: msg.content,
        });
      }

      // Add attachments in proper OpenRouter format
      for (const attachment of msg.attachments) {
        if (attachment.file_type.startsWith('image/')) {
          msgContentParts.push({
            type: 'image_url',
            image_url: {
              url: attachment.file_url,
            },
          });
        } else if (attachment.file_type === 'application/pdf') {
          try {
            const response = await fetch(attachment.file_url);
            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:application/pdf;base64,${base64Data}`;

            msgContentParts.push({
              type: 'file',
              file: {
                filename: attachment.filename,
                file_data: dataUrl,
              },
            });
          } catch (error) {
            console.error('Failed to process PDF attachment:', error);
            msgContentParts.push({
              type: 'text',
              text: `[PDF Document: ${attachment.filename} - Unable to process file content]`,
            });
          }
        } else {
          msgContentParts.push({
            type: 'text',
            text: `[File: ${attachment.filename}]`,
          });
        }
      }

      return msgContentParts.length > 1 ||
        (msgContentParts.length === 1 && msgContentParts[0].type !== 'text')
        ? msgContentParts
        : msgContentParts[0]?.text || msg.content;
    };

    // Build chat messages array with proper attachment formatting
    const formattedMessages = await Promise.all(
      messages.map(async (msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: await formatMessageContent(msg),
      }))
    );

    const chatMessages = [
      ...formattedMessages,
      {
        role: 'user' as const,
        content:
          contentParts.length > 1 ||
          (contentParts.length === 1 && contentParts[0].type !== 'text')
            ? contentParts
            : contentParts[0]?.text || message || '',
      },
    ];

    const openRouter = new OpenRouterService(profile.openrouter_api_key);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let assistantResponse = '';

          const response = await openRouter.createChatCompletion(
            model,
            chatMessages,
            (chunk: string) => {
              assistantResponse += chunk;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
              );
            },
            request.headers.get('origin') || undefined
          );

          await supabase.from('messages').insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: assistantResponse,
          });

          // Generate title for new conversations after first response
          if (messages.length === 0) {
            try {
              const titleResponse = await fetch(
                `${request.headers.get('origin') || 'http://localhost:3000'}/api/generate-title`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: request.headers.get('Authorization') || '',
                    Cookie: request.headers.get('Cookie') || '',
                  },
                  body: JSON.stringify({
                    userMessage: message,
                    assistantResponse,
                    conversationId: conversation.id,
                  }),
                }
              );

              if (titleResponse.ok) {
                const titleData = await titleResponse.json();
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      titleUpdate: true,
                      title: titleData.title,
                      conversationId: conversation.id,
                    })}\n\n`
                  )
                );
              }
            } catch (titleError) {
              console.error('Failed to generate title:', titleError);
              // Don't fail the main request if title generation fails
            }
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, conversationId: conversation.id })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error('Error in chat completion:', error);

          // Extract meaningful error message
          let errorMessage = 'Failed to generate response';
          if (error instanceof Error) {
            errorMessage = error.message;
          }

          // Save error message as assistant response for user to see
          try {
            await supabase.from('messages').insert({
              conversation_id: conversation.id,
              role: 'assistant',
              content: `❌ **Error**: ${errorMessage}`,
            });
          } catch (dbError) {
            console.error('Failed to save error message:', dbError);
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: errorMessage,
                errorContent: `❌ **Error**: ${errorMessage}`,
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
