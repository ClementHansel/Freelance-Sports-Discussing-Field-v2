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
        await sessionManager.initializeSession();
      } catch (error) {
        console.error("Failed to initialize session manager:", error);
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
        sessionManager.clearSession();

        // Fetch user role
        setTimeout(async () => {
          try {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .single();

            if (roleData) {
              setUserRole(roleData.role);
            }
          } catch (error) {}
        }, 0);
      } else {
        setUserRole("user");
        // Re-initialize temp session when user logs out
        setTimeout(() => {
          sessionManager.initializeSession();
        }, 0);
      }

      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    const redirectUrl = `${window.location.origin}/`;

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
        signIn,
        signUp,
        signOut,
        loading,
        isAdmin,
        isModerator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
