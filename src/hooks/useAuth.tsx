
import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Starting fetchProfile for userId:', userId);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('Profile query result - data:', data, 'error:', error);

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('Auth effect starting...');
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Fetching profile for user:', session.user.id);
          // Fetch profile data
          const profileData = await fetchProfile(session.user.id);
          console.log('Profile data:', profileData);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        
        console.log('Setting loading to false');
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Fetching profile for initial session user:', session.user.id);
        const profileData = await fetchProfile(session.user.id);
        console.log('Initial profile data:', profileData);
        setProfile(profileData);
      }
      
      console.log('Setting initial loading to false');
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
      // Reset all state
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdmin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
