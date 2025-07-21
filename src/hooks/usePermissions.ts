"use client";

import { useAuth } from "./useAuth";

export const usePermissions = () => {
  const { user, isAdmin, isModerator } = useAuth();

  const canModerate = isAdmin || isModerator;
  const canDeletePosts = isAdmin || isModerator;
  const canBanUsers = isAdmin;
  const canManageCategories = isAdmin;
  const canViewAdminPanel = isAdmin;
  const canEditUsers = isAdmin;

  return {
    canModerate,
    canDeletePosts,
    canBanUsers,
    canManageCategories,
    canViewAdminPanel,
    canEditUsers,
    user,
  };
};
