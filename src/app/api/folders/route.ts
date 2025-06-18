import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET all folders for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
      return NextResponse.json({ error: 'Failed to fetch folders', details: error.message }, { status: 500 });
    }

    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('Error in GET /api/folders:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// POST a new folder for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const { data: newFolder, error } = await supabase
      .from('folders')
      .insert({
        user_id: user.id,
        name: name.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      // Check for unique constraint violation if folder names should be unique per user
      if (error.code === '23505') { // unique_violation
        return NextResponse.json({ error: 'A folder with this name already exists.', details: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create folder', details: error.message }, { status: 500 });
    }

    return NextResponse.json(newFolder, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/folders:', error);
    if (error.name === 'SyntaxError') { // JSON parsing error
        return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
