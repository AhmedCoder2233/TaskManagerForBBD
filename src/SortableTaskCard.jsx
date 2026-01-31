import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";

export function SortableTaskCard({ task, onTaskClick, currentUserId, userRole }) {
  // Check if user can drag this task
  const canDragTask = () => {
    if (userRole === "admin" || "sales_admin") return true;
    
    if (task.created_by === currentUserId) return true;
    
    // Assignee can move their assigned task
    if (task.assigned_to === currentUserId) return true;
    
    return false;
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: !canDragTask(),
    data: {
      type: 'task',
      task: task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${canDragTask() ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      <TaskCard 
        task={task}
        isDragging={isDragging}
        currentUserId={currentUserId}
        userRole={userRole}
        onTaskClick={onTaskClick}
        canDrag={canDragTask()} // Pass this prop down
      />
    </div>
  );
}