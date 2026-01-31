import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { WorkspaceContext } from "./context/WorkspaceContext";
import { AuthContext } from "./context/AuthContext";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { supabase } from "./lib/supabase";
import InviteUser from "./components/InviteUser";

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { workspaces } = useContext(WorkspaceContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Check if user has access to this workspace
    const checkAccess = () => {
      const userHasAccess = workspaces.some(ws => ws.id === workspaceId);
      setHasAccess(userHasAccess);
      
      if (!userHasAccess && workspaces.length > 0) {
        navigate("/workspaces");
      }
    };

    checkAccess();
  }, [workspaceId, workspaces, navigate]);

  useEffect(() => {
    if (!workspaceId || !hasAccess) return;

    const fetchWorkspaceDetails = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .single();

      if (error) {
        console.error("Error fetching workspace:", error);
        navigate("/workspaces");
        return;
      }

      setWorkspace(data);
      setLoading(false);
    };

    fetchWorkspaceDetails();
  }, [workspaceId, hasAccess, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Workspace Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {workspace.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Workspace ID: {workspace.id}
              </p>
            </div>

            {/* Workspace Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Workspace Overview
                  </h2>
                  <p className="text-gray-600">
                    Welcome to your workspace! Here you can collaborate with your team members.
                  </p>
                </div>

                {/* Add your workspace content here */}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Invite User Component */}
                {user && (
                  <InviteUser workspaceId={workspaceId} />
                )}

                {/* Workspace Members */}
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Members
                  </h3>
                  {/* Add members list here */}
                  <p className="text-sm text-gray-500">
                    Member list coming soon...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}