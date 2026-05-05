-- Profiler (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('job_seeker', 'recruiter')),
  full_name TEXT,
  avatar_url TEXT,
  headline TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'user_type', 'job_seeker'),
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Jobbannonser
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  skills_required TEXT[],
  location TEXT,
  work_type TEXT CHECK (work_type IN ('remote', 'hybrid', 'on-site')),
  salary_min INTEGER,
  salary_max INTEGER,
  currency TEXT DEFAULT 'SEK',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CV-data
CREATE TABLE cv_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  cv_url TEXT,
  cv_text TEXT,
  skills TEXT[],
  experience_years INTEGER,
  education TEXT,
  ai_summary TEXT,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ansökningar
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  ai_summary TEXT,
  skill_gaps TEXT[],
  interview_questions TEXT[],
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','shortlisted','accepted','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, seeker_id)
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs: everyone can read active jobs, recruiters can CRUD own
CREATE POLICY "Active jobs are viewable by everyone" ON jobs FOR SELECT USING (status = 'active' OR recruiter_id = auth.uid());
CREATE POLICY "Recruiters can insert jobs" ON jobs FOR INSERT WITH CHECK (recruiter_id = auth.uid());
CREATE POLICY "Recruiters can update own jobs" ON jobs FOR UPDATE USING (recruiter_id = auth.uid());
CREATE POLICY "Recruiters can delete own jobs" ON jobs FOR DELETE USING (recruiter_id = auth.uid());

-- CV profiles: users can CRUD own
CREATE POLICY "Users can view own cv_profile" ON cv_profiles FOR SELECT USING (seeker_id = auth.uid());
CREATE POLICY "Users can insert own cv_profile" ON cv_profiles FOR INSERT WITH CHECK (seeker_id = auth.uid());
CREATE POLICY "Users can update own cv_profile" ON cv_profiles FOR UPDATE USING (seeker_id = auth.uid());

-- Applications: seekers can CRUD own, recruiters can read+update for their jobs
CREATE POLICY "Seekers can view own applications" ON applications FOR SELECT USING (seeker_id = auth.uid());
CREATE POLICY "Seekers can insert own applications" ON applications FOR INSERT WITH CHECK (seeker_id = auth.uid());
CREATE POLICY "Recruiters can view applications for their jobs" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
);
CREATE POLICY "Recruiters can update application status" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
);
