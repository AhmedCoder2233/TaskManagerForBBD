import { useEffect, useState, useContext } from "react";
import { supabase } from "./lib/supabase";
import { AuthContext } from "./context/AuthContext";
import { WorkspaceContext } from "./context/WorkspaceContext";
import { useNavigate } from "react-router-dom";

export default function Invites() {
  const { user } = useContext(AuthContext);
  const { acceptInvite } = useContext(WorkspaceContext);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
const handleError = (error, userMessage = "Something went wrong") => {
  if (import.meta.env.DEV) {
    console.error(error);
  }
  setErrorMessage(userMessage);
  setTimeout(() => setErrorMessage(""), 3000);
};
  useEffect(() => {
    if (!user) return;

    const fetchInvites = async () => {
      setLoading(true);

      // 1️⃣ Fetch invites by email
      const { data: inviteData, error: inviteError } = await supabase
        .from("workspace_invites")
        .select("id, status, workspace_id, created_at, invited_by, role")
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (inviteError) {
        handleError(inviteError, "Failed to Fetch Invites");
        setInvites([]);
        setLoading(false);
        return;
      }

      if (!inviteData || inviteData.length === 0) {
        setInvites([]);
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch related workspaces
      const workspaceIds = inviteData.map((i) => i.workspace_id);

      const { data: workspaceData, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id, name")
        .in("id", workspaceIds);

      if (workspaceError) {
        setInvites([]);
        handleError(workspaceError, "Failed to Fetch Workspaces");
        setLoading(false);
        return;
      }

      // 3️⃣ Fetch inviter info
      const inviterIds = inviteData.map((i) => i.invited_by);
      const { data: inviterData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", inviterIds);

      // 4️⃣ Merge all data
      const merged = inviteData.map((invite) => ({
        ...invite,
        workspace: workspaceData?.find((w) => w.id === invite.workspace_id) || null,
        inviter: inviterData?.find((p) => p.id === invite.invited_by) || null,
      }));

      setInvites(merged);
      setLoading(false);
    };

    fetchInvites();

    // 🔥 Real-time subscription for new invites
    if (user?.email) {
      const channel = supabase
        .channel(`invites:email=eq.${user.email.toLowerCase()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'workspace_invites',
            filter: `email=eq.${user.email.toLowerCase()}`
          },
          () => {
            console.log("📢 New invite received!");
            fetchInvites();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const respond = async (invite, action) => {
    setProcessing(invite.id);
    try {
      if (action === "accepted") {
        // Use the acceptInvite function from context
        await acceptInvite(invite.id, invite.workspace_id);
        
        // Remove from local state
        setInvites((prev) => prev.filter((i) => i.id !== invite.id));
        
        // 🔥 Navigate to the workspace after accepting
        setTimeout(() => {
          navigate(`/workspace/${invite.workspace_id}`);
        }, 500);
      } else {
        // Reject invite
        await supabase
          .from("workspace_invites")
          .update({ status: "rejected" })
          .eq("id", invite.id);

        // Remove from local state
        setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      }
      
    } catch (error) {
      handleError(error, "Failed to process invite");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
{errorMessage && (
  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
    {errorMessage}
  </div>
)}
      <div className="flex">
        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Workspace Invites
            </h1>
            <p className="text-gray-600 mt-2">
              Accept or decline invitations to join workspaces
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading invites...</p>
            </div>
          ) : invites.length === 0 ? (
            <div className="bg-white border rounded-xl p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending invitations
              </h3>
              <p className="text-gray-500">
                You don't have any pending workspace invitations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold">
                            {invite.workspace?.name?.charAt(0) || "W"}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {invite.workspace?.name || "Workspace"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Invited by {invite.inviter?.name || "someone"}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-2">
                        You've been invited to join this workspace as a <span className="font-medium">{invite.role || "member"}</span>.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => respond(invite, "accepted")}
                        disabled={processing === invite.id}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing === invite.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Accepting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Accept
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => respond(invite, "rejected")}
                        disabled={processing === invite.id}
                        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    Invited on {new Date(invite.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );

}

