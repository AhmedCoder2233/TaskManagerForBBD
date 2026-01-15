import { useContext, useState, useEffect } from "react";
import { WorkspaceContext } from "./context/WorkspaceContext";
import CreateWorkspace from "./components/CreateWorkspace";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { 
  FiSearch,
  FiGrid,
  FiUsers,
  FiTrash2,
  FiMoreVertical,
  FiClipboard,
  FiCheckCircle,
  FiPlayCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiPauseCircle,
  FiTrendingUp,
  FiPieChart,
  FiActivity,
  FiTarget,
  FiClock,
  FiBarChart2,
  FiChevronRight
} from "react-icons/fi";
import { supabase } from "./lib/supabase";

export default function Workspaces() {
  const { workspaces, loading, removeWorkspace } = useContext(WorkspaceContext);
  const { profile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [memberCounts, setMemberCounts] = useState({});
  const [taskCounts, setTaskCounts] = useState({});
  const [taskStatusBreakdown, setTaskStatusBreakdown] = useState({});
  const [membersLoading, setMembersLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenuId, setShowMenuId] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [userTaskStats, setUserTaskStats] = useState({
    planning: 0,
    in_progress: 0,
    at_risk: 0,
    update_required: 0,
    on_hold: 0,
    completed: 0,
    totalAssigned: 0
  });

  // Status colors configuration - Monochrome theme
  const statusColors = {
    planning: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      icon: FiClipboard,
      label: "Planning",
      dot: "bg-gray-400"
    },
    in_progress: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-300",
      icon: FiPlayCircle,
      label: "In Progress",
      dot: "bg-gray-500"
    },
    at_risk: {
      bg: "bg-gray-200",
      text: "text-gray-900",
      border: "border-gray-400",
      icon: FiAlertTriangle,
      label: "At Risk",
      dot: "bg-gray-600"
    },
    update_required: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: FiRefreshCw,
      label: "Update Required",
      dot: "bg-amber-500"
    },
    on_hold: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      icon: FiPauseCircle,
      label: "On Hold",
      dot: "bg-gray-400"
    },
    completed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: FiCheckCircle,
      label: "Completed",
      dot: "bg-emerald-500"
    },
  };

  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  // Filter workspaces based on search
  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch user's assigned tasks stats with all 6 phases
  useEffect(() => {
    const fetchUserTasks = async () => {
      if (profile?.id) {
        try {
          const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('assigned_to', profile.id);

          if (error) {
            console.error('Error fetching user tasks:', error);
            return;
          }

          // Initialize stats for all 6 phases
          const stats = {
            planning: 0,
            in_progress: 0,
            at_risk: 0,
            update_required: 0,
            on_hold: 0,
            completed: 0,
            totalAssigned: 0
          };

          if (tasks) {
            tasks.forEach(task => {
              const status = task.status;
              if (stats.hasOwnProperty(status)) {
                stats[status] = (stats[status] || 0) + 1;
              }
            });
            
            stats.totalAssigned = tasks.length;
          }

          setUserTaskStats(stats);
        } catch (error) {
          console.error('Error in fetchUserTasks:', error);
        }
      }
    };

    fetchUserTasks();
  }, [profile?.id]);

  // Fetch real member counts and task analytics for all workspaces
  useEffect(() => {
    const fetchWorkspaceAnalytics = async () => {
      if (!workspaces.length) {
        setMembersLoading(false);
        setAnalyticsLoading(false);
        return;
      }

      setMembersLoading(true);
      setAnalyticsLoading(true);
      
      const memberCountsObj = {};
      const taskCountsObj = {};
      const taskBreakdownObj = {};

      for (const ws of workspaces) {
        try {
          // Fetch workspace members count
          const { count: memberCount, error: memberError } = await supabase
            .from("workspace_members")
            .select("*", { count: 'exact', head: true })
            .eq("workspace_id", ws.id);

          if (memberError) {
            console.error(`Error fetching members for workspace ${ws.id}:`, memberError);
            memberCountsObj[ws.id] = 1;
          } else {
            memberCountsObj[ws.id] = memberCount || 1;
          }

          // Fetch workspace tasks for analytics
          const { data: tasks, error: taskError } = await supabase
            .from("tasks")
            .select('*')
            .eq("workspace_id", ws.id);

          if (taskError) {
            console.error(`Error fetching tasks for workspace ${ws.id}:`, taskError);
            taskCountsObj[ws.id] = 0;
            taskBreakdownObj[ws.id] = {
              planning: 0,
              in_progress: 0,
              at_risk: 0,
              update_required: 0,
              on_hold: 0,
              completed: 0
            };
          } else {
            const totalTasks = tasks?.length || 0;
            taskCountsObj[ws.id] = totalTasks;

            // Calculate task status breakdown for all 6 phases
            taskBreakdownObj[ws.id] = {
              planning: tasks?.filter(task => task.status === 'planning').length || 0,
              in_progress: tasks?.filter(task => task.status === 'in_progress').length || 0,
              at_risk: tasks?.filter(task => task.status === 'at_risk').length || 0,
              update_required: tasks?.filter(task => task.status === 'update_required').length || 0,
              on_hold: tasks?.filter(task => task.status === 'on_hold').length || 0,
              completed: tasks?.filter(task => task.status === 'completed').length || 0
            };
          }
        } catch (error) {
          console.error(`Error processing workspace ${ws.id}:`, error);
          memberCountsObj[ws.id] = 1;
          taskCountsObj[ws.id] = 0;
          taskBreakdownObj[ws.id] = {
            planning: 0,
            in_progress: 0,
            at_risk: 0,
            update_required: 0,
            on_hold: 0,
            completed: 0
          };
        }
      }

      setMemberCounts(memberCountsObj);
      setTaskCounts(taskCountsObj);
      setTaskStatusBreakdown(taskBreakdownObj);
      setMembersLoading(false);
      setAnalyticsLoading(false);
    };

    fetchWorkspaceAnalytics();
  }, [workspaces]);

  // Handle delete workspace
  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceToDelete.id);
      
      if (error) throw error;
      
      setShowDeleteModal(false);
      setWorkspaceToDelete(null);
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error("Error deleting workspace:", error);
      alert("Failed to delete workspace. Please try again.");
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Recently";
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return "Recently";
    }
  };

  const openDeleteModal = (workspace, e) => {
    e.stopPropagation();
    setWorkspaceToDelete(workspace);
    setShowDeleteModal(true);
    setShowMenuId(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.workspace-menu')) {
        setShowMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Loading skeleton
  const WorkspaceSkeleton = () => (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );

  // Calculate completion rate for a workspace
  const calculateCompletionRate = (workspaceId) => {
    const breakdown = taskStatusBreakdown[workspaceId];
    if (!breakdown) return 0;
    
    const totalTasks = taskCounts[workspaceId] || 0;
    const completedTasks = breakdown.completed || 0;
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const WorkspaceCard = ({ ws, index }) => {
    const memberCount = memberCounts[ws.id] || 1;
    const totalTasks = taskCounts[ws.id] || 0;
    const completionRate = calculateCompletionRate(ws.id);
    const breakdown = taskStatusBreakdown[ws.id];
    const isMenuOpen = showMenuId === ws.id;
    
    return (
      <motion.div
        key={ws.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: index * 0.05,
          duration: 0.3
        }}
        whileHover={{ 
          y: -4,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)"
        }}
        className="group relative"
      >
        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all duration-300 overflow-hidden">
          
          {/* Card Header with Menu */}
          <div className="flex items-start justify-between mb-4">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
              onClick={() => navigate(`/workspace/${ws.id}`)}
            >
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {ws.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-black transition-colors">
                  {ws.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <FiClock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-500 truncate">
                    Created {formatDate(ws.created_at)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Actions Menu - Only show if user is admin */}
            {isAdmin && (
              <div className="relative workspace-menu flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuId(isMenuOpen ? null : ws.id);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Workspace options"
                >
                  <FiMoreVertical className="w-5 h-5 text-gray-500" />
                </button>
                
                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1"
                    >
                      <button
                        onClick={(e) => openDeleteModal(ws, e)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span className="font-medium">Delete Workspace</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          {/* Card Content */}
          <div 
            className="space-y-4 cursor-pointer"
            onClick={() => navigate(`/workspace/${ws.id}`)}
          >
            {/* Stats Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
                <FiUsers className="w-4 h-4" />
                {membersLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <span className="font-medium">{memberCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
                <FiClipboard className="w-4 h-4" />
                {analyticsLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <span className="font-medium">{totalTasks}</span>
                )}
              </div>
            </div>

            {/* Progress Section */}
            {totalTasks > 0 ? (
              <div className="space-y-3">
                {/* Completion Rate */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Completion</span>
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    completionRate >= 70 ? 'bg-emerald-100 text-emerald-700' :
                    completionRate >= 40 ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {completionRate}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-black rounded-full"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Task Status Distribution */}
                {breakdown && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Task Status</span>
                      <FiBarChart2 className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(statusColors).map(([status, config]) => {
                        const count = breakdown[status] || 0;
                        if (count === 0) return null;
                        
                        return (
                          <div key={status} className="text-center">
                            <div className="text-lg font-bold text-gray-900 mb-0.5">{count}</div>
                            <div className="flex items-center justify-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
                              <span className="text-[10px] text-gray-600 truncate">{config.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                  <FiClipboard className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  No tasks yet
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/workspace/${ws.id}?tab=tasks`);
                  }}
                  className="text-xs font-medium text-black hover:text-gray-700 underline underline-offset-2"
                >
                  Add First Task
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Last updated</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/workspace/${ws.id}`);
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-black hover:text-gray-700 group"
                >
                  View Details
                  <FiChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

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
                Manage your team workspaces and track progress with detailed analytics
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
              <CreateWorkspace />
            </div>
          </div>
          
          {/* User Stats - Assigned Tasks with 6 Phases */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                  <FiTarget className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Your Task Overview</h3>
                  <p className="text-sm text-gray-500">Across all workspaces</p>
                </div>
              </div>
              
              {/* Total Tasks Summary */}
              <div className="mb-5">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FiClipboard className="w-5 h-5 text-gray-700" />
                    <span className="font-medium text-gray-900">Total Assigned Tasks</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{userTaskStats.totalAssigned}</span>
                </div>
              </div>
              
              {/* 6 Phases Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                {/* Planning */}
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {userTaskStats.planning}
                  </div>
                  <FiClipboard className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-700">Planning</div>
                </div>
                
                {/* In Progress */}
                <div className="text-center p-4 bg-gray-100 rounded-lg border border-gray-300">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {userTaskStats.in_progress}
                  </div>
                  <FiPlayCircle className="w-5 h-5 text-gray-700 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-700">In Progress</div>
                </div>
                
                {/* At Risk */}
                <div className="text-center p-4 bg-gray-200 rounded-lg border border-gray-400">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {userTaskStats.at_risk}
                  </div>
                  <FiAlertTriangle className="w-5 h-5 text-gray-800 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-700">At Risk</div>
                </div>
                
                {/* Update Required */}
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-2xl font-bold text-amber-700 mb-2">
                    {userTaskStats.update_required}
                  </div>
                  <FiRefreshCw className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-amber-700">Update Required</div>
                </div>
                
                {/* On Hold */}
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {userTaskStats.on_hold}
                  </div>
                  <FiPauseCircle className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-700">On Hold</div>
                </div>
                
                {/* Completed */}
                <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-700 mb-2">
                    {userTaskStats.completed}
                  </div>
                  <FiCheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-emerald-700">Completed</div>
                </div>
              </div>
              
              {/* Completion Stats */}
              {userTaskStats.totalAssigned > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiTrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-600">Completion Rate:</span>
                      <span className="text-lg font-bold text-emerald-700">
                        {userTaskStats.totalAssigned > 0 
                          ? Math.round((userTaskStats.completed / userTaskStats.totalAssigned) * 100) 
                          : 0
                        }%
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {userTaskStats.completed} of {userTaskStats.totalAssigned} completed
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Analytics Overview */}
          {!loading && workspaces.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-900">Workspace Analytics</h2>
                  <FiActivity className="w-5 h-5 text-gray-700" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {workspaces.length}
                    </div>
                    <div className="text-sm text-gray-600">Workspaces</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {Object.values(memberCounts).reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Members</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {Object.values(taskCounts).reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {workspaces.length > 0 
                        ? Math.round(Object.values(taskCounts).reduce((a, b) => a + b, 0) / workspaces.length)
                        : 0
                      }
                    </div>
                    <div className="text-sm text-gray-600">Avg Tasks</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Workspace Content */}
        <div>
          {/* Content Header */}
          {workspaces.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Your Workspaces
                  </h2>
                  <p className="text-sm text-gray-600">
                    Click to view detailed analytics and manage tasks
                  </p>
                </div>
                {filteredWorkspaces.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {filteredWorkspaces.length} workspace{filteredWorkspaces.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Show message when no workspaces exist */}
          {!loading && workspaces.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <FiGrid className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No workspaces yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first workspace to organize tasks and collaborate with your team.
              </p>
              <CreateWorkspace />
            </motion.div>
          )}

          {/* Workspace Grid */}
          {workspaces.length > 0 && (
            <AnimatePresence mode="wait">
              {loading || membersLoading || analyticsLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
                >
                  {[...Array(4)].map((_, i) => (
                    <WorkspaceSkeleton key={i} />
                  ))}
                </motion.div>
              ) : filteredWorkspaces.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <FiSearch className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No matching workspaces
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No results found for "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Clear Search
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="workspaces"
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
                >
                  {filteredWorkspaces.map((ws, index) => (
                    <WorkspaceCard key={ws.id} ws={ws} index={index} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && workspaceToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleteLoading && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden z-[10000] mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center">
                    <FiTrash2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900">Delete Workspace</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-800 font-medium mb-2">
                    Are you sure you want to delete this workspace?
                  </p>
                  <p className="text-gray-600 text-sm">
                    All data including tasks, members, and settings will be permanently removed.
                  </p>
                </div>
              </div>

              {/* Workspace Info */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">
                      {workspaceToDelete.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{workspaceToDelete.name}</h4>
                    <p className="text-sm text-gray-500">
                      Created {formatDate(workspaceToDelete.created_at)}
                    </p>
                  </div>
                </div>
                
                {/* Analytics Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {memberCounts[workspaceToDelete.id] || 1}
                    </div>
                    <div className="text-xs text-gray-600">Members</div>
                  </div>
                  <div className="text-center p-3 bg-gray-100 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {taskCounts[workspaceToDelete.id] || 0}
                    </div>
                    <div className="text-xs text-gray-600">Tasks</div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 flex gap-3">
                <button
                  onClick={() => {
                    if (!deleteLoading) {
                      setShowDeleteModal(false);
                      setWorkspaceToDelete(null);
                    }
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWorkspace}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-5 h-5" />
                      Delete Workspace
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}