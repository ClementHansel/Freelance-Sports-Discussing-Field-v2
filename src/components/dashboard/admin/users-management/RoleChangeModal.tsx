"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminUser } from "@/hooks/useAdminUsers";
import * as Sentry from "@sentry/react"; // Optional

interface RoleChangeModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const validRoles = ["user", "moderator", "admin"] as const;
type ValidRole = (typeof validRoles)[number];

export const RoleChangeModal = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}: RoleChangeModalProps) => {
  const [selectedRole, setSelectedRole] = useState<ValidRole | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reset role state when modal opens with new user
  useEffect(() => {
    if (isOpen && user?.role) {
      setSelectedRole(user.role as ValidRole); // assume backend role is valid
    }
  }, [isOpen, user]);

  const handleRoleChange = async () => {
    if (!user || !selectedRole || user.role === selectedRole) return;

    setIsLoading(true);
    try {
      // Delete old role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: selectedRole,
      });

      if (insertError) throw insertError;

      toast({
        title: "Role Updated",
        description: `${user.username}'s role has been changed to ${selectedRole}`,
      });

      // Optional Sentry breadcrumb
      Sentry.addBreadcrumb({
        category: "admin",
        message: `Changed role of ${user.username} to ${selectedRole}`,
        level: "info",
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      let errorMessage = "Failed to update user role";

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

      Sentry.captureException(error); // Optional

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
          <DialogTitle>Change User Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Changing role for:{" "}
              <span className="font-medium">{user?.username}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Current role:{" "}
              <span className="font-medium capitalize">{user?.role}</span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">New Role</label>
            <Select
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as ValidRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {validRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={
                !selectedRole || selectedRole === user?.role || isLoading
              }
            >
              {isLoading ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
