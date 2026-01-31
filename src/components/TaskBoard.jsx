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
  FiPlus, 
  FiSearch, 
  FiRefreshCw, 
  FiBell,
  FiList,
  FiTable,
  FiUser,
  FiMessageSquare,
  FiCalendar,
  FiX,
  FiMenu,
  FiEye,
  FiEdit2,
  FiFilter
} from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";

const STAGES = [
  { 
    id: "planning", 
    title: "Planning", 
    icon: "📋",
    color: "slate",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700",
    dotColor: "bg-slate-500"
  },
  { 
    id: "in_progress", 
    title: "In Progress", 
    icon: "⚡",
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    dotColor: "bg-blue-500"
  },
  { 
    id: "at_risk", 
    title: "At Risk", 
    icon: "⚠️",
    color: "amber",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    dotColor: "bg-amber-500"
  },
  { 
    id: "update_required", 
    title: "Update Required", 
    icon: "🔄",
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    dotColor: "bg-purple-500"
  },
  { 
    id: "completed", 
    title: "Completed", 
    icon: "✅",
    color: "emerald",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-700",
    dotColor: "bg-emerald-500"
  },
  { 
    id: "on_hold", 
    title: "On Hold", 
    icon: "⏸️",
    color: "gray",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-700",
    dotColor: "bg-gray-500"
  },
];

