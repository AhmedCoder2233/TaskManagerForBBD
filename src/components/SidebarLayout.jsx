import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import CreateWorkspaceModal from "./CreateWorkspace"; // Import modal
import { 
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
  FiPlus,
  FiLogOut,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiClipboard,
  FiMail
} from "react-icons/fi";

export default function SidebarLayout({ children }) {
  const { workspaces, loading: workspacesLoading } = useContext(WorkspaceContext);
  const { profile, logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTaskStats, setUserTaskStats] = useState({
    planning: 0,
    in_progress: 0,
    at_risk: 0,
    update_required: 0,
    on_hold: 0,
    completed: 0,
    total: 0
  });
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false); // Modal state
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user task statistics
  useEffect(() => {
    const fetchUserTaskStats = async () => {
      if (profile?.id) {
        try {
          const { data: tasks, error } = await supabase
            .from('tasks')
            .select('status')
            .eq('assigned_to', profile.id);

          if (!error && tasks) {
            const stats = {
              planning: tasks.filter(t => t.status === 'planning').length,
              in_progress: tasks.filter(t => t.status === 'in_progress').length,
              at_risk: tasks.filter(t => t.status === 'at_risk').length,
              update_required: tasks.filter(t => t.status === 'update_required').length,
              on_hold: tasks.filter(t => t.status === 'on_hold').length,
              completed: tasks.filter(t => t.status === 'completed').length,
              total: tasks.length
            };
            setUserTaskStats(stats);
          }
        } catch (error) {
          console.error('Error fetching user task stats:', error);
        }
      }
    };

    fetchUserTaskStats();
  }, [profile?.id]);

  // Fetch pending invites count
  useEffect(() => {
    const fetchPendingInvites = async () => {
      if (profile?.email) {
        try {
          const { count, error } = await supabase
            .from('workspace_invites')
            .select('*', { count: 'exact', head: true })
            .eq('email', profile.email)
            .eq('status', 'pending');

          if (!error) {
            setPendingInvitesCount(count || 0);
          }
        } catch (error) {
          console.error('Error fetching pending invites:', error);
        }
      }
    };

    fetchPendingInvites();

    // Set up real-time subscription for invite changes
    const channel = supabase
      .channel('invites_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_invites',
          filter: `email=eq.${profile?.email}`
        },
        () => {
          fetchPendingInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.email]);

  const isActivePath = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const filteredWorkspaces = workspaces?.filter(ws =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Create Workspace Modal */}
      <CreateWorkspaceModal 
        isOpen={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
      />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMobileSidebarOpen ? (
            <FiX className="w-6 h-6 text-gray-700" />
          ) : (
            <FiMenu className="w-6 h-6 text-gray-700" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-bold text-gray-900">Workspace</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 72
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col bg-white border-r border-gray-200 relative z-30"
      >
        <SidebarContent 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isActivePath={isActivePath}
          expandedWorkspaces={expandedWorkspaces}
          setExpandedWorkspaces={setExpandedWorkspaces}
          navigate={navigate}
          workspaces={filteredWorkspaces}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          profile={profile}
          handleSignOut={handleSignOut}
          userTaskStats={userTaskStats}
          workspacesLoading={workspacesLoading}
          isAdmin={isAdmin}
          pendingInvitesCount={pendingInvitesCount}
          onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)} // Pass function to open modal
        />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden fixed top-16 left-0 bottom-0 w-72 bg-white border-r border-gray-200 z-40 overflow-y-auto"
          >
            <SidebarContent 
              isSidebarOpen={true}
              setIsSidebarOpen={() => {}}
              isActivePath={isActivePath}
              expandedWorkspaces={expandedWorkspaces}
              setExpandedWorkspaces={setExpandedWorkspaces}
              navigate={navigate}
              workspaces={filteredWorkspaces}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              profile={profile}
              handleSignOut={handleSignOut}
              userTaskStats={userTaskStats}
              workspacesLoading={workspacesLoading}
              isAdmin={isAdmin}
              pendingInvitesCount={pendingInvitesCount}
              onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)} // Pass function to open modal
              isMobile={true}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className={`transition-all duration-300 ${isSidebarOpen ? '' : 'md:max-w-full md:mx-auto'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarContent({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  isActivePath, 
  expandedWorkspaces,
  setExpandedWorkspaces,
  navigate,
  workspaces,
  searchQuery,
  setSearchQuery,
  profile,
  handleSignOut,
  userTaskStats,
  workspacesLoading,
  isAdmin,
  pendingInvitesCount,
  onOpenCreateWorkspace, // Add this prop
  isMobile = false
}) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo & Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">Workspace</span>
            </div>
            {!isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                title="Collapse sidebar"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors mx-auto"
            title="Expand sidebar"
          >
            <FiChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      {isSidebarOpen && (
        <div className="px-3 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        
        {/* Invites Button */}
        <div className="px-2 mb-4">
          <button
            onClick={() => navigate('/invites')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              isActivePath('/invites') 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={isSidebarOpen ? '' : 'Invites'}
          >
            <div className="relative">
              <FiMail className="w-5 h-5 flex-shrink-0" />
              {pendingInvitesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {pendingInvitesCount > 9 ? '9+' : pendingInvitesCount}
                </span>
              )}
            </div>
            {isSidebarOpen && (
              <>
                <span className="flex-1 text-left font-medium text-sm">Invites</span>
                {pendingInvitesCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActivePath('/invites') ? 'bg-white text-gray-900' : 'bg-red-500 text-white'
                  }`}>
                    {pendingInvitesCount}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* My Tasks Section */}
        {isSidebarOpen && userTaskStats.total > 0 && (
          <div className="px-2 mb-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FiClipboard className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-bold text-gray-900">My Tasks</span>
                <span className="ml-auto px-2 py-0.5 bg-gray-900 text-white rounded-full text-xs font-semibold">
                  {userTaskStats.total}
                </span>
              </div>

              {/* Task Status Breakdown */}
              <div className="space-y-2 mb-3">
                {userTaskStats.in_progress > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      <span className="text-gray-600">In Progress</span>
                    </div>
                    <span className="font-semibold text-gray-900">{userTaskStats.in_progress}</span>
                  </div>
                )}
                {userTaskStats.at_risk > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                      <span className="text-gray-600">At Risk</span>
                    </div>
                    <span className="font-semibold text-gray-900">{userTaskStats.at_risk}</span>
                  </div>
                )}
                {userTaskStats.update_required > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-gray-600">Update Required</span>
                    </div>
                    <span className="font-semibold text-amber-700">{userTaskStats.update_required}</span>
                  </div>
                )}
                {userTaskStats.completed > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-gray-600">Completed</span>
                    </div>
                    <span className="font-semibold text-emerald-600">{userTaskStats.completed}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Completion</span>
                  <span className="font-semibold text-emerald-600">
                    {userTaskStats.total > 0 ? Math.round((userTaskStats.completed / userTaskStats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${userTaskStats.total > 0 ? (userTaskStats.completed / userTaskStats.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed View - My Tasks */}
        {!isSidebarOpen && userTaskStats.total > 0 && (
          <div className="px-2 mb-4">
            <div 
              className="w-full p-2 bg-gray-100 rounded-lg relative group"
              title={`My Tasks: ${userTaskStats.total}`}
            >
              <FiClipboard className="w-5 h-5 text-gray-700 mx-auto" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white rounded-full text-xs font-semibold flex items-center justify-center">
                {userTaskStats.total > 99 ? '99+' : userTaskStats.total}
              </span>
            </div>
          </div>
        )}

        {/* Workspaces Section */}
        <div className="px-2">
          {isSidebarOpen && (
            <button
              onClick={() => setExpandedWorkspaces(!expandedWorkspaces)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors mb-2"
            >
              <span>Workspaces</span>
              {expandedWorkspaces ? (
                <FiChevronUp className="w-4 h-4" />
              ) : (
                <FiChevronDown className="w-4 h-4" />
              )}
            </button>
          )}

          <AnimatePresence>
            {(expandedWorkspaces || !isSidebarOpen) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1"
              >
                {workspacesLoading ? (
                  isSidebarOpen ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                  ) : null
                ) : workspaces && workspaces.length > 0 ? (
                  workspaces.map((workspace) => {
                    const isActive = location.pathname.includes(`/workspace/${workspace.id}`);
                    
                    return (
                      <button
                        key={workspace.id}
                        onClick={() => navigate(`/workspace/${workspace.id}`)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        title={isSidebarOpen ? '' : workspace.name}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-gray-900' : 'bg-gray-200'
                        }`}>
                          <span className={`font-semibold text-sm ${
                            isActive ? 'text-white' : 'text-gray-700'
                          }`}>
                            {workspace.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {isSidebarOpen && (
                          <span className="flex-1 text-left font-medium text-sm truncate">
                            {workspace.name}
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : isSidebarOpen ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No workspaces found
                  </div>
                ) : null}

                {/* Create New Workspace Button - Only for Admin */}
                {isAdmin && isSidebarOpen && (
                  <button
                    onClick={onOpenCreateWorkspace} // Use modal open function
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-all border-2 border-dashed border-gray-300 hover:border-gray-400 mt-2"
                  >
                    <FiPlus className="w-5 h-5" />
                    <span className="text-sm font-medium">New Workspace</span>
                  </button>
                )}

                {/* Collapsed View - Create Workspace for Admin */}
                {isAdmin && !isSidebarOpen && (
                  <button
                    onClick={onOpenCreateWorkspace} // Use modal open function
                    className="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-all border-2 border-dashed border-gray-300 hover:border-gray-400 mt-2"
                    title="New Workspace"
                  >
                    <FiPlus className="w-5 h-5 mx-auto" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0">
        {isSidebarOpen ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {profile?.name || 'User'}
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                 Role: {profile?.role || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {profile?.email || ''}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-semibold text-sm">
                {profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5 text-gray-600 mx-auto" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}