// src/types/admin-moderation.ts

// Refined interfaces for better type safety
export interface CategorySlug {
  slug: string | null;
}

export interface TopicForReport {
  id: string;
  title: string | null;
  content: string | null;
  slug: string | null;
  author_id: string | null;
  categories: CategorySlug | null;
}

export interface PostForReport {
  id: string;
  content: string | null;
  author_id: string | null;
  topic_id: string | null;
  ip_address: string | null;
  created_at: string | null;
  topics: TopicForReport | null; // Nested topic info
}

export interface ReporterProfile {
  id: string;
  username: string;
}

export interface ContentAuthorProfile {
  id: string;
  username: string;
}

// Type for raw data directly from Supabase for reports
export interface SupabaseReportRow {
  id: string;
  reason: string;
  description: string | null;
  status: string; // Supabase returns it as a generic string initially
  created_at: string | null;
  reviewed_at: string | null;
  reporter_id: string | null;
  reporter_ip_address: string | null;
  reported_post_id: string | null;
  reported_topic_id: string | null;
  admin_notes: string | null;
  // Add any other columns returned by select('*') that are not explicitly in our Report interface.
  // If 'profiles' or 'posts' are joined directly here, their types would also be needed.
}

// Final Report interface with specific literal union for status
export interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: "pending" | "resolved" | "dismissed" | "closed"; // Explicit literal union
  created_at: string | null;
  reviewed_at: string | null;
  reporter_id: string | null;
  reporter_ip_address: string | null;
  reported_post_id: string | null;
  reported_topic_id: string | null;
  admin_notes: string | null;
  reporter?: ReporterProfile | null;
  post?: PostForReport | null;
  topic?: TopicForReport | null;
  contentAuthor?: ContentAuthorProfile | null;
}

// Raw interface for posts fetched from Supabase in the moderation queue
export interface SupabasePostRaw {
  id: string;
  content: string;
  created_at: string | null;
  author_id: string | null;
  topic_id: string | null;
  ip_address: string | null;
  is_anonymous: boolean | null; // Can be boolean or null from DB
  moderation_status: string;
  topics: {
    id: string;
    title: string | null;
    content: string | null;
    author_id: string | null;
    slug: string | null;
    categories: {
      slug: string | null;
      requires_moderation: boolean | null;
    } | null;
  } | null;
}

// Raw interface for topics fetched from Supabase in the moderation queue
export interface SupabaseTopicRaw {
  id: string;
  title: string | null;
  content: string;
  slug: string | null;
  created_at: string | null;
  author_id: string | null;
  moderation_status: string;
  categories: {
    slug: string | null;
    requires_moderation: boolean | null;
  } | null;
}

// Re-introduced: Union type for raw moderation items from Supabase
export type SupabaseModerationItemRaw = SupabasePostRaw | SupabaseTopicRaw;

// ModerationItem interface with specific literal union for status
export interface ModerationItem {
  id: string;
  type: "topic" | "post";
  title: string;
  content: string;
  author: string;
  created_at: string; // Keep as string as the modal expects it
  reported_count: number;
  status: "pending" | "approved" | "rejected"; // Explicit literal union
  is_anonymous?: boolean; // Changed to boolean | undefined
  ip_address?: string | null;
  slug?: string; // Changed to string | undefined
  category_slug?: string; // Changed to string | undefined
  topic_slug?: string; // Changed to string | undefined
  topic_id?: string; // Changed to string | undefined
}
