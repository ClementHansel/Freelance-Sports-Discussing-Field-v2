"use client";

import React, { Suspense, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Mail,
  Calendar,
  Award,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { EditProfileModal } from "@/components/profile/EditProfileModal";

// Define interfaces for profile and topic data for better type safety
interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string | undefined; // FIX: Changed to string | undefined
  bio?: string | undefined; // FIX: Changed to string | undefined
  reputation: number;
  // Add other profile fields as they exist in your 'profiles' table
}

interface UserTopic {
  id: string;
  title: string;
  reply_count: number | null;
  view_count: number | null;
  created_at: string | null;
  // Add other topic fields as they exist in your 'topics' table
}

// Changed to default export for Next.js page files
export default function Profile() {
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch user profile
  const { data: fetchedProfile, isLoading: profileLoading } =
    useQuery<UserProfile | null>({
      queryKey: ["profile", user?.id],
      queryFn: async () => {
        if (!user?.id) return null;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          throw error; // Propagate error for react-query
        }
        return data as UserProfile; // Cast to UserProfile
      },
      enabled: !!user?.id, // Only run query if user.id exists
    });

  // Ensure profile passed to modal is never 'undefined'
  // If fetchedProfile is undefined (e.g., during initial loading), treat it as null for the modal.
  const profile = fetchedProfile === undefined ? null : fetchedProfile;

  // Fetch user topics
  const { data: userTopics } = useQuery<UserTopic[]>({
    queryKey: ["user-topics", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching user topics:", error);
        throw error; // Propagate error
      }
      return data as UserTopic[]; // Cast to UserTopic[]
    },
    enabled: !!user?.id, // Only run query if user.id exists
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in
          </h1>
          <p className="text-gray-600">
            You need to be signed in to view your profile.
          </p>
        </Card>
      </div>
    );
  }

  const getRoleColor = (role: string | undefined) => {
    // Allow role to be undefined
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "moderator":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <Button variant="outline" onClick={() => setEditModalOpen(true)}>
          Edit Profile
        </Button>
      </div>

      <Suspense
        fallback={
          <Card className="p-6">
            <div className="text-center">Loading content...</div>
          </Card>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {" "}
                {/* Added overflow-hidden */}
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || user.username || "User Avatar"} // Use profile username first, then user, then fallback
                    className="w-full h-full object-cover" // Ensure image covers the div
                    onError={(e) => {
                      // Add error handling for image
                      e.currentTarget.src =
                        "https://placehold.co/64x64/cccccc/ffffff?text=U"; // Fallback placeholder
                    }}
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile?.username || user.username || "Guest User"}
                </h2>{" "}
                {/* Fallback for username */}
                <Badge className={getRoleColor(user.role)}>
                  {user.role || "member"} {/* Fallback for role */}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email || "N/A"}</p>{" "}
                  {/* Fallback for email */}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Member since</p>
                  <p className="font-medium">
                    {user.joinDate
                      ? new Date(user.joinDate).toLocaleDateString()
                      : "N/A"}
                  </p>{" "}
                  {/* Handle null/undefined joinDate */}
                </div>
              </div>
              {profile?.bio && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Bio</p>
                  <p className="text-gray-700">{profile.bio}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Forum Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Topics Created</span>
                </div>
                <span className="font-medium">{userTopics?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Reputation</span>
                </div>
                <span className="font-medium">{profile?.reputation || 0}</span>
              </div>
            </div>
          </Card>
        </div>

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
                      : "N/A"}{" "}
                    {/* Handle null/undefined created_at */}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No topics created yet.</p>
          )}
        </Card>
      </Suspense>

      {/* Ensure EditProfileModal is correctly imported and its props align */}
      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={profile} // Pass the adjusted profile (UserProfile or null)
      />
    </div>
  );
}
