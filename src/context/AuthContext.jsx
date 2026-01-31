import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: () => {},
  signIn: () => {},
  logout: () => {},
  forgotPassword: () => {},
  resetPassword: () => {},
  isPasswordResetFlow: false,
  setIsPasswordResetFlow: () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState(false);

  /* ================= CHECK FOR PASSWORD RESET FLOW ================= */
  useEffect(() => {
    // Check URL hash for password recovery token
    const hash = window.location.hash;
    
    if (hash.includes('type=recovery')) {
      console.log("🔐 Password reset flow detected from URL");
      setIsPasswordResetFlow(true);
    }
  }, []);

  /* ================= SESSION ================= */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setLoading(false);
          return;
        }

        const u = data.session?.user;

        // If we're in password reset flow, handle specially
        if (isPasswordResetFlow) {
          console.log("⏸️  Password reset flow: Showing reset page");
          // Keep user as null to show reset page
          setUser(null);
          setLoading(false);
          return;
        }

        if (u && !u.email_confirmed_at) {
          setUser(null);
        } else {
          setUser(u ?? null);
        }

        setLoading(false);
      } catch (err) {
        console.error("Auth initialization error:", err);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log("🔑 Password recovery event detected");
          setIsPasswordResetFlow(true);
          // Keep user null to show reset page
          setUser(null);
          return;
        }

        // If password was updated, clear the reset flow
        if (event === 'USER_UPDATED') {
          console.log("✅ Password updated, clearing reset flow");
          setIsPasswordResetFlow(false);
        }

        const u = session?.user;

        if (u && !u.email_confirmed_at) {
          setUser(null);
        } else {
          setUser(u ?? null);
        }
      }
    );

    return () => {
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [isPasswordResetFlow]);

  /* ================= PROFILE ================= */
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.log("Profile not found - logging out user");
          supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          return;
        }
        
        setProfile(data);
      });
  }, [user]);

  /* ================= FORGOT PASSWORD ================= */
  const forgotPassword = async (email) => {
    try {
      console.log("Sending password reset email to:", email);
      
      const redirectUrl = `${window.location.origin}/reset-password`;
      console.log("Sending reset email with redirect:", redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Reset link send error:", error);
        throw new Error(`Failed to send reset link: ${error.message}`);
      }

      console.log("Reset email sent successfully");
      return true;

    } catch (err) {
      console.error("Forgot password error:", err);
      throw err;
    }
  };

  /* ================= RESET PASSWORD ================= */
  const resetPassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setIsPasswordResetFlow(false);
      return true;
    } catch (err) {
      console.error("Reset password error:", err);
      throw err;
    }
  };

  /* ================= SIGN UP ================= */
  const signUp = async (email, password, name) => {
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (existingProfile) {
        throw new Error(
          "An account with this email already exists. Please sign in instead."
        );
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `https://bigbullcamp.com/`,
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;

      if (!data?.user) {
        throw new Error("Failed to create user account");
      }

      try {
        await supabase.rpc("accept_workspace_invites", {
          user_email: email,
          user_id: data.user.id,
        });
      } catch (err) {
        console.warn("Invite acceptance skipped:", err);
      }

      return "VERIFY_EMAIL";
    } catch (err) {
      console.error("SignUp error:", err);
      throw err;
    }
  };

  /* ================= SIGN IN ================= */
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      throw new Error(
        "Please verify your email first. Check your inbox for the verification link."
      );
    }
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const contextValue = {
    user, 
    profile, 
    loading, 
    signUp, 
    signIn, 
    logout,
    forgotPassword,
    resetPassword,
    isPasswordResetFlow,
    setIsPasswordResetFlow
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
