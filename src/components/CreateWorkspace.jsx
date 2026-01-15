import { useContext, useState } from "react";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { AuthContext } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiX } from "react-icons/fi";

export default function CreateWorkspaceModal({ isOpen, onClose }) {
  const { createWorkspace } = useContext(WorkspaceContext);
  const { profile } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (profile?.role !== "admin") return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Workspace name required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createWorkspace(name);
      setName("");
      onClose(); // Close modal after successful creation
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const handleClose = () => {
    setName("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Create New Workspace
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Create a new workspace for your team
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleCreate} className="p-6">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter workspace name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !name.trim()}
                      className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiPlus className="w-5 h-5" />
                      {loading ? "Creating..." : "Create Workspace"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}