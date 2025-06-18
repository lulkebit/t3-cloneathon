-- Alter conversations table to add is_pinned and is_archived fields
ALTER TABLE conversations
ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Add indexes for better query performance on these new boolean fields
CREATE INDEX idx_conversations_is_pinned ON conversations(is_pinned DESC); -- DESC for pinned items first
CREATE INDEX idx_conversations_is_archived ON conversations(is_archived ASC); -- ASC for non-archived items first

-- RLS policies for conversations table should already exist and
-- generally restrict access based on user_id.
-- Pinning and archiving are modifications of a user's own conversation,
-- so existing update policies should cover this as long as they check (auth.uid() = user_id).
-- No new RLS policies are strictly needed for these columns themselves,
-- but ensure your existing policies are robust.

-- Example of how an update policy might look (if you need to create or adjust):
-- CREATE POLICY "Users can update their own conversations"
-- ON conversations
-- FOR UPDATE
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);

-- The existing trigger for 'updated_at' on the conversations table
-- (assumed to be 'on_conversation_updated_at' from previous migration)
-- will automatically handle updates to 'updated_at' when these new fields are changed.
-- If it doesn't exist, you would add it:
--
-- CREATE OR REPLACE FUNCTION public.handle_conversation_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER on_conversation_updated_at
-- BEFORE UPDATE ON conversations
-- FOR EACH ROW
-- EXECUTE FUNCTION public.handle_conversation_updated_at();
--
-- (The DO $$ block from previous migration ensures it's created if not exists, so it should be fine)

COMMENT ON COLUMN conversations.is_pinned IS 'Indicates if the conversation is pinned by the user.';
COMMENT ON COLUMN conversations.is_archived IS 'Indicates if the conversation is archived by the user.';
