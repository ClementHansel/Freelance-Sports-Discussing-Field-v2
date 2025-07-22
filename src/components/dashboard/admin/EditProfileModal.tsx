"use client";

import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminUser } from "@/hooks/useAdminUsers";

interface EditProfileModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditProfileModal = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}: EditProfileModalProps) => {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Wrap loadProfileData in useCallback to make it stable across renders
  // This prevents infinite loops when adding it to useEffect's dependency array.
  const loadProfileData = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("bio")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setBio(data?.bio || "");
    } catch (error) {
      console.error("Error loading profile:", error);
      // Optionally show a toast for loading error
      toast({
        title: "Error loading profile data",
        description: "Could not fetch user's bio.",
        variant: "destructive",
      });
    }
  }, [user, toast]); // user and toast are stable enough dependencies

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      loadProfileData(); // Now safe to include in dependencies
    }
  }, [user, loadProfileData]); // Added loadProfileData to dependency array

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          bio: bio.trim() || null, // Ensure empty string becomes null for DB
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: `${user.username}'s profile has been updated successfully`,
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      // Changed 'any' to 'unknown'
      let errorMessage = "Failed to update profile";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        errorMessage = (error as { message: string }).message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Enter bio (optional)"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!username.trim() || isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
