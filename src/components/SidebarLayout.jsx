import { useState, useContext, useEffect } from "react";
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
  FiTrash2
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
    earliestTaskDate: null
  });
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [workspaceDetails, setWorkspaceDetails] = useState({});
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  
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
            .select('id, status, created_at')
            .eq('assigned_to', profile.id);

          if (!error && tasks) {
            let earliestDate = null;
            if (tasks.length > 0) {
              const validDates = tasks
                .map(t => new Date(t.created_at))
                .filter(date => !isNaN(date.getTime()));
              
              if (validDates.length > 0) {
                const timestamps = validDates.map(d => d.getTime());
                earliestDate = new Date(Math.min(...timestamps));
              }
            }

            const stats = {
              planning: tasks.filter(t => t.status === 'planning').length,
              in_progress: tasks.filter(t => t.status === 'in_progress').length,
              at_risk: tasks.filter(t => t.status === 'at_risk').length,
              update_required: tasks.filter(t => t.status === 'update_required').length,
              on_hold: tasks.filter(t => t.status === 'on_hold').length,
              completed: tasks.filter(t => t.status === 'completed').length,
              total: tasks.length,
              earliestTaskDate: earliestDate
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
            .limit(8);

          if (!error && tasks) {
            // Get workspace names for each task
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
            // Refresh tasks
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
          width: isSidebarOpen ? 360 : 72
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
          onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
          assignedTasks={assignedTasks}
          workspaceDetails={workspaceDetails}
          loadingTasks={loadingTasks}
          handleDeleteWorkspace={handleDeleteWorkspace}
          deletingWorkspaceId={deletingWorkspaceId}
          deleteError={deleteError}
        />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.aside
            initial={{ x: -360 }}
            animate={{ x: 0 }}
            exit={{ x: -360 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden fixed top-16 left-0 bottom-0 w-80 bg-white border-r border-gray-200 z-40 overflow-y-auto"
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
              onOpenCreateWorkspace={() => setShowCreateWorkspaceModal(true)}
              assignedTasks={assignedTasks}
              workspaceDetails={workspaceDetails}
              loadingTasks={loadingTasks}
              handleDeleteWorkspace={handleDeleteWorkspace}
              deletingWorkspaceId={deletingWorkspaceId}
              deleteError={deleteError}
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
  onOpenCreateWorkspace,
  assignedTasks,
  workspaceDetails,
  loadingTasks,
  handleDeleteWorkspace,
  deletingWorkspaceId,
  deleteError,
  isMobile = false
}) {
  const location = useLocation();
  const [hoveredWorkspace, setHoveredWorkspace] = useState(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { 
          icon: <FiCheckCircle className="w-3.5 h-3.5" />,
          color: 'text-emerald-500',
          bg: 'bg-emerald-100',
          label: 'Completed'
        };
      case 'in_progress':
        return { 
          icon: <FiClock className="w-3.5 h-3.5" />,
          color: 'text-blue-500',
          bg: 'bg-blue-100',
          label: 'In Progress'
        };
      case 'at_risk':
        return { 
          icon: <FiAlertCircle className="w-3.5 h-3.5" />,
          color: 'text-red-500',
          bg: 'bg-red-100',
          label: 'At Risk'
        };
      case 'update_required':
        return { 
          icon: <FiAlertCircle className="w-3.5 h-3.5" />,
          color: 'text-amber-500',
          bg: 'bg-amber-100',
          label: 'Update Required'
        };
      case 'planning':
        return { 
          icon: <FiCalendar className="w-3.5 h-3.5" />,
          color: 'text-gray-500',
          bg: 'bg-gray-100',
          label: 'Planning'
        };
      case 'on_hold':
        return { 
          icon: <FiAlertCircle className="w-3.5 h-3.5" />,
          color: 'text-yellow-500',
          bg: 'bg-yellow-100',
          label: 'On Hold'
        };
      default:
        return { 
          icon: <FiCalendar className="w-3.5 h-3.5" />,
          color: 'text-gray-500',
          bg: 'bg-gray-100',
          label: status
        };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // ✅ FIXED: Format created_at to show only date (YYYY-MM-DD)
  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Create date object from the string
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date string:', dateString);
        return 'N/A';
      }
      
      // Get local date components (date only)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Format: YYYY-MM-DD
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
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

  return (
    <div className="flex flex-col h-full">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Workspace</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete workspace "{workspaceToDelete?.name}"?
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This will permanently delete all tasks, members, and data in this workspace.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{deleteError}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={deletingWorkspaceId === workspaceToDelete?.id}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAction}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          </div>
        </div>
      )}

      {/* Logo & Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 text-lg">Workspace</span>
                {userTaskStats.total > 0 && (
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <FiClipboard className="w-3 h-3" />
                    <span>{userTaskStats.total} tasks assigned</span>
                  </div>
                )}
              </div>
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
            title={isSidebarOpen ? '' : `Invites (${pendingInvitesCount})`}
          >
            <div className="relative">
              <FiMail className="w-5 h-5 flex-shrink-0" />
              {pendingInvitesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
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

        {/* My Assigned Tasks Section */}
        {isSidebarOpen && (
          <div className="px-2 mb-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-900 rounded-lg">
                    <FiClipboard className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">My Assigned Tasks</span>
                    <div className="text-xs text-gray-500">
                      Total: {userTaskStats.total}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-600">Completion</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {userTaskStats.total > 0 ? Math.round((userTaskStats.completed / userTaskStats.total) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Recent Assigned Tasks */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  Recent Tasks ({assignedTasks.length})
                </h4>
                {loadingTasks ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500">Loading tasks...</div>
                  </div>
                ) : assignedTasks.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {assignedTasks.map((task) => {
                      const statusInfo = getStatusInfo(task.status);
                      
                      return (
                        <div 
                          key={task.id}
                          className="p-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer hover:shadow-sm"
                          onClick={() => navigate(`/task/${task.id}`)}
                          title={`${task.title}\nStatus: ${statusInfo.label}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`p-1 rounded ${statusInfo.bg}`}>
                                  {statusInfo.icon}
                                </span>
                                <span className={`text-xs font-semibold ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                                {task.priority && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-medium text-gray-900 truncate mb-1">
                                {task.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                                <span className="text-gray-500 flex items-center gap-1">
                                  <FiFolder className="w-3 h-3" />
                                  {task.workspace_name || 'No workspace'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
                    <FiClipboard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No tasks assigned yet</p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-emerald-600">
                    {userTaskStats.completed}/{userTaskStats.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
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
              className="w-full p-2 bg-gray-100 rounded-lg relative group cursor-pointer"
              title={`My Tasks\nTotal: ${userTaskStats.total}`}
              onClick={() => navigate('/my-tasks')}
            >
              <FiClipboard className="w-5 h-5 text-gray-700 mx-auto" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white rounded-full text-xs font-semibold flex items-center justify-center">
                {userTaskStats.total > 99 ? '99+' : userTaskStats.total}
              </span>
            </div>
          </div>
        )}

        {/* Workspaces Section with Delete Button */}
        <div className="px-2">
          {isSidebarOpen && (
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Workspaces
                </span>
                {workspaces && (
                  <span className="text-xs text-gray-400">
                    ({workspaces.length})
                  </span>
                )}
              </div>
              <button
                onClick={() => setExpandedWorkspaces(!expandedWorkspaces)}
                className="p-1 hover:bg-gray-100 rounded"
                title={expandedWorkspaces ? "Collapse" : "Expand"}
              >
                {expandedWorkspaces ? (
                  <FiChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <FiChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
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
                {workspacesLoading ? (
                  isSidebarOpen ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Loading workspaces...</div>
                  ) : null
                ) : workspaces && workspaces.length > 0 ? (
                  workspaces.map((workspace) => {
                    const isActive = location.pathname.includes(`/workspace/${workspace.id}`);
                    const details = workspaceDetails[workspace.id] || {};
                    const totalTasks = details.total_tasks || 0;
                    const createdDate = details.created_at || workspace.created_at;
                    const formattedDate = formatDateOnly(createdDate);
                    
                    return (
                      <div 
                        key={workspace.id}
                        className="relative group"
                        onMouseEnter={() => setHoveredWorkspace(workspace.id)}
                        onMouseLeave={() => setHoveredWorkspace(null)}
                      >
                        <div
                          onClick={() => navigate(`/workspace/${workspace.id}`)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-gray-100 text-gray-900 border-l-4 border-gray-900' 
                              : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'bg-gray-900' : 'bg-gray-200'
                          }`}>
                            <span className={`font-semibold text-sm ${
                              isActive ? 'text-white' : 'text-gray-700'
                            }`}>
                              {workspace.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {isSidebarOpen && (
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-medium text-sm truncate">
                                  {workspace.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  {totalTasks > 0 && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 min-w-[24px] flex items-center justify-center ${
                                      isActive ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                      {totalTasks}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <FiCalendar className="w-3 h-3" />
                                    {formattedDate}
                                  </span>
                                </div>
                                {/* Only delete button for admin */}
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteConfirm(workspace.id, workspace.name);
                                    }}
                                    className="p-1 hover:bg-red-100 rounded text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Quick Delete Button for collapsed view */}
                        {isAdmin && !isSidebarOpen && hoveredWorkspace === workspace.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirm(workspace.id, workspace.name);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10"
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
                      </div>
                    );
                  })
                ) : isSidebarOpen ? (
                  <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg mx-2">
                    <FiFolder className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No workspaces found</p>
                    {searchQuery && (
                      <p className="text-xs text-gray-400 mt-1">Try a different search</p>
                    )}
                  </div>
                ) : null}

                {/* Create New Workspace Button - Only for Admin */}
                {isAdmin && isSidebarOpen && (
                  <button
                    onClick={onOpenCreateWorkspace}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-all border-2 border-dashed border-gray-300 hover:border-gray-400 mt-2 mx-2"
                  >
                    <div className="w-9 h-9 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <FiPlus className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium">New Workspace</span>
                      <p className="text-xs text-gray-500">Create a new workspace</p>
                    </div>
                  </button>
                )}

                {/* Collapsed View - Create Workspace for Admin */}
                {isAdmin && !isSidebarOpen && (
                  <button
                    onClick={onOpenCreateWorkspace}
                    className="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-all border-2 border-dashed border-gray-300 hover:border-gray-400 mt-2 mx-auto"
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
      <div className="border-t border-gray-200 p-3 flex-shrink-0">
        {isSidebarOpen ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                {userTaskStats.total > 0 && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {userTaskStats.total}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {profile?.name || 'User'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {profile?.role || 'User'}
                  </span>
                  {userTaskStats.total > 0 && (
                    <span className="text-xs text-gray-500">
                      {userTaskStats.total} tasks
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">
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
            <div className="relative mx-auto mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {profile?.name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              {userTaskStats.total > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                  {userTaskStats.total}
                </div>
              )}
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