import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiLogOut, FiHome, FiArrowRight, FiMenu, FiX } from "react-icons/fi";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../context/NotificationContext";

export default function Header() {
  const { user, logout, profile } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const getUserDisplayName = () => {
    if (profile?.name) return profile.name;
    if (user?.name) return user.name;
    return "User";
  };

  const getUserDisplayRole = () => {
    if (profile?.role) return profile.role;
    return "User";
  };

  const getUserAvatarText = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navItems = [
    { path: "/workspaces", label: "Dashboard", icon: <FiHome />, alwaysVisible: true },
  ];

  const authNavItems = [
    { 
      path: "/workspaces", 
      label: "Workspaces", 
      icon: <FiArrowRight />, 
      requiresAuth: true,
    },
    { 
      path: "/invites", 
      label: "Invites", 
      icon: <FiArrowRight />, 
      requiresAuth: true,
    },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`top-0 z-50 w-full transition-all duration-300 ${
          scrolled 
            ? "bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200" 
            : "bg-white border-b border-gray-100"
        }`}
      >
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 lg:h-20">
            {/* Logo - Text based */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer flex-shrink-0"
              onClick={() => navigate("/")}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-black rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xs xs:text-sm sm:text-base">BBD</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-lg sm:text-xl text-black">Task Manager</h1>
                  <p className="text-xs text-gray-500">by BigBull Digital</p>
                </div>
              </div>
            </motion.div>

            <NotificationBell /> 

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center ml-4 xl:ml-8 space-x-1 xl:space-x-3">
              {navItems.map((item) => {
                if (user && (item.path === "/about" || item.path === "/pricing")) {
                  return null;
                }
                return (
                  <motion.button
                    key={item.path}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-lg xl:rounded-xl text-sm xl:text-base font-medium transition-all whitespace-nowrap ${
                      isActivePath(item.path)
                        ? "text-black bg-gray-100 border border-gray-300"
                        : "text-gray-700 hover:text-black hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-base xl:text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}

              {user && authNavItems.map((item) => (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-4 py-2 xl:py-2.5 rounded-lg xl:rounded-xl text-sm xl:text-base font-medium transition-all whitespace-nowrap ${
                    isActivePath(item.path)
                      ? "text-black bg-gray-100 border border-gray-300"
                      : "text-gray-700 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  <span className="text-base xl:text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* Right Side - Auth Section */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {user ? (
                <>
                  {/* Dashboard Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/workspaces")}
                    className="hidden sm:block px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 text-xs sm:text-sm lg:text-base bg-black text-white rounded-lg lg:rounded-xl font-semibold hover:bg-gray-800 transition-all whitespace-nowrap"
                  >
                    Dashboard
                  </motion.button>

                  {/* User Info */}
                  <div className="hidden lg:flex items-center gap-2 xl:gap-3 pl-3 xl:pl-4 pr-2 xl:pr-3 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-gray-50 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
                    <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-black flex items-center justify-center shadow">
                      <span className="font-bold text-white text-xs xl:text-sm">
                        {getUserAvatarText()}
                      </span>
                    </div>
                    <div className="text-left min-w-0 max-w-[120px] xl:max-w-[160px]">
                      <p className="font-semibold text-gray-900 text-xs xl:text-sm truncate">
                        {getUserDisplayName().split(' ')[0]} | {getUserDisplayRole()}
                      </p>
                      <p className="text-[10px] xl:text-xs text-gray-500 truncate">{user.email?.split('@')[0]}</p>
                    </div>
                  </div>

                  {/* Mobile User Avatar */}
                  <div className="lg:hidden flex items-center">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-black flex items-center justify-center shadow cursor-pointer">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {getUserAvatarText()}
                      </span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="hidden lg:block px-3 xl:px-4 py-2 xl:py-2.5 text-gray-700 hover:text-black font-semibold hover:bg-gray-100 rounded-lg xl:rounded-xl transition-colors"
                    title="Logout"
                  >
                    <FiLogOut className="w-4 h-4 xl:w-5 xl:h-5" />
                  </motion.button>
                </>
              ) : (
                <>
                  {/* Sign In Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/auth")}
                    className="hidden md:block px-3 lg:px-5 py-2 lg:py-2.5 text-sm lg:text-base text-gray-700 hover:text-black font-semibold transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </motion.button>
                  
                  {/* Get Started Button */}
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/auth")}
                    className="hidden sm:block px-3 sm:px-4 lg:px-6 py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base bg-black text-white rounded-lg lg:rounded-xl font-semibold hover:bg-gray-800 transition-all whitespace-nowrap"
                  >
                    Get Started
                  </motion.button>
                </>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                ) : (
                  <FiMenu className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-[85vw] xs:w-[75vw] sm:w-full max-w-[320px] sm:max-w-sm bg-white shadow-2xl lg:hidden"
            >
              {/* Mobile Menu Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-b from-white to-gray-50">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">BBD</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-black text-sm sm:text-base">Task Manager</h2>
                      <p className="text-xs text-gray-500">Menu</p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                  </motion.button>
                </div>

                {/* User Info */}
                {user && (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black flex items-center justify-center shadow">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {getUserAvatarText()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-black text-xs sm:text-sm truncate">
                        {getUserDisplayName()} | {getUserDisplayRole()}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Content */}
              <div className="h-[calc(100vh-160px)] sm:h-[calc(100vh-180px)] overflow-y-auto p-3 sm:p-4">
                <div className="space-y-1.5 sm:space-y-2">
                  {[...navItems, ...(user ? authNavItems : [])]
                    .filter(item => {
                      if (user && (item.path === "/about" || item.path === "/pricing")) {
                        return false;
                      }
                      return true;
                    })
                    .map((item) => (
                      <motion.button
                        key={item.path}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          navigate(item.path);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl text-left transition-all ${
                          isActivePath(item.path)
                            ? "bg-gray-100 border border-gray-300"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span className={`text-lg sm:text-xl ${
                          isActivePath(item.path) ? "text-black" : "text-gray-600"
                        }`}>
                          {item.icon}
                        </span>
                        <div className="flex-1">
                          <span className={`font-medium text-sm sm:text-base ${
                            isActivePath(item.path) ? "text-black" : "text-gray-900"
                          }`}>
                            {item.label}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                </div>

                {/* Mobile Auth Buttons */}
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                  {user ? (
                    <div className="space-y-2.5 sm:space-y-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          navigate("/workspaces");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl text-sm sm:text-base bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
                      >
                        Go to Dashboard
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl text-sm sm:text-base border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        Logout
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 sm:space-y-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          navigate("/auth");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl text-sm sm:text-base border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        Sign In
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          navigate("/auth");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl text-sm sm:text-base bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
                      >
                        Get Started
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}