import { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseUrl, supabaseAnonKey } from "../lib/supabase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === "admin";
  const isLoggedIn = !!user;

  // Fetch profile from `profiles` table
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data;
    } catch (err) {
      console.error("fetchProfile error:", err);
      return null;
    }
  };

  // Create profile row after first sign-up
  const createProfile = async (userId, name, email, role = "user") => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert([{ id: userId, name, email, role, is_blocked: false }])
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        return null;
      }
      return data;
    } catch (err) {
      console.error("createProfile error:", err);
      return null;
    }
  };

  useEffect(() => {
    // Get current session on mount
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          setProfile(prof);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      const prof = await createProfile(data.user.id, name, email, "user");
      setProfile(prof);
    }
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      const prof = await fetchProfile(data.user.id);
      setProfile(prof);
    }
    return data;
  };

  const signInWithGoogle = async () => {
    // Pre-flight check to verify if Google provider is configured in Supabase
    try {
      if (supabaseUrl && supabaseAnonKey) {
        const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          headers: { apikey: supabaseAnonKey },
        });
        if (res.ok) {
          const authSettings = await res.json();
          if (authSettings?.external?.google === false) {
            throw new Error(
              "Google Sign-In is not enabled in your Supabase project yet. You can sign in immediately using your Email & Password (or Create Account), or enable Google in your Supabase Dashboard → Authentication → Providers → Google."
            );
          }
        }
      }
    } catch (err) {
      if (err.message.includes("Google Sign-In is not enabled")) {
        throw err;
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isLoggedIn,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