const VIEW_MODES = {
  BOARD: 'board',
  LIST: 'list',
  TABLE: 'table'
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Tasks', icon: FiGrid },
  { value: 'mine', label: 'My Tasks', icon: FiUser },
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
  const [notification, setNotification] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.BOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');

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
          .select("id, name, avatar_url")
          .in("id", userIds);

        if (profilesData) {
          profilesData.forEach(profile => {
            userProfiles[profile.id] = {
              name: profile.name || "Team Member",
              avatar: profile.avatar_url
            };
          });
        }
      }

      const tasksWithDetails = await Promise.all(
        (tasksData || []).map(async (task) => {
          const { count: attachmentsCount } = await supabase
            .from("task_attachments")
            .select("*", { count: 'exact', head: true })
            .eq("task_id", task.id);
          
          const { count: commentsCount } = await supabase
            .from("task_comments")
            .select("*", { count: 'exact', head: true })
            .eq("task_id", task.id);
          
          const isOverdue = task.due_date && new Date(task.due_date) < new Date();
          
          return {
            ...task,
            attachments_count: attachmentsCount || 0,
            comments_count: commentsCount || 0,
            assigned_user: task.assigned_to ? userProfiles[task.assigned_to] || null : null,
            draggable: true,
            isOverdue
          };
        })
      );

      setTasks(tasksWithDetails);
      
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
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
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

      showNotification(`Task moved to ${STAGES.find(s => s.id === newStatus)?.title}`, "success");
      
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

  const handleStatusChange = async (taskId, newStatus) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    const originalStatus = taskToUpdate.status;

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

      showNotification(`Task status updated`, "success");
      
    } catch (error) {
      console.error("Error updating task status:", error);
      
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status: originalStatus } : task
      ));
      
      showNotification("Failed to update task", "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTimeFromNow = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `in ${diffDays} days`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    
    return '';
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      taskFilter === 'all' ? true :
      taskFilter === 'mine' ? task.assigned_to === currentUserId :
      taskFilter === 'unassigned' ? !task.assigned_to : true;
    
    return matchesSearch && matchesFilter;
  });

  const getTasksForStage = (stageId) => {
    return filteredTasks.filter((task) => task.status === stageId);
  };

  const getStatusColorClass = (status) => {
    const stage = STAGES.find(s => s.id === status);
    return stage ? stage.bgColor : 'bg-gray-100';
  };

  const getStatusTextColor = (status) => {
    const stage = STAGES.find(s => s.id === status);
    return stage ? stage.textColor : 'text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        @media (max-width: 640px) {
          .board-columns {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .task-row-hover:hover {
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.02) 0%, rgba(139, 92, 246, 0.01) 100%);
        }
      `}</style>

      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-white border-green-200 text-green-700'
              : notification.type === 'error'
              ? 'bg-white border-red-200 text-red-700'
              : 'bg-white border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <FiCheckCircle className="w-4 h-4" />}
              {notification.type === 'error' && <FiAlertCircle className="w-4 h-4" />}
              {notification.type === 'info' && <FiBell className="w-4 h-4" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-300 ${isPanelOpen ? 'lg:pr-[520px]' : ''}`}>
        {/* Main Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 sm:px-6 py-4">
            {/* Mobile Header */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
                  <p className="text-sm text-gray-500 mt-0.5">{filteredTasks.length} total tasks</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchTasks}
                    disabled={loading}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {/* Mobile Search & Filters */}
              {isMobileMenuOpen && (
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <FiSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2.5 w-full bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="relative">
                    <FiFilter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select 
                      value={taskFilter}
                      onChange={(e) => setTaskFilter(e.target.value)}
                      className="pl-9 pr-4 py-2.5 w-full bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                    >
                      {FILTER_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Task Board</h1>
                  <p className="text-sm text-gray-600 mt-1">Manage and track all team tasks</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <span className="font-medium">{filteredTasks.length}</span>
                    <span>tasks</span>
                  </div>
                
                </div>
              </div>

              {/* Desktop Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-72">
                    <FiSearch className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tasks by title or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-3 w-full bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="relative group">
                    <FiFilter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                    <select 
                      value={taskFilter}
                      onChange={(e) => setTaskFilter(e.target.value)}
                      className="pl-9 pr-8 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer hover:border-gray-400 transition-colors min-w-[160px]"
                    >
                      {FILTER_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchTasks}
                    disabled={loading}
                    className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 hover:shadow-sm disabled:opacity-50"
                    title="Refresh tasks"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6">
            <div className="flex items-center py-3">
              <div className="flex items-center">
                <button 
                  onClick={() => setViewMode(VIEW_MODES.BOARD)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 mr-2 ${
                    viewMode === VIEW_MODES.BOARD 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                  <span>Board</span>
                </button>
                
                <button 
                  onClick={() => setViewMode(VIEW_MODES.LIST)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 mr-2 ${
                    viewMode === VIEW_MODES.LIST 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FiList className="w-4 h-4" />
                  <span>List</span>
                </button>
                
                <button 
                  onClick={() => setViewMode(VIEW_MODES.TABLE)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                    viewMode === VIEW_MODES.TABLE 
                      ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FiTable className="w-4 h-4" />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6">
          {/* Board View */}
          {viewMode === VIEW_MODES.BOARD && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 board-columns">
                {STAGES.map((stage) => (
                  <div key={stage.id} className="h-full">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stage.dotColor}`}></div>
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{stage.title}</h3>
                        <span className="px-2 py-0.5 bg-white border border-gray-300 text-gray-700 rounded-full text-xs font-medium min-w-[24px] text-center">
                          {getTasksForStage(stage.id).length}
                        </span>
                      </div>
                    </div>
                    
                    <Column
                      id={stage.id}
                      title={stage.title}
                      icon={stage.icon}
                      border={stage.borderColor}
                      accent={stage.dotColor}
                      tasks={getTasksForStage(stage.id)}
                      onTaskClick={handleTaskClick}
                      currentUserId={currentUserId}
                      userRole={userRole}
                    />
                  </div>
                ))}
              </div>

              <DragOverlay dropAnimation={{ duration: 200, easing: 'ease-out' }}>
                {activeTask && (
                  <div className="w-80 transform rotate-2 shadow-2xl">
                    <TaskCard 
                      task={activeTask} 
                      isDragging 
                      currentUserId={currentUserId}
                      userRole={userRole}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}

          {/* List View */}
          {viewMode === VIEW_MODES.LIST && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-100">
                {filteredTasks.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 task-row-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 focus:ring-purple-500 text-purple-600 cursor-pointer"
                              checked={task.status === 'completed'}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(task.id, e.target.checked ? 'completed' : 'planning');
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors text-base line-clamp-1">
                              {task.title}
                            </h4>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <FiCalendar className="w-4 h-4" />
                              <span className="font-medium">{formatDate(task.due_date)}</span>
                              {task.due_date && task.status !== 'completed' && (
                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                  {getTimeFromNow(task.due_date)}
                                </span>
                              )}
                            </div>
                            
                            {task.assigned_to && (
                              <div className="flex items-center gap-1.5">
                                <FiUser className="w-4 h-4" />
                                <span>{task.assigned_to === currentUserId ? "You" : task.assigned_user?.name}</span>
                              </div>
                            )}
                            
                            {task.comments_count > 0 && (
                              <div className="flex items-center gap-1.5">
                                <FiMessageSquare className="w-4 h-4" />
                                <span>{task.comments_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Dropdown in List View */}
                      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="relative group">
                          <select 
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className={`appearance-none bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent px-3 py-2 min-w-[160px] transition-colors ${getStatusColorClass(task.status)} ${getStatusTextColor(task.status)}`}
                          >
                            {STAGES.map((stage) => (
                              <option key={stage.id} value={stage.id}>
                                {stage.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FiList className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No tasks found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === VIEW_MODES.TABLE && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTasks.map((task) => (
                      <tr 
                        key={task.id} 
                        onClick={() => handleTaskClick(task)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors task-row-hover"
                      >
                        <td className="px-6 py-4">
                          <div className="min-w-0 max-w-md">
                            <div className="font-medium text-gray-900 hover:text-purple-600 transition-colors truncate">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-sm text-gray-600 truncate mt-1">{task.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative group" onClick={(e) => e.stopPropagation()}>
                            <select 
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className={`appearance-none bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent px-3 py-2 min-w-[160px] transition-colors ${getStatusColorClass(task.status)} ${getStatusTextColor(task.status)}`}
                            >
                              {STAGES.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                  {stage.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {task.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm">
                                {task.assigned_user?.avatar ? (
                                  <img 
                                    src={task.assigned_user.avatar} 
                                    alt={task.assigned_user.name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <FiUser className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <span className="text-sm text-gray-700 font-medium">
                                {task.assigned_to === currentUserId ? "You" : task.assigned_user?.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {task.due_date ? (
                              <>
                                <FiCalendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                  <div className="text-sm text-gray-900 font-medium">{formatDate(task.due_date)}</div>
                                  <div className="text-xs text-gray-500">{getTimeFromNow(task.due_date)}</div>
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskClick(task);
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FiTable className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No tasks found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && tasks.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="text-gray-600">Loading tasks...</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTasks.length === 0 && tasks.length > 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <FiSearch className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No tasks found</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                {searchQuery ? "Try a different search term" : "Try changing your filter"}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTaskFilter('all');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Clear filters
              </button>
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