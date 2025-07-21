"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Hash, Monitor, Calendar } from "lucide-react";
import {
  useAdminTempUserInfo,
  useAdminDisplayName,
} from "@/hooks/useAdminTempUserInfo";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface AdminTempUserInfoProps {
  userId: string;
  className?: string;
}

export const AdminTempUserInfo: React.FC<AdminTempUserInfoProps> = ({
  userId,
  className,
}) => {
  const { user } = useAuth();
  const { data: tempUserInfo } = useAdminTempUserInfo(userId);
  const { data: adminDisplayName } = useAdminDisplayName(userId);

  // Only show to admins
  if (!user || user.role !== "admin") {
    return null;
  }

  // Only show for temporary users
  if (!tempUserInfo) {
    return null;
  }

  return (
    <div
      className={`border border-orange-200 bg-orange-50 rounded-lg p-3 ${className}`}
    >
      <div className="mb-2">
        <h4 className="text-sm font-medium text-orange-800 flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          Admin: Anonymous User Tracking
        </h4>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3 text-orange-600" />
            <span className="text-orange-700">
              {adminDisplayName || `Guest #${tempUserInfo.guest_number}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-orange-600" />
            <span className="text-orange-700">
              Session: {tempUserInfo.session_id.substring(0, 8)}...
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-orange-600" />
            <span className="text-orange-700">
              Created: {formatDistanceToNow(new Date(tempUserInfo.created_at))}{" "}
              ago
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-orange-600" />
            <span className="text-orange-700">
              Expires: {formatDistanceToNow(new Date(tempUserInfo.expires_at))}
            </span>
          </div>
        </div>
        <div className="text-xs text-orange-600">
          <strong>Session ID:</strong> {tempUserInfo.session_id}
        </div>
      </div>
    </div>
  );
};
