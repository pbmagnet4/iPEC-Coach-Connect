-- Messaging System Schema for iPEC Coach Connect
-- Real-time messaging with conversations, messages, and notifications

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participants TEXT[] NOT NULL DEFAULT '{}',
    last_message_id UUID NULL,
    last_message_at TIMESTAMP WITH TIME ZONE NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
    file_url TEXT NULL,
    file_name TEXT NULL,
    file_size INTEGER NULL,
    read_at TIMESTAMP WITH TIME ZONE NULL,
    edited_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Create typing indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Create user presence table for online/offline status
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations (last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions (message_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators (conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON user_presence (is_online);

-- Add foreign key constraint for last_message_id (after messages table is created)
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_last_message 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_typing_indicators_updated_at BEFORE UPDATE ON typing_indicators FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in" 
ON conversations FOR SELECT 
USING (auth.uid()::text = ANY(participants));

CREATE POLICY "Users can create conversations they participate in" 
ON conversations FOR INSERT 
WITH CHECK (auth.uid()::text = ANY(participants));

CREATE POLICY "Users can update conversations they participate in" 
ON conversations FOR UPDATE 
USING (auth.uid()::text = ANY(participants));

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" 
ON messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND auth.uid()::text = ANY(conversations.participants)
    )
);

CREATE POLICY "Users can create messages in their conversations" 
ON messages FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND auth.uid()::text = ANY(conversations.participants)
    )
);

CREATE POLICY "Users can update their own messages" 
ON messages FOR UPDATE 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS Policies for message reactions
CREATE POLICY "Users can view reactions on messages they can see" 
ON message_reactions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM messages m 
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = message_reactions.message_id 
        AND auth.uid()::text = ANY(c.participants)
    )
);

CREATE POLICY "Users can create reactions on messages they can see" 
ON message_reactions FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM messages m 
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.id = message_reactions.message_id 
        AND auth.uid()::text = ANY(c.participants)
    )
);

CREATE POLICY "Users can delete their own reactions" 
ON message_reactions FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for typing indicators
CREATE POLICY "Users can view typing indicators in their conversations" 
ON typing_indicators FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = typing_indicators.conversation_id 
        AND auth.uid()::text = ANY(conversations.participants)
    )
);

CREATE POLICY "Users can manage their own typing indicators" 
ON typing_indicators FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for user presence
CREATE POLICY "Anyone can view user presence" 
ON user_presence FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own presence" 
ON user_presence FOR ALL 
USING (auth.uid() = user_id);

-- Create functions for message management

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM messages 
        WHERE receiver_id = user_uuid 
        AND read_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation unread count
CREATE OR REPLACE FUNCTION get_conversation_unread_count(conversation_uuid UUID, user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM messages 
        WHERE conversation_id = conversation_uuid 
        AND receiver_id = user_uuid 
        AND read_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(user_uuid UUID, online_status BOOLEAN)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_presence (user_id, is_online, last_seen)
    VALUES (user_uuid, online_status, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET 
        is_online = online_status,
        last_seen = CASE WHEN online_status THEN user_presence.last_seen ELSE NOW() END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS VOID AS $$
BEGIN
    DELETE FROM typing_indicators 
    WHERE updated_at < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Create a function to be called every 30 seconds to clean up typing indicators
SELECT cron.schedule('cleanup-typing-indicators', '*/30 * * * * *', 'SELECT cleanup_old_typing_indicators();');

-- Create storage bucket for message files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message-files', 'message-files', false) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message files
CREATE POLICY "Users can upload message files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'message-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view message files in their conversations" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'message-files' AND 
    auth.role() = 'authenticated' AND
    -- Allow access to files that belong to conversations the user participates in
    EXISTS (
        SELECT 1 FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE m.file_url LIKE '%' || storage.objects.name || '%'
        AND auth.uid()::text = ANY(c.participants)
    )
);

CREATE POLICY "Users can delete their own message files" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'message-files' AND 
    auth.role() = 'authenticated' AND
    EXISTS (
        SELECT 1 FROM messages m
        WHERE m.file_url LIKE '%' || storage.objects.name || '%'
        AND m.sender_id = auth.uid()
    )
);

-- Add comment documentation
COMMENT ON TABLE conversations IS 'Stores messaging conversations between users';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON TABLE message_reactions IS 'Stores emoji reactions to messages';
COMMENT ON TABLE typing_indicators IS 'Stores real-time typing status for conversations';
COMMENT ON TABLE user_presence IS 'Stores online/offline status for users';

COMMENT ON COLUMN conversations.participants IS 'Array of user IDs participating in the conversation';
COMMENT ON COLUMN messages.message_type IS 'Type of message: text, file, image, or system';
COMMENT ON COLUMN messages.file_url IS 'URL to uploaded file if message_type is file or image';
COMMENT ON COLUMN user_presence.is_online IS 'Current online status of the user';
COMMENT ON COLUMN user_presence.last_seen IS 'Timestamp when user was last seen online';