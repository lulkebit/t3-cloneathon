import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { TitleGenerator } from '@/lib/titleGenerator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userMessage, assistantResponse, conversationId } = await request.json();

    if (!userMessage || !conversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's OpenRouter API key
    const { data: profile } = await supabase
      .from('profiles')
      .select('openrouter_api_key')
      .eq('id', user.id)
      .single();

    if (!profile?.openrouter_api_key) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 400 });
    }

    // Generate the title
    const titleGenerator = new TitleGenerator(profile.openrouter_api_key);
    const generatedTitle = await titleGenerator.generateTitle(userMessage, assistantResponse);

    // Update the conversation with the new title
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({ title: generatedTitle })
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update conversation title:', updateError);
      return NextResponse.json({ error: 'Failed to update title' }, { status: 500 });
    }

    return NextResponse.json({ 
      title: generatedTitle,
      conversation: updatedConversation 
    });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 