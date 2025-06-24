# Local Testing Guide - T3 Chat Clone

This guide will walk you through setting up the T3 Chat Clone application for local development and testing using the hosted Supabase service.

## Prerequisites

Before you begin, make sure you have the following installed on your system:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **pnpm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## 1. Clone and Setup the Project

### 1.1 Clone the Repository

```bash
git clone https://github.com/lulkebit/t3-cloneathon.git
cd t3-cloneathon
```

### 1.2 Install Dependencies

```bash
npm install
```

or if you prefer pnpm:

```bash
pnpm install
```

## 2. Supabase Configuration

### 2.1 Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a free account
2. Click "New Project"
3. Choose your organization (or create a new one)
4. Fill in your project details:
   - **Name**: `t3-chat-clone` (or any name you prefer)
   - **Database Password**: Create a strong password and save it securely
   - **Region**: Choose the region closest to you
5. Click "Create new project"
6. Wait for the project to be initialized (this can take a few minutes)

### 2.2 Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

### 2.3 Configure Environment Variables

1. In the project root, copy the environment example file:

   ```bash
   cp env.example .env.local
   ```

2. Open `.env.local` and replace the placeholder values:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 3. Database Setup

### 3.1 Set Up Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. In the **Site URL** field, add: `http://localhost:3000`
3. In **Redirect URLs**, add: `http://localhost:3000/auth/callback`
4. Enable the authentication providers you want to use:
   - **Email**: Already enabled by default
   - **Google OAuth** (optional):
     - Go to **Authentication** → **Providers** → **Google**
     - Enable Google provider
     - Add your Google OAuth credentials (requires Google Cloud Console setup)
   - **GitHub OAuth** (optional):
     - Go to **Authentication** → **Providers** → **GitHub**
     - Enable GitHub provider
     - Add your GitHub OAuth app credentials

### 3.2 Create Database Tables

In your Supabase dashboard, go to **SQL Editor** and run the following SQL commands to create the required tables:

```sql
-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  openrouter_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create attachments table
CREATE TABLE attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create message quality metrics table
CREATE TABLE message_quality_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  response_time INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost DECIMAL(10,6),
  quality_score INTEGER,
  coherence_score INTEGER,
  relevance_score INTEGER,
  completeness_score INTEGER,
  clarity_score INTEGER,
  word_count INTEGER,
  sentence_count INTEGER,
  average_sentence_length DECIMAL(5,2),
  readability_score DECIMAL(5,2),
  temperature DECIMAL(3,2),
  top_p DECIMAL(3,2),
  finish_reason TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages from own conversations" ON messages FOR SELECT
USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

CREATE POLICY "Users can create messages in own conversations" ON messages FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

CREATE POLICY "Users can update messages in own conversations" ON messages FOR UPDATE
USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

CREATE POLICY "Users can delete messages from own conversations" ON messages FOR DELETE
USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

-- Similar policies for attachments and quality metrics
CREATE POLICY "Users can view attachments from own messages" ON attachments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM messages
  JOIN conversations ON conversations.id = messages.conversation_id
  WHERE messages.id = attachments.message_id AND conversations.user_id = auth.uid()
));

CREATE POLICY "Users can create attachments for own messages" ON attachments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM messages
  JOIN conversations ON conversations.id = messages.conversation_id
  WHERE messages.id = attachments.message_id AND conversations.user_id = auth.uid()
));

CREATE POLICY "Users can view quality metrics from own messages" ON message_quality_metrics FOR SELECT
USING (EXISTS (
  SELECT 1 FROM messages
  JOIN conversations ON conversations.id = messages.conversation_id
  WHERE messages.id = message_quality_metrics.message_id AND conversations.user_id = auth.uid()
));

CREATE POLICY "Users can create quality metrics for own messages" ON message_quality_metrics FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM messages
  JOIN conversations ON conversations.id = messages.conversation_id
  WHERE messages.id = message_quality_metrics.message_id AND conversations.user_id = auth.uid()
));
```

### 3.3 Set Up Storage (for File Attachments)

1. In your Supabase dashboard, go to **Storage**
2. Click **Create Bucket**
3. Name the bucket: `attachments`
4. Make it **Public** (check the public option)
5. Click **Create bucket**

6. Set up storage policies by going to **Storage** → **Policies** → **attachments**:

   ```sql
   -- Policy for SELECT (viewing files)
   CREATE POLICY "Users can view own attachments" ON storage.objects FOR SELECT
   USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- Policy for INSERT (uploading files)
   CREATE POLICY "Users can upload own attachments" ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

   -- Policy for DELETE (deleting files)
   CREATE POLICY "Users can delete own attachments" ON storage.objects FOR DELETE
   USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

### 3.4 Create Profile Trigger

To automatically create a profile when a user signs up, add this trigger:

```sql
-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles(id, email)
  VALUES(NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 4. Get OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Go to your **API Keys** section
4. Create a new API key
5. Copy the API key (you'll need this when testing the app)

## 5. Run the Application

### 5.1 Start the Development Server

```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

### 5.2 Verify the Setup

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the login page
3. Try creating a new account with your email
4. Check your email for the confirmation link
5. After confirming, you should be able to log in

## 6. Common Issues and Troubleshooting

### 6.1 Environment Variables Not Loading

- Ensure your `.env.local` file is in the project root
- Restart the development server after changing environment variables
- Check that variable names match exactly (including `NEXT_PUBLIC_` prefix)

### 6.2 Supabase Connection Issues

- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active and not paused
- Ensure RLS policies are properly configured

### 6.3 Authentication Issues

- Verify the Site URL and Redirect URLs in Supabase settings
- Check email spam folder for verification emails
- Ensure the auth callback route is working: `http://localhost:3000/auth/callback`

### 6.4 Database Errors

- Check that all tables were created successfully
- Verify Row Level Security policies are in place
- Ensure the profile trigger is working

### 6.5 File Upload Issues

- Verify the `attachments` storage bucket exists and is public
- Check storage policies are correctly configured
- Ensure file size limits are appropriate

## 7. Development Tips

### 7.1 Code Formatting

The project includes Prettier configuration. Format your code with:

```bash
npm run format
```

### 7.2 Database Inspection

Use the Supabase dashboard to:

- View table data in the **Table Editor**
- Monitor real-time subscriptions
- Check authentication logs
- Review storage usage

### 7.3 Debugging

- Check browser console for client-side errors
- Monitor the terminal running `npm run dev` for server-side errors
- Use Supabase dashboard logs for database-related issues

### 7.4 Performance Testing

- Test with multiple models simultaneously in consensus mode
- Upload various file types and sizes
- Create multiple conversations to test pagination
- Test on different devices and screen sizes

## 8. Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Support

If you encounter issues during setup:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed correctly
3. Ensure all environment variables are set properly
4. Review Supabase dashboard for any configuration issues

For additional questions or issues not covered in this guide, please [open an issue](../../issues/new) in this repository.

Happy testing! 🚀
