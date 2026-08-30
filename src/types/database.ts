export type UserType = 'job_seeker' | 'recruiter'
export type WorkType = 'remote' | 'hybrid' | 'on-site'
export type JobStatus = 'active' | 'paused' | 'closed'
export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected'
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+'

export interface Profile {
  id: string
  user_type: UserType
  full_name: string | null
  avatar_url: string | null
  headline: string | null
  bio: string | null
  location: string | null
  website: string | null
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface Testimonial {
  name: string
  role: string
  quote: string
}

export interface CompanyProfile {
  id: string
  recruiter_id: string
  company_name: string
  logo_url: string | null
  industry: string | null
  description: string | null
  website: string | null
  location: string | null
  size: CompanySize | null
  brand_color: string | null
  cover_image_url: string | null
  testimonials: Testimonial[]
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  recruiter_id: string
  title: string
  description: string
  requirements: string | null
  skills_required: string[] | null
  experience_level: string | null
  location: string | null
  work_type: WorkType | null
  salary_min: number | null
  salary_max: number | null
  currency: string
  status: JobStatus
  deadline: string | null
  views: number
  created_at: string
  updated_at: string
}

export interface CvProfile {
  id: string
  seeker_id: string
  cv_url: string | null
  cv_text: string | null
  skills: string[] | null
  experience_years: number | null
  education: string | null
  languages: string[] | null
  ai_summary: string | null
  last_analyzed_at: string | null
  created_at: string
}

export interface MatchCategoryScores {
  kompetens: number
  erfarenhet: number
  utbildning: number
  kultur_mjuka_kompetenser: number
}

export interface MatchBreakdown {
  category_scores: MatchCategoryScores
  category_reasoning: Record<keyof MatchCategoryScores, string>
  top_positive_factors: string[]
  top_gaps: string[]
}

export interface Application {
  id: string
  job_id: string
  seeker_id: string
  match_score: number | null
  match_breakdown: MatchBreakdown | null
  ai_summary: string | null
  skill_gaps: string[] | null
  interview_questions: string[] | null
  cover_letter: string | null
  status: ApplicationStatus
  created_at: string
  updated_at: string
}

export interface SavedJob {
  id: string
  seeker_id: string
  job_id: string
  created_at: string
}

export interface Shortlist {
  id: string
  recruiter_id: string
  application_id: string
  note: string | null
  created_at: string
}

export interface Conversation {
  id: string
  recruiter_id: string
  seeker_id: string
  job_id: string | null
  last_message_at: string | null
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

export type NotificationType = 'new_application' | 'status_change' | 'new_job_match' | 'interview_invite' | 'message'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  href: string | null
  read: boolean
  created_at: string
}

export interface CandidateNote {
  id: string
  recruiter_id: string
  seeker_id: string
  note: string
  tags: string[]
  created_at: string
  updated_at: string
}

export type InterviewStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface InterviewSchedule {
  id: string
  application_id: string
  recruiter_id: string
  seeker_id: string
  proposed_times: string[]
  confirmed_time: string | null
  location: string | null
  meeting_link: string | null
  notes: string | null
  status: InterviewStatus
  created_at: string
  updated_at: string
}

export type ScorecardRecommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no'

export interface ScorecardRating {
  question: string
  rating: number // 1-5
  comment: string
}

export interface InterviewScorecard {
  id: string
  application_id: string
  recruiter_id: string
  seeker_id: string
  stage: string
  ratings: ScorecardRating[]
  overall_rating: number | null
  recommendation: ScorecardRecommendation | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Joined types for UI
export interface ApplicationWithJob extends Application {
  job: Job & { company_profile?: CompanyProfile }
}

export interface ApplicationWithSeeker extends Application {
  seeker: Profile
  cv_profile: CvProfile | null
}

export interface JobWithDetails extends Job {
  recruiter: Profile
  company_profile?: CompanyProfile | null
  application_count?: number
  user_application?: Application | null
  is_saved?: boolean
}

export interface ConversationWithProfiles extends Conversation {
  recruiter: Profile
  seeker: Profile
  job?: Job | null
  last_message?: Message | null
  unread_count?: number
}

export type Gender = 'kvinna' | 'man' | 'annat'

export interface CandidateDemographics {
  id: string
  seeker_id: string
  gender: Gender | null
  birth_year: number | null
  consent_given_at: string
  consent_version: string
  created_at: string
  updated_at: string
}

export type AiDecisionType =
  | 'cv_analysis'
  | 'match_score'
  | 'skill_gap_analysis'
  | 'interview_questions'
  | 'candidate_summary'
  | 'auto_match'
  | 'fairness_analysis'

export interface AiDecisionLog {
  id: string
  subject_user_id: string | null
  triggered_by_user_id: string | null
  decision_type: AiDecisionType
  job_id: string | null
  application_id: string | null
  score: number | null
  decision_summary: string | null
  decision_data: Record<string, unknown> | null
  input_skills: string[] | null
  output_skills_matched: string[] | null
  output_skills_missing: string[] | null
  model_id: string
  was_reviewed_by_human: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  human_override_score: number | null
  human_override_reason: string | null
  created_at: string
}
