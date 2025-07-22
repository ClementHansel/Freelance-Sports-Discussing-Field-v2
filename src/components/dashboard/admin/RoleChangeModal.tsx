"use client";

import React, { useState } from "react";
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
import { AdminUser } from "@/hooks/useAdminUsers"; // Assuming AdminUser is correctly typed here

interface RoleChangeModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoleChangeModal = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}: RoleChangeModalProps) => {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async () => {
    if (!user || !selectedRole) return;

    setIsLoading(true);
    try {
      // First, delete existing role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Then insert new role
      // The 'role' column in 'user_roles' table is likely an enum or a specific set of strings.
      // We can assert `selectedRole` to that specific union type.
      // Assuming 'admin', 'moderator', 'user' are the valid roles.
      const { error: insertError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: selectedRole as "admin" | "moderator" | "user", // Explicit assertion
      });

      if (insertError) throw insertError;

      toast({
        title: "Role Updated",
        description: `${user.username}'s role has been changed to ${selectedRole}`,
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      // Changed 'any' to 'unknown'
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
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={!selectedRole || isLoading}
            >
              {isLoading ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
