import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Users, MessageSquare, Upload, Briefcase, 
  Check, Shield, Globe, FileText, Zap
} from 'lucide-react';

const Pricing = () => {
  const planFeatures = [
    { icon: <Briefcase className="w-5 h-5" />, text: "1 Admin Account per Email" },
    { icon: <Users className="w-5 h-5" />, text: "Create Unlimited Workspaces" },
    { icon: <Users className="w-5 h-5" />, text: "Add Unlimited Team Members" },
    { icon: <MessageSquare className="w-5 h-5" />, text: "Real-Time Chat & Group Chat" },
    { icon: <Upload className="w-5 h-5" />, text: "File Upload & Download with Comments" },
    { icon: <FileText className="w-5 h-5" />, text: "Advanced Task Management" },
    { icon: <Shield className="w-5 h-5" />, text: "Enterprise-grade Security" },
    { icon: <Globe className="w-5 h-5" />, text: "99.9% Uptime Guarantee" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Simple & Transparent <span className="text-red-600">Pricing</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Everything you need for team collaboration. One plan, all features included.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Pricing Card */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden border border-gray-200 sm:border-2 sm:border-red-500"
          >
            <div className="p-6 sm:p-8 lg:p-10">
              {/* Plan Header */}
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Professional Plan
                </h2>
                <p className="text-gray-600 text-base sm:text-lg">
                  Complete collaboration platform for your team
                </p>
              </div>

              {/* Price Section */}
              <div className="text-center mb-8 sm:mb-10">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-6">
                  <div className="text-center">
                    <div className="flex items-end justify-center gap-2 mb-1">
                      <motion.span
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold text-red-600"
                      >
                        $49
                      </motion.span>
                      <span className="text-xl sm:text-2xl text-gray-600 mb-1">/month</span>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base">Per admin email account</p>
                  </div>

                  <div className="h-px w-16 bg-gray-300 sm:h-12 sm:w-px" />

                  <div className="text-center">
                    <div className="flex items-end justify-center gap-2 mb-1">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                        $41
                      </span>
                      <span className="text-lg sm:text-xl text-gray-600 mb-1">/month</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        Save 20%
                      </span>
                      <span className="text-gray-600 text-sm">with yearly billing</span>
                    </div>
                  </div>
                </div>

                {/* Email Contact Button */}
                <motion.a
                  href="mailto:info@bigbulldigital.com"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Email to Purchase Admin Role
                </motion.a>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
                {planFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <span className="text-gray-800 font-medium text-sm sm:text-base">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Additional Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-red-50 to-red-50/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-8 sm:mb-10 border border-red-100"
              >
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  Also Includes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {[
                    "Activity Tracking & Analytics",
                    "File Version History",
                    "Custom Workspace Templates",
                    "Priority Email Support",
                    "Regular Feature Updates",
                    "No Hidden Fees"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-3">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Simple Email Contact Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center text-white shadow-lg"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-4 sm:mb-6">
                  <Mail className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">
                  Interested in Admin Role?
                </h3>
                
                <p className="text-red-100 text-sm sm:text-base mb-4 sm:mb-6">
                  Email us to purchase admin access
                </p>

                <motion.a
                  href="mailto:info@bigbulldigital.com"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-white text-red-600 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:shadow-lg transition-all w-full sm:w-auto"
                >
                  <Mail className="w-5 h-5" />
                  info@bigbulldigital.com
                </motion.a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Simple Trust Section */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-lg mb-3">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">Secure Platform</h4>
              <p className="text-gray-600 text-xs sm:text-sm">Enterprise-grade security</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-lg mb-3">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1">High Reliability</h4>
              <p className="text-gray-600 text-xs sm:text-sm">99.9% uptime guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-6 sm:py-8 text-center border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-gray-600 text-sm sm:text-base">
            © {new Date().getFullYear()} BigBull Digital. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
