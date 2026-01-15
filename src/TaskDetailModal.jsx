import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import { 
  FiX, 
  FiUser, 
  FiCalendar, 
  FiMessageSquare, 
  FiPaperclip, 
  FiDownload,
  FiTrash2,
  FiEdit2,
  FiSend,
  FiFile,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiType,
  FiClock,
  FiActivity,
  FiMove,
  FiChevronRight,
  FiPlus,
  FiInfo,
  FiLock
} from "react-icons/fi";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export default function TaskDetailPanel({ 
  task, 
  isOpen, 
  onClose, 
  currentUserId, 
  userRole, 
  workspaceId 
}) {
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [userName, setUserName] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const [assignedUserName, setAssignedUserName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [createdByName, setCreatedByName] = useState("");
  const commentsEndRef = useRef(null);
  const commentsSectionRef = useRef(null);
  const activityEndRef = useRef(null);

  // Check if user has admin or sales_admin role
  const isAdmin = userRole === "admin";
  const isAdminComment = userRole === "admin" || "sales_admin";
  
  // Check if current user is the task creator
  const isTaskCreator = currentUserId === task?.assigned_to;
  
  // Check if current user is the assigned user
  const isAssignedUser = currentUserId === task?.assigned_to;
  
  // Check if user can comment (admin, sales_admin, or assigned user)
  const canComment = () => {
    return isAdminComment || isAssignedUser;
  };

  // Function to check if user can edit
  const canEdit = () => {
    return isAdmin || isTaskCreator;
  };

  // Function to check if user can delete attachments
  const canDeleteAttachment = (attachmentUserId) => {
    return isAdmin || attachmentUserId === currentUserId;
  };

  // Fetch created by user name
  useEffect(() => {
    const fetchCreatedByName = async () => {
      if (!task?.created_by) {
        setCreatedByName("Unknown");
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", task.created_by)
          .single();
        
        if (error || !data) {
          setCreatedByName("User");
          return;
        }
        
        setCreatedByName(data.name || data.email?.split('@')[0] || "User");
      } catch (error) {
        console.error("Error fetching created by user:", error);
        setCreatedByName("User");
      }
    };

    if (task) {
      fetchCreatedByName();
    }
  }, [task]);

  // Get current user's name from profiles table
  useEffect(() => {
    const fetchCurrentUserName = async () => {
      if (!currentUserId) {
        setUserName("Guest");
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", currentUserId)
          .single();
        
        if (error) {
          console.error("Error fetching user profile:", error);
          setUserName("User");
          return;
        }
        
        if (data) {
          setUserName(data.name || data.email?.split('@')[0] || "User");
        } else {
          setUserName("User");
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
        setUserName("User");
      }
    };
    
    if (currentUserId) {
      fetchCurrentUserName();
    }
  }, [currentUserId]);

  // Function to log activity
  const logActivity = async (action, details = {}, oldValue = null, newValue = null) => {
    if (!task || !currentUserId) return;

    try {
      const activityData = {
        id: uuidv4(),
        task_id: task.id,
        user_id: currentUserId,
        action: action,
        details: details,
        old_value: oldValue,
        new_value: newValue,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("task_activities")
        .insert(activityData);

      if (error) {
        console.error("Error logging activity:", error);
      }
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // Function to fetch task activities
  const fetchTaskActivities = async () => {
    if (!task) return;
    
    try {
      const { data: activitiesData, error } = await supabase
        .from("task_activities")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching activities:", error);
        return;
      }

      const { data: movementsData } = await supabase
        .from("task_movements")
        .select(`
          *,
          moved_by:profiles!task_movements_moved_by_user_id_fkey(name)
        `)
        .eq("task_id", task.id)
        .order("created_at", { ascending: false })
        .limit(20);

      let allActivities = [];
      
      if (activitiesData && activitiesData.length > 0) {
        const userIds = [...new Set(activitiesData.map(a => a.user_id).filter(Boolean))];
        
        let userProfiles = {};
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", userIds);

          if (profilesData) {
            profilesData.forEach(profile => {
              userProfiles[profile.id] = profile.name || profile.email?.split('@')[0] || "User";
            });
          }
        }

        const activitiesWithUsers = activitiesData.map(activity => ({
          ...activity,
          user_name: activity.user_id ? 
            (userProfiles[activity.user_id] || "User") : 
            "System",
          type: "activity"
        }));

        allActivities = [...allActivities, ...activitiesWithUsers];
      }

      if (movementsData && movementsData.length > 0) {
        const movementsAsActivities = movementsData.map(movement => ({
          id: movement.id,
          task_id: movement.task_id,
          user_id: movement.moved_by_user_id,
          user_name: movement.moved_by?.name || "User",
          action: "status_changed",
          details: {
            from_status: movement.from_status,
            to_status: movement.to_status
          },
          old_value: movement.from_status,
          new_value: movement.to_status,
          created_at: movement.created_at,
          type: "movement"
        }));

        allActivities = [...allActivities, ...movementsAsActivities];
      }

      allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setActivities(allActivities);
      
    } catch (error) {
      console.error("Error fetching task activities:", error);
    }
  };

  // Function to format stage name for display
  const formatStageName = (stageId) => {
    const stageMap = {
      'planning': 'Planning',
      'in_progress': 'In Progress',
      'at_risk': 'At Risk',
      'update_required': 'Update Required',
      'on_hold': 'On Hold',
      'completed': 'Completed'
    };
    return stageMap[stageId] || stageId.replace('_', ' ');
  };

  // Fetch task details and comments - REALTIME VERSION
  useEffect(() => {
    if (!task) return;

    const fetchTaskDetails = async () => {
      setEditedDescription(task.description || "");
      setEditedTitle(task.title || "");
      setError(null);
      
      // Fetch attachments
      try {
        const { data: attachmentsData, error: attachmentsError } = await supabase
          .from("task_attachments")
          .select("*")
          .eq("task_id", task.id)
          .order("created_at", { ascending: false });

        if (attachmentsError) {
          console.error("Error fetching attachments:", attachmentsError);
        } else {
          setAttachments(attachmentsData || []);
        }
      } catch (err) {
        console.error("Error in attachments fetch:", err);
      }

      // Fetch comments
      await fetchComments();
      
      // Fetch task activities
      await fetchTaskActivities();
      
      // Fetch assigned user name
      if (task.assigned_to) {
        await fetchAssignedUserName();
      } else {
        setAssignedUserName("Unassigned");
      }
    };

    fetchTaskDetails();

    // Set up real-time subscriptions
    const setupRealtimeSubscriptions = () => {
      if (!task) return null;

      const commentsChannel = supabase
        .channel(`comments-${task.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_comments',
            filter: `task_id=eq.${task.id}`
          },
          async (payload) => {
            if (payload.new.user_id) {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('name, email')
                  .eq('id', payload.new.user_id)
                  .single();

                const newCommentWithUser = {
                  ...payload.new,
                  user_name: profile?.name || profile?.email?.split('@')[0] || "User"
                };

                setComments(prev => [...prev, newCommentWithUser]);
                
                // Don't scroll automatically - removed this line
                // setTimeout(() => scrollToBottom(commentsEndRef), 100);
              } catch (error) {
                console.error('Error fetching user for comment:', error);
              }
            }
          }
        )
        .subscribe();

      const activitiesChannel = supabase
        .channel(`activities-${task.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_activities',
            filter: `task_id=eq.${task.id}`
          },
          async (payload) => {
            if (payload.new.user_id) {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('name, email')
                  .eq('id', payload.new.user_id)
                  .single();

                const newActivity = {
                  ...payload.new,
                  user_name: profile?.name || profile?.email?.split('@')[0] || "User",
                  type: "activity"
                };

                setActivities(prev => [newActivity, ...prev]);
              } catch (error) {
                console.error('Error fetching user for activity:', error);
              }
            }
          }
        )
        .subscribe();

      const movementsChannel = supabase
        .channel(`movements-${task.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_movements',
            filter: `task_id=eq.${task.id}`
          },
          async (payload) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('name, email')
                .eq('id', payload.new.moved_by_user_id)
                .single();

              const newActivity = {
                id: payload.new.id,
                task_id: payload.new.task_id,
                user_id: payload.new.moved_by_user_id,
                user_name: profile?.name || profile?.email?.split('@')[0] || "User",
                action: "status_changed",
                details: {
                  from_status: payload.new.from_status,
                  to_status: payload.new.to_status
                },
                old_value: payload.new.from_status,
                new_value: payload.new.to_status,
                created_at: payload.new.created_at,
                type: "movement"
              };

              setActivities(prev => [newActivity, ...prev]);
            } catch (error) {
              console.error('Error fetching user for movement:', error);
            }
          }
        )
        .subscribe();

      const attachmentsChannel = supabase
        .channel(`attachments-${task.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_attachments',
            filter: `task_id=eq.${task.id}`
          },
          (payload) => {
            setAttachments(prev => [payload.new, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(commentsChannel);
        supabase.removeChannel(activitiesChannel);
        supabase.removeChannel(movementsChannel);
        supabase.removeChannel(attachmentsChannel);
      };
    };

    const unsubscribe = setupRealtimeSubscriptions();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [task]);

  // Function to fetch comments with user names
  const fetchComments = async () => {
    if (!task) return;
    
    try {
      const { data: commentsData, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        setError("Failed to load comments");
        return;
      }

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id).filter(Boolean))];
        
        let userProfiles = {};
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", userIds);

          if (profilesData) {
            profilesData.forEach(profile => {
              userProfiles[profile.id] = profile.name || profile.email?.split('@')[0] || "User";
            });
          }
        }

        const commentsWithUsers = commentsData.map(comment => ({
          ...comment,
          user_name: comment.user_id ? 
            (userProfiles[comment.user_id] || "User") : 
            "Anonymous"
        }));

        setComments(commentsWithUsers);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError("Failed to load comments");
      setComments([]);
    }
  };

  // Function to fetch assigned user name
  const fetchAssignedUserName = async () => {
    if (!task?.assigned_to) {
      setAssignedUserName("Unassigned");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", task.assigned_to)
        .single();
      
      if (error) {
        console.error("Error fetching assigned user:", error);
        setAssignedUserName("User");
        return;
      }
      
      if (data) {
        setAssignedUserName(data.name || data.email?.split('@')[0] || "User");
      } else {
        setAssignedUserName("User");
      }
    } catch (error) {
      console.error("Error fetching assigned user:", error);
      setAssignedUserName("User");
    }
  };

  const handleAddComment = async () => {
    setError(null);
    
    // Check if user can comment
    if (!canComment()) {
      setError("Only admins, sales admins, and assigned users can comment");
      return;
    }
    
    if (!newComment.trim()) {
      setError("Please enter a comment");
      return;
    }
    
    if (!currentUserId) {
      console.error("currentUserId is null/undefined");
      setError("You must be logged in to comment. Please refresh the page or log in again.");
      return;
    }
    
    if (!task) {
      setError("Task not found");
      return;
    }

    setIsPosting(true);
    
    const commentText = newComment.trim();
    
    try {
      const commentData = {
        id: uuidv4(),
        task_id: task.id,
        user_id: currentUserId,
        comment: commentText,
        created_at: new Date().toISOString(),
      };

      const { data: comment, error: insertError } = await supabase
        .from("task_comments")
        .insert(commentData)
        .select()
        .single();

      if (insertError) {
        console.error("Insert error details:", insertError);
        
        if (insertError.code === '42501') {
          setError("Permission denied. You may not have permission to add comments.");
        } else if (insertError.code === '23503') {
          setError("Invalid task or user reference.");
        } else if (insertError.code === '23505') {
          setError("Duplicate comment ID. Please try again.");
        } else {
          setError(`Failed to add comment: ${insertError.message}`);
        }
        
        setIsPosting(false);
        return;
      }

      // Clear input field
      setNewComment("");
      
      // Update task timestamp
      try {
        await supabase
          .from("tasks")
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq("id", task.id);
      } catch (updateError) {
        console.error("Error updating task timestamp:", updateError);
      }

      // Log activity for comment
      await logActivity("comment_added", {
        comment_length: commentText.length
      });

    } catch (error) {
      console.error("Unexpected error adding comment:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
    if (error && error.includes("Please enter a comment")) {
      setError(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleFileUpload = async (e) => {
    // Only admins or task creator can upload files
    if (!canEdit()) {
      alert("Only admins or task creator can upload files");
      return;
    }

    const file = e.target.files[0];
    if (!file || !task) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${task.id}_${Date.now()}.${fileExt}`;
      const filePath = `task-attachments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const attachmentData = {
        task_id: task.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: currentUserId,
        created_at: new Date().toISOString(),
      };

      const { data: attachment, error: dbError } = await supabase
        .from("task_attachments")
        .insert(attachmentData)
        .select()
        .single();

      if (dbError) throw dbError;

      await supabase
        .from("tasks")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", task.id);

      await logActivity("file_uploaded", {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      });

      window.location.reload();

    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await logActivity("file_downloaded", {
        file_name: attachment.file_name,
        file_id: attachment.id
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const attachment = attachments.find(a => a.id === attachmentId);
    
    if (!canDeleteAttachment(attachment?.uploaded_by)) {
      alert("Only admins or the uploader can delete files");
      return;
    }

    if (!confirm("Delete this attachment?")) return;

    try {      
      if (attachment?.file_path) {
        await supabase.storage
          .from('task-attachments')
          .remove([attachment.file_path]);
      }

      await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachmentId);

      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      
      await supabase
        .from("tasks")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", task.id);

      await logActivity("file_deleted", {
        file_name: attachment.file_name,
        file_size: attachment.file_size
      });

    } catch (error) {
      console.error("Error deleting attachment:", error);
      alert("Failed to delete attachment");
    }
  };

  const handleUpdateDescription = async () => {
    if (!task) return;

    if (!canEdit()) {
      alert("Only admins or task creator can edit description");
      return;
    }

    setIsSaving(true);
    try {
      const oldDescription = task.description || "";
      
      const { error } = await supabase
        .from("tasks")
        .update({ 
          description: editedDescription,
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id);

      if (error) throw error;

      await logActivity(
        "description_updated",
        {
          old_length: oldDescription.length,
          new_length: editedDescription.length
        },
        oldDescription,
        editedDescription
      );

      task.description = editedDescription;
      setEditingDescription(false);
    } catch (error) {
      console.error("Error updating description:", error);
      alert("Failed to update description");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!task) return;

    if (!canEdit()) {
      alert("Only admins or task creator can edit title");
      return;
    }

    if (!editedTitle.trim()) {
      alert("Title cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const oldTitle = task.title || "";
      
      const { error } = await supabase
        .from("tasks")
        .update({ 
          title: editedTitle.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", task.id);

      if (error) throw error;

      await logActivity(
        "title_updated",
        {
          old_length: oldTitle.length,
          new_length: editedTitle.length
        },
        oldTitle,
        editedTitle.trim()
      );

      task.title = editedTitle.trim();
      setEditingTitle(false);
    } catch (error) {
      console.error("Error updating title:", error);
      alert("Failed to update title");
    } finally {
      setIsSaving(false);
    }
  };

  // Function to format activity message
  const getActivityMessage = (activity) => {
    const action = activity.action;
    const details = activity.details || {};
    
    switch(action) {
      case "title_updated":
        return "Title changed";
      
      case "description_updated":
        return "Description updated";
      
      case "file_uploaded":
        return `Uploaded file: ${details.file_name || 'File'}`;
      
      case "file_downloaded":
        return `Downloaded file: ${details.file_name || 'File'}`;
      
      case "file_deleted":
        return `Deleted file: ${details.file_name || 'File'}`;
      
      case "comment_added":
        return "Added a comment";
      
      case "task_created":
        return "Created this task";
      
      case "status_changed":
        const fromStage = formatStageName(activity.old_value || details.from_status);
        const toStage = formatStageName(activity.new_value || details.to_status);
        return `Moved task from ${fromStage} to ${toStage}`;
      
      default:
        return "Made changes";
    }
  };

  // Function to get icon for activity type
  const getActivityIcon = (action) => {
    switch(action) {
      case "status_changed":
        return <FiMove className="w-4 h-4 text-gray-600" />;
      case "comment_added":
        return <FiMessageSquare className="w-4 h-4 text-gray-600" />;
      case "file_uploaded":
      case "file_downloaded":
      case "file_deleted":
        return <FiFile className="w-4 h-4 text-gray-600" />;
      case "title_updated":
        return <FiType className="w-4 h-4 text-gray-600" />;
      case "description_updated":
        return <FiEdit2 className="w-4 h-4 text-gray-600" />;
      default:
        return <FiActivity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!task) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-full md:w-[500px] lg:w-[520px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiType className="w-4 h-4 text-gray-300" />
                  <span className="text-sm font-medium text-gray-300">Edit Title</span>
                </div>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold text-white placeholder-gray-400"
                  placeholder="Enter task title..."
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateTitle}
                    disabled={!editedTitle.trim() || isSaving}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Title"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingTitle(false);
                      setEditedTitle(task.title);
                    }}
                    className="px-4 py-2.5 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-2.5 py-1 rounded-full bg-gray-700">
                      <span className="text-xs font-medium text-gray-300">Task</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      task.status === 'at_risk' ? 'bg-amber-500/20 text-amber-400' :
                      task.status === 'update_required' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {formatStageName(task.status)}
                    </span>
                    {canEdit() && (
                      <div className="flex items-center gap-1 bg-black/30 text-gray-300 px-2 py-1 rounded-full">
                        <FiLock className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {isAdmin ? (userRole === "admin" ? "Admin" : "Sales Admin") : "Creator"}
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white truncate pr-4">{task.title}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      Created: {format(new Date(task.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                
                {canEdit() && (
                  <button
                    onClick={() => {
                      setEditingTitle(true);
                      setEditedTitle(task.title);
                    }}
                    className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors flex-shrink-0"
                    title="Edit Title"
                    disabled={isSaving}
                  >
                    <FiEdit2 className="w-4 h-4 text-gray-300" />
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors flex-shrink-0 ml-3"
          >
            <FiX className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto pb-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="p-5 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-50 border-l-4 border-red-500 text-red-800 px-4 py-4 rounded-lg flex items-start gap-3 shadow-sm">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Activity Log Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FiActivity className="w-4 h-4 text-blue-600" />
                </div>
                <span>Activity Log</span>
              </h3>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1.5 rounded-full">
                {activities.length}
              </span>
            </div>
            
            {activities.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-b from-gray-50 to-white">
                <FiActivity className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No activity recorded</p>
                <p className="text-sm text-gray-400 mt-1">Changes will appear here</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {activities.map((activity) => (
                  <div key={activity.id || activity.task_id + activity.created_at} 
                       className="group pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 truncate">
                              {activity.user_name || "System"}
                            </span>
                            {activity.user_id === currentUserId && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                You
                              </span>
                            )}
                            {activity.user_id === task.created_by && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
                                Creator
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium mb-2">
                          {getActivityMessage(activity)}
                        </p>
                        
                        {activity.action === "status_changed" && (
                          <div className="mt-3 flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg font-medium">
                                {formatStageName(activity.old_value || activity.details?.from_status)}
                              </span>
                              <FiChevronRight className="w-4 h-4 text-gray-400" />
                              <span className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-lg font-medium">
                                {formatStageName(activity.new_value || activity.details?.to_status)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {activity.action !== "status_changed" && activity.old_value && activity.new_value && (
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white p-2 rounded-lg border border-gray-200">
                              <span className="text-gray-600 line-through truncate flex-1">
                                {activity.old_value}
                              </span>
                              <FiChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-800 truncate flex-1">
                                {activity.new_value}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={activityEndRef} />
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div ref={commentsSectionRef} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <FiMessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <span>Comments</span>
              </h3>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1.5 rounded-full">
                {comments.length}
              </span>
            </div>
            
            {/* Comment Input */}
            <div className="mb-6 bg-gradient-to-b from-gray-50 to-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white text-sm font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="mb-3">
                    <span className="text-sm font-bold text-gray-900">{userName}</span>
                    {!canComment() && currentUserId && (
                      <span className="text-xs text-red-600 ml-2 font-medium">
                        (Only admins, sales admins, and assigned users can comment)
                      </span>
                    )}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={handleCommentChange}
                    onKeyDown={handleKeyDown}
                    className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none disabled:opacity-50 bg-white shadow-sm"
                    placeholder={canComment() ? "Write a comment..." : "Only admins, sales admins, and assigned users can comment"}
                    rows="3"
                    disabled={isPosting || !canComment()}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      {isPosting ? (
                        <span className="flex items-center gap-2">
                          <FiLoader className="w-3 h-3 animate-spin" />
                          <span className="font-medium">Posting...</span>
                        </span>
                      ) : canComment() ? (
                        <span className="flex items-center gap-2">
                          <FiInfo className="w-3 h-3" />
                          Press Ctrl+Enter to send
                        </span>
                      ) : (
                        "Only admins, sales admins, and assigned users can comment"
                      )}
                    </p>
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isPosting || !canComment()}
                      className="px-5 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm transition-all duration-200 flex items-center gap-2.5 shadow-md"
                    >
                      {isPosting ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <FiSend className="w-4 h-4" />
                          Post Comment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-b from-gray-50 to-white">
                  <FiMessageSquare className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No comments yet</p>
                  <p className="text-sm text-gray-400 mt-1">Be the first to comment</p>
                </div>
              ) : (
                <>
                  {comments.map((comment) => (
                    <div key={comment.id} className="group pb-4 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-gray-50/50 p-3 rounded-lg transition-colors">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-gray-800 text-sm font-bold">
                            {(comment.user_name || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900">
                                {comment.user_name || "User"}
                              </span>
                              {comment.user_id === currentUserId && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                  You
                                </span>
                              )}
                              {comment.user_id === task.created_by && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
                                  Creator
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200">
                            {comment.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2.5">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FiMessageSquare className="w-4 h-4 text-green-600" />
                </div>
                <span>Description</span>
              </h3>
              {canEdit() && (
                <button
                  onClick={() => {
                    if (!editingDescription) {
                      setEditedDescription(task.description || "");
                    }
                    setEditingDescription(!editingDescription);
                  }}
                  className="text-sm flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium transition-all duration-200"
                  disabled={isSaving || editingTitle}
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  {editingDescription ? "Cancel" : "Edit"}
                </button>
              )}
            </div>

            {editingDescription ? (
              <div className="space-y-4">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[140px] bg-white shadow-sm"
                  placeholder="Enter task description..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateDescription}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-bold hover:from-green-500 hover:to-green-600 disabled:opacity-50 transition-all duration-200 flex items-center gap-2.5 shadow-md"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingDescription(false);
                      setEditedDescription(task.description || "");
                    }}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed p-3 bg-gradient-to-b from-gray-50 to-white rounded-lg border border-gray-200">
                {task.description || (
                  <span className="text-gray-400 italic">No description provided</span>
                )}
              </p>
            )}
          </div>

          {/* Task Details Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <FiUser className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">Assigned To</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  <span className="text-blue-700 text-sm font-bold">
                    {(assignedUserName || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 truncate">
                    {assignedUserName}
                  </p>
                  {task.assigned_to && (
                    <p className="text-xs text-gray-500 mt-1 truncate font-medium">
                      ID: {task.assigned_to.slice(0, 8)}...
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <div className="p-1.5 bg-purple-50 rounded-lg">
                  <FiUser className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">Created By</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                  <span className="text-purple-700 text-sm font-bold">
                    {(createdByName || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 truncate">
                    {createdByName}
                  </p>
                  {task.created_by && (
                    <p className="text-xs text-gray-500 mt-1 truncate font-medium">
                      ID: {task.created_by.slice(0, 8)}...
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 shadow-sm col-span-2">
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <div className="p-1.5 bg-amber-50 rounded-lg">
                  <FiCalendar className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">Due Date</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {task.due_date ? (
                      <span className="flex items-center gap-2">
                        {new Date(task.due_date).toLocaleString('en-US', {
                          timeZone: 'Asia/Karachi',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-400">No due date</span>
                    )}
                  </p>
                  {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                    <p className="text-xs font-medium text-red-600 mt-2 bg-red-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      Overdue
                    </p>
                  )}
                </div>
                {task.due_date && (
                  <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg">
                    <FiCalendar className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <FiPaperclip className="w-4 h-4 text-amber-600" />
                </div>
                <span>Attachments</span>
              </h3>
              <div className="flex items-center gap-3">
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1.5 rounded-full">
                  {attachments.length}
                </span>
                {canEdit() && (
                  <label className="text-sm px-4 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 cursor-pointer transition-all duration-200 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                    <FiPlus className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading || isSaving || !currentUserId}
                    />
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <FiLoader className="w-3 h-3 animate-spin" />
                        Uploading...
                      </span>
                    ) : "Add File"}
                  </label>
                )}
              </div>
            </div>

            {attachments.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-b from-gray-50 to-white">
                <FiFile className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No attachments yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  {canEdit() ? "Upload files to share with your team" : "No files uploaded"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:border-gray-300 transition-all duration-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center shadow-sm">
                        <FiFile className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate text-gray-900">
                          {attachment.file_name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                          <span className="font-medium">{(attachment.file_size / 1024).toFixed(1)} KB</span>
                          <span className="text-gray-300">•</span>
                          <span className="font-medium">{attachment.file_type || "File"}</span>
                          {attachment.uploaded_by === currentUserId && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                              Your Upload
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                        disabled={isSaving}
                      >
                        <FiDownload className="w-4 h-4 text-gray-600" />
                      </button>
                      {canDeleteAttachment(attachment.uploaded_by) && (
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                          disabled={isSaving}
                        >
                          <FiTrash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}