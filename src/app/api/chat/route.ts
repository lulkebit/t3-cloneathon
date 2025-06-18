import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { OpenRouterService } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, message, model, attachments = [] } = await request.json();

    if ((!message || message.trim() === '') && attachments.length === 0) {
      return NextResponse.json({ error: 'Message or attachments required' }, { status: 400 });
    }

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    // Fetch the full profile to get API key and any default settings
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*') // Select all columns from profile
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile fetch error for chat:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile or profile not found' }, { status: 500 });
    }

    if (!userProfile.openrouter_api_key) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 400 });
    }

    let conversation: any = null; // Use 'any' for conversation to handle profile defaults easily
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
          .select(`
            *,
            attachments (
              id,
              filename,
              file_type,
              file_size,
              file_url,
              created_at
            )
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        messages = existingMessages || [];
      }
    }

    if (!conversation) {
      // New conversation: apply default settings from profile
      const newConversationData: any = {
        user_id: user.id,
        title: 'New Chat', // Default title, can be updated later
        model,
      };

      if (userProfile.default_temperature !== null && userProfile.default_temperature !== undefined) {
        newConversationData.temperature = userProfile.default_temperature;
      }
      if (userProfile.default_top_p !== null && userProfile.default_top_p !== undefined) {
        newConversationData.top_p = userProfile.default_top_p;
      }
      if (userProfile.default_min_p !== null && userProfile.default_min_p !== undefined) {
        newConversationData.min_p = userProfile.default_min_p;
      }
      if (userProfile.default_seed !== null && userProfile.default_seed !== undefined) {
        newConversationData.seed = userProfile.default_seed;
      }
      if (userProfile.default_system_prompt !== null && userProfile.default_system_prompt !== undefined) {
        newConversationData.systemPrompt = userProfile.default_system_prompt;
      }

      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert(newConversationData)
        .select()
        .single();

      if (conversationError || !newConversation) {
        console.error('Failed to create new conversation:', conversationError);
        return NextResponse.json({ error: 'Failed to create conversation', details: conversationError?.message }, { status: 500 });
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
        // Continue anyway, don't fail the entire request
      }
    }

    // Build the current message content array format for OpenRouter Vision API
    const contentParts: any[] = [];
    
    // Add text content if present
    if (message && message.trim()) {
      contentParts.push({
        type: "text",
        text: message
      });
    }

    // Add attachments in proper OpenRouter format
    if (attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.file_type.startsWith('image/')) {
          // For images, use image_url format
          contentParts.push({
            type: "image_url",
            image_url: {
              url: attachment.file_url
            }
          });
        } else if (attachment.file_type === 'application/pdf') {
          // For PDFs, we need to fetch and encode as base64
          try {
            const response = await fetch(attachment.file_url);
            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:application/pdf;base64,${base64Data}`;
            
            contentParts.push({
              type: "file",
              file: {
                filename: attachment.filename,
                file_data: dataUrl
              }
            });
          } catch (error) {
            console.error('Failed to process PDF attachment:', error);
            // Fallback to text description if PDF processing fails
            contentParts.push({
              type: "text",
              text: `[PDF Document: ${attachment.filename} - Unable to process file content]`
            });
          }
        } else {
          // For other file types, add as text description
          contentParts.push({
            type: "text",
            text: `[File: ${attachment.filename}]`
          });
        }
      }
    }

    // Helper function to format message content with attachments
    const formatMessageContent = async (msg: any) => {
      if (msg.role === 'assistant' || !msg.attachments || msg.attachments.length === 0) {
        return msg.content;
      }

      const msgContentParts: any[] = [];
      
      // Add text content if present
      if (msg.content && msg.content.trim()) {
        msgContentParts.push({
          type: "text",
          text: msg.content
        });
      }

      // Add attachments in proper OpenRouter format
      for (const attachment of msg.attachments) {
        if (attachment.file_type.startsWith('image/')) {
          msgContentParts.push({
            type: "image_url",
            image_url: {
              url: attachment.file_url
            }
          });
        } else if (attachment.file_type === 'application/pdf') {
          try {
            const response = await fetch(attachment.file_url);
            const arrayBuffer = await response.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:application/pdf;base64,${base64Data}`;
            
            msgContentParts.push({
              type: "file",
              file: {
                filename: attachment.filename,
                file_data: dataUrl
              }
            });
          } catch (error) {
            console.error('Failed to process PDF attachment:', error);
            msgContentParts.push({
              type: "text",
              text: `[PDF Document: ${attachment.filename} - Unable to process file content]`
            });
          }
        } else {
          msgContentParts.push({
            type: "text",
            text: `[File: ${attachment.filename}]`
          });
        }
      }

      return msgContentParts.length > 1 || (msgContentParts.length === 1 && msgContentParts[0].type !== 'text') 
        ? msgContentParts 
        : msgContentParts[0]?.text || msg.content;
    };

    // Build chat messages array with proper attachment formatting
    const formattedMessages = await Promise.all(
      messages.map(async (msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: await formatMessageContent(msg)
      }))
    );

    const chatMessages = [
      ...formattedMessages,
      { 
        role: 'user' as const, 
        content: contentParts.length > 1 || (contentParts.length === 1 && contentParts[0].type !== 'text') 
          ? contentParts 
          : contentParts[0]?.text || message || ''
      }
    ];

    // Use the API key from the fetched userProfile
    const openRouter = new OpenRouterService(userProfile.openrouter_api_key);

    const params: { temperature?: number; top_p?: number; min_p?: number; seed?: number } = {};
    // conversation object might be from DB or newly created with defaults
    if (conversation.temperature !== undefined && conversation.temperature !== null) params.temperature = conversation.temperature;
    if (conversation.top_p !== undefined && conversation.top_p !== null) params.top_p = conversation.top_p;
    if (conversation.min_p !== undefined && conversation.min_p !== null) params.min_p = conversation.min_p;
    if (conversation.seed !== undefined && conversation.seed !== null) params.seed = conversation.seed;

    let finalChatMessages = [...chatMessages];

    if (conversation.systemPrompt && conversation.systemPrompt.trim() !== '') {
      let processedSystemPrompt = conversation.systemPrompt;
      processedSystemPrompt = processedSystemPrompt.replace(/{{CURRENT_DATE}}/g, new Date().toISOString().split('T')[0]);
      // Assuming user.email is available. If profile has a display name, that could be used.
      processedSystemPrompt = processedSystemPrompt.replace(/{{USER_NAME}}/g, user.email || 'User');

      if (processedSystemPrompt.trim() !== '') {
        finalChatMessages.unshift({ role: 'system', content: processedSystemPrompt });
      }
    }
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let assistantResponse = '';

          // Use finalChatMessages which may include the processed system prompt
          const response = await openRouter.createChatCompletion(
            model,
            finalChatMessages,
            (chunk: string) => {
              assistantResponse += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            },
            request.headers.get('origin') || undefined,
            params
          );

          await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              role: 'assistant',
              content: assistantResponse,
            });

          // Generate title for new conversations after first response
          if (messages.length === 0) {
            try {
              const titleResponse = await fetch(`${request.headers.get('origin') || 'http://localhost:3000'}/api/generate-title`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': request.headers.get('Authorization') || '',
                  'Cookie': request.headers.get('Cookie') || '',
                },
                body: JSON.stringify({
                  userMessage: message,
                  assistantResponse,
                  conversationId: conversation.id,
                }),
              });
              
              if (titleResponse.ok) {
                const titleData = await titleResponse.json();
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  titleUpdate: true, 
                  title: titleData.title,
                  conversationId: conversation.id 
                })}\n\n`));
              }
            } catch (titleError) {
              console.error('Failed to generate title:', titleError);
              // Don't fail the main request if title generation fails
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: conversation.id })}\n\n`));
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
            await supabase
              .from('messages')
              .insert({
                conversation_id: conversation.id,
                role: 'assistant',
                content: `❌ **Error**: ${errorMessage}`,
              });
          } catch (dbError) {
            console.error('Failed to save error message:', dbError);
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            error: errorMessage,
            errorContent: `❌ **Error**: ${errorMessage}`
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
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 