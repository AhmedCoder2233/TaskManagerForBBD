import React from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Upload, FolderOpen, CheckSquare, Activity, Download, MessageCircle, Briefcase, Shield, Zap, Heart, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const services = [
    {
      icon: <CheckSquare className="w-8 h-8" />,
      title: "Task Management",
      description: "Create, assign, and track tasks with intuitive boards. Set priorities, deadlines, and monitor progress in real-time.",
      image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Real-Time Chat",
      description: "Instant messaging with typing indicators, read receipts, and seamless communication across your team.",
      image: "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=800&q=80"
    },
    {
      icon: <Upload className="w-8 h-8" />,
      title: "File Management",
      description: "Upload files and images with drag-and-drop. Share with team members who can download and comment on files.",
      image: "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=800&q=80"
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "Workspaces",
      description: "Create multiple workspaces for different projects. Organize teams, tasks, and conversations in dedicated spaces.",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Group Chat",
      description: "Collaborative group conversations with multiple members. Keep everyone aligned with team-wide discussions.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Activity Tracking",
      description: "Real-time activity feeds showing file uploads, comments, and team interactions. Stay updated on everything.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
    }
  ];

  const navigate = useNavigate();

  const features = [
    { icon: <Download className="w-6 h-6" />, text: "Easy File Downloads" },
    { icon: <MessageCircle className="w-6 h-6" />, text: "Comment on Files" },
    { icon: <FolderOpen className="w-6 h-6" />, text: "Organized Workspaces" },
    { icon: <Shield className="w-6 h-6" />, text: "Secure & Private" },
    { icon: <Zap className="w-6 h-6" />, text: "Lightning Fast" },
    { icon: <Heart className="w-6 h-6" />, text: "User Friendly" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Simplified Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50">
        {/* Simple Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-red-100 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-200 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-6"
              >
                About Our Platform
              </motion.span>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight"
              >
                Streamline Your
                <span className="block text-red-600">Team Collaboration</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl text-gray-600 mb-8 md:mb-10 leading-relaxed max-w-2xl lg:max-w-none mx-auto lg:mx-0"
              >
                An all-in-one platform designed to enhance productivity with task management, 
                real-time communication, and seamless file sharing for modern teams.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <motion.button
                  onClick={() => navigate("/pricing")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Get Started
                </motion.button>
                

              </motion.div>
            </motion.div>

            {/* Right Column - Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80" 
                  alt="Team collaboration"
                  className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent" />
                
                {/* Stats Overlay - Responsive */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">10K+</div>
                        <div className="text-sm text-gray-600">Active Teams</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">99.9%</div>
                        <div className="text-sm text-gray-600">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">50K+</div>
                        <div className="text-sm text-gray-600">Files Shared</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center"
          >
            <div className="space-y-4 md:space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-red-600 font-semibold text-sm uppercase tracking-wider">About BigBullCamp</span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2">
                  Built for Modern <span className="text-red-600">Teams</span>
                </h2>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-gray-700 text-base sm:text-lg leading-relaxed"
              >
                BigBullCamp is a comprehensive collaboration platform designed to streamline team workflows. 
                From task management to real-time communication, we provide everything your team needs to work efficiently.
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-gray-700 text-base sm:text-lg leading-relaxed"
              >
                Our platform empowers teams to collaborate seamlessly with features like workspace creation, 
                group chats, file sharing with commenting, and comprehensive activity tracking.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-4"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center gap-3 text-gray-700"
                  >
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                      {feature.icon}
                    </div>
                    <span className="font-medium text-sm sm:text-base">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80" 
                  alt="Team working together"
                  className="w-full h-[300px] sm:h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/50 to-transparent" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
  <div className="max-w-7xl mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-8 sm:mb-12 md:mb-16"
    >
      <span className="text-red-600 font-semibold text-sm uppercase tracking-wider">Our Services</span>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-3 sm:mb-4">
        Everything Your Team <span className="text-red-600">Needs</span>
      </h2>
      <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
        Powerful features designed to enhance productivity and collaboration
      </p>
    </motion.div>

    <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
      {services.map((service, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -5 }}
          className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 
            w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-21.33px)]" // Responsive widths
        >
          <div className="relative h-40 sm:h-48 overflow-hidden">
            <img 
              src={service.image} 
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent" />
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="absolute bottom-4 left-4 p-2 sm:p-3 bg-white text-red-600 rounded-lg sm:rounded-xl shadow-lg"
            >
              {service.icon}
            </motion.div>
          </div>
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-red-600 transition-colors">
              {service.title}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {service.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <span className="text-red-600 font-semibold text-sm uppercase tracking-wider">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2">
              How It <span className="text-red-600">Works</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { 
                step: "01", 
                title: "Create Workspace", 
                desc: "Set up your workspace and invite team members",
                image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&q=80"
              },
              { 
                step: "02", 
                title: "Collaborate & Share", 
                desc: "Upload files, chat in real-time, and manage tasks together",
                image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80"
              },
              { 
                step: "03", 
                title: "Track Progress", 
                desc: "Monitor activities, download files, and achieve goals",
                image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-xl h-full"
                >
                  <div className="relative h-40 sm:h-48">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-red-900/70 to-transparent" />
                    <div className="absolute top-4 left-4 w-12 h-12 sm:w-16 sm:h-16 bg-red-600 text-white rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base">{item.desc}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-gray-500 text-sm sm:text-base">
              © {new Date().getFullYear()} BigBull CAMP. All rights reserved.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-gray-400">
              Built with ❤️ for teams that deliver excellence
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
