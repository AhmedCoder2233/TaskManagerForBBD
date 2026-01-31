import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { AuthContext } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import CreateWorkspaceModal from "./CreateWorkspace";
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
  FiMail,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiFolder,
  FiTrash2,
  FiUsers,
  FiSettings,
  FiStar,
  FiTrendingUp,
  FiGrid,
  FiHome,
  FiBell,
  FiUser
} from "react-icons/fi";

export default function SidebarLayout({ children }) {
  const { workspaces, loading: workspacesLoading, fetchWorkspaces } = useContext(WorkspaceContext);
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
    total: 0,
    completionRate: 0
  });
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [workspaceDetails, setWorkspaceDetails] = useState({});
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeSection, setActiveSection] = useState("dashboard");
  
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
    // Update active section based on route
    const path = location.pathname;
    if (path.includes('/workspace/')) setActiveSection('workspaces');
    else if (path.includes('/invites')) setActiveSection('invites');
    else if (path.includes('/my-tasks')) setActiveSection('tasks');
    else if (path === '/') setActiveSection('dashboard');
  }, [location.pathname]);

  // Responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
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
            .select('id, status')
            .eq('assigned_to', profile.id);

          if (!error && tasks) {
            const completed = tasks.filter(t => t.status === 'completed').length;
            const total = tasks.length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            const stats = {
              planning: tasks.filter(t => t.status === 'planning').length,
              in_progress: tasks.filter(t => t.status === 'in_progress').length,
              at_risk: tasks.filter(t => t.status === 'at_risk').length,
              update_required: tasks.filter(t => t.status === 'update_required').length,
              on_hold: tasks.filter(t => t.status === 'on_hold').length,
              completed: completed,
              total: total,
              completionRate: completionRate
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

  // Fetch assigned tasks with details
  useEffect(() => {
    const fetchAssignedTasks = async () => {
      if (profile?.id) {
        try {
          setLoadingTasks(true);
          const { data: tasks, error } = await supabase
            .from('tasks')
            .select(`
              id, 
              title, 
              status, 
              created_at, 
              due_date,
              priority,
              workspace_id
            `)
            .eq('assigned_to', profile.id)
            .order('created_at', { ascending: false })
            .limit(5);

          if (!error && tasks) {
            const tasksWithWorkspaceNames = await Promise.all(
              tasks.map(async (task) => {
                if (task.workspace_id) {
                  const { data: workspace, error: workspaceError } = await supabase
                    .from('workspaces')
                    .select('name')
                    .eq('id', task.workspace_id)
                    .single();

                  if (!workspaceError && workspace) {
                    return {
                      ...task,
                      workspace_name: workspace.name
                    };
                  }
                }
                return {
                  ...task,
                  workspace_name: 'No workspace'
                };
              })
            );

            setAssignedTasks(tasksWithWorkspaceNames);
          }
        } catch (error) {
          console.error('Error fetching assigned tasks:', error);
        } finally {
          setLoadingTasks(false);
        }
      }
    };

    fetchAssignedTasks();
  }, [profile?.id]);

  // Fetch workspace details
  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      if (workspaces?.length > 0) {
        try {
          const details = {};
          
          for (const workspace of workspaces) {
            // Fetch tasks count
            const { count, error } = await supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('workspace_id', workspace.id);

            // Store workspace details
            details[workspace.id] = {
              total_tasks: error ? 0 : count || 0,
              created_at: workspace.created_at
            };
          }
          
          setWorkspaceDetails(details);
        } catch (error) {
          console.error('Error fetching workspace details:', error);
        }
      }
    };

    fetchWorkspaceDetails();
  }, [workspaces]);

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

    // Real-time subscription
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

  // Real-time subscription for tasks
  useEffect(() => {
    if (profile?.id) {
      const channel = supabase
        .channel('tasks_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `assigned_to=eq.${profile.id}`
          },
          () => {
            fetchUserTaskStats();
            fetchAssignedTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);

  // Fetch notifications count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (profile?.id) {
        try {
          const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('read', false);

          if (!error) {
            setNotificationCount(count || 0);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };

    fetchNotifications();
  }, [profile?.id]);

  // Handle workspace delete
  const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
    setDeletingWorkspaceId(workspaceId);
    setDeleteError(null);

    try {
      // Delete workspace tasks
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('workspace_id', workspaceId);

      if (tasksError) {
        console.error('Error deleting tasks:', tasksError);
        setDeleteError('Failed to delete tasks');
        return;
      }

      // Delete workspace members
      const { error: membersError } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId);

      if (membersError) {
        console.error('Error deleting members:', membersError);
        setDeleteError('Failed to delete workspace members');
        return;
      }

      // Delete the workspace
      const { error: workspaceError } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (workspaceError) {
        console.error('Error deleting workspace:', workspaceError);
        setDeleteError('Failed to delete workspace');
        return;
      }

      // Refresh workspaces list
      await fetchWorkspaces();
      
      // Navigate to /workspaces route after delete
      navigate('/workspaces');

    } catch (error) {
      console.error('Error in delete workspace:', error);
      setDeleteError('Unexpected error occurred');
    } finally {
      setDeletingWorkspaceId(null);
    }
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

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 overflow-hidden">
      {/* Create Workspace Modal */}
      <CreateWorkspaceModal 
        isOpen={showCreateWorkspaceModal}
        onClose={() => setShowCreateWorkspaceModal(false)}
      />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-purple-100 z-40 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
        >
          {isMobileSidebarOpen ? (
            <FiX className="w-6 h-6 text-purple-700" />
          ) : (
            <FiMenu className="w-6 h-6 text-purple-700" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
            <FiGrid className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Workspace Pro
          </span>
        </div>
        <div className="flex items-center gap-2">
          {notificationCount > 0 && (
            <button className="relative p-2">
              <FiBell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
        </div>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 320 : 80
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-col bg-white/95 backdrop-blur-sm border-r border-purple-100 shadow-xl relative z-30"
      >
        <SidebarContent 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
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
          onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
          assignedTasks={assignedTasks}
          workspaceDetails={workspaceDetails}
          loadingTasks={loadingTasks}
          handleDeleteWorkspace={handleDeleteWorkspace}
          deletingWorkspaceId={deletingWorkspaceId}
          deleteError={deleteError}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          notificationCount={notificationCount}
        />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden fixed top-16 left-0 bottom-0 w-80 bg-white/95 backdrop-blur-sm border-r border-purple-100 z-40 overflow-y-auto shadow-2xl"
          >
            <SidebarContent 
              isSidebarOpen={true}
              setIsSidebarOpen={() => {}}
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
              onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
              assignedTasks={assignedTasks}
              workspaceDetails={workspaceDetails}
              loadingTasks={loadingTasks}
              handleDeleteWorkspace={handleDeleteWorkspace}
              deletingWorkspaceId={deletingWorkspaceId}
              deleteError={deleteError}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              notificationCount={notificationCount}
              isMobile={true}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-0' : ''}`}>
        <div className={`h-full ${isSidebarOpen ? '' : 'lg:max-w-full lg:mx-auto'}`}>
          <div className="pt-16 lg:pt-0 h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarContent({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
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
  onOpenCreateWorkspace,
  assignedTasks,
  workspaceDetails,
  loadingTasks,
  handleDeleteWorkspace,
  deletingWorkspaceId,
  deleteError,
  activeSection,
  setActiveSection,
  notificationCount,
  isMobile = false
}) {
  const location = useLocation();
  const [hoveredWorkspace, setHoveredWorkspace] = useState(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(true);

  const sidebarRef = useRef(null);

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { 
          icon: <FiCheckCircle className="w-3.5 h-3.5" />,
          color: 'text-emerald-600',
          bg: 'bg-emerald-100',
          label: 'Completed'
        };
      case 'in_progress':
        return { 
          icon: <FiClock className="w-3.5 h-3.5" />,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          label: 'In Progress'
        };
      case 'at_risk':
        return { 
          icon: <FiAlertCircle className="w-3.5 h-3.5" />,
          color: 'text-red-600',
          bg: 'bg-red-100',
          label: 'At Risk'
        };
      case 'update_required':
        return { 
          icon: <FiAlertCircle className="w-3.5 h-3.5" />,
          color: 'text-amber-600',
          bg: 'bg-amber-100',
          label: 'Update Required'
        };
      case 'planning':
        return { 
          icon: <FiCalendar className="w-3.5 h-3.5" />,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
          label: 'Planning'
        };
      case 'on_hold':
        return { 
          icon: <FiAlertCircle className="w-3.5 h-3.5" />,
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          label: 'On Hold'
        };
      default:
        return { 
          icon: <FiCalendar className="w-3.5 h-3.5" />,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          label: status
        };
    }
  };


  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'N/A';
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (workspaceId, workspaceName) => {
    setWorkspaceToDelete({ id: workspaceId, name: workspaceName });
    setShowDeleteConfirm(true);
  };

  // Handle delete action
  const handleDeleteAction = () => {
    if (workspaceToDelete) {
      handleDeleteWorkspace(workspaceToDelete.id, workspaceToDelete.name);
      setShowDeleteConfirm(false);
      setWorkspaceToDelete(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setWorkspaceToDelete(null);
  };

  // Navigation items
  const navItems = [
    { id: 'home', label: 'Home', icon: FiHome, path: '/' },
    { id: 'invites', label: 'Invites', icon: FiMail, path: '/invites', count: pendingInvitesCount },
  ];

  const isActivePath = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="flex flex-col h-full" ref={sidebarRef}>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-purple-100"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 bg-red-100 rounded-xl">
                  <FiAlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Delete Workspace</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Are you sure you want to delete <span className="font-semibold text-purple-700">"{workspaceToDelete?.name}"</span>?
                  </p>
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700 font-medium">
                      ⚠️ This will permanently delete all tasks, members, and data. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              
              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{deleteError}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleCancelDelete}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  disabled={deletingWorkspaceId === workspaceToDelete?.id}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAction}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={deletingWorkspaceId === workspaceToDelete?.id}
                >
                  {deletingWorkspaceId === workspaceToDelete?.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Workspace'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo & Toggle */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-purple-100 flex-shrink-0">
        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <FiGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Workspace Pro
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {userTaskStats.total} tasks • {userTaskStats.completionRate}% complete
                </p>
              </div>
            </div>
            {!isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-purple-50 rounded-xl transition-all duration-200"
                title="Collapse sidebar"
              >
                <FiChevronLeft className="w-5 h-5 text-purple-600" />
              </button>
            )}
          </>
        ) : (
          <div className="w-full flex flex-col items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center hover:bg-purple-50 rounded-xl transition-all duration-200"
              title="Expand sidebar"
            >
              <FiChevronRight className="w-5 h-5 text-purple-600" />
            </button>
            <div className="mt-2 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <FiGrid className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {isSidebarOpen && (
        <div className="px-4 py-4 border-b border-purple-100 flex-shrink-0">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white/50 backdrop-blur-sm"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 mb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id || isActivePath(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 mb-1 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-l-4 border-purple-600' 
                    : 'text-gray-600 hover:bg-purple-50/50 hover:text-purple-600 border-l-4 border-transparent'
                }`}
                title={!isSidebarOpen ? item.label : ''}
              >
                <div className={`relative ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-purple-500'}`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.count > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      isActive ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                    }`}>
                      {item.count > 9 ? '9+' : item.count}
                    </span>
                  )}
                </div>
                {isSidebarOpen && (
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.count > 0 && !isActive && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* My Tasks Overview */}
        {isSidebarOpen && userTaskStats.total > 0 && (
          <div className="px-3 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                    <FiClipboard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">Task Overview</span>
                    <div className="text-xs text-gray-500">
                      {userTaskStats.completed} of {userTaskStats.total} completed
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-600">Progress</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {userTaskStats.completionRate}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Completion</span>
                  <span className="font-semibold text-purple-700">
                    {userTaskStats.completed}/{userTaskStats.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${userTaskStats.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 bg-white rounded-lg border border-purple-100">
                  <div className="text-xs font-semibold text-blue-600">{userTaskStats.in_progress}</div>
                  <div className="text-[10px] text-gray-500">In Progress</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-purple-100">
                  <div className="text-xs font-semibold text-amber-600">{userTaskStats.planning}</div>
                  <div className="text-[10px] text-gray-500">Planning</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-purple-100">
                  <div className="text-xs font-semibold text-red-600">{userTaskStats.at_risk}</div>
                  <div className="text-[10px] text-gray-500">At Risk</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workspaces Section */}
        <div className="px-2">
          {isSidebarOpen && (
            <div className="flex items-center justify-between px-3 py-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  My Workspaces
                </span>
                {workspaces && (
                  <span className="text-xs text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">
                    {workspaces.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <button
                    onClick={onOpenCreateWorkspace}
                    className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors"
                    title="New Workspace"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setExpandedWorkspaces(!expandedWorkspaces)}
                  className="p-1.5 hover:bg-purple-50 rounded-lg text-gray-500 transition-colors"
                  title={expandedWorkspaces ? "Collapse" : "Expand"}
                >
                  {expandedWorkspaces ? (
                    <FiChevronUp className="w-4 h-4" />
                  ) : (
                    <FiChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
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
                {workspacesLoading && isSidebarOpen ? (
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-3 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded"></div>
                        <div className="w-24 h-2 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                ) : workspaces && workspaces.length > 0 ? (
                  workspaces.map((workspace) => {
                    const isActive = location.pathname.includes(`/workspace/${workspace.id}`);
                    const details = workspaceDetails[workspace.id] || {};
                    const totalTasks = details.total_tasks || 0;
                    
                    return (
                      <div 
                        key={workspace.id}
                        className="relative group"
                        onMouseEnter={() => setHoveredWorkspace(workspace.id)}
                        onMouseLeave={() => setHoveredWorkspace(null)}
                      >
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="relative"
                        >
                          <div
                            onClick={() => navigate(`/workspace/${workspace.id}`)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                              isActive 
                                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600 shadow-sm' 
                                : 'hover:bg-purple-50/50 border-l-4 border-transparent'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                              isActive 
                                ? 'bg-gradient-to-br from-purple-600 to-indigo-600' 
                                : 'bg-gradient-to-br from-purple-100 to-indigo-100'
                            }`}>
                              <span className={`font-bold text-sm ${
                                isActive ? 'text-white' : 'text-purple-700'
                              }`}>
                                {workspace.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {isSidebarOpen && (
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-semibold text-sm text-gray-900 truncate">
                                    {workspace.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {totalTasks > 0 && (
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                                        isActive 
                                          ? 'bg-purple-600 text-white' 
                                          : 'bg-purple-100 text-purple-700'
                                      }`}>
                                        {totalTasks}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <FiCalendar className="w-3 h-3" />
                                  <span>Created {formatDate(details.created_at)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Delete Button */}
                          {isAdmin && hoveredWorkspace === workspace.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConfirm(workspace.id, workspace.name);
                              }}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all duration-200 ${
                                isSidebarOpen
                                  ? 'bg-white shadow-md border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                              title="Delete workspace"
                              disabled={deletingWorkspaceId === workspace.id}
                            >
                              {deletingWorkspaceId === workspace.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FiTrash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </motion.div>
                      </div>
                    );
                  })
                ) : isSidebarOpen ? (
                  <div className="text-center py-6 px-3">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                      <FiFolder className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">No workspaces yet</p>
                    {isAdmin && (
                      <button
                        onClick={onOpenCreateWorkspace}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Create your first workspace →
                      </button>
                    )}
                  </div>
                ) : null}

                {/* Collapsed View - Create Workspace for Admin */}
                {isAdmin && !isSidebarOpen && (
                  <button
                    onClick={onOpenCreateWorkspace}
                    className="w-10 h-10 mx-auto mt-2 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    title="New Workspace"
                  >
                    <FiPlus className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-purple-100 p-4 flex-shrink-0 bg-gradient-to-t from-white to-purple-50/30">
        {isSidebarOpen ? (
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-base">
                    {profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                  {userTaskStats.total > 9 ? '9+' : userTaskStats.total}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {profile?.name || 'User'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-lg font-medium">
                    {profile?.role || 'User'}
                  </span>
                  {notificationCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-lg font-medium">
                      {notificationCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-2">
                  {profile?.email || ''}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2">
            
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => navigate('/profile')}
                title="Profile"
              >
                <span className="text-white font-bold text-base">
                  {profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              {userTaskStats.total > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                  {userTaskStats.total > 9 ? '9+' : userTaskStats.total}
                </div>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}