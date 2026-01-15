import { useState, useContext } from "react";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiUserPlus, FiCheck, FiX } from "react-icons/fi";
import { HiOutlineSparkles, HiOutlineShieldCheck } from "react-icons/hi";

export default function InviteUser({ workspaceId }) {
  const { inviteUserByEmail } = useContext(WorkspaceContext);
  const { profile } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState([]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setIsLoading(true);

    if (profile?.role !== "admin") {
      setError("Only admins can invite users to workspaces");
      setIsLoading(false);
      return;
    }

    try {
      await inviteUserByEmail(workspaceId, email);
      setMsg("Invite sent successfully!");
      setInvitedUsers(prev => [...prev, { email, timestamp: new Date().toISOString() }]);
      setEmail("");
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setError(err.message);
      
      // Auto-hide error message after 4 seconds
      setTimeout(() => setError(""), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin status indicator with badge
  const AdminBadge = () => (
    <motion.div 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-50 to-red-50 border border-red-100"
    >
      <HiOutlineShieldCheck className="w-4 h-4 text-red-600" />
      <span className="text-xs font-medium text-red-700">Workspace Admin</span>
    </motion.div>
  );

  // Loading spinner animation
  const LoadingSpinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
    />
  );

  // Hide for non-admins
  if (profile?.role !== "admin") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <FiUserPlus className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invite Members</h3>
            <p className="text-sm text-gray-500">Manage workspace access</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <HiOutlineShieldCheck className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Admin Access Required</p>
              <p className="text-xs text-red-600">Only workspace admins can invite new members</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Header with Admin Badge */}
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 5 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg"
            >
              <FiUserPlus className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Invite Members</h3>
              <p className="text-sm text-gray-500">Add collaborators to your workspace</p>
            </div>
          </div>
          <AdminBadge />
        </div>
      </div>

      {/* Invite Form - Always Visible */}
      <motion.form
        onSubmit={handleInvite}
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Success Message */}
        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <FiCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Invite Sent!</p>
                <p className="text-xs text-green-600">Check will appear in user's notifications</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <FiX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Unable to send invite</p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Input with Floating Label */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl bg-white/50 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none transition-all"
            placeholder="name@company.com"
            required
          />
        </div>

        {/* Submit Button with Animation */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 px-4 bg-gradient-to-r from-red-600 to-red-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>Sending Invite...</span>
            </>
          ) : (
            <>
              <HiOutlineSparkles className="w-5 h-5" />
              <span>Send Invitation</span>
            </>
          )}
        </motion.button>

        {/* Recent Invites Section */}
        {invitedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pt-4 border-t border-gray-100"
          >
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Invites</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {invitedUsers.map((user, index) => (
                <motion.div
                  key={`${user.email}-${user.timestamp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg hover:border-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-100 to-red-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-red-600">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                  >
                    Sent
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Help Text */}
        <div className="pt-2">
          <p className="text-xs text-gray-500 text-center">
            Users will receive an email notification and see the invite in their dashboard
          </p>
        </div>
      </motion.form>
    </motion.div>
  );
}