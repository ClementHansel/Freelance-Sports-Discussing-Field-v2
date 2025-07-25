"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Ban, Shield, User } from "lucide-react";
import { useAdminUsers, AdminUser } from "@/hooks/useAdminUsers";
import { formatDistanceToNow } from "date-fns";
import { RoleChangeModal } from "./RoleChangeModal";
import { BanUserModal } from "./BanUserModal";
import { EditProfileModal } from "./EditProfileModal";
import { useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { data: users, isLoading, error } = useAdminUsers();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (error) {
      Sentry.captureException(error);
    }
  }, [error]);

  const filteredUsers =
    users?.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "moderator":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const handleEditProfile = (user: AdminUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
    Sentry.addBreadcrumb({
      category: "admin",
      message: `Opened edit profile for user ${user.username}`,
      level: "info",
    });
  };

  const handleChangeRole = (user: AdminUser) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
    Sentry.addBreadcrumb({
      category: "admin",
      message: `Opened role change for user ${user.username}`,
      level: "info",
    });
  };

  const handleBanUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsBanModalOpen(true);
    Sentry.addBreadcrumb({
      category: "admin",
      message: `Opened ban modal for user ${user.username}`,
      level: "warning",
    });
  };

  useEffect(() => {
    if (searchTerm) {
      Sentry.setContext("user-management-search", { searchTerm });
    }
  }, [searchTerm]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Users
          </h2>
          <p className="text-gray-600">
            {error.message || "Unable to load user data"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button
          onClick={() =>
            Sentry.addBreadcrumb({
              category: "admin",
              message: "Clicked Add New User (unimplemented)",
              level: "info",
            })
          }
        >
          Add New User
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users by username..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Reputation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.created_at
                        ? formatDistanceToNow(new Date(user.created_at)) +
                          " ago"
                        : "Unknown"}
                    </TableCell>
                    <TableCell>{user.post_count}</TableCell>
                    <TableCell>{user.reputation}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem
                            onClick={() => handleEditProfile(user)}
                          >
                            <User className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleChangeRole(user)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleBanUser(user)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Ban User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {searchTerm
                      ? "No users found matching your search."
                      : "No users found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Total Users</h3>
          <p className="text-2xl font-bold text-blue-600">
            {isLoading ? "..." : users?.length || 0}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Active Users</h3>
          <p className="text-2xl font-bold text-green-600">
            {isLoading ? "..." : users?.length || 0}
          </p>
          <p className="text-sm text-gray-500">
            All users are considered active
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Admins</h3>
          <p className="text-2xl font-bold text-red-600">
            {isLoading
              ? "..."
              : users?.filter((u) => u.role === "admin").length || 0}
          </p>
        </Card>
      </div>

      {/* Modals */}
      <RoleChangeModal
        user={selectedUser}
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSuccess={handleRefresh}
      />
      <BanUserModal
        user={selectedUser}
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        onSuccess={handleRefresh}
      />
      <EditProfileModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
