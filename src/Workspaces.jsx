import { useContext, useState } from "react";
import { WorkspaceContext } from "./context/WorkspaceContext";
import CreateWorkspace from "./components/CreateWorkspace";
import { motion } from "framer-motion";
import { FiSearch, FiGrid } from "react-icons/fi";

export default function Workspaces() {
  const { workspaces, loading } = useContext(WorkspaceContext);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter workspaces based on search
  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Workspaces
              </h1>
              <p className="text-gray-600">
                Select a workspace from the sidebar to get started
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full sm:w-64 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-black focus:border-black focus:outline-none transition-colors"
                  placeholder="Search workspaces..."
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label="Clear search"
                  >
                    <span className="text-gray-400 hover:text-gray-600 text-xl">×</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <FiGrid className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Workspaces
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                To get started, please select a workspace from the sidebar menu. 
                Each workspace contains its own tasks, members, and activities.
              </p>
              <div className="bg-gray-50 rounded-lg p-6 max-w-xl mx-auto">
                <h3 className="font-semibold text-gray-900 mb-3">How to begin:</h3>
                <ol className="text-left text-gray-600 space-y-2 list-decimal pl-5">
                  <li>Look for the sidebar menu on the left side of your screen</li>
                  <li>Click on any workspace name to open it</li>
                  <li>If you don't see any workspaces, create one using the button above</li>
                  <li>Once inside a workspace, you can create tasks, invite members, and track progress</li>
                </ol>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Workspace List (Only shown if there are workspaces) */}
        {workspaces.length > 0 && (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Your Workspaces ({filteredWorkspaces.length})
                  </h2>
                  <p className="text-sm text-gray-600">
                    Available workspaces you can select from the sidebar
                  </p>
                </div>
              </div>
            </div>

            {/* Simple Workspace Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FiSearch className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No matching workspaces
                </h3>
                <p className="text-gray-600">
                  No results found for "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkspaces.map((ws, index) => (
                  <motion.div
                    key={ws.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {ws.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {ws.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Select from sidebar to open
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}