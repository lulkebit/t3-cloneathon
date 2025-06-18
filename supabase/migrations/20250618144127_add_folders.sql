-- Create folders table
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add folder_id to conversations table
ALTER TABLE conversations
ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Optional: Add an index for folder_id on conversations table
CREATE INDEX idx_conversations_folder_id ON conversations(folder_id);

-- Enable RLS for folders table
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Policies for folders table
CREATE POLICY "Users can view their own folders"
ON folders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
ON folders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON folders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON folders
FOR DELETE
USING (auth.uid() = user_id);

-- Update existing RLS policies for conversations if needed to account for folders,
-- though direct folder access is handled by folder policies.
-- For example, if you want to restrict queries on conversations based on folder access,
-- that would be more complex and might involve functions or join security.
-- For now, conversation policies typically rely on user_id matching.

-- Trigger to update 'updated_at' timestamp on folder update
CREATE OR REPLACE FUNCTION public.handle_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_folder_updated_at
BEFORE UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION public.handle_folder_updated_at();

-- Trigger to update 'updated_at' timestamp on conversation update (if not already present)
-- This is a good general practice for tables. Assuming it might not exist or might need an update.
CREATE OR REPLACE FUNCTION public.handle_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_conversation_updated_at' AND tgrelid = 'conversations'::regclass
    ) THEN
        CREATE TRIGGER on_conversation_updated_at
        BEFORE UPDATE ON conversations
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_conversation_updated_at();
    END IF;
END $$;
