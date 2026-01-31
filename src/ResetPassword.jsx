import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "./lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  /* ================= FIXED RESET FLOW CHECK ================= */
  useEffect(() => {
    const checkResetFlow = async () => {
      console.log("🔍 Checking reset flow...");
      
      // Check if this is a password reset URL
      const hash = window.location.hash;
      console.log("URL hash:", hash);
      
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        console.log("✅ Password reset link detected");
        
        // IMPORTANT: We need to let Supabase process the token
        // The issue might be that the token needs to be exchanged for a session
        
        try {
          // Try to manually exchange the token for a session
          const urlParams = new URLSearchParams(hash.substring(1));
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          const tokenType = urlParams.get('type');
          
          if (accessToken && tokenType === 'recovery') {
            console.log("🔑 Found recovery token, attempting to set session");
            
            // Set the session manually
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (sessionError) {
              console.error("Session error:", sessionError);
              throw sessionError;
            }
            
            if (sessionData?.session) {
              console.log("✅ Session created successfully");
              setInitializing(false);
              return;
            }
          }
          
          // Alternative: Just wait for Supabase to auto-process
          console.log("⏳ Waiting for Supabase to auto-process token...");
          
          // Check session after delay
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
              console.log("✅ Got session after delay");
              setInitializing(false);
            } else {
              console.log("❌ Still no session after delay");
              
              // One more attempt - try refreshing
              const { data: { session: session2 } } = await supabase.auth.refreshSession();
              
              if (session2) {
                console.log("✅ Got session after refresh");
                setInitializing(false);
              } else {
                console.log("❌ No session available");
                navigate('/auth');
              }
            }
          }, 2000);
          
        } catch (err) {
          console.error("Error processing reset token:", err);
          navigate('/auth');
        }
        
      } else {
        // Not a reset URL, check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("User already logged in");
          // Ask if they want to reset password
          if (window.confirm("You are already logged in. Do you want to reset your password?")) {
            setInitializing(false);
          } else {
            navigate('/workspaces');
          }
        } else {
          console.log("Not a reset flow and not logged in");
          navigate('/auth');
        }
      }
    };

    checkResetFlow();
  }, [navigate]);

  /* ================= HANDLE FORM SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) throw updateError;

      setSuccess("Password reset successfully! Redirecting to login...");
      
      // Clear URL hash
      window.history.replaceState(null, "", window.location.pathname);
      
      // Sign out and redirect to login after delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/auth");
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // Show loading while initializing
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Setting up password reset...</p>
          <p className="text-xs text-gray-500 mt-2">Please wait while we verify your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-8">
            <motion.div
              className="inline-block w-16 h-16 bg-black rounded-2xl mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                  <span className="text-black font-bold text-lg">🔒</span>
                </div>
              </div>
            </motion.div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
            <p className="text-gray-600">Create a new password for your account</p>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black focus:outline-none transition disabled:bg-gray-100"
                placeholder="Enter new password (min. 6 characters)"
                disabled={loading}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black focus:outline-none transition disabled:bg-gray-100"
                placeholder="Confirm new password"
                disabled={loading}
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800 shadow-md hover:shadow-lg"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Resetting Password...
                </div>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                supabase.auth.signOut();
                navigate("/auth");
              }}
              disabled={loading}
              className="w-full text-center text-black hover:text-gray-700 hover:underline transition-colors disabled:opacity-50 font-medium"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}