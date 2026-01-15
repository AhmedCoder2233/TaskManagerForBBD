import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTaskCard } from "./SortableTaskCard";
import { FiPlus, FiMoreVertical } from "react-icons/fi";

export function Column({ id, title, icon, gradient, border, tasks, onTaskClick, currentUserId, userRole, showNotification  }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-2xl p-4 border-2 min-h-[600px] flex flex-col
        ${gradient} ${border}
        ${isOver ? "ring-4 ring-blue-300 ring-opacity-50 scale-[1.02]" : ""}
        transition-all duration-200 shadow-lg hover:shadow-xl
      `}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <span className="text-lg">{icon}</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </span>
                {tasks.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-white/50 transition-colors">
            <FiMoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${tasks.length > 0 ? '100%' : '0%'}` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 overflow-y-auto pr-1">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 pb-4">
            {tasks.length === 0 ? (
              <div className={`
                text-center py-10 px-4 rounded-xl border-2 border-dashed 
                ${isOver ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 bg-white/50'}
                transition-colors duration-200
              `}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl">📥</span>
                </div>
                <p className="text-gray-500 font-medium mb-1">
                  {isOver ? "Drop task here" : "No tasks"}
                </p>
                <p className="text-sm text-gray-400">
                  {isOver ? "Release to drop" : "Drag tasks here"}
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <SortableTaskCard 
                  key={task.id} 
                  task={task} 
                  onTaskClick={onTaskClick}
                  currentUserId={currentUserId}
                  userRole={userRole}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>


    </div>
  );
}