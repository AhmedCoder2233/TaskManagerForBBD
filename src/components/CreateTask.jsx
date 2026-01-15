import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { 
  FiUser, 
  FiCalendar, 
  FiFileText, 
  FiPaperclip,
  FiX,
  FiUpload,
  FiFile,
  FiCheckCircle,
  FiMail,
  FiClock
} from "react-icons/fi";
import emailjs from '@emailjs/browser'; 

export default function CreateTask({ workspaceId, onTaskCreated, userRole }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [userId, setUserId] = useState(null);

  emailjs.init(import.meta.env.VITE_EMAIL_API);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

useEffect(() => {
  const fetchData = async () => {
    // Fetch workspace name
    try {
      const { data: workspaceData } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single();
      
      if (workspaceData) {
        setWorkspaceName(workspaceData.name);
      }
    } catch (err) {
      console.error("Error fetching workspace:", err);
    }

    // Fetch members
    try {
      const { data: membersData } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceId);

      if (!membersData) return;

      const userIds = membersData.map(m => m.user_id).filter(Boolean);
      if (userIds.length === 0) return;

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .in('id', userIds);

      const combinedMembers = userIds.map(userId => {
        const profile = profilesData?.find(p => p.id === userId);
        return {
          user_id: userId,
          profiles: profile || { id: userId, name: `Team Member`, email: "", role: "member" }
        };
      });

      // Filter out admin users if current user is admin
      const filteredMembers = userRole === 'admin' 
        ? combinedMembers.filter(member => {
            // Filter out admin users
            return member.profiles.role !== 'admin';
          })
        : combinedMembers;

      setMembers(filteredMembers);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  fetchData();
}, [workspaceId, userRole]);

  // Email send function using Web3Forms
const sendTaskEmail = async (toEmail, toName, pktDueDate = null) => {
  try {
    // Format date in Pakistani timezone for email
    const formatPKTDateTime = (dateString) => {
      if (!dateString) return "Not set";
      
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          timeZone: 'Asia/Karachi',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) + ' (PKT)';
      } catch (error) {
        return "Invalid date";
      }
    };

    // Use the PKT date passed from createTask
    const formattedDate = pktDueDate ? 
      formatPKTDateTime(pktDueDate) : 
      "Not set";

    // Prepare the data that matches your EmailJS template variables
    const templateParams = {
      to_name: toName,
      to_email: toEmail,
      message: `
You have a new task assigned.

Workspace: ${workspaceName}
Task Title: ${title}
Task Description: ${description || "No description provided"}
Due Date: ${formattedDate}
`
    };

    // Send the email
    const result = await emailjs.send(
      import.meta.env.VITE_SERVICE_ID,
      import.meta.env.VITE_TEMPLATE_ID,
      templateParams
    );
    return { success: true };

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error.text };
  }
};

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    
    for (const file of files) {
      try {
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
        const filePath = `task-attachments/${workspaceId}/${Date.now()}_${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const attachment = {
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        };

        setAttachments(prev => [...prev, attachment]);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
    
    setIsUploading(false);
  };

  const removeAttachment = (index) => {
    const attachment = attachments[index];
    if (attachment.preview) URL.revokeObjectURL(attachment.preview);
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

const createTask = async (e) => {
  e.preventDefault();
  if (!title.trim()) {
    setSuccessMessage("Please enter a task title");
    setTimeout(() => setSuccessMessage(""), 3000);
    return;
  }

  // Validation: Check if assignedTo is selected
  if (!assignedTo) {
    setSuccessMessage("Please assign the task to a team member");
    setTimeout(() => setSuccessMessage(""), 3000);
    return;
  }

  // Validation: Check if due date is selected
  if (!dueDate) {
    setSuccessMessage("Please select a due date");
    setTimeout(() => setSuccessMessage(""), 3000);
    return;
  }

  setLoading(true);
  try {
    // Function to convert local date/time to Pakistan timezone ISO string
    const getPKTDateTimeISO = (dateStr, timeStr) => {
      if (!dateStr) return null;
      
      if (!timeStr) {
        // If no time provided, set to 23:59:59 PKT
        timeStr = "23:59:59";
      } else if (timeStr.length === 5) {
        // If time is in HH:MM format, add seconds
        timeStr = `${timeStr}:00`;
      }
      
      // Create date string in PKT timezone (UTC+5)
      const pktDateTimeString = `${dateStr}T${timeStr}+05:00`;
      
      try {
        // Parse as PKT timezone
        const date = new Date(pktDateTimeString);
        
        if (isNaN(date.getTime())) {
          console.warn("Invalid date, using fallback");
          // Fallback: use local date and adjust for PKT (UTC+5)
          const localDate = new Date(`${dateStr}T${timeStr}`);
          const pktDate = new Date(localDate.getTime() + (5 * 60 * 60 * 1000));
          return pktDate.toISOString();
        }
        
        return date.toISOString();
      } catch (error) {
        console.error("Date parsing error:", error);
        // Fallback to simple date without timezone
        return `${dateStr}T${timeStr}`;
      }
    };

    // Get due date in Pakistan timezone
    const pktDueDate = getPKTDateTimeISO(dueDate, dueTime);

    // Create task
    const taskData = {
      workspace_id: workspaceId,
      title: title.trim(),
      description: description.trim() || null,
      status: "planning",
      assigned_to: assignedTo || null,
      created_by: userId,
      due_date: pktDueDate,
    };

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (taskError) throw taskError;

    // Upload attachments
    if (attachments.length > 0) {
      const attachmentsData = attachments.map(attachment => ({
        task_id: task.id,
        file_name: attachment.name,
        file_path: attachment.path,
        file_size: attachment.size,
        file_type: attachment.type,
        uploaded_by: userId,
      }));

      await supabase.from("task_attachments").insert(attachmentsData);
    }

    // Send email - Update email to show PKT time
    let emailSent = false;
    let assignedUserName = "";
    
    if (assignedTo && sendEmail) {
      const assignedUser = members.find(m => m.user_id === assignedTo);
      if (assignedUser?.profiles?.email) {
        try {
          const emailResult = await sendTaskEmail(
            assignedUser.profiles.email,
            assignedUser.profiles.name,
            pktDueDate // Pass PKT date to email function
          );
          
          emailSent = emailResult.success;
          assignedUserName = assignedUser.profiles.name;
          
          if (!emailSent) {
            console.log("Trying alternative email method...");
            // Fallback to Formspree
            await sendEmailViaFormspree(
              assignedUser.profiles.email,
              assignedUser.profiles.name,
              pktDueDate // Pass PKT date to formspree
            );
            emailSent = true;
          }
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      }
    }

    // Reset form
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setDueDate("");
    setDueTime("");
    setAttachments([]);

    // Success message
    let successMsg = `✓ Task "${task.title}" created successfully!`;
    if (emailSent) {
      successMsg += ` Email sent to ${assignedUserName}.`;
    } else if (assignedTo && sendEmail) {
      successMsg += ` (Email could not be sent)`;
    }
    setSuccessMessage(successMsg);
    
    // Notify parent
    if (onTaskCreated) onTaskCreated(task);

    setTimeout(() => setSuccessMessage(""), 5000);

  } catch (error) {
    console.error("Error creating task:", error);
    setSuccessMessage(`✗ Failed to create task: ${error.message}`);
    setTimeout(() => setSuccessMessage(""), 3000);
  } finally {
    setLoading(false);
  }
};
  // Get assigned user info
  const getAssignedUserInfo = () => {
    if (!assignedTo) return null;
    const user = members.find(m => m.user_id === assignedTo);
    return user?.profiles;
  };

  const assignedUser = getAssignedUserInfo();

  return (
    <div className="relative">
      {/* Success Message */}
      {successMessage && (
        <div className={`absolute top-[-60px] left-0 right-0 p-4 rounded-lg ${
          successMessage.startsWith("✓") 
            ? "bg-green-50 border border-green-200 text-green-800" 
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          <div className="flex items-center gap-3">
            {successMessage.startsWith("✓") ? (
              <FiCheckCircle className="w-5 h-5" />
            ) : (
              <FiCheckCircle className="w-5 h-5 text-red-600" />
            )}
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={createTask} className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 shadow-sm">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">Create New Task</h3>
          <p className="text-sm text-gray-600">Add a new task with email notification</p>
          {workspaceName && (
            <p className="text-xs text-red-600 mt-1">
              <span className="font-medium">{workspaceName}</span>
            </p>
          )}
        </div>

        {/* Task Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Title *
          </label>
          <input
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-colors"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Task Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <FiFileText className="w-4 h-4" />
            Description
          </label>
          <textarea
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-colors min-h-[100px] resize-y"
            placeholder="Describe the task in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assign To - Now Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FiUser className="w-4 h-4" />
              Assign To *
            </label>
            <select
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-colors"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              required
            >
              <option value="">Select Team Member *</option>
              {members.length === 0 ? (
                <option disabled>Loading team members...</option>
              ) : (
                members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.name || "Team Member"}
                    {m.profiles?.email ? ` (${m.profiles.email})` : ''}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">Select who this task is assigned to</p>
          </div>

          {/* Due Date & Time - Now Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              Due Date & Time *
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-colors"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <div className="relative w-32">
                <input
                  type="time"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-colors"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  required
                />
                <FiClock className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Set deadline for this task</p>
          </div>
        </div>

        {/* Email Notification Settings */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-gray-700 font-medium">
              <FiMail className="w-4 h-4" />
              Email Notification
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
          
          {assignedUser && sendEmail && (
            <div className="text-sm text-gray-600">
              <p>Email will be sent to: <span className="font-medium">{assignedUser.email}</span></p>
            </div>
          )}
          
          {assignedTo && !assignedUser?.email && sendEmail && (
            <div className="text-sm text-yellow-600">
              <p>⚠️ Selected user doesn't have an email address</p>
            </div>
          )}

        </div>

        {/* Attachments Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <FiPaperclip className="w-4 h-4" />
              Attachments (Optional)
            </label>
            <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center gap-2 transition-colors">
              <FiUpload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Add Files'}</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {attachment.preview ? (
                      <img 
                        src={attachment.preview} 
                        alt="Preview" 
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        <FiFile className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-2 rounded-lg hover:bg-gray-200"
                  >
                    <FiX className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !title.trim() || !assignedTo || !dueDate || !dueTime}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating Task...
            </>
          ) : (
            <>
              <FiCheckCircle className="w-4 h-4" />
              Create Task
            </>
          )}
        </button>
      </form>
    </div>
  );
}