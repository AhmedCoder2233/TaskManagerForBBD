import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Auth() {
  const { signIn, signUp, forgotPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isForgotPassword) {
        await forgotPassword(formData.email);
        setSuccess("Password reset link has been sent to your email! Please check your inbox.");
        setFormData({ email: "", password: "", name: "" });
        
        setTimeout(() => {
          setIsForgotPassword(false);
          setSuccess("");
        }, 5000);
      } else if (isSignUp) {
        const result = await signUp(formData.email, formData.password, formData.name);
        if (result === "VERIFY_EMAIL") {
          setSuccess(
            "Account created successfully! Please check your email to verify your account."
          );
          setFormData({ email: "", password: "", name: "" });
          
          setTimeout(() => {
            setIsSignUp(false);
            setSuccess("");
          }, 3000);
        }
      } else {
        await signIn(formData.email, formData.password);
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setError("");
    setSuccess("");
    setFormData({ email: "", password: "", name: "" });
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setError("");
    setSuccess("");
    setFormData({ email: "", password: "", name: "" });
    
    if (!isForgotPassword) {
      window.history.pushState({}, "", "/auth?mode=forgot");
    } else {
      window.history.pushState({}, "", "/auth");
    }
  };

  const getCurrentMode = () => {
    if (isForgotPassword) return "forgotPassword";
    if (isSignUp) return "signUp";
    return "signIn";
  };

  const currentMode = getCurrentMode();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-block w-16 h-16 bg-black rounded-2xl mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
                  <span className="text-black font-bold text-lg">
                    {currentMode === "signUp" ? "👤" : 
                     currentMode === "forgotPassword" ? "🔒" : "🔑"}
                  </span>
                </div>
              </div>
            </motion.div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {currentMode === "signUp" 
                ? "Create Account" 
                : currentMode === "forgotPassword"
                ? "Reset Password"
                : "Welcome Back"}
            </h2>
            <p className="text-gray-600">
              {currentMode === "signUp"
                ? "Sign up to get started"
                : currentMode === "forgotPassword"
                ? "Enter your email to reset password"
                : "Sign in to your account"}
            </p>
          </div>

          {/* Success Alert */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className={`${currentMode === "forgotPassword" ? "bg-blue-50 border-l-4 border-blue-500" : "bg-green-50 border-l-4 border-green-500"} p-4 rounded-lg`}>
                  <p className={`${currentMode === "forgotPassword" ? "text-blue-700" : "text-green-700"} text-sm font-medium`}>
                    {success}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field (Sign Up Only) */}
            <AnimatePresence mode="wait">
              {currentMode === "signUp" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required={currentMode === "signUp"}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black focus:outline-none transition disabled:bg-gray-100"
                    placeholder="John Doe"
                    disabled={loading}
                    value={formData.name}
                    onChange={handleChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black focus:outline-none transition disabled:bg-gray-100"
                placeholder="you@example.com"
                disabled={loading}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password Field (Not for Forgot Password) */}
            <AnimatePresence mode="wait">
              {currentMode !== "forgotPassword" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={currentMode !== "forgotPassword"}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black focus:outline-none transition disabled:bg-gray-100"
                    placeholder={currentMode === "signUp" ? "Create a password" : "Enter your password"}
                    disabled={loading}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {currentMode === "signUp" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Must be at least 6 characters
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot Password Link (Only for Sign In) */}
            {currentMode === "signIn" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  disabled={loading}
                  className="text-sm text-black hover:text-gray-700 hover:underline transition-colors disabled:opacity-50 font-medium"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Submit Button */}
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
                  {currentMode === "forgotPassword" 
                    ? "Sending reset link..." 
                    : currentMode === "signUp" 
                    ? "Creating account..." 
                    : "Signing in..."}
                </div>
              ) : (
                <>{currentMode === "forgotPassword" 
                    ? "Send Reset Link" 
                    : currentMode === "signUp" 
                    ? "Create Account" 
                    : "Sign In"}</>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm">
              {currentMode === "forgotPassword" ? (
                <>
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={toggleForgotPassword}
                    disabled={loading}
                    className="text-black font-semibold hover:text-gray-700 hover:underline transition-colors disabled:opacity-50"
                  >
                    Back to Sign In
                  </button>
                </>
              ) : currentMode === "signUp" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    disabled={loading}
                    className="text-black font-semibold hover:text-gray-700 hover:underline transition-colors disabled:opacity-50"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    disabled={loading}
                    className="text-black font-semibold hover:text-gray-700 hover:underline transition-colors disabled:opacity-50"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}