import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
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

/* ================= PRIVATE ROUTE ================= */
function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  return user ? children : <Navigate to="/auth" />;
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
                <Header />
                
                <Routes>
                  {/* PUBLIC ROUTES */}
                  <Route 
                    path="/auth" 
                    element={
                      <PublicRoute>
                        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white w-full">
                          <SignIn />
                        </div>
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path="/reset-password" 
                    element={
                        <ResetPassword />
                    } 
                  />

                  {/* PRIVATE ROUTES */}
                  <Route
                    path="/workspaces"
                    element={
                      <PrivateRoute>
                        <Workspaces />
                      </PrivateRoute>
                    }
                  />
                  
                  <Route
                    path="/invites"
                    element={
                      <PrivateRoute>
                        <Invites />
                      </PrivateRoute>
                    }
                  />
                  
                  <Route
                    path="/workspace/:id"
                    element={
                      <PrivateRoute>
                        <WorkspaceDetails />
                      </PrivateRoute>
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