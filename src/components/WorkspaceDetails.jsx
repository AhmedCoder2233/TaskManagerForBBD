import { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import InviteUser from "../components/InviteUser";
import CreateTask from "../components/CreateTask";
import TaskBoard from "../components/TaskBoard";
import ActivitiesSection from "../components/ActivitiesSection";
import { AuthContext } from "../context/AuthContext";
import { WorkspaceContext } from "../context/WorkspaceContext";
import { supabase } from "../lib/supabase";
import { 
  FiGrid, 
  FiUsers, 
  FiPlusCircle, 
  FiActivity,
  FiX,
  FiUserMinus,
  FiUserPlus,
  FiMail,
  FiArrowLeft,
  FiTrash2,
  FiAlertTriangle,
  FiMoreVertical,
  FiChevronDown,
  FiCheck,
  FiEye,
  FiMessageSquare,
  FiCalendar,
  FiPaperclip
} from "react-icons/fi";
import { HiOutlineSparkles, HiOutlineShieldCheck } from "react-icons/hi";

export default function WorkspaceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useContext(AuthContext);
  const { currentWorkspace, inviteUserByEmail } = useContext(WorkspaceContext);
  
  const [activeTab, setActiveTab] = useState("tasks");
  const [workspaceStats, setWorkspaceStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    membersCount: 0,
    pendingInvites: 0
  });
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [workspaceData, setWorkspaceData] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [recentInvites, setRecentInvites] = useState([]);
  
  // Custom confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [cleanupStatus, setCleanupStatus] = useState(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Real-time updates state
  const [dataVersion, setDataVersion] = useState(0);

  // Dropdown state
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);

  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  // Define tabs based on user role
  const tabs = useMemo(() => {
    const baseTabs = [
      { 
        id: "tasks", 
        label: "Task Board", 
        icon: FiGrid,
        description: "Manage and track tasks"
      },
      { 
        id: "activities", 
        label: "Activity Log", 
        icon: FiActivity,
        description: "View recent activities"
      },
    ];

    // Only show invite tab for non-admin users
    if (profile?.role !== "admin") {
      baseTabs.push({ 
        id: "invite", 
        label: "Invite Members", 
        icon: FiUsers,
        description: "Manage team access"
      });
    }

    if (profile?.role !== "member" && profile?.role !== "client") {
      baseTabs.push({ 
        id: "create", 
        label: "Create Task", 
        icon: FiPlusCircle,
        description: "Add new task to board"
      });
    }

    return baseTabs;
  }, [profile?.role]);

  // Fetch workspace data from Supabase
  const fetchWorkspaceData = async (workspaceId) => {
    try {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single();

      if (error) throw error;
      
      setWorkspaceData(data);
      return data;
    } catch (error) {
      console.error("Error fetching workspace data:", error);
      return null;
    }
  };

  // Fetch workspace members from Supabase
  const fetchWorkspaceMembers = async (workspaceId) => {
    try {
      const { data, error } = await supabase
        .from("workspace_members")
        .select(`
          *,
          profile:user_id (
            id,
            email,
            name,
            role,
            status,
            created_at
          )
        `)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedData = data.map(member => ({
          ...member,
          user: {
            id: member.profile?.id || member.user_id,
            email: member.profile?.email || "No email",
            name: member.profile?.name || "Unknown User",
            full_name: member.profile?.name || "Unknown User",
            role: member.profile?.role || "member",
            status: member.profile?.status || "active",
            avatar_url: null
          }
        }));
        
        setWorkspaceMembers(formattedData);
        return formattedData;
      } else {
        setWorkspaceMembers([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching workspace members:", error);
      setWorkspaceMembers([]);
      return [];
    }
  };

  // Fetch tasks stats
  const fetchTasksStats = async (workspaceId) => {
    try {
      const { count: totalTasks, error: totalError } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);

      if (totalError) throw totalError;

      const { count: completedTasks, error: completedError } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "completed");

      if (completedError) throw completedError;

      return {
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0
      };
    } catch (error) {
      console.error("Error fetching tasks stats:", error);
      return { totalTasks: 0, completedTasks: 0 };
    }
  };

  // Fetch pending invites
  const fetchPendingInvites = async (workspaceId) => {
    try {
      const { data, error } = await supabase
        .from("workspace_invites")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending invites:", error);
        return { count: 0, invites: [] };
      }
      
      setRecentInvites(data || []);
      return { count: data?.length || 0, invites: data || [] };
    } catch (error) {
      console.error("Error fetching pending invites:", error);
      return { count: 0, invites: [] };
    }
  };

  // Fetch activities
  const fetchActivities = async (workspaceId) => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) {
        const mockActivities = [
          {
            id: 1,
            type: "workspace_created",
            user: { name: profile?.name || "You", avatar: null },
            description: "created this workspace",
            timestamp: new Date().toISOString(),
            metadata: {}
          }
        ];
        setActivities(mockActivities);
        return;
      }
      
      setActivities(data.map(activity => ({
        id: activity.id,
        type: activity.type,
        user: { 
          name: activity.user?.full_name || "Unknown User", 
          avatar: activity.user?.avatar_url 
        },
        description: activity.description,
        timestamp: activity.created_at,
        metadata: activity.metadata || {}
      })));
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  // Function to refresh workspace data
  const refreshWorkspaceData = async () => {
    if (!id) return;
    
    try {
      const [members, tasksStats, pendingInvites] = await Promise.all([
        fetchWorkspaceMembers(id),
        fetchTasksStats(id),
        fetchPendingInvites(id)
      ]);

      setWorkspaceStats({
        totalTasks: tasksStats.totalTasks,
        completedTasks: tasksStats.completedTasks,
        membersCount: members.length,
        pendingInvites: pendingInvites.count
      });
      
      await fetchActivities(id);
    } catch (error) {
      console.error("Error refreshing workspace data:", error);
    }
  };

  // Show confirmation modal
  const showRemoveConfirmation = (memberId, memberName) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setShowConfirmModal(true);
  };

  // Handle invite submission
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMsg("");
    setInviteError("");
    setIsInviteLoading(true);

    if (profile?.role !== "admin") {
      setInviteError("Only admins can invite users to workspaces");
      setIsInviteLoading(false);
      return;
    }

    try {
      await inviteUserByEmail(id, inviteEmail);
      setInviteMsg("Invite sent successfully!");
      setRecentInvites(prev => [...prev, { 
        email: inviteEmail, 
        created_at: new Date().toISOString(),
        status: "pending"
      }]);
      setInviteEmail("");
      
      // Refresh stats
      const pendingInvites = await fetchPendingInvites(id);
      setWorkspaceStats(prev => ({
        ...prev,
        pendingInvites: pendingInvites.count
      }));

      // Auto-hide success message after 3 seconds
      setTimeout(() => setInviteMsg(""), 3000);
    } catch (err) {
      setInviteError(err.message);
      
      // Auto-hide error message after 4 seconds
      setTimeout(() => setInviteError(""), 4000);
    } finally {
      setIsInviteLoading(false);
    }
  };

  // Setup real-time subscriptions
  useEffect(() => {
    if (!id) return;

    // Subscribe to workspace changes
    const channel = supabase
      .channel(`workspace-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `workspace_id=eq.${id}`
        },
        () => {
          setDataVersion(prev => prev + 1);
          refreshWorkspaceData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${id}`
        },
        () => {
          setDataVersion(prev => prev + 1);
          refreshWorkspaceData();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [id]);

  // Load initial data
  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        await fetchWorkspaceData(id);
        await refreshWorkspaceData();
      } catch (error) {
        console.error("Error loading workspace data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();
  }, [id, dataVersion]);

  const tabContent = useMemo(() => {
    const hasPermission = workspaceMembers.some(member => member.user_id === profile?.id);
    
    if (!hasPermission && profile?.id) {
      return (
        <div className="text-center py-12 px-4">
          <FiAlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">You are no longer a member of this workspace</p>
          <button
            onClick={() => navigate('/workspaces')}
            className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Workspaces
          </button>
        </div>
      );
    }

    switch(activeTab) {
      case "tasks":
        return (
          <TaskBoard 
            workspaceId={id} 
            userRole={profile?.role} 
            key={`tasks-${dataVersion}`}
          />
        );
      case "activities":
        return <ActivitiesSection 
          activities={activities} 
          workspaceId={id} 
          key={`activities-${dataVersion}`}
        />;
      case "invite":
        return <InviteUser 
          workspaceId={id} 
          members={workspaceMembers} 
          key={`invite-${dataVersion}`}
        />;
      case "create":
        return <CreateTask 
          workspaceId={id} 
          key={`create-${dataVersion}`}
        />;
      default:
        return <TaskBoard 
          workspaceId={id} 
          userRole={profile?.role} 
          key={`tasks-default-${dataVersion}`}
        />;
    }
  }, [activeTab, id, profile?.role, activities, workspaceMembers, profile?.id, navigate, dataVersion]);

  const calculateCompletionRate = () => {
    if (workspaceStats.totalTasks === 0) return 0;
    return Math.round((workspaceStats.completedTasks / workspaceStats.totalTasks) * 100);
  };

  const getWorkspaceName = () => {
    return workspaceData?.name || currentWorkspace?.name || "Loading...";
  };

  const getCurrentTabInfo = () => {
    return tabs.find(tab => tab.id === activeTab) || tabs[0];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSectionDropdown && !event.target.closest('.section-dropdown')) {
        setShowSectionDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSectionDropdown]);

  return (
    <>
      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <FiAlertTriangle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">Remove Member</h3>
                    <p className="text-sm text-gray-600 truncate">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {isCleaningUp ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{cleanupStatus}</p>
                    <p className="text-xs text-gray-600">Please wait...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3 mb-4 p-3 bg-yellow-50 rounded-lg">
                      <FiAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Are you sure you want to remove <span className="font-semibold">{memberToRemove?.name}</span> from this workspace?
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-red-800 mb-2">This will permanently delete:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li className="flex items-start gap-2">
                            <FiTrash2 className="w-3 h-3 mt-1 flex-shrink-0" />
                            <span>All tasks assigned to {memberToRemove?.name}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <FiTrash2 className="w-3 h-3 mt-1 flex-shrink-0" />
                            <span>All tasks created by {memberToRemove?.name}</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <FiTrash2 className="w-3 h-3 mt-1 flex-shrink-0" />
                            <span>All comments by {memberToRemove?.name}</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowConfirmModal(false);
                          setMemberToRemove(null);
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isCleaningUp}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowConfirmModal(false);
                          setMemberToRemove(null);
                        }}
                        disabled={isCleaningUp}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span className="truncate">
                          {memberToRemove?.id === profile?.id ? "Leave Workspace" : "Remove Permanently"}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Workspace Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back Button and Workspace Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/workspaces')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Back to workspaces"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {getWorkspaceName()}
                </h1>
                <p className="text-sm text-gray-600 truncate">
                  {workspaceData?.description || "Project workspace"}
                </p>
              </div>
            </div>

            {/* Section Dropdown */}
            <div className="relative section-dropdown">
              <button
                onClick={() => setShowSectionDropdown(!showSectionDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getCurrentTabInfo().icon;
                    return <Icon className="w-4 h-4" />;
                  })()}
                  <span className="text-sm">{getCurrentTabInfo().label}</span>
                </div>
                <FiChevronDown className={`w-4 h-4 transition-transform ${showSectionDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showSectionDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Switch Sections</div>
                  </div>
                  
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowSectionDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-sm flex items-center gap-3 text-left transition-colors ${
                          isActive 
                            ? 'bg-purple-50 text-purple-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{tab.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{tab.description}</div>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Stats and Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Task Stats */}
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900">{workspaceStats.totalTasks}</div>
                <div className="text-xs text-gray-600">Tasks</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-bold text-green-600">{calculateCompletionRate()}%</div>
                <div className="text-xs text-gray-600">Done</div>
              </div>
              
              {/* Members Button */}
              <button
                onClick={() => setShowMembersModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiUsers className="w-4 h-4" />
                <span className="text-sm font-medium">{workspaceStats.membersCount}</span>
              </button>
              
              {/* Admin Actions */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowMembersModal(true);
                    setShowInviteForm(true);
                  }}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
                >
                  <FiUserPlus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${dataVersion}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tabContent}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Enhanced Members Modal */}
      <AnimatePresence>
        {showMembersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowMembersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                <div className="flex-1 min-w-0">
                  {showInviteForm ? (
                    <button
                      onClick={() => setShowInviteForm(false)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      <span className="text-sm font-medium">Back to Members</span>
                    </button>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 truncate">
                        {showInviteForm ? "Invite to Workspace" : "Workspace Members"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {showInviteForm ? (
                          "Send invitation emails to new members"
                        ) : (
                          <>
                            {workspaceStats.membersCount} member{workspaceStats.membersCount !== 1 ? 's' : ''}
                            {workspaceStats.pendingInvites > 0 && (
                              <span className="ml-2 text-purple-600 font-medium">
                                • {workspaceStats.pendingInvites} pending invite{workspaceStats.pendingInvites !== 1 ? 's' : ''}
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowMembersModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4 flex-shrink-0"
                    >
                      <FiX className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Admin Badge */}
              {isAdmin && !showInviteForm && (
                <div className="px-6 py-3 bg-gradient-to-r from-purple-50 to-purple-50/50 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <HiOutlineShieldCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-purple-700 flex-1">You are a workspace admin</span>
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all flex-shrink-0"
                    >
                      <FiUserPlus className="w-3 h-3" />
                      Invite Members
                    </button>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {showInviteForm ? (
                  // Invite Form Section
                  <div className="space-y-4">
                    <form onSubmit={handleInvite} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiMail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="name@company.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowInviteForm(false)}
                          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isInviteLoading}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                        >
                          {isInviteLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <HiOutlineSparkles className="w-4 h-4" />
                              <span>Send Invitation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  // Members List Section
                  <>
                    {/* Members List */}
                    {workspaceMembers.length === 0 ? (
                      <div className="text-center py-12">
                        <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">No members found</p>
                        {isAdmin && (
                          <button
                            onClick={() => setShowInviteForm(true)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all"
                          >
                            Invite Your First Member
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {workspaceMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-sm">
                                  {member.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900 truncate">
                                    {member.user.name}
                                  </p>
                                  {member.user_id === profile?.id && (
                                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">You</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 truncate">{member.user.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                member.user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {member.user.role}
                              </span>

                              {isAdmin && member.user_id !== profile?.id && (
                                <button
                                  onClick={() => showRemoveConfirmation(member.user_id, member.user.name)}
                                  disabled={removingMemberId === member.user_id}
                                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                                  title="Remove member"
                                >
                                  <FiUserMinus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Invite Section for Admins */}
                    {isAdmin && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-xl"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900">Need to add more people?</h4>
                            <p className="text-sm text-gray-600 mt-1">Invite team members to collaborate</p>
                          </div>
                          <button
                            onClick={() => setShowInviteForm(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all whitespace-nowrap"
                          >
                            <FiUserPlus className="w-4 h-4" />
                            Invite Members
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading workspace...</p>
          </div>
        </div>
      )}

      {/* Mobile Stats Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">{workspaceStats.totalTasks}</div>
              <div className="text-xs text-gray-600">Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-green-600">{calculateCompletionRate()}%</div>
              <div className="text-xs text-gray-600">Done</div>
            </div>
            <button
              onClick={() => setShowMembersModal(true)}
              className="text-center"
            >
              <div className="text-sm font-bold text-gray-900">{workspaceStats.membersCount}</div>
              <div className="text-xs text-gray-600">Members</div>
            </button>
          </div>
          
          <button
            onClick={() => setShowMembersModal(true)}
            className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg"
          >
            <FiUsers className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}