import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { Conversation } from '@/types/chat';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const { temperature, top_p, min_p, seed, systemPrompt } = await request.json();

    // Validate that the conversation exists and belongs to the user
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingConversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Prepare update data, only including fields that are actually provided
    const updateData: Partial<Conversation> = {};
    if (temperature !== undefined) updateData.temperature = temperature;
    if (top_p !== undefined) updateData.top_p = top_p;
    if (min_p !== undefined) updateData.min_p = min_p;
    if (seed !== undefined) updateData.seed = seed;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();


    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating conversation settings:', updateError);
      return NextResponse.json({ error: 'Failed to update conversation settings', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedConversation);

  } catch (error: any) {
    console.error('Error in settings route:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
