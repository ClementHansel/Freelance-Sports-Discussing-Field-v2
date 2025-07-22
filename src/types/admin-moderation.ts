// src/types/admin-moderation.ts

import { Database } from "@/integrations/supabase/types"; // Assuming this path is correct for your Supabase types

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
  created_at: string | null;
  moderation_status?: Database["public"]["Enums"]["moderation_status"] | null;
  ip_address: string | null;
}

export interface PostForReport {
  id: string;
  content: string | null;
  author_id: string | null;
  topic_id: string | null;
  ip_address: string | null;
  created_at: string | null;
  topics: TopicForReport | null; // Correctly named 'topics'
  moderation_status?: Database["public"]["Enums"]["moderation_status"] | null;
}

export interface ReporterProfile {
  id: string;
  username: string;
}

export interface ContentAuthorProfile {
  id: string;
  username: string;
}

export interface ReportedPost {
  id: string;
  content: string | null;
  topic_id: string;
  moderation_status: Database["public"]["Enums"]["moderation_status"] | null;
  ip_address: string | null;
  topic?: {
    category_slug: string | null;
    slug: string | null;
  } | null;
}

export interface ReportedTopic {
  id: string;
  title: string;
  content: string | null;
  moderation_status: Database["public"]["Enums"]["moderation_status"] | null;
  ip_address: string | null;
  category_slug: string | null;
  slug: string | null;
}

export interface ReporterBehavior {
  total_reports: number;
  reports_today: number;
  dismissed_reports: number;
  recent_repeat_reports: number;
  is_problematic_reporter: boolean;
}

export interface PreviousReports {
  was_previously_approved: boolean;
  last_approved_at: string | null;
  total_reports: number;
}

export interface SupabaseReportRow {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string | null;
  reviewed_at: string | null;
  reporter_id: string | null;
  reporter_ip_address: string | null;
  reported_post_id: string | null;
  reported_topic_id: string | null;
  admin_notes: string | null;
}

export interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: "pending" | "resolved" | "dismissed" | "closed";
  created_at: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  reporter_id: string | null;
  reporter_ip_address: string | null;
  reported_post_id: string | null;
  reported_topic_id: string | null;
  reporter?: ReporterProfile | null;
  post?: PostForReport | null;
  topic?: TopicForReport | null;
  contentAuthor?: ContentAuthorProfile | null;
}

export interface SupabasePostRaw {
  id: string;
  content: string;
  created_at: string | null;
  author_id: string | null;
  topic_id: string | null;
  ip_address: string | null;
  is_anonymous: boolean | null; // This is the property causing the error
  moderation_status: string;
  topics: {
    id: string;
    title: string | null;
    content: string | null;
    author_id: string | null;
    slug: string | null;
    created_at: string | null; // Added this
    ip_address: string | null; // Added this
    moderation_status: string | null; // Added this
    categories: {
      slug: string | null;
      requires_moderation: boolean | null; // This is the property causing the error
    } | null;
  } | null;
}

export interface SupabaseTopicRaw {
  id: string;
  title: string | null;
  content: string;
  slug: string | null;
  created_at: string | null;
  author_id: string | null;
  moderation_status: string;
  ip_address: string | null; // Added this
  categories: {
    slug: string | null;
    requires_moderation: boolean | null; // This is the property causing the error
  } | null;
}

export type SupabaseModerationItemRaw = SupabasePostRaw | SupabaseTopicRaw;

export interface ModerationItem {
  id: string;
  type: "topic" | "post";
  title: string;
  content: string;
  author: string;
  created_at: string;
  reported_count: number;
  status: "pending" | "approved" | "rejected";
  is_anonymous?: boolean;
  ip_address?: string | null;
  slug?: string;
  category_slug?: string;
  topic_slug?: string;
  topic_id?: string;
}
