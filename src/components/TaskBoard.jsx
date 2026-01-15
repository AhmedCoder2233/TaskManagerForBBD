import { useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabase";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column } from "../Column";
import TaskCard from "../TaskCard";
import TaskDetailPanel from "../TaskDetailModal";
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiGrid, 
  FiFilter, 
  FiPlus, 
  FiSearch, 
  FiUsers, 
  FiRefreshCw, 
  FiBell,
  FiCalendar,
  FiClock,
  FiBarChart2,
  FiTrendingUp
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";

const STAGES = [
  { 
    id: "planning", 
    title: "Planning", 
    icon: "📋",
    color: "gray",
    border: "border-gray-200",
    accent: "bg-gray-800"
  },
  { 
    id: "in_progress", 
    title: "In Progress", 
    icon: "⚡",
    color: "gray",
    border: "border-gray-200",
    accent: "bg-gray-800"
  },
  { 
    id: "at_risk", 
    title: "At Risk", 
    icon: "⚠️",
    color: "amber",
    border: "border-amber-200",
    accent: "bg-amber-600"
  },
  { 
    id: "update_required", 
    title: "Update Required", 
    icon: "🔄",
    color: "blue",
    border: "border-blue-200",
    accent: "bg-blue-600"
  },
  { 
    id: "on_hold", 
    title: "On Hold", 
    icon: "⏸️",
    color: "gray",
    border: "border-gray-200",
    accent: "bg-gray-800"
  },
  { 
    id: "completed", 
    title: "Completed", 
    icon: "✅",
    color: "green",
    border: "border-green-200",
    accent: "bg-green-600"
  },
];

export default function TaskBoard({ workspaceId, userRole }) {
  const { user } = useContext(AuthContext);
  const currentUserId = user?.id;
  
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, atRisk: 0, overdue: 0 });
  const [notification, setNotification] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter: sortableKeyboardCoordinates 
    })
  );

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const recordTaskMovement = async (taskId, fromStatus, toStatus) => {
    try {
      const { data, error } = await supabase
        .from('task_movements')
        .insert({
          task_id: taskId,
          moved_by_user_id: currentUserId,
          from_status: fromStatus,
          to_status: toStatus,
          workspace_id: workspaceId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording task movement:', error);
      return null;
    }
  };

  const showRealtimeNotification = async (movementData) => {
    if (movementData.moved_by_user_id === currentUserId) return;

    try {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', movementData.task_id)
        .single();

      const { data: userData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', movementData.moved_by_user_id)
        .single();

      if (taskData && userData) {
        const fromStage = STAGES.find(s => s.id === movementData.from_status)?.title || movementData.from_status;
        const toStage = STAGES.find(s => s.id === movementData.to_status)?.title || movementData.to_status;
        
        const activity = {
          id: movementData.id,
          title: 'Task Moved',
          message: `${userData.name} moved "${taskData.title}" from ${fromStage} to ${toStage}`,
          time: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          type: 'info'
        };

        setRecentActivities(prev => [activity, ...prev.slice(0, 4)]);
        
        showNotification(`${userData.name} moved "${taskData.title}"`, "info");
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const fetchTaskMovements = async (taskId) => {
    try {
      const { data, error } = await supabase
        .from('task_movements')
        .select(`
          *,
          moved_by:profiles!task_movements_moved_by_user_id_fkey(name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching movements:', error);
      return [];
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      const userIds = [...new Set(tasksData
        .filter(t => t.assigned_to)
        .map(t => t.assigned_to)
      )];

      let userProfiles = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);

        if (profilesData) {
          profilesData.forEach(profile => {
            userProfiles[profile.id] = profile.name || "Team Member";
          });
        }
      }

      const tasksWithDetails = await Promise.all(
        (tasksData || []).map(async (task) => {
          const { count } = await supabase
            .from("task_attachments")
            .select("*", { count: 'exact', head: true })
            .eq("task_id", task.id);
          
          const isOverdue = task.due_date && new Date(task.due_date) < new Date();
          
          const movements = await fetchTaskMovements(task.id);
          
          return {
            ...task,
            attachments_count: count || 0,
            assigned_user_name: task.assigned_to ? userProfiles[task.assigned_to] || "Team Member" : null,
            draggable: true,
            isOverdue,
            recent_movements: movements
          };
        })
      );

      setTasks(tasksWithDetails);
      
      const completed = tasksWithDetails.filter(t => t.status === 'completed').length;
      const inProgress = tasksWithDetails.filter(t => t.status === 'in_progress').length;
      const atRisk = tasksWithDetails.filter(t => t.status === 'at_risk').length;
      const overdue = tasksWithDetails.filter(t => t.isOverdue).length;
      
      setStats({
        total: tasksWithDetails.length,
        completed,
        inProgress,
        atRisk,
        overdue
      });
    } catch (err) {
      console.error("Error fetching tasks:", err);
      showNotification("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;

    fetchTasks();

    const movementsChannel = supabase
      .channel(`task-movements-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_movements',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          showRealtimeNotification(payload.new);
          fetchTasks();
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel(`tasks-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          if (payload.eventType !== 'UPDATE' || 
              (payload.old?.status === payload.new?.status)) {
            fetchTasks();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, [workspaceId]);

  const handleDragStart = (event) => {
    const task = tasks.find(t => t.id === event.active.id);

    if (!task) return;

    if (userRole !== "admin" && userRole !== "sales_admin" && task.created_by !== currentUserId && task.assigned_to !== currentUserId) {
      showNotification("You don't have permission to move this task", "error");
      return;
    }

    setActiveId(event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const validColumns = STAGES.map(stage => stage.id);
    if (!validColumns.includes(over.id)) return;

    const taskId = active.id;
    const newStatus = over.id;

    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    const originalStatus = taskToUpdate.status;
    const fromStage = STAGES.find(s => s.id === originalStatus)?.title || originalStatus;
    const toStage = STAGES.find(s => s.id === newStatus)?.title || newStatus;

    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));

    try {
      await recordTaskMovement(taskId, originalStatus, newStatus);

      const { error } = await supabase
        .from("tasks")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;

      showNotification(`Task moved from ${fromStage} to ${toStage}`, "success");
      
    } catch (error) {
      console.error("Error updating task status:", error);
      
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: originalStatus } : task
      ));
      
      showNotification("Failed to move task", "error");
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedTask(null), 300);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTasksForStage = (stageId) => {
    return filteredTasks.filter((task) => task.status === stageId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-white border-green-300 text-gray-800'
              : notification.type === 'error'
              ? 'bg-white border-red-300 text-gray-800'
              : 'bg-white border-blue-300 text-gray-800'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <FiCheckCircle className="w-4 h-4 text-green-600" />}
              {notification.type === 'error' && <FiAlertCircle className="w-4 h-4 text-red-600" />}
              {notification.type === 'info' && <FiBell className="w-4 h-4 text-blue-600" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-300 ${isPanelOpen ? 'pr-[520px]' : ''}`}>
        <div className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center">
                      <FiGrid className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
                    <p className="text-gray-600 text-sm">
                      {stats.total} tasks • {stats.completed} completed • {stats.inProgress} in progress
                    </p>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="px-4 py-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                        <FiBarChart2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Total Tasks</p>
                        <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
                        <FiCheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Completed</p>
                        <p className="text-lg font-bold text-gray-900">{stats.completed}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                        <FiTrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">In Progress</p>
                        <p className="text-lg font-bold text-gray-900">{stats.inProgress}</p>
                      </div>
                    </div>
                  </div>

                  {stats.overdue > 0 && (
                    <div className="px-4 py-3 rounded-lg bg-white border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
                          <FiClock className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Overdue</p>
                          <p className="text-lg font-bold text-gray-900">{stats.overdue}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {recentActivities.length > 0 && (
                    <div className="px-4 py-3 rounded-lg bg-white border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                          <FiBell className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Recent Updates</p>
                          <p className="text-lg font-bold text-gray-900">{recentActivities.length}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
                    <FiSearch className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="outline-none flex-1 text-sm placeholder-gray-400 w-48"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={fetchTasks}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                >
                  <FiRefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {recentActivities.length > 0 && (
            <div className="mb-6">
              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FiBell className="w-4 h-4" />
                  Recent Activity
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {recentActivities.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="p-3 bg-gray-50 rounded border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-white">📋</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setRecentActivities([])}
                  className="mt-3 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}

          {/* Task Board Columns */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1150px] mx-auto">
  {STAGES.map((stage) => (
    <Column
      key={stage.id}
      id={stage.id}
      title={stage.title}
      icon={stage.icon}
      gradient={null}
      border={stage.border}
      accent={stage.accent}
      tasks={getTasksForStage(stage.id)}
      onTaskClick={handleTaskClick}
      currentUserId={currentUserId}
      userRole={userRole}
      searchQuery={searchQuery}
    />
  ))}
</div>


            <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
              {activeTask && (
                <div className="relative w-64">
                  <div className="absolute inset-0 bg-gray-300/20 rounded-lg blur-lg"></div>
                  <div className="relative shadow-xl border border-gray-300 bg-white">
                    <TaskCard 
                      task={activeTask} 
                      isDragging 
                      currentUserId={currentUserId}
                      userRole={userRole}
                    />
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Empty State */}
          {tasks.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first task to get started with project management
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && tasks.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2].map((j) => (
                      <div key={j} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        isOpen={isPanelOpen}
        onClose={closePanel}
        currentUserId={currentUserId}
        userRole={userRole}
        workspaceId={workspaceId}
      />
    </div>
  );
}