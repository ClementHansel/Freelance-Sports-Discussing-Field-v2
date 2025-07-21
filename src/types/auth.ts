
export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  bio?: string;
  role: 'admin' | 'moderator' | 'user';
  joinDate: string;
  reputation: number;
  isActive: boolean;
}

export interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}
