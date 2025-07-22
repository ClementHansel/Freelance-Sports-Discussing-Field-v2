"use client";

import React, { createContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContextType } from "@/types/auth";
import { sessionManager } from "@/lib/utils/sessionManager";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "moderator" | "user">(
    "user"
  );

  useEffect(() => {
    // Initialize session manager for anonymous users
    const initializeApp = async () => {
      try {
        // Guard window access for SSR safety
        if (typeof window !== "undefined") {
          await sessionManager.initializeSession();
        }
      } catch (error) {
        console.error("Failed to initialize session manager:", error);
      } finally {
        // Ensure loading is set to false after initialization attempt
        setLoading(false);
      }
    };

    initializeApp();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Clear temp session when user logs in
        // Guard window access for SSR safety
        if (typeof window !== "undefined") {
          sessionManager.clearSession();
        }

        // Fetch user role
        setTimeout(async () => {
          try {
            const { data: roleData, error: roleError } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .single();

            if (roleError) {
              console.error("Error fetching user role:", roleError);
              setUserRole("user"); // Default to user on error
            } else if (roleData) {
              setUserRole(roleData.role);
            } else {
              setUserRole("user"); // No role found, default to user
            }
          } catch (err) {
            console.error("Unexpected error in auth state change:", err);
            setUserRole("user"); // Default to user on unexpected error
          } finally {
            setLoading(false); // Set loading to false after role fetch
          }
        }, 0);
      } else {
        // User logged out or no session, ensure role is reset and loading is false
        setUserRole("user");
        setLoading(false);
        console.log(
          "User logged out or no session, AuthProvider finished loading."
        ); // Added for re-evaluation
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    // Guard window access for SSR safety
    const redirectUrl =
      typeof window !== "undefined" ? `${window.location.origin}/` : "/";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username,
        },
      },
    });

    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = userRole === "admin";
  const isModerator = userRole === "moderator" || isAdmin;

  const contextUser = user
    ? {
        id: user.id,
        email: user.email || "",
        username:
          user.user_metadata?.username || user.email?.split("@")[0] || "",
        role: userRole,
        joinDate: user.created_at?.split("T")[0] || "",
        reputation: 0,
        isActive: true,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: contextUser,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isModerator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
