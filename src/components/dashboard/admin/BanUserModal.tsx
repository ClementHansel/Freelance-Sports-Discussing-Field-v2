"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminUser } from "@/hooks/useAdminUsers";

interface BanUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BanUserModal = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}: BanUserModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBanUser = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Delete user's profile (cascade will handle related data)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "User Banned",
        description: `${user.username} has been banned successfully`,
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      // 'unknown' is the safest type for caught errors
      let errorMessage = "Failed to ban user";

      if (error instanceof Error) {
        // If it's a standard Error object
        errorMessage = error.message;
      } else if (typeof error === "string") {
        // If it's a string literal error
        errorMessage = error;
      } else if (
        // Check if it's an object, not null, has a 'message' property, and that message is a string
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string" // Type assertion to an object with unknown message
      ) {
        errorMessage = (error as { message: string }).message; // Now safely assert to string
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
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ban User</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          Are you sure you want to ban <strong>{user?.username}</strong>? This
          action cannot be undone and will permanently delete their account and
          all associated data.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleBanUser}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Banning..." : "Ban User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
