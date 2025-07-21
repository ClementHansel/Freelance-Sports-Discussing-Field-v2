"use client";

import { supabase } from "@/integrations/supabase/client";

export interface TempUser {
  id: string;
  session_id: string;
  display_name: string;
  created_at: string;
  expires_at: string;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionId: string | null = null;
  private tempUserId: string | null = null;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async initializeSession(): Promise<string> {
    // Check if we have a valid session in localStorage
    const storedSessionId = localStorage.getItem("temp_session_id");
    const storedExpiry = localStorage.getItem("temp_session_expiry");
    const storedTempUserId = localStorage.getItem("temp_user_id");

    if (storedSessionId && storedExpiry && storedTempUserId) {
      const expiry = new Date(storedExpiry);
      if (expiry > new Date()) {
        // Session is still valid
        this.sessionId = storedSessionId;
        this.tempUserId = storedTempUserId;
        return this.tempUserId;
      }
    }

    // Create new session
    return this.createNewSession();
  }

  private async createNewSession(): Promise<string> {
    // Generate new session ID
    this.sessionId =
      "session_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();

    try {
      // Get or create temporary user
      const { data, error } = await supabase.rpc("get_or_create_temp_user", {
        p_session_id: this.sessionId,
      });

      if (error) {
        console.error("Error creating temp user:", error);
        throw error;
      }

      this.tempUserId = data;

      // Store in localStorage with 12-hour expiry
      const expiry = new Date(Date.now() + 12 * 60 * 60 * 1000);
      localStorage.setItem("temp_session_id", this.sessionId);
      localStorage.setItem("temp_user_id", this.tempUserId);
      localStorage.setItem("temp_session_expiry", expiry.toISOString());

      console.log("Created new temporary user session:", {
        sessionId: this.sessionId,
        tempUserId: this.tempUserId,
        expiry: expiry.toISOString(),
      });

      return this.tempUserId;
    } catch (error) {
      console.error("Failed to create temp user session:", error);
      throw error;
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getTempUserId(): string | null {
    return this.tempUserId;
  }

  async getTempUserData(): Promise<TempUser | null> {
    if (!this.tempUserId) return null;

    try {
      const { data, error } = await supabase
        .from("temporary_users")
        .select("*")
        .eq("id", this.tempUserId)
        .single();

      if (error) {
        console.error("Error fetching temp user data:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Failed to fetch temp user data:", error);
      return null;
    }
  }

  clearSession(): void {
    this.sessionId = null;
    this.tempUserId = null;
    localStorage.removeItem("temp_session_id");
    localStorage.removeItem("temp_user_id");
    localStorage.removeItem("temp_session_expiry");
  }

  async checkRateLimit(): Promise<{
    canPost: boolean;
    remainingPosts: number;
  }> {
    // POSTING LIMITS REMOVED - Always allow posting
    return { canPost: true, remainingPosts: 999999 };
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip || "127.0.0.1";
    } catch (error) {
      console.warn("Failed to get real IP, using fallback");
      const userAgent = navigator.userAgent;
      const timestamp = Date.now();
      const hash = btoa(`${userAgent}-${timestamp}`).slice(0, 15);
      return `192.168.1.${hash.slice(-3).replace(/[^0-9]/g, "1")}`;
    }
  }

  async recordPost(): Promise<void> {
    if (!this.sessionId) {
      console.error("No session ID available for recording post");
      return;
    }

    try {
      const clientIP = await this.getClientIP();
      console.log(
        "Recording enhanced anonymous activity for IP:",
        clientIP,
        "Session:",
        this.sessionId
      );

      await supabase.rpc("record_enhanced_anonymous_activity", {
        user_ip: clientIP,
        p_session_id: this.sessionId,
        p_fingerprint_hash: undefined, // Changed from null to undefined
        p_content_type: "post",
      });

      console.log("Activity recorded successfully");
    } catch (error) {
      console.error("Error recording anonymous activity:", error);
    }
  }
}

export const sessionManager = SessionManager.getInstance();
