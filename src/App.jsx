import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import SignIn from "./SignIn";

import { AuthProvider, AuthContext } from "./context/AuthContext";
import "./App.css";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { ActiveWorkspaceProvider } from "./context/ActiveWorkspaceContext";
import Workspaces from "./Workspaces";
import WorkspaceDetails from "./components/WorkspaceDetails";
import Invites from "./Invites";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ResetPassword from "./ResetPassword";
import { NotificationProvider } from "./context/NotificationContext";
import SidebarLayout from "./components/SidebarLayout";

/* ================= PRIVATE ROUTE WITH SIDEBAR ================= */
function PrivateRouteWithSidebar({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  
  if (!user) return <Navigate to="/auth" />;
  
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
}

/* ================= PUBLIC ROUTE (for non-auth users) ================= */
function PublicRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  return !user ? children : <Navigate to="/workspaces" />;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a short loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <WorkspaceProvider>
          <ActiveWorkspaceProvider>
            <BrowserRouter>
              <ToastContainer />

              {/* Simple Loading Screen */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 bg-white flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4">
                        <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-xl">BBD</span>
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">BigBull Digital</h2>
                      <p className="text-gray-600 mt-1">Task Manager</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main App Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {/* Header is now inside each component that needs it */}
                <Routes>
                  {/* PUBLIC ROUTES WITHOUT SIDEBAR */}
                  <Route 
                    path="/auth" 
                    element={
                      <PublicRoute>
                        <SignIn />
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path="/reset-password" 
                    element={
                      <PublicRoute>
                        <ResetPassword />
                      </PublicRoute>
                    } 
                  />

                  {/* PRIVATE ROUTES WITH SIDEBAR */}
                  <Route
                    path="/workspaces"
                    element={
                      <PrivateRouteWithSidebar>
                        <Workspaces />
                      </PrivateRouteWithSidebar>
                    }
                  />
                  
                  <Route
                    path="/invites"
                    element={
                      <PrivateRouteWithSidebar>
                        <Invites />
                      </PrivateRouteWithSidebar>
                    }
                  />
                  
                  <Route
                    path="/workspace/:id"
                    element={
                      <PrivateRouteWithSidebar>
                        <WorkspaceDetails />
                      </PrivateRouteWithSidebar>
                    }
                  />

                  {/* Default redirect based on auth status */}
                  <Route
                    path="/*"
                    element={
                      <AuthContext.Consumer>
                        {({ user, loading }) => {
                          if (loading) return null;
                          return user ? <Navigate to="/workspaces" /> : <Navigate to="/auth" />;
                        }}
                      </AuthContext.Consumer>
                    }
                  />
                </Routes>
              </motion.div>
            </BrowserRouter>
          </ActiveWorkspaceProvider>
        </WorkspaceProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}