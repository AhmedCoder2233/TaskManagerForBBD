import { useState, useEffect, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
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
  FiChevronRight,
  FiChevronLeft,
  FiBarChart,
  FiClock,
  FiCheckCircle,
  FiMessageSquare,
  FiActivity,
} from "react-icons/fi";

export default function WorkspaceDetails() {
  const { id } = useParams();
  const { profile } = useContext(AuthContext);
  const { currentWorkspace } = useContext(WorkspaceContext);
  
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

  // Define tabs based on user role
  const getTabs = () => {
    const baseTabs = [
      { 
        id: "tasks", 
        label: "Task Board", 
        icon: FiGrid, 
        color: "gray",
        description: "Organize and track your project tasks"
      },
      { 
        id: "activities", 
        label: "Activities", 
        icon: FiActivity, 
        color: "gray",
        description: "View all workspace activities and logs"
      },
      { 
        id: "invite", 
        label: "Invite Members", 
        icon: FiUsers, 
        color: "gray",
        description: "Manage team access and permissions"
      },
    ];

    if (profile?.role !== "member") {
      baseTabs.push({ 
        id: "create", 
        label: "Create Task", 
        icon: FiPlusCircle, 
        color: "gray",
        description: "Add new tasks to your project"
      });
    }

    return baseTabs;
  };

  const tabs = getTabs();

  // Helper functions for dynamic Tailwind classes
  const getActiveTabClass = () => {
    return "bg-white text-gray-900 border border-gray-300 shadow-sm";
  };

  const getActiveCardClass = () => {
    return "border-gray-300 bg-gray-50";
  };

  const getActiveIndicatorClass = () => {
    return "bg-gray-900 text-white";
  };

  const getInactiveIndicatorClass = () => {
    return "bg-gray-200 text-gray-700";
  };

  const getIndicatorLineClass = () => {
    return "bg-gray-400";
  };

  const getIconClass = (isActive) => {
    return isActive ? "text-white" : "text-gray-700";
  };

  const getIconBgClass = (isActive) => {
    return isActive ? "bg-gray-900" : "bg-gray-100";
  };

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
      console.log("Fetching members for workspace:", workspaceId);
      
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

      if (error) {
        console.error("Supabase error fetching members:", error);
        throw error;
      }
      
      console.log("Fetched workspace members:", data);
      
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
      
      try {
        const { data: simpleData, error: simpleError } = await supabase
          .from("workspace_members")
          .select("*")
          .eq("workspace_id", workspaceId);

        if (simpleError) {
          setWorkspaceMembers([]);
          return [];
        }

        if (simpleData && simpleData.length > 0) {
          const fallbackData = simpleData.map(member => ({
            ...member,
            user: {
              id: member.user_id,
              email: "Unknown",
              name: "User",
              full_name: "User",
              role: "member",
              status: "active",
              avatar_url: null
            }
          }));
          
          setWorkspaceMembers(fallbackData);
          return fallbackData;
        }
        
        setWorkspaceMembers([]);
        return [];
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        setWorkspaceMembers([]);
        return [];
      }
    }
  };

  // Debug function
  const debugWorkspaceMembers = async (workspaceId) => {
    try {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (error) {
        console.error("Debug query error:", error);
      } else {
        console.log("Raw workspace_members data:", data);
      }
    } catch (error) {
      console.error("Debug error:", error);
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
      const { count, error } = await supabase
        .from("workspace_invites")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "pending");

      if (error) {
        console.log("workspace_invites table not found or error:", error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error("Error fetching pending invites:", error);
      return 0;
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

      if (error) {
        const mockActivities = [
          {
            id: 1,
            type: "workspace_created",
            user: { name: profile?.full_name || "You", avatar: null },
            description: "created this workspace",
            timestamp: new Date().toISOString(),
            metadata: {}
          },
          {
            id: 2,
            type: "member_joined",
            user: { name: "Team Member", avatar: null },
            description: "joined the workspace",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            metadata: {}
          }
        ];
        setActivities(mockActivities);
        return;
      }
      
      if (data && data.length > 0) {
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
      } else {
        const mockActivities = [
          {
            id: 1,
            type: "workspace_created",
            user: { name: profile?.full_name || "You", avatar: null },
            description: "created this workspace",
            timestamp: new Date().toISOString(),
            metadata: {}
          }
        ];
        setActivities(mockActivities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  useEffect(() => {
    const loadWorkspaceData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        console.log("Loading workspace data for ID:", id);
        
        const workspaceInfo = await fetchWorkspaceData(id);
        await debugWorkspaceMembers(id);
        
        const [members, tasksStats, pendingInvitesCount] = await Promise.all([
          fetchWorkspaceMembers(id),
          fetchTasksStats(id),
          fetchPendingInvites(id)
        ]);

        setWorkspaceStats({
          totalTasks: tasksStats.totalTasks,
          completedTasks: tasksStats.completedTasks,
          membersCount: members.length,
          pendingInvites: pendingInvitesCount
        });
        
        await fetchActivities(id);
      } catch (error) {
        console.error("Error loading workspace data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();
  }, [id]);

  const tabContent = useMemo(() => {
    switch(activeTab) {
      case "tasks":
        return <TaskBoard workspaceId={id} userRole={profile?.role} />;
      case "activities":
        return <ActivitiesSection activities={activities} workspaceId={id} />;
      case "invite":
        return <InviteUser workspaceId={id} members={workspaceMembers} />;
      case "create":
        return <CreateTask workspaceId={id} />;
      default:
        return <TaskBoard workspaceId={id} userRole={profile?.role} />;
    }
  }, [activeTab, id, profile?.role, activities, workspaceMembers]);

  const calculateCompletionRate = () => {
    if (workspaceStats.totalTasks === 0) return 0;
    return Math.round((workspaceStats.completedTasks / workspaceStats.totalTasks) * 100);
  };

const canCreateTask =
  profile?.role !== "client" && profile?.role !== "member";

  const getUserWorkspaceRole = () => {
    if (workspaceMembers.length > 0) {
      const currentMember = workspaceMembers.find(
        member => member.user_id === profile?.id
      );
      return currentMember?.role || 'member';
    }
    return currentWorkspace?.user_role || 'member';
  };

  const userWorkspaceRole = getUserWorkspaceRole();

  const getWorkspaceName = () => {
    return workspaceData?.name || currentWorkspace?.name || "Loading...";
  };

  const getWorkspaceDescription = () => {
    return workspaceData?.description || currentWorkspace?.description || "Project workspace";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <FiFolder className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getWorkspaceName()}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {getWorkspaceDescription()}
                  </p>
                </div>
              </div>
              
              {!loading && (
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiBarChart className="w-4 h-4 text-gray-700" />
                      <div>
                        <p className="text-xs text-gray-500">Tasks</p>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-900">{workspaceStats.totalTasks}</span>
                          {workspaceStats.totalTasks > 0 && (
                            <span className="text-xs text-gray-600">
                              ({workspaceStats.completedTasks} completed)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Progress</p>
                        <span className="font-semibold text-gray-900">{calculateCompletionRate()}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiUsers className="w-4 h-4 text-gray-700" />
                      <div>
                        <p className="text-xs text-gray-500">Members</p>
                        <span className="font-semibold text-gray-900">{workspaceStats.membersCount}</span>
                      </div>
                    </div>
                  </div>

                  {workspaceStats.pendingInvites > 0 && (
                    <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs text-gray-500">Pending</p>
                          <span className="font-semibold text-gray-900">{workspaceStats.pendingInvites}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="hidden sm:flex rounded-lg bg-gray-100 p-1">
              {tabs.map((tab) => {
                if (tab.id === "create" && !canCreateTask) {
                  return null;
                }
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeTab === tab.id 
                        ? getActiveTabClass()
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
              >
                {tabs.map((tab) => {
                  if (tab.id === "create" && !canCreateTask) {
                    return null;
                  }
                  return (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  const prevTab = tabs[currentIndex - 1];
                  if (prevTab && (prevTab.id !== "create" || canCreateTask)) {
                    setActiveTab(prevTab.id);
                  }
                }}
                disabled={tabs.findIndex(t => t.id === activeTab) === 0}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              
              <button
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  const nextTab = tabs[currentIndex + 1];
                  if (nextTab && (nextTab.id !== "create" || canCreateTask)) {
                    setActiveTab(nextTab.id);
                  }
                }}
                disabled={tabs.findIndex(t => t.id === activeTab) === tabs.length - 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <FiChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tabs.map((tab, index) => {
              if (tab.id === "create" && !canCreateTask) {
                return null;
              }
              
              const visibleTabs = tabs.filter(t => t.id !== "create" || canCreateTask);
              const currentIndex = visibleTabs.findIndex(t => t.id === activeTab);
              const tabIndex = visibleTabs.findIndex(t => t.id === tab.id);
              
              return (
                <div key={tab.id} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                    activeTab === tab.id 
                      ? getActiveIndicatorClass()
                      : currentIndex > tabIndex
                      ? getInactiveIndicatorClass()
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {tabIndex + 1}
                  </div>
                  {tabIndex < visibleTabs.length - 1 && (
                    <div className={`h-0.5 w-6 transition-all duration-200 ${
                      currentIndex > tabIndex
                        ? getIndicatorLineClass()
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
            <span className="text-sm text-gray-600 ml-3">
              Step {tabs.findIndex(t => t.id === activeTab) + 1} of {tabs.length}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {tabs.find(t => t.id === activeTab)?.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-500">Active</span>
                </div>
              </div>
            </div>

            <div className="p-0">
              {tabContent}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Quick Navigation Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {tabs.map((tab) => {
            if (tab.id === "create" && !canCreateTask) {
              return null;
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-lg border transition-all duration-200 text-left hover:shadow-sm ${
                  activeTab === tab.id 
                    ? getActiveCardClass()
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    getIconBgClass(activeTab === tab.id)
                  }`}>
                    <tab.icon className={`w-5 h-5 ${
                      getIconClass(activeTab === tab.id)
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{tab.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tab.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading workspace...</p>
          </div>
        </div>
      )}
    </div>
  );
}