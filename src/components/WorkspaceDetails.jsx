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
  FiFolder,
  FiBarChart,
  FiCheckCircle,
  FiActivity,
  FiX,
  FiUserMinus,
  FiUserPlus,
  FiMail,
  FiChevronRight,
  FiCheck,
  FiArrowLeft,
  FiTrash2,
  FiAlertTriangle
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
  const [realtimeChannel, setRealtimeChannel] = useState(null);

  // Check if user is admin
  const isAdmin = profile?.role === "admin";

  // Define tabs based on user role
  const getTabs = () => {
    const baseTabs = [
      { 
        id: "tasks", 
        label: "Tasks", 
        icon: FiGrid,
        description: "Manage your tasks"
      },
      { 
        id: "activities", 
        label: "Activities", 
        icon: FiActivity,
        description: "View activity logs"
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
        description: "Add new task"
      });
    }

    return baseTabs;
  };

  const tabs = getTabs();

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

  // Check if user has permission to view/access this workspace
  const checkUserPermission = async () => {
    if (!id || !profile?.id) return false;
    
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', id)
        .eq('user_id', profile.id)
        .single();
      
      return !error && data;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  };

  // Function to completely delete user's tasks
  const deleteUserTasks = async (memberId, workspaceId) => {
    try {
      // First, get all task IDs that are assigned to this user or created by this user
      const { data: userTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('id')
        .eq('workspace_id', workspaceId)
        .or(`assigned_to.eq.${memberId},created_by.eq.${memberId}`);

      if (fetchError) throw fetchError;

      if (userTasks && userTasks.length > 0) {
        const taskIds = userTasks.map(task => task.id);
        
        // First delete related data (attachments, comments, activities) for these tasks
        if (taskIds.length > 0) {
          // Delete task attachments
          const { error: attachmentsError } = await supabase
            .from('task_attachments')
            .delete()
            .in('task_id', taskIds);

          if (attachmentsError) throw attachmentsError;

          // Delete task comments
          const { error: commentsError } = await supabase
            .from('task_comments')
            .delete()
            .in('task_id', taskIds);

          if (commentsError) throw commentsError;
        }

        // Delete the tasks themselves
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .in('id', taskIds);

        if (tasksError) throw tasksError;
      }

      // Also delete tasks where user is assigned_to but not the creator
      const { error: assignedTasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('assigned_to', memberId);

      if (assignedTasksError) throw assignedTasksError;

      console.log(`Deleted all tasks for user ${memberId} in workspace ${workspaceId}`);
      return true;
    } catch (error) {
      console.error("Error deleting user tasks:", error);
      return false;
    }
  };

  // Function to delete user's comments and attachments
  const deleteUserCommentsAndAttachments = async (memberId, workspaceId) => {
    try {
      // Get all task IDs from this workspace
      const { data: workspaceTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('workspace_id', workspaceId);
      
      if (tasksError) throw tasksError;
      
      if (workspaceTasks && workspaceTasks.length > 0) {
        const taskIds = workspaceTasks.map(task => task.id);
        
        if (taskIds.length > 0) {
          // Delete comments by this user on any task in this workspace
          const { error: commentsError } = await supabase
            .from('task_comments')
            .delete()
            .in('task_id', taskIds)
            .eq('user_id', memberId);

          if (commentsError) throw commentsError;

          // Delete attachments uploaded by this user for any task in this workspace
          const { error: attachmentsError } = await supabase
            .from('task_attachments')
            .delete()
            .in('task_id', taskIds)
            .eq('uploaded_by', memberId);

          if (attachmentsError) throw attachmentsError;
        }
      }

      console.log(`Deleted comments and attachments for user ${memberId}`);
      return true;
    } catch (error) {
      console.error("Error deleting user comments and attachments:", error);
      return false;
    }
  };

  // Function to delete user's activity history
  const deleteUserActivityHistory = async (memberId, workspaceId) => {
    try {
      // For task_activities, we need to go through tasks first
      try {
        // Get all task IDs from this workspace
        const { data: workspaceTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id')
          .eq('workspace_id', workspaceId);
        
        if (!tasksError && workspaceTasks && workspaceTasks.length > 0) {
          const taskIds = workspaceTasks.map(task => task.id);
          
          if (taskIds.length > 0) {
            // Try to delete task activities by this user
            try {
              const { error: taskActivitiesError } = await supabase
                .from('task_activities')
                .delete()
                .in('task_id', taskIds)
                .eq('user_id', memberId);
              
              if (taskActivitiesError) {
                console.warn("Could not delete task activities:", taskActivitiesError);
              }
            } catch (e) {
              console.warn("Error with task_activities table:", e);
            }
          }
        }
      } catch (taskActivityError) {
        console.warn("Error accessing task_activities:", taskActivityError);
      }

      console.log(`Deleted activity history for user ${memberId}`);
      return true;
    } catch (error) {
      console.error("Error deleting user activity history:", error);
      return false;
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

  // Updated cleanupUserData function with real-time updates
  const cleanupUserData = async (memberId, memberName, workspaceId) => {
    setIsCleaningUp(true);
    setCleanupStatus("Deleting user's tasks...");
    
    try {
      // Step 1: Delete user's tasks
      setCleanupStatus("Deleting user's tasks...");
      const tasksDeleted = await deleteUserTasks(memberId, workspaceId);
      
      if (!tasksDeleted) {
        throw new Error("Failed to delete user tasks");
      }
      
      // Force immediate UI update
      setDataVersion(prev => prev + 1);
      
      setCleanupStatus("Deleting comments and attachments...");
      
      // Step 2: Delete user's comments and attachments
      const commentsDeleted = await deleteUserCommentsAndAttachments(memberId, workspaceId);
      
      if (!commentsDeleted) {
        console.warn("Could not delete all comments and attachments");
      }
      
      setCleanupStatus("Deleting activity history...");
      
      // Step 3: Delete user's activity history
      const activitiesDeleted = await deleteUserActivityHistory(memberId, workspaceId);
      
      if (!activitiesDeleted) {
        console.warn("Could not delete all activity history");
      }
      
      setCleanupStatus("Removing from workspace...");
      
      // Step 4: Remove user from workspace_members
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', memberId);
      
      if (error) throw error;
      
      // Force immediate refresh of all data
      await refreshWorkspaceData();
      setDataVersion(prev => prev + 1);
      
      console.log(`Removed ${memberName} from workspace ${workspaceId}`);
      return true;
      
    } catch (error) {
      console.error("Error in cleanup:", error);
      
      // Even if there were errors, try to remove from workspace_members
      try {
        const { error: removeError } = await supabase
          .from('workspace_members')
          .delete()
          .eq('workspace_id', workspaceId)
          .eq('user_id', memberId);
        
        if (!removeError) {
          // Force refresh even if only partially successful
          await refreshWorkspaceData();
          setDataVersion(prev => prev + 1);
          console.log(`Still removed ${memberName} from workspace_members despite cleanup errors`);
          return true; // Consider it success if at least removed from workspace
        }
      } catch (finalError) {
        console.error("Failed to remove from workspace_members:", finalError);
      }
      
      throw new Error("Failed to completely clean up user data");
      
    } finally {
      setIsCleaningUp(false);
      setCleanupStatus(null);
    }
  };

  // Show confirmation modal
  const showRemoveConfirmation = (memberId, memberName) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setShowConfirmModal(true);
  };

  // Handle member removal after confirmation
  const handleRemoveConfirmed = async () => {
    if (!memberToRemove || !isAdmin) {
      setShowConfirmModal(false);
      setMemberToRemove(null);
      return;
    }

    try {
      const success = await cleanupUserData(
        memberToRemove.id, 
        memberToRemove.name, 
        id
      );
      
      if (success) {
        // If removed user is current user, redirect
        if (memberToRemove.id === profile?.id) {
          navigate('/workspaces');
          return;
        }
        
        // Show success message
        setShowConfirmModal(false);
        setMemberToRemove(null);
        
        // Force refresh of TaskBoard component
        setDataVersion(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      setShowConfirmModal(false);
      setMemberToRemove(null);
    }
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
          // Force refresh when tasks change
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
          // Force refresh when members change
          setDataVersion(prev => prev + 1);
          refreshWorkspaceData();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    setRealtimeChannel(channel);

    // Cleanup on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [id]);

  // Check user permission on component mount and when workspace changes
  useEffect(() => {
    const verifyPermission = async () => {
      const hasPermission = await checkUserPermission();
      if (!hasPermission) {
        navigate('/workspaces');
      }
    };

    if (id && profile?.id) {
      verifyPermission();
    }
  }, [id, profile?.id, navigate, dataVersion]);

  // Load initial data
  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const workspaceInfo = await fetchWorkspaceData(id);
        
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
        console.error("Error loading workspace data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();
  }, [id, dataVersion]); // Add dataVersion to dependency array

  const tabContent = useMemo(() => {
    // Check permission before showing tabs
    const hasPermission = workspaceMembers.some(member => member.user_id === profile?.id);
    
    if (!hasPermission && profile?.id) {
      return (
        <div className="text-center py-12">
          <FiAlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-600 mt-1">You are no longer a member of this workspace</p>
          <button
            onClick={() => navigate('/workspaces')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go to Workspaces
          </button>
        </div>
      );
    }

    switch(activeTab) {
      case "tasks":
        return <TaskBoard 
          workspaceId={id} 
          userRole={profile?.role} 
          key={`tasks-${dataVersion}`} // Force re-render on dataVersion change
        />;
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

  const getWorkspaceDescription = () => {
    return workspaceData?.description || currentWorkspace?.description || "Project workspace";
  };

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
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <FiAlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Remove Member</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {isCleaningUp ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm font-medium text-gray-900">{cleanupStatus}</p>
                    <p className="text-xs text-gray-600 mt-1">Please wait...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4 p-3 bg-yellow-50 rounded-lg">
                      <FiAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Are you sure you want to remove <span className="font-semibold">{memberToRemove?.name}</span> from this workspace?
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-red-800 mb-2">This will permanently delete:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li className="flex items-center gap-2">
                            <FiTrash2 className="w-3 h-3" />
                            All tasks assigned to {memberToRemove?.name}
                          </li>
                          <li className="flex items-center gap-2">
                            <FiTrash2 className="w-3 h-3" />
                            All tasks created by {memberToRemove?.name}
                          </li>
                          <li className="flex items-center gap-2">
                            <FiTrash2 className="w-3 h-3" />
                            All comments by {memberToRemove?.name}
                          </li>
                          <li className="flex items-center gap-2">
                            <FiTrash2 className="w-3 h-3" />
                            All attachments uploaded by {memberToRemove?.name}
                          </li>
                          <li className="flex items-center gap-2">
                            <FiTrash2 className="w-3 h-3" />
                            All activity history of {memberToRemove?.name}
                          </li>
                        </ul>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          {memberToRemove?.id === profile?.id 
                            ? "You will be redirected to the workspaces page."
                            : "The user will lose all access to this workspace."}
                        </p>
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
                        onClick={handleRemoveConfirmed}
                        disabled={isCleaningUp}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        {memberToRemove?.id === profile?.id ? "Leave Workspace" : "Remove Permanently"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Workspace Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold text-xl">
                  {getWorkspaceName().charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {getWorkspaceName()}
                </h1>
                <p className="text-sm text-gray-600 truncate">
                  {getWorkspaceDescription()}
                </p>
              </div>
            </div>

            {/* View Members Button with Pending Invites Badge */}
            <button
              onClick={() => setShowMembersModal(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors font-medium whitespace-nowrap group"
            >
              <FiUsers className="w-4 h-4" />
              <span>View Members</span>
              <span className="px-2 py-0.5 bg-gray-900 text-white rounded-full text-xs font-semibold">
                {workspaceStats.membersCount}
              </span>
              
              {workspaceStats.pendingInvites > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {workspaceStats.pendingInvites}
                </span>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <FiUsers className="w-4 h-4 text-gray-600" />
                  <p className="text-xs text-gray-600 font-medium">Members</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{workspaceStats.membersCount}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'text-gray-900 border-b-2 border-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${dataVersion}`} // Add dataVersion to key for force re-render
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tabContent}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Enhanced Members Modal with Invite Functionality */}
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
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div>
                  {showInviteForm ? (
                    <button
                      onClick={() => setShowInviteForm(false)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-1"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      <span className="text-sm font-medium">Back to Members</span>
                    </button>
                  ) : null}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {showInviteForm ? "Invite to Workspace" : "Workspace Members"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {showInviteForm ? (
                      "Send invitation emails to new members"
                    ) : (
                      <>
                        {workspaceStats.membersCount} member{workspaceStats.membersCount !== 1 ? 's' : ''}
                        {workspaceStats.pendingInvites > 0 && (
                          <span className="ml-2 text-red-600 font-medium">
                            • {workspaceStats.pendingInvites} pending invite{workspaceStats.pendingInvites !== 1 ? 's' : ''}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Admin Badge */}
              {isAdmin && !showInviteForm && (
                <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-red-50 to-red-50/50 border-b border-red-100">
                  <div className="flex items-center gap-2">
                    <HiOutlineShieldCheck className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">You are a workspace admin</span>
                    <span className="ml-auto">
                      <button
                        onClick={() => setShowInviteForm(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-600 text-white text-xs font-medium rounded-lg hover:from-red-700 hover:to-red-700 transition-all"
                      >
                        <FiUserPlus className="w-3 h-3" />
                        Invite Members
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {showInviteForm ? (
                  // Invite Form Section
                  <div className="space-y-4">
                    {/* Success Message */}
                    <AnimatePresence>
                      {inviteMsg && (
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
                      {inviteError && (
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
                            <p className="text-xs text-red-600">{inviteError}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Invite Form */}
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
                            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none"
                            placeholder="name@company.com"
                            required
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          User will receive an email invitation to join this workspace
                        </p>
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
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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

                    {/* Recent Invites Section */}
                    {recentInvites.length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Invites</h4>
                        <div className="space-y-2">
                          {recentInvites.slice(0, 5).map((invite, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-100 to-red-100 flex items-center justify-center">
                                  <span className="text-xs font-medium text-red-600">
                                    {invite.email?.charAt(0).toUpperCase() || "?"}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(invite.created_at).toLocaleDateString()} • {invite.status}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                invite.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : invite.status === 'accepted'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {invite.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Members List Section
                  <>
                    {/* Members List */}
                    {workspaceMembers.length === 0 ? (
                      <div className="text-center py-12">
                        <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No members found</p>
                        {isAdmin && (
                          <button
                            onClick={() => setShowInviteForm(true)}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-red-600 to-red-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-700 transition-all"
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
                            className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-sm">
                                  {member.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                  {member.user.name}
                                  {member.user_id === profile?.id && (
                                    <span className="ml-2 text-xs text-gray-600">(You)</span>
                                  )}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 truncate">{member.user.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                                member.user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {member.user.role}
                              </span>

                              {isAdmin && member.user_id !== profile?.id && (
                                <button
                                  onClick={() => showRemoveConfirmation(member.user_id, member.user.name)}
                                  disabled={removingMemberId === member.user_id || isCleaningUp}
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
                        className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">Need to add more people?</h4>
                            <p className="text-sm text-gray-600 mt-1">Invite team members to collaborate</p>
                          </div>
                          <button
                            onClick={() => setShowInviteForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-700 transition-all"
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
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading workspace...</p>
          </div>
        </div>
      )}
    </>
  );
}
