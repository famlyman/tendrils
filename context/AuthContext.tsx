import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../supabase";

type AuthContextType = {
  userId: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ userId: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUserId(session?.user?.id ?? null);
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for auth state changes (including session restoration)
    const { data: { subscription: listener } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUserId(session?.user?.id ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener?.unsubscribe?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ userId, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);