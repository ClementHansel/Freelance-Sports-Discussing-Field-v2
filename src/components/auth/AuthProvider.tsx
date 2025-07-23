"use client";

import React, { createContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContextType } from "@/types/auth";

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

  // Fetch user role
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.warn("User role fetch error:", error.message);
        setUserRole("user");
      } else {
        setUserRole(data?.role ?? "user");
      }
    } catch (err) {
      console.error("Unexpected error fetching role:", err);
      setUserRole("user");
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("GetSession error:", error);

      const session = data.session;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await fetchUserRole(session.user.id);
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) fetchUserRole(session.user.id);
      else setUserRole("user");

      setLoading(false);
    });

    init();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);

    const redirectUrl =
      typeof window !== "undefined" ? `${window.location.origin}/` : "/";

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
        },
      },
    });

    console.log("authData", authData);
    console.log("authError", authError);

    if (authError) {
      setLoading(false);
      throw authError;
    }

    if (!authData?.user) {
      setLoading(false);
      throw new Error("User data not returned after signup.");
    }

    setLoading(false);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const isAdmin = userRole === "admin";
  const isModerator = isAdmin || userRole === "moderator";

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
