// src/components/forum/profile/Profile.tsx
"use client";

import React, { Suspense, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  User as LucideUser, // Alias LucideIcon 'User' to avoid conflict with Supabase User type
  Mail,
  Calendar,
  Award,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import Image from "next/image"; // Ensure this is correctly imported for Next.js Image component

// Import Supabase's User type for explicit casting, if needed, for 'user.created_at'
import { User as SupabaseUser } from "@supabase/supabase-js";

// Define interfaces for profile and topic data for better type safety
interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null; // Corrected: Use 'string | null' to match Supabase schema
  bio: string | null; // Corrected: Use 'string | null' to match Supabase schema
  reputation: number | null; // Corrected: Use 'number | null' to match Supabase schema
  created_at: string | null; // Added: Based on typical Supabase Auth.User
  updated_at: string | null; // Added: Based on typical Supabase Auth.User
}

interface UserTopic {
  id: string;
  title: string;
  reply_count: number | null;
  view_count: number | null;
  created_at: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch user profile
  const { data: fetchedProfile, isLoading: profileLoading } =
    useQuery<UserProfile | null>({
      queryKey: ["userProfile", user?.id],
      queryFn: async () => {
        if (!user) return null;
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, username, avatar_url, bio, reputation, created_at, updated_at"
          )
          .eq("id", user.id)
          .single();
        if (error) {
          console.error("Error fetching profile:", error);
          throw error;
        }
        return data;
      },
      enabled: !!user,
    });

  const profile: UserProfile | null = fetchedProfile || null;

  // Fetch user's topics
  const { data: userTopics, isLoading: topicsLoading } = useQuery<
    UserTopic[] | null
  >({
    queryKey: ["userTopics", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("topics")
        .select("id, title, reply_count, view_count, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5); // Show last 5 topics
      if (error) {
        console.error("Error fetching user topics:", error);
        throw error;
      }
      return data;
    },
    enabled: !!user,
  });

  if (!user || profileLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Something went wrong. Could not load profile.
      </div>
    );
  }

  // Adapt the profile object for EditProfileModal's expected types
  // This converts nulls to undefined for properties that EditProfileModal expects as string | undefined
  const adaptedProfileForModal = profile
    ? {
        ...profile,
        bio: profile.bio === null ? undefined : profile.bio,
        avatar_url:
          profile.avatar_url === null ? undefined : profile.avatar_url,
        reputation:
          profile.reputation === null ? undefined : profile.reputation, // Assuming EditProfileModal expects number | undefined for reputation
      }
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-shrink-0 relative">
          <Image
            src={profile.avatar_url || "/images/default-avatar.png"}
            alt={profile.username || "User avatar"}
            width={96}
            height={96}
            className="rounded-full object-cover w-24 h-24"
          />
        </div>

        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center sm:justify-start">
            <LucideUser className="mr-2 h-6 w-6" /> {/* Use aliased User */}
            {profile.username || "Anonymous User"}
          </h1>
          <p className="text-gray-600 mb-4">{profile.bio || "No bio set."}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-y-2 gap-x-4 text-gray-700 text-sm">
            <span className="flex items-center">
              <Award className="mr-1 h-4 w-4 text-yellow-500" />
              Reputation: <Badge className="ml-1">{profile.reputation}</Badge>
            </span>
            {user.email && (
              <span className="flex items-center">
                <Mail className="mr-1 h-4 w-4" />
                {user.email}
              </span>
            )}
            {/* Cast user to unknown first to bypass strict type checking, then to SupabaseUser.
                The ideal fix is to ensure `useAuth()` returns a User type that includes `created_at`. */}
            {(user as unknown as SupabaseUser).created_at && (
              <span className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {/* Ensure date formatting is self-contained within the expression */}
                {new Date(
                  (user as unknown as SupabaseUser).created_at
                ).toLocaleDateString()}
              </span>
            )}
          </div>
          <Button onClick={() => setEditModalOpen(true)} className="mt-4">
            Edit Profile
          </Button>
        </div>
      </Card>

      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading recent topics...</div>
          </Card>
        }
      >
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Topics
          </h2>
          {userTopics && userTopics.length > 0 ? (
            <div className="space-y-3">
              {userTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{topic.title}</span>
                    <p className="text-sm text-gray-600">
                      {topic.reply_count || 0} replies • {topic.view_count || 0}{" "}
                      views
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {topic.created_at
                      ? new Date(topic.created_at).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No topics created yet.</p>
          )}
        </Card>
      </Suspense>

      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={adaptedProfileForModal} // Pass the adapted profile here
      />
    </div>
  );
}
