import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext } from "./AuthContext";

export const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { user, profile } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add ref to track if workspaces have been fetched
  const workspacesFetchedRef = useRef(false);

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("workspace_members")
      .select(`
        workspace_id,
        workspaces (
          id,
          name,
          created_at,
          created_by
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    const uniqueWorkspaces = data
      ?.map((row) => row.workspaces)
      .filter(Boolean);

    setWorkspaces(uniqueWorkspaces || []);
    setLoading(false);
  };

  const createWorkspace = async (name) => {
    if (profile.role !== "admin") return;

    const { data } = await supabase
      .from("workspaces")
      .insert({
        name,
        created_by: user.id,
      })
      .select()
      .single();

    await supabase.from("workspace_members").insert({
      workspace_id: data.id,
      user_id: user.id,
    });

    fetchWorkspaces();
  };

  const inviteUserByEmail = async (workspaceId, email) => {
    if (!email) {
      throw new Error("Email is required");
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1️⃣ Check profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", cleanEmail)
      .single();

    if (profileError || !profile) {
      throw new Error("User with this email does not exist");
    }

    // 2️⃣ Prevent duplicate invite
    const { data: existingInvite } = await supabase
      .from("workspace_invites")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", cleanEmail)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      throw new Error("Invite already sent to this user");
    }

    // 3️⃣ Send invite
    const { error: inviteError } = await supabase
      .from("workspace_invites")
      .insert({
        workspace_id: workspaceId,
        invited_user_id: profile.id,
        email: cleanEmail,
        invited_by: user.id,
        role: "member",
        status: "pending",
      });

    if (inviteError) throw inviteError;
  };

  const fetchWorkspaceStats = async (workspaceId) => {
    try {
      // Fetch tasks stats
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('workspace_id', workspaceId);

      if (tasksError) throw tasksError;

      // Fetch pending invites
      const { data: invites, error: invitesError } = await supabase
        .from('workspace_invites')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending');

      if (invitesError) throw invitesError;

      return {
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
        pendingInvites: invites?.length || 0
      };
    } catch (error) {
      console.error("Error fetching workspace stats:", error);
      return null;
    }
  };

  // Function to accept invite and add user to workspace
  const acceptInvite = async (inviteId, workspaceId) => {
    try {
      if (!user) throw new Error("User not authenticated");

      // 1️⃣ Update invite status to accepted
      const { error: updateError } = await supabase
        .from("workspace_invites")
        .update({ status: "accepted" })
        .eq("id", inviteId)
        .eq("invited_user_id", user.id);

      if (updateError) throw updateError;

      // 2️⃣ Add user to workspace_members
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: "member",
        });

      if (memberError) {
        // If already a member, ignore duplicate error
        if (memberError.code !== '23505') {
          throw memberError;
        }
      }

      // 3️⃣ Refresh workspaces list
      await fetchWorkspaces();

      return { success: true };
    } catch (error) {
      console.error("Error accepting invite:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Only fetch workspaces if:
    // 1. User exists
    // 2. Workspaces haven't been fetched yet
    // 3. OR workspaces array is empty (fresh load)
    if (user && (!workspacesFetchedRef.current || workspaces.length === 0)) {
      fetchWorkspaces();
      workspacesFetchedRef.current = true;
    }
    
    // If user logs out, reset the ref
    if (!user) {
      workspacesFetchedRef.current = false;
      setWorkspaces([]);
    }
  }, [user, profile]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        loading,
        createWorkspace,
        inviteUserByEmail,
        fetchWorkspaces,
        acceptInvite,
        fetchWorkspaceStats
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
