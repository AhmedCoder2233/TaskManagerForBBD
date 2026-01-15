import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContext';
import { FiBell, FiX, FiClock, FiArrowRight } from 'react-icons/fi';

// ✅ Global Notification Context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// ✅ STAGES Definition (shared across app)
const STAGES = [
  { id: "planning", title: "Planning" },
  { id: "in_progress", title: "In Progress" },
  { id: "at_risk", title: "At Risk" },
  { id: "update_required", title: "Update Required" },
  { id: "on_hold", title: "On Hold" },
  { id: "completed", title: "Completed" },
];

// ✅ Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [userWorkspaces, setUserWorkspaces] = useState({});

  // Get user's workspaces
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserWorkspaces = async () => {
      try {
        const { data, error } = await supabase
          .from('workspace_members')
          .select('workspace_id, workspaces(name)')
          .eq('user_id', user.id);

        if (error) throw error;
        
        // Store workspace IDs with names
        const workspaceMap = {};
        data.forEach(item => {
          workspaceMap[item.workspace_id] = item.workspaces?.name || 'Unknown Workspace';
        });
        
        setUserWorkspaces(workspaceMap);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      }
    };

    fetchUserWorkspaces();
  }, [user?.id]);

  // ✅ Subscribe to ALL user's workspaces
  useEffect(() => {
    if (!user?.id || Object.keys(userWorkspaces).length === 0) return;

    const channels = Object.keys(userWorkspaces).map(workspaceId => {
      const channel = supabase
        .channel(`global-task-movements-${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_movements',
            filter: `workspace_id=eq.${workspaceId}`
          },
          async (payload) => {
            // Skip if user moved it themselves
            if (payload.new.moved_by_user_id === user.id) return;

            try {
              // Get task details
              const { data: taskData } = await supabase
                .from('tasks')
                .select('title')
                .eq('id', payload.new.task_id)
                .single();

              // Get user who moved it
              const { data: userData } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', payload.new.moved_by_user_id)
                .single();

              if (taskData && userData) {
                const fromStage = STAGES.find(s => s.id === payload.new.from_status)?.title || payload.new.from_status;
                const toStage = STAGES.find(s => s.id === payload.new.to_status)?.title || payload.new.to_status;

                const notification = {
                  id: `${payload.new.id}-${Date.now()}`,
                  title: 'Task Moved',
                  message: `${userData.name} moved "${taskData.title}" from ${fromStage} to ${toStage}`,
                  workspace: userWorkspaces[workspaceId],
                  workspaceId: workspaceId,
                  time: new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }),
                  timestamp: new Date(),
                  type: 'task_move',
                  fromStage,
                  toStage
                };

                // Add to notification list
                setNotifications(prev => [notification, ...prev.slice(0, 19)]);

                // Add to toast queue
                setToastQueue(prev => [...prev, notification]);
              }
            } catch (error) {
              console.error('Error processing notification:', error);
            }
          }
        )
        .subscribe();

      return channel;
    });

    // Cleanup
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.id, userWorkspaces]);

  // ✅ Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    if (toastQueue.length === 0) return;

    const timers = toastQueue.map((toast, index) => {
      return setTimeout(() => {
        setToastQueue(prev => prev.filter(t => t.id !== toast.id));
      }, 5000 + (index * 100));
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [toastQueue]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const dismissToast = (id) => {
    setToastQueue(prev => prev.filter(t => t.id !== id));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        clearNotifications,
        removeNotification,
        toastQueue,
        dismissToast
      }}
    >
      {children}
      
      {/* 🎨 Enhanced Global Toast Notifications - STACKED */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toastQueue.map((notification, index) => (
          <div 
            key={notification.id}
            className="animate-slideIn pointer-events-auto"
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-300"></div>
              
              {/* Main Card */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden max-w-md">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(239, 68, 68) 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                {/* Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-600"></div>

                {/* Content */}
                <div className="relative p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon with Animation */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-red-500 rounded-xl blur-md opacity-40 animate-pulse"></div>
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                        <span className="text-xl">📋</span>
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-base">{notification.title}</h4>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">New</span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed break-words">
                        {notification.message}
                      </p>

                      {/* Stage Transition Visual */}
                      <div className="flex items-center gap-2 mb-3 bg-red-50/50 rounded-lg p-2 border border-red-100">
                        <span className="text-xs font-medium text-red-700 bg-white px-2 py-1 rounded shadow-sm">
                          {notification.fromStage}
                        </span>
                        <FiArrowRight className="w-3 h-3 text-red-500" />
                        <span className="text-xs font-medium text-red-700 bg-white px-2 py-1 rounded shadow-sm">
                          {notification.toStage}
                        </span>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-red-600 font-medium">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                          {notification.workspace}
                        </div>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1 text-gray-500">
                          <FiClock className="w-3 h-3" />
                          {notification.time}
                        </div>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button 
                      onClick={() => dismissToast(notification.id)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-200 flex items-center justify-center group/btn"
                    >
                      <FiX className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-200" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-100">
                  <div className="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 animate-progress origin-left"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
