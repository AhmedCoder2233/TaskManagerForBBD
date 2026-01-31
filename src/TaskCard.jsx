import { supabase } from "./lib/supabase";
import { 
  FiUser, 
  FiCalendar, 
  FiMessageSquare, 
  FiPaperclip, 
  FiChevronRight,
  FiMoreVertical,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiTrash2,
  FiAlertTriangle,
  FiX,
  FiUsers,
  FiFlag,
  FiTag,
  FiBriefcase
} from "react-icons/fi";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect, useRef } from "react";

export default function TaskCard({ 
  task, 
  isDragging = false, 
  currentUserId, 
  userRole, 
  onTaskClick, 
  canDrag = true
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    disabled: !task.draggable,
  });

  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSortableDragging ? 'none' : transition,
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const statusConfigs = {
    planning: {
      accent: "bg-gray-500",
      text: "text-gray-700",
      bg: "bg-gray-50",
      icon: FiClock,
      label: "Planning"
    },
    in_progress: {
      accent: "bg-blue-500",
      text: "text-blue-700",
      bg: "bg-blue-50",
      icon: FiClock,
      label: "In Progress"
    },
    at_risk: {
      accent: "bg-amber-500",
      text: "text-amber-700",
      bg: "bg-amber-50",
      icon: FiAlertTriangle,
      label: "At Risk"
    },
    update_required: {
      accent: "bg-purple-500",
      text: "text-purple-700",
      bg: "bg-purple-50",
      icon: FiAlertTriangle,
      label: "Update Required"
    },
    on_hold: {
      accent: "bg-gray-500",
      text: "text-gray-700",
      bg: "bg-gray-50",
      icon: FiClock,
      label: "On Hold"
    },
    completed: {
      accent: "bg-emerald-500",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      icon: FiCheckCircle,
      label: "Completed"
    },
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    
    // Display full date with day
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase();
  };

  const getTimeRemaining = () => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { days: Math.abs(diffDays), type: 'overdue' };
    if (diffDays === 0) return { days: 0, type: 'today' };
    if (diffDays === 1) return { days: diffDays, type: 'tomorrow' };
    if (diffDays <= 3) return { days: diffDays, type: 'soon' };
    if (diffDays <= 7) return { days: diffDays, type: 'week' };
    return { days: diffDays, type: 'normal' };
  };

  const getAssignedDetails = () => {
    if (!task.assigned_date) return null;
    const assignedDate = new Date(task.assigned_date);
    const now = new Date();
    const diffMs = now - assignedDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let relativeTime;
    if (diffDays === 0) relativeTime = 'today';
    else if (diffDays === 1) relativeTime = 'yesterday';
    else if (diffDays < 7) relativeTime = `${diffDays} days ago`;
    else if (diffDays < 30) relativeTime = `${Math.floor(diffDays/7)} weeks ago`;
    else relativeTime = `${Math.floor(diffDays/30)} months ago`;
    
    return {
      date: formatDate(task.assigned_date),
      time: formatTime(task.assigned_date),
      relative: relativeTime
    };
  };

  const timeRemaining = getTimeRemaining();
  const assignedDetails = getAssignedDetails();
  const statusConfig = statusConfigs[task.status] || statusConfigs.planning;
  const StatusIcon = statusConfig.icon;

  const handleCardClick = (e) => {
    if (e.defaultPrevented || isDragging || showMenu) return;
    onTaskClick(task);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  const getDueDateStyle = () => {
    if (!timeRemaining) return {};
    
    switch(timeRemaining.type) {
      case 'overdue':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: 'text-red-600'
        };
      case 'today':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: 'text-amber-600'
        };
      case 'tomorrow':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: 'text-blue-600'
        };
      case 'soon':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: 'text-amber-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: 'text-gray-600'
        };
    }
  };

  const dueDateStyle = getDueDateStyle();

  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { 
          if (!showMenu) {
            setIsHovered(false); 
          }
        }}
        className={`
          group relative bg-white rounded-xl border transition-all duration-200 w-full
          ${isDragging 
            ? 'shadow-2xl opacity-95 scale-[1.02] z-50 rotate-1 shadow-gray-500/30' 
            : 'shadow-sm hover:shadow-lg'
          }
          ${isHovered && !isDragging ? 'border-gray-300' : 'border-gray-200'}
          ${!canDrag ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}
          min-h-[180px] flex flex-col overflow-hidden
          hover:ring-2 hover:ring-opacity-10 hover:ring-blue-500
        `}
        onClick={handleCardClick}
      >
   
        
        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Header with Task ID */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  #{task.task_id || task.id.slice(0, 8)}
                </span>
                {task.project && (
                  <span className="text-xs text-gray-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <FiBriefcase className="w-3 h-3" />
                    {task.project}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                {task.title}
              </h3>
            </div>
            
            {/* Action menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  showMenu ? 'bg-gray-100 ring-1 ring-gray-200' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-100'
                }`}
              >
                <FiMoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-gray-600 mb-4 line-clamp-2 flex-1">
              {task.description}
            </p>
          )}

   
          {/* Assignee Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned To</span>
              {assignedDetails && (
                <span className="text-xs text-gray-400">
                  {assignedDetails.relative}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
              {task.assigned_to ? (
                <>
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-white">
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
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {task.assigned_to === currentUserId ? "You" : task.assigned_user?.name || "Unknown User"}
                      </span>
                      <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">
                        {task.assigned_user?.role || "Team Member"}
                      </span>
                    </div>
                    {assignedDetails && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Assigned on {assignedDetails.date} at {assignedDetails.time}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 p-2.5 w-full">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <FiUsers className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-sm text-gray-500">Unassigned</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates Section */}
          <div className="grid grid-cols-2 gap-3">
            {/* Due Date */}
            <div className={`p-2.5 rounded-lg border ${dueDateStyle.border} ${dueDateStyle.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <FiCalendar className={`w-4 h-4 ${dueDateStyle.icon}`} />
                <span className={`text-xs font-medium ${dueDateStyle.text}`}>Due Date</span>
              </div>
              {task.due_date ? (
                <div>
                  <div className={`text-sm font-semibold ${dueDateStyle.text}`}>
                    {timeRemaining?.type === 'overdue' 
                      ? `${timeRemaining.days}d overdue`
                      : timeRemaining?.type === 'today'
                      ? 'Today'
                      : timeRemaining?.type === 'tomorrow'
                      ? 'Tomorrow'
                      : formatDate(task.due_date)
                    }
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatTime(task.due_date)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Not set</div>
              )}
            </div>

            {/* Created Date */}
            <div className="p-2.5 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-1">
                <FiClock className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Created</span>
              </div>
              {task.created_at ? (
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(task.created_at)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatTime(task.created_at)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">-</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            {/* Metadata */}
            <div className="flex items-center gap-4">
              {task.attachments_count > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center">
                    <FiPaperclip className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">{task.attachments_count}</span>
                  <span className="text-xs text-gray-500">files</span>
                </div>
              )}
              
              {task.comments_count > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center">
                    <FiMessageSquare className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">{task.comments_count}</span>
                  <span className="text-xs text-gray-500">comments</span>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <FiTag className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {task.tags.slice(0, 2).join(', ')}
                    {task.tags.length > 2 && ` +${task.tags.length - 2}`}
                  </span>
                </div>
              )}
            </div>

            {/* View indicator */}
            <div className={`transition-all duration-200 transform ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <FiChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <div 
            ref={menuRef}
            className="absolute right-0 top-12 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Task Actions</div>
            </div>
            <button 
              onClick={() => {
                setShowMenu(false);
                onTaskClick(task);
              }}
              className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
            >
              <FiEye className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">View Details</div>
                <div className="text-xs text-gray-400 mt-0.5">Open task details panel</div>
              </div>
            </button>
            
            <button 
              onClick={() => {
                setShowMenu(false);
                // Add edit functionality here
              }}
              className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
            >
              <FiCalendar className="w-4 h-4 text-gray-500" />
              <div>
                <div className="font-medium">Reschedule</div>
                <div className="text-xs text-gray-400 mt-0.5">Change due date</div>
              </div>
            </button>
            
            <button 
              onClick={() => {
                setShowMenu(false);
                // Add delete functionality here
              }}
              className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 text-left transition-colors border-t border-gray-100"
            >
              <FiTrash2 className="w-4 h-4" />
              <div>
                <div className="font-medium">Delete Task</div>
                <div className="text-xs text-red-400 mt-0.5">Remove from project</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}