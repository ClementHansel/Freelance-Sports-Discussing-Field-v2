"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sessionManager } from "@/lib/utils/sessionManager";
import { useAuth } from "@/hooks/useAuth";
import { RealtimeChannel } from "@supabase/supabase-js"; // Import RealtimeChannel type

interface OnlineUsersContextType {
  onlineCount: number;
}

// Define the interface for the data tracked in presence
interface PresenceData {
  user_id: string;
  online_at: string;
  is_authenticated: boolean;
}

// Define the type for the presence state object
type PresenceState = Record<string, PresenceData[]>;

// eslint-disable-next-line react-refresh/only-export-components
export const OnlineUsersContext = createContext<
  OnlineUsersContextType | undefined
>(undefined);

export const OnlineUsersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    let channel: RealtimeChannel | null = null; // Use RealtimeChannel type
    let isSubscribed = false;

    const initializePresence = async () => {
      try {
        console.log("🔄 Initializing online presence tracking...");

        // Ensure session is initialized for anonymous users
        if (!user) {
          await sessionManager.initializeSession();
          console.log("📝 Session initialized for anonymous user");
        }

        // Get persistent user ID
        const userId = user ? user.id : sessionManager.getTempUserId();
        console.log(
          "👤 User ID for presence:",
          userId,
          user ? "(authenticated)" : "(anonymous)"
        );

        if (!userId) {
          console.error("❌ No user ID available for presence tracking");
          return;
        }

        channel = supabase.channel("online_users", {
          config: {
            presence: {
              key: "user_presence",
            },
          },
        });

        channel
          .on("presence", { event: "sync" }, () => {
            if (!isSubscribed) return;
            const presenceState: PresenceState = channel!.presenceState(); // Assert channel is not null
            console.log("🔄 Presence sync event:", presenceState);

            const uniqueUsers = new Set<string>(); // Specify type for Set

            // Count unique users by their persistent ID
            Object.values(presenceState).forEach(
              (presences: PresenceData[]) => {
                // Use PresenceData[]
                presences.forEach((presence: PresenceData) => {
                  // Use PresenceData
                  uniqueUsers.add(presence.user_id);
                });
              }
            );

            const count = uniqueUsers.size;
            console.log(
              "👥 Online users count:",
              count,
              "Unique IDs:",
              Array.from(uniqueUsers)
            );
            setOnlineCount(count);

            // Update peak users if current count is higher
            // This functionality is disabled as custom RPCs cannot be used.
            // if (count > 0) {
            //   supabase
            //     .rpc("update_peak_users", { current_count: count })
            //     .then(({ error }) => {
            //       if (error) {
            //         console.error("❌ Error updating peak users:", error);
            //       } else {
            //         console.log("📈 Peak users updated with count:", count);
            //       }
            //     });
            // }
          })
          .on("presence", { event: "join" }, ({ newPresences }) => {
            if (!isSubscribed) return;
            console.log("➕ User joined:", newPresences);

            const presenceState: PresenceState = channel!.presenceState(); // Assert channel is not null
            const uniqueUsers = new Set<string>(); // Specify type for Set

            Object.values(presenceState).forEach(
              (presences: PresenceData[]) => {
                // Use PresenceData[]
                presences.forEach((presence: PresenceData) => {
                  // Use PresenceData
                  uniqueUsers.add(presence.user_id);
                });
              }
            );

            const count = uniqueUsers.size;
            console.log("👥 Online users count after join:", count);
            setOnlineCount(count);

            // Update peak users if current count is higher
            // This functionality is disabled as custom RPCs cannot be used.
            // if (count > 0) {
            //   supabase.rpc("update_peak_users", { current_count: count }); // Removed
            // }
          })
          .on("presence", { event: "leave" }, ({ leftPresences }) => {
            if (!isSubscribed) return;
            console.log("➖ User left:", leftPresences);

            const presenceState: PresenceState = channel!.presenceState(); // Assert channel is not null
            const uniqueUsers = new Set<string>(); // Specify type for Set

            Object.values(presenceState).forEach(
              (presences: PresenceData[]) => {
                // Use PresenceData[]
                presences.forEach((presence: PresenceData) => {
                  // Use PresenceData
                  uniqueUsers.add(presence.user_id);
                });
              }
            );

            const count = uniqueUsers.size;
            console.log("👥 Online users count after leave:", count);
            setOnlineCount(count);
          })
          .subscribe(async (status) => {
            console.log("📡 Channel status:", status);

            if (status === "SUBSCRIBED") {
              isSubscribed = true;

              const userStatus: PresenceData = {
                // Use PresenceData
                user_id: userId,
                online_at: new Date().toISOString(),
                is_authenticated: !!user,
              };

              console.log("🏷️ Tracking user presence:", userStatus);

              try {
                const trackResult = await channel!.track(userStatus); // Assert channel is not null
                console.log("✅ Presence tracked:", trackResult);
              } catch (error) {
                console.error("❌ Error tracking presence:", error);
              }
            }
          });
      } catch (error) {
        console.error("❌ Error initializing presence:", error);
      }
    };

    initializePresence();

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up presence tracking");
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]); // Re-run when user auth state changes

  return (
    <OnlineUsersContext.Provider value={{ onlineCount }}>
      {children}
    </OnlineUsersContext.Provider>
  );
};
