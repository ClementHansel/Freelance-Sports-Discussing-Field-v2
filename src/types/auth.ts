import { Session } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  role: "admin" | "moderator" | "user";
  joinDate: string;
  reputation: number;
  isActive: boolean;
  // This interface explicitly does NOT contain 'moderation_status'.
  // If you ever need moderation status on the user, it should be added here,
  // but it's typically a property of content (posts/topics), not the user themselves.
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}
