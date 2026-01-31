import { FiChevronRight, FiSidebar, FiUsers, FiCheckSquare } from "react-icons/fi";

export default function Workspaces() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-indigo-50/30">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pt-12 pb-8 sm:pt-16 sm:pb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <FiSidebar className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-purple-600">Workspace</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Get started by selecting a workspace from the sidebar menu
          </p>
        </div>

        {/* Steps Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          {/* Step 1 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-purple-100 h-full">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mb-6">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Locate Sidebar</h3>
              <p className="text-gray-600 mb-4">
                Find the sidebar menu on the left side of your screen
              </p>
              <div className="mt-auto">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                    <FiSidebar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
            {/* Connector for desktop */}
            <div className="hidden lg:block absolute top-1/2 right-0 w-8 h-0.5 bg-gradient-to-r from-purple-200 to-transparent transform translate-x-full"></div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-blue-100 h-full">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-6">
                <span className="text-white text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Choose Workspace</h3>
              <p className="text-gray-600 mb-4">
                Click on any workspace to open it and start working
              </p>
              <div className="mt-auto">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
            {/* Connector for desktop */}
            <div className="hidden lg:block absolute top-1/2 right-0 w-8 h-0.5 bg-gradient-to-r from-blue-200 to-transparent transform translate-x-full"></div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-emerald-100 h-full">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center mb-6">
                <span className="text-white text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Start Working</h3>
              <p className="text-gray-600 mb-4">
                Create tasks, collaborate with team, and track progress
              </p>
              <div className="mt-auto">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <FiCheckSquare className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

       
        {/* Visual Guide */}
        <div className="mt-12 sm:mt-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Visual Guide</h2>
            <p className="text-gray-600">Find what you need to get started</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 mb-20 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-700 font-bold text-sm">L</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sidebar Menu</p>
                  <p className="text-xs text-gray-500">Left side of screen</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 mb-20 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-sm">W</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Workspaces List</p>
                  <p className="text-xs text-gray-500">Available projects</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 mb-20 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-700 font-bold text-sm">S</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Search</p>
                  <p className="text-xs text-gray-500">Find workspaces</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 mb-20 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-700 font-bold text-sm">U</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Your Profile</p>
                  <p className="text-xs text-gray-500">Bottom of sidebar</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      
      </div>
    </div>
  );
}