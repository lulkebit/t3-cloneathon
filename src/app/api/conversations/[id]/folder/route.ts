import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// PUT update a conversation's folder_id
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
    const { folder_id } = await request.json(); // folder_id can be null to remove from folder

    if (folder_id !== null && (typeof folder_id !== 'string' || folder_id.trim().length === 0)) {
      // Allow null, but if it's not null, it must be a valid string UUID
      return NextResponse.json({ error: 'Valid folder_id or null is required' }, { status: 400 });
    }

    // Verify the conversation belongs to the user
    const { data: existingConversation, error: convFetchError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convFetchError || !existingConversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // If folder_id is provided, verify the folder also belongs to the user
    if (folder_id) {
      const { data: existingFolder, error: folderFetchError } = await supabase
        .from('folders')
        .select('id')
        .eq('id', folder_id)
        .eq('user_id', user.id)
        .single();

      if (folderFetchError || !existingFolder) {
        return NextResponse.json({ error: 'Folder not found or access denied for the target folder' }, { status: 404 });
      }
    }

    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({ folder_id: folder_id, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating conversation folder:', updateError);
      return NextResponse.json({ error: 'Failed to update conversation folder', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedConversation);
  } catch (error: any) {
    console.error('Error in PUT /api/conversations/[id]/folder:', error);
     if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
