import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { OpenRouterService } from '@/lib/openrouter';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, openrouter_api_key, created_at, updated_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      openrouter_api_key,
      default_temperature,
      default_top_p,
      default_min_p,
      default_seed,
      default_system_prompt
    } = await request.json();

    if (!openrouter_api_key) { // Still require API key for any profile update for now
      return NextResponse.json({ error: 'OpenRouter API key is required to update settings' }, { status: 400 });
    }

    // Validate API key if provided
    if (openrouter_api_key) {
      const openRouter = new OpenRouterService(openrouter_api_key);
      const isValid = await openRouter.validateApiKey();
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid OpenRouter API key' }, { status: 400 });
      }
    }

    const updateData: any = {
      id: user.id,
      email: user.email, // Ensure email is always set/updated
      updated_at: new Date().toISOString(),
    };

    if (openrouter_api_key !== undefined) updateData.openrouter_api_key = openrouter_api_key;
    if (default_temperature !== undefined) updateData.default_temperature = default_temperature;
    if (default_top_p !== undefined) updateData.default_top_p = default_top_p;
    if (default_min_p !== undefined) updateData.default_min_p = default_min_p;
    if (default_seed !== undefined) updateData.default_seed = default_seed;
    if (default_system_prompt !== undefined) updateData.default_system_prompt = default_system_prompt;

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      console.error('Failed to update profile:', error);
      return NextResponse.json({ error: 'Failed to update profile', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
} 