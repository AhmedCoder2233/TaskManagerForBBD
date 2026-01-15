// lib/taskHelpers.js
import { supabase } from "./supabase";

export const fetchTasksWithUsers = async (workspaceId) => {
  try {
    // First get all tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (tasksError) throw tasksError;

    // Get all unique user IDs from tasks
    const userIds = [
      ...new Set(tasks.flatMap(t => [t.assigned_to, t.created_by].filter(Boolean)))
    ];

    // Fetch user profiles in batch
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);

    if (profilesError) throw profilesError;

    // Combine data
    const profileMap = profiles.reduce((map, profile) => {
      map[profile.id] = profile;
      return map;
    }, {});

    // Enrich tasks with user info
    const enrichedTasks = tasks.map(task => ({
      ...task,
      assigned_user: task.assigned_to ? profileMap[task.assigned_to] : null,
      creator: task.created_by ? profileMap[task.created_by] : null,
    }));

    return { data: enrichedTasks, error: null };
  } catch (error) {
    return { data: [], error };
  }
};