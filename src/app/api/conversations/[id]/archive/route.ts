import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// PUT toggle is_archived for a conversation
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

    // First, fetch the current is_archived status
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, user_id, is_archived')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingConversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    const newArchivedStatus = !existingConversation.is_archived;

    // When archiving, also unpin it. When unarchiving, it remains unpinned.
    const updatePayload: { is_archived: boolean; updated_at: string; is_pinned?: boolean } = {
      is_archived: newArchivedStatus,
      updated_at: new Date().toISOString(),
    };

    if (newArchivedStatus) { // If archiving, set is_pinned to false
      updatePayload.is_pinned = false;
    }

    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update(updatePayload)
      .eq('id', conversationId)
      .select() // Select all fields to return the full updated conversation
      .single();

    if (updateError) {
      console.error('Error updating archive status:', updateError);
      return NextResponse.json({ error: 'Failed to update archive status', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedConversation);
  } catch (error: any) {
    console.error('Error in PUT /api/conversations/[id]/archive:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
