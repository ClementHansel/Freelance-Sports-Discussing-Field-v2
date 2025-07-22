"use client";

import React, { createContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContextType } from "@/types/auth";
import { sessionManager } from "@/lib/utils/sessionManager"; // Ensure this path is correct

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
    // 1. Initialize session manager for anonymous users (from old build, improved with window guard)
    const initializeAnonymousSession = async () => {
      try {
        if (typeof window !== "undefined") {
          await sessionManager.initializeSession();
        }
      } catch (error) {
        console.error("Failed to initialize anonymous session:", error);
      }
    };

    // 2. Check for existing session on initial load (from old build)
    const checkInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting initial session:", error);
          // If there's an error getting session, ensure loading is false
          setLoading(false);
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          // If a user is found, clear any temporary anonymous session
          if (typeof window !== "undefined") {
            sessionManager.clearSession();
          }
          // Fetch user role immediately for existing authenticated users
          await fetchUserRole(initialSession.user.id);
        } else {
          // No authenticated user, ensure anonymous session is initialized
          await initializeAnonymousSession();
          setUserRole("user"); // Default role if no authenticated user
          setLoading(false); // Set loading to false after anonymous session init
        }
      } catch (err) {
        console.error("Unexpected error during initial session check:", err);
        setLoading(false);
      }
    };

    // Helper to fetch user role
    const fetchUserRole = async (userId: string) => {
      try {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
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
        console.error("Unexpected error in fetchUserRole:", err);
        setUserRole("user"); // Default to user on unexpected error
      } finally {
        setLoading(false); // Set loading to false after role fetch
      }
    };

    checkInitialSession(); // Start the initial session check

    // 3. Set up auth state listener (from both builds, combined)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(true); // Set loading true while processing auth state change

      if (session?.user) {
        // Clear temp session when user logs in
        if (typeof window !== "undefined") {
          sessionManager.clearSession();
        }
        await fetchUserRole(session.user.id);
      } else {
        // User logged out or no session, ensure role is reset and anonymous session re-initialized
        setUserRole("user");
        await initializeAnonymousSession(); // Re-initialize anonymous session on logout (from old build)
        setLoading(false); // Set loading to false after anonymous session init
        console.log(
          "User logged out or no session, AuthProvider finished loading."
        );
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
    const redirectUrl =
      typeof window !== "undefined" ? `${window.location.origin}/` : "/";

    // Step 1: Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username, // This sets user_metadata.username
        },
      },
    });

    if (authError) {
      setLoading(false);
      throw authError; // Re-throw auth error to be caught by RegisterForm
    }

    // Step 2: If auth signup is successful, create a corresponding profile entry
    // This assumes your 'profiles' table has at least 'id' and 'username' columns.
    // The 'id' should be the same as the user's ID from auth.users.
    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id, // Link profile to auth.users ID
          username: username, // Use the provided username
          avatar_url: null, // Default avatar URL or a placeholder
          // Ensure your profiles table RLS allows inserts by authenticated users
        },
      ]);

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        setLoading(false);
        throw new Error("Failed to create user profile."); // Throw a more specific error
      }
    } else {
      setLoading(false);
      throw new Error("User data not returned after signup.");
    }

    setLoading(false); // Set loading to false after successful profile creation
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
        session, // Now explicitly provided
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
