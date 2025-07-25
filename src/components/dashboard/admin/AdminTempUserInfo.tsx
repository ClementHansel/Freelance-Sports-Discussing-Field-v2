"use client";

import React, { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Hash,
  Monitor,
  Calendar,
  HeartPulse,
  Settings2,
} from "lucide-react";
import {
  useAdminTempUserInfo,
  useAdminDisplayName,
} from "@/hooks/useAdminTempUserInfo";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import * as Sentry from "@sentry/react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

  const [heartbeatEnabled, setHeartbeatEnabled] = useState(true);
  const [intervalMs, setIntervalMs] = useState(15000); // 15s default
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!heartbeatEnabled || !tempUserInfo) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const displayName =
        adminDisplayName || `Guest #${tempUserInfo.guest_number}`;
      const message = `Heartbeat from session ${tempUserInfo.session_id} (${displayName})`;

      // Optional local debug
      console.log(`[HEARTBEAT] ${message}`);

      Sentry.captureMessage(message, {
        level: "info",
        tags: {
          feature: "heartbeat",
          type: "tempUser",
          sessionId: tempUserInfo.session_id,
        },
        extra: {
          userId,
          intervalMs,
          guestNumber: tempUserInfo.guest_number,
          isAdmin: user?.role === "admin",
        },
      });

      // (Optional) if you later enable tracing:
      // const transaction = Sentry.getActiveTransaction();
      // transaction?.setName(`Heartbeat-${tempUserInfo.session_id}`);
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    heartbeatEnabled,
    intervalMs,
    userId,
    tempUserInfo,
    adminDisplayName,
    user,
  ]);

  if (!user || user.role !== "admin") return null;
  if (!tempUserInfo) return null;

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

        {/* Heartbeat Controls */}
        <div className="mt-3 border-t pt-3">
          <div className="flex items-center gap-2 text-sm text-orange-700 mb-2">
            <HeartPulse className="w-4 h-4 text-red-600" />
            <span>Heartbeat Monitor</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Label htmlFor="heartbeat-switch">Enabled</Label>
              <Switch
                id="heartbeat-switch"
                checked={heartbeatEnabled}
                onCheckedChange={setHeartbeatEnabled}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="interval-input">Interval (ms)</Label>
              <Input
                id="interval-input"
                type="number"
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                className="w-24"
                min={5000}
              />
            </div>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};
