import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import { FiPlus } from "react-icons/fi";

export function Column({
  id,
  title,
  icon,
  gradient,
  border,
  accent,
  tasks,
  onTaskClick,
  currentUserId,
  userRole,
  searchQuery
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const getColumnHeaderStyle = () => {
    const styles = {
      planning: "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200",
      in_progress: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200",
      at_risk: "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200",
      update_required: "bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200",
      completed: "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200",
      on_hold: "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
    };
    return styles[id] || "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
  };

  const getColumnBodyStyle = () => {
    const styles = {
      planning: "bg-slate-25",
      in_progress: "bg-blue-25",
      at_risk: "bg-amber-25",
      update_required: "bg-purple-25",
      completed: "bg-emerald-25",
      on_hold: "bg-gray-25"
    };
    return styles[id] || "bg-gray-25";
  };

  return (
    <div className="flex flex-col h-full group">
      {/* Column Header */}
      <div className={`px-4 py-3 rounded-t-lg border ${getColumnHeaderStyle()} transition-colors duration-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${accent}`}></div>
            <div className="flex items-center gap-2">
              <span className="text-base" role="img" aria-label={title}>
                {icon}
              </span>
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            </div>
            <span className={`px-2 py-0.5 ${getColumnHeaderStyle().split(' ')[0].replace('bg-gradient-to-r', 'bg-white')} border ${border} text-gray-700 rounded-full text-xs font-medium min-w-[24px] flex items-center justify-center`}>
              {tasks.length}
            </span>
          </div>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded-md">
            <FiPlus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Column Body */}
      <div
        ref={setNodeRef}
        className={`
          flex flex-col rounded-b-lg transition-all duration-200
          ${isOver 
            ? 'bg-gradient-to-b from-white to-purple-50 ring-2 ring-purple-300 ring-opacity-70 border-2 border-purple-200' 
            : `border ${border} bg-gradient-to-b from-white via-white to-${getColumnBodyStyle().replace('bg-', '')}`
          }
          ${tasks.length === 0 ? 'min-h-[250px] max-h-[350px]' : 'max-h-[calc(100vh-250px)]'}
          overflow-hidden
        `}
      >
        <SortableContext
          id={id}
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className={`flex-1 ${tasks.length > 0 ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent' : ''}`}>
            <div className="p-3 space-y-3">
              {tasks.length === 0 ? (
                <div className={`
                  flex flex-col items-center justify-center h-full rounded-lg transition-all duration-300
                  ${isOver 
                    ? 'border-purple-300 bg-purple-50/50' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
                  }
                  ${isOver ? 'min-h-[200px]' : 'min-h-[180px]'}
                `}>
                  <div className={`w-12 h-12 rounded-full ${getColumnHeaderStyle().split(' ')[0].replace('bg-gradient-to-r', 'bg-gradient-to-br')} mb-3 flex items-center justify-center`}>
                    <span className="text-xl">{icon}</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-1">No tasks yet</p>
               
                </div>
              ) : (
                <>
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="transform transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
                    >
                      <TaskCard
                        task={task}
                        onTaskClick={onTaskClick}
                        currentUserId={currentUserId}
                        userRole={userRole}
                        canDrag={task.draggable}
                      />
                    </div>
                  ))}
                  
              
                </>
              )}
            </div>
            
            {/* Empty space indicator for dragging */}
            {isOver && tasks.length > 0 && (
              <div className="px-3 pb-3">
                <div className="h-2 rounded-full bg-gradient-to-r from-purple-100 via-purple-300 to-purple-100 animate-pulse"></div>
              </div>
            )}
          </div>
        </SortableContext>
      </div>

      {/* Column Footer Stats */}
      <div className="mt-2 px-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{tasks.length} tasks</span>
          {tasks.some(t => t.isOverdue) && (
            <span className="text-rose-600 font-medium">
              {tasks.filter(t => t.isOverdue).length} overdue
            </span>
          )}
        </div>
      </div>
    </div>
  );
}