import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// PUT toggle is_pinned for a conversation
export async function PUT(
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

    // First, fetch the current is_pinned status
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, user_id, is_pinned')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingConversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    const newPinnedStatus = !existingConversation.is_pinned;

    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({ is_pinned: newPinnedStatus, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select() // Select all fields to return the full updated conversation
      .single();

    if (updateError) {
      console.error('Error updating pin status:', updateError);
      return NextResponse.json({ error: 'Failed to update pin status', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedConversation);
  } catch (error: any) {
    console.error('Error in PUT /api/conversations/[id]/pin:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
