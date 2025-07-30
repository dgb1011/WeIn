# 🚀 Supabase Setup Guide for BrainBased EMDR

## 📋 **Step-by-Step Setup Instructions**

### **Step 1: Create Supabase Account**

1. **Visit [supabase.com](https://supabase.com)**
2. **Click "Start your project"**
3. **Sign up with GitHub, Google, or email**
4. **Verify your email address**

### **Step 2: Create New Project**

1. **Click "New Project"**
2. **Choose your organization**
3. **Project Details:**
   - **Name**: `brainbased-emdr-platform`
   - **Database Password**: `emdr-secure-password-2024`
   - **Region**: Choose closest to your users (US East for US)
4. **Click "Create new project"**
5. **Wait for project to be ready (2-3 minutes)**

### **Step 3: Get Connection Details**

1. **Go to Settings → API**
2. **Copy the following values:**
   - **Project URL** (starts with `https://`)
   - **Anon public key** (starts with `eyJ`)

### **Step 4: Update Environment Variables**

Replace the placeholders in `.env.local`:

```env
# Database (for Prisma)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Client
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### **Step 5: Configure Database Schema**

1. **Go to SQL Editor in Supabase Dashboard**
2. **Run the following SQL to create the schema:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_type AS ENUM ('STUDENT', 'CONSULTANT', 'ADMIN');
CREATE TYPE student_status AS ENUM ('ENROLLED', 'CONSULTATION_ACCESS_GRANTED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'READY_FOR_CERTIFICATION', 'CERTIFIED', 'SUSPENDED', 'WITHDRAWN');
CREATE TYPE session_status AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED', 'TECHNICAL_ISSUE');
CREATE TYPE document_type AS ENUM ('CONSULTATION_LOG', 'EVALUATION_FORM', 'REFLECTION_PAPER', 'CASE_STUDY', 'ADDITIONAL_REQUIREMENT', 'MAKEUP_DOCUMENTATION');
CREATE TYPE review_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION', 'AUTO_APPROVED');
CREATE TYPE availability_type AS ENUM ('RECURRING_WEEKLY', 'ONE_TIME', 'BLOCKED_TIME', 'HOLIDAY_BLOCK');
CREATE TYPE session_type AS ENUM ('VIDEO_CONSULTATION', 'IN_PERSON', 'PHONE', 'MAKEUP_SESSION');

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  user_type user_type NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  kajabi_user_id VARCHAR(255) UNIQUE NOT NULL,
  course_completion_date TIMESTAMP NOT NULL,
  total_verified_hours DECIMAL(5,2) DEFAULT 0,
  total_video_hours DECIMAL(5,2) DEFAULT 0,
  certification_status student_status DEFAULT 'IN_PROGRESS',
  preferred_session_length INTEGER DEFAULT 60,
  consultation_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create consultants table
CREATE TABLE consultants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(8,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create admins table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'admin',
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create consultation_sessions table
CREATE TABLE consultation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  consultant_id UUID REFERENCES consultants(id),
  scheduled_start TIMESTAMP NOT NULL,
  scheduled_end TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  actual_end TIMESTAMP,
  status session_status DEFAULT 'SCHEDULED',
  session_type session_type DEFAULT 'VIDEO_CONSULTATION',
  video_session_id UUID,
  student_verified_at TIMESTAMP,
  consultant_verified_at TIMESTAMP,
  student_notes TEXT,
  consultant_notes TEXT,
  session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 5),
  technical_issues_reported BOOLEAN DEFAULT false,
  makeup_session_for UUID REFERENCES consultation_sessions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create video_sessions table
CREATE TABLE video_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_session_id UUID REFERENCES consultation_sessions(id),
  room_id VARCHAR(255) UNIQUE NOT NULL,
  recording_enabled BOOLEAN DEFAULT true,
  recording_url VARCHAR(500),
  recording_duration_seconds INTEGER,
  video_quality VARCHAR(20) DEFAULT '720p',
  connection_quality_avg DECIMAL(3,2),
  bandwidth_usage_mb DECIMAL(10,2),
  technical_issues JSONB DEFAULT '[]',
  session_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create video_participants table
CREATE TABLE video_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_session_id UUID REFERENCES video_sessions(id),
  user_id UUID NOT NULL,
  user_type user_type NOT NULL,
  join_time TIMESTAMP NOT NULL,
  leave_time TIMESTAMP,
  total_duration_seconds INTEGER,
  audio_quality_avg DECIMAL(3,2),
  video_quality_avg DECIMAL(3,2),
  screen_share_duration_seconds INTEGER DEFAULT 0,
  chat_messages_count INTEGER DEFAULT 0,
  connection_interruptions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create consultant_availability table
CREATE TABLE consultant_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID REFERENCES consultants(id) ON DELETE CASCADE,
  availability_type availability_type NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_sessions INTEGER DEFAULT 1,
  buffer_minutes INTEGER DEFAULT 15,
  is_available BOOLEAN DEFAULT true,
  booking_window_days INTEGER DEFAULT 30,
  minimum_notice_hours INTEGER DEFAULT 24,
  auto_approve BOOLEAN DEFAULT true,
  timezone VARCHAR(50) NOT NULL,
  recurring_pattern JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create student_documents table
CREATE TABLE student_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  extracted_text TEXT,
  upload_timestamp TIMESTAMP DEFAULT NOW(),
  review_status review_status DEFAULT 'PENDING',
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  version_number INTEGER DEFAULT 1,
  replaces_document_id UUID REFERENCES student_documents(id),
  auto_validation_score DECIMAL(3,2),
  requires_manual_review BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create certifications table
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  issued_date DATE NOT NULL,
  certification_type VARCHAR(100) DEFAULT 'EMDR_Basic',
  total_consultation_hours DECIMAL(5,2) NOT NULL,
  total_video_hours DECIMAL(5,2) NOT NULL,
  consultant_count INTEGER NOT NULL,
  document_verification_complete BOOLEAN NOT NULL,
  certificate_pdf_path VARCHAR(500),
  certificate_pdf_size_bytes INTEGER,
  verification_code VARCHAR(100) UNIQUE NOT NULL,
  qr_code_data TEXT,
  delivery_email_sent_at TIMESTAMP,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT false,
  revocation_reason TEXT,
  revoked_at TIMESTAMP,
  kajabi_tags_updated BOOLEAN DEFAULT false,
  directory_process_initiated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create consultant_payments table
CREATE TABLE consultant_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID REFERENCES consultants(id) ON DELETE CASCADE,
  payment_period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  total_hours DECIMAL(5,2) NOT NULL,
  hourly_rate DECIMAL(8,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'PENDING',
  payment_date TIMESTAMP,
  session_breakdown JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create session_history table
CREATE TABLE session_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  session_date TIMESTAMP NOT NULL,
  session_duration INTEGER NOT NULL, -- in minutes
  consultant_id UUID REFERENCES consultants(id),
  session_type session_type NOT NULL,
  status session_status NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create system_health_metrics table
CREATE TABLE system_health_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  metric_unit VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW(),
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_consultants_user_id ON consultants(user_id);
CREATE INDEX idx_consultation_sessions_student_id ON consultation_sessions(student_id);
CREATE INDEX idx_consultation_sessions_consultant_id ON consultation_sessions(consultant_id);
CREATE INDEX idx_consultation_sessions_status ON consultation_sessions(status);
CREATE INDEX idx_video_sessions_consultation_id ON video_sessions(consultation_session_id);
CREATE INDEX idx_consultant_availability_consultant_id ON consultant_availability(consultant_id);
CREATE INDEX idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX idx_certifications_student_id ON certifications(student_id);
CREATE INDEX idx_consultant_payments_consultant_id ON consultant_payments(consultant_id);
CREATE INDEX idx_session_history_student_id ON session_history(student_id);
```

### **Step 6: Configure Row Level Security (RLS)**

1. **Go to Authentication → Policies**
2. **Enable RLS on all tables**
3. **Create policies for data access:**

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
FOR SELECT USING (auth.uid()::text = id::text);

-- Students can view their own data
CREATE POLICY "Students can view own data" ON students
FOR SELECT USING (auth.uid()::text = user_id::text);

-- Consultants can view their own data
CREATE POLICY "Consultants can view own data" ON consultants
FOR SELECT USING (auth.uid()::text = user_id::text);

-- Admins can view all data
CREATE POLICY "Admins can view all data" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = users.id
  )
);
```

### **Step 7: Set up Storage Buckets**

1. **Go to Storage → Create bucket**
2. **Create buckets:**
   - `video-recordings` (for session recordings)
   - `documents` (for uploaded documents)
   - `certificates` (for generated certificates)

### **Step 8: Configure Authentication**

1. **Go to Authentication → Settings**
2. **Configure:**
   - **Site URL**: `http://localhost:3000` (development)
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
   - **Enable email confirmations**: Yes
   - **Enable phone confirmations**: No

### **Step 9: Test the Setup**

1. **Run database migrations:**
```bash
npx prisma migrate dev --name supabase-setup
```

2. **Seed the database:**
```bash
npm run db:seed
```

3. **Test the connection:**
```bash
npm run dev
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Connection Error**: Check your DATABASE_URL format
2. **RLS Policy Error**: Ensure policies are correctly configured
3. **Migration Error**: Check if all extensions are enabled
4. **Authentication Error**: Verify redirect URLs

### **Support Resources:**
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)
- [Community Discord](https://discord.supabase.com)

## 🎯 **Next Steps After Setup**

1. **Test authentication flow**
2. **Verify real-time subscriptions**
3. **Test file uploads**
4. **Configure monitoring**
5. **Set up backup schedules**

---

**Your Supabase setup is now ready for the BrainBased EMDR platform! 🚀** 