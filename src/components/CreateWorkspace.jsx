import { useContext, useState } from "react";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";

export default function CreateWorkspace() {
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
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <motion.form
      onSubmit={handleCreate}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        bg-white
        border
        rounded-2xl
        p-5 sm:p-6
        space-y-4
      "
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Create Workspace
        </h3>
        <p className="text-sm text-gray-500">
          Admins can create and manage workspaces
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="
            flex-1
            border
            px-4 py-3
            rounded-lg
            focus:outline-none
            focus:ring-2 focus:ring-gray-900
          "
          placeholder="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          disabled={loading}
          className="
            px-6 py-3
            bg-gray-900
            text-white
            rounded-lg
            flex items-center justify-center gap-2
            hover:bg-gray-800
            disabled:opacity-50
          "
        >
          <FiPlus />
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </motion.form>
  );
}
