import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// PUT update a folder's name
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

    const folderId = params.id;
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Verify the folder belongs to the user before updating
    const { data: existingFolder, error: fetchError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingFolder) {
      return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 404 });
    }

    const { data: updatedFolder, error: updateError } = await supabase
      .from('folders')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating folder:', updateError);
       if (updateError.code === '23505') { // unique_violation, if you have unique constraints on name per user
        return NextResponse.json({ error: 'A folder with this name already exists.', details: updateError.message }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update folder', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedFolder);
  } catch (error: any) {
    console.error('Error in PUT /api/folders/[id]:', error);
    if (error.name === 'SyntaxError') {
        return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// DELETE a folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const folderId = params.id;

    // Verify the folder belongs to the user before deleting
    const { data: existingFolder, error: fetchError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingFolder) {
      return NextResponse.json({ error: 'Folder not found or access denied' }, { status: 404 });
    }

    // Supabase ON DELETE SET NULL will handle conversations.folder_id automatically.
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (deleteError) {
      console.error('Error deleting folder:', deleteError);
      return NextResponse.json({ error: 'Failed to delete folder', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Folder deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/folders/[id]:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
