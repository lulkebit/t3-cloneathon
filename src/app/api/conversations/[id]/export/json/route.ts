import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { Message } from '@/types/chat'; // Assuming Message type might be needed

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // conversationId is 'id' here
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    // Fetch conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*') // Select all conversation fields
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Fetch messages for the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        role,
        content,
        created_at,
        attachments (
          filename,
          file_type,
          file_size,
          file_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages for export:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages for conversation', details: messagesError.message }, { status: 500 });
    }

    // Construct the JSON object
    const exportData = {
      conversation_id: conversation.id,
      title: conversation.title,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      model: conversation.model,
      folder_id: conversation.folder_id,
      is_pinned: conversation.is_pinned,
      is_archived: conversation.is_archived,
      temperature: conversation.temperature,
      top_p: conversation.top_p,
      min_p: conversation.min_p,
      seed: conversation.seed,
      system_prompt: conversation.systemPrompt,
      messages: messages || [],
    };

    const filename = `conversation_${conversation.id}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Error in GET /api/conversations/[id]/export/json:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
