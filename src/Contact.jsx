import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, Globe, Building, 
  Flag, Clock, MessageSquare, Users
} from 'lucide-react';

const Contact = () => {
  const locations = [
    {
      country: "Pakistan",
      icon: <Flag className="w-6 h-6" />,
      phone: "+92 331-2705270",
      email: "info@bigbulldigital.com",
      supportEmail: "support@bigbulldigital.com",
      address: "Plot# 1C lane 7 Zamzam Commercial Phase V DHA",
      hours: "Mon-Fri: 9 AM - 6 PM PKT"
    },
    {
      country: "United States",
      icon: <Flag className="w-6 h-6" />,
      phone: "+1 (708) 960 7181",
      email: "info@bigbulldigital.com",
      supportEmail: "support@bigbulldigital.com",
      address: "1533 Yellowstone Dr, Streamwood IL 60107",
      hours: "Mon-Fri: 9 AM - 5 PM CST"
    },
    {
      country: "Dubai",
      icon: <Globe className="w-6 h-6" />,
      phone: "Contact via Email",
      email: "info@bigbulldigital.com",
      supportEmail: "support@bigbulldigital.com",
      address: "Al Khaleej Al Tejari - 1 St - Business Bay",
      hours: "Mon-Fri: 9 AM - 6 PM GST"
    },
    {
      country: "United Kingdom",
      icon: <Flag className="w-6 h-6" />,
      phone: "Contact via Email",
      email: "info@bigbulldigital.com",
      supportEmail: "support@bigbulldigital.com",
      address: "20-22 Wenlock Rd, London N1 7GU, UK",
      hours: "Mon-Fri: 9 AM - 5 PM GMT"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Get in <span className="text-red-600">Touch</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
              We're here to help. Reach out to our team through any of the following channels.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Email Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10 sm:mb-12"
          >
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-white/20 rounded-full">
                  <Mail className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold">Email Contacts</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <motion.a
                  href="mailto:info@bigbulldigital.com"
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Building className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">General Inquiries</h3>
                  </div>
                  <p className="text-red-100 text-lg font-medium">info@bigbulldigital.com</p>
                </motion.a>

                <motion.a
                  href="mailto:support@bigbulldigital.com"
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">Customer Support</h3>
                  </div>
                  <p className="text-red-100 text-lg font-medium">support@bigbulldigital.com</p>
                </motion.a>
              </div>
            </div>
          </motion.div>

          {/* Phone Numbers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10 sm:mb-12"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200">
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <Phone className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Phone Numbers</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div className="text-center p-6 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Flag className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-gray-900 text-lg">Pakistan Office</h3>
                  </div>
                  <motion.a
                    href="tel:+923312705270"
                    whileHover={{ scale: 1.05 }}
                    className="inline-block text-2xl font-bold text-red-600 hover:text-red-700 transition-colors"
                  >
                    +92 331-2705270
                  </motion.a>
                </div>

                <div className="text-center p-6 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Flag className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-gray-900 text-lg">USA Office</h3>
                  </div>
                  <motion.a
                    href="tel:+17089607181"
                    whileHover={{ scale: 1.05 }}
                    className="inline-block text-2xl font-bold text-red-600 hover:text-red-700 transition-colors"
                  >
                    +1 (708) 960 7181
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Global Offices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Our <span className="text-red-600">Global Offices</span>
              </h2>
              <p className="text-gray-600">Reach out to our team worldwide</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {locations.map((location, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Location Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                        {location.icon}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{location.country}</h3>
                    </div>

                    {/* Phone */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Phone</span>
                      </div>
                      <p className="font-medium text-gray-900">{location.phone}</p>
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Email</span>
                      </div>
                      <motion.a
                        href={`mailto:${location.email}`}
                        whileHover={{ x: 5 }}
                        className="block text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        {location.email}
                      </motion.a>
                    </div>

                    {/* Address */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Address</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{location.address}</p>
                    </div>

                    {/* Hours */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Business Hours</span>
                      </div>
                      <p className="text-gray-700 text-sm">{location.hours}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Contact Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 bg-gradient-to-r from-red-50 to-red-50/50 rounded-2xl p-6 sm:p-8 border border-red-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Quick Contact Tips</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl">
                <div className="text-lg font-semibold text-red-600 mb-2">📧 For Inquiries</div>
                <p className="text-gray-600 text-sm">Use info@bigbulldigital.com for business proposals and partnerships</p>
              </div>
              
              <div className="p-4 bg-white rounded-xl">
                <div className="text-lg font-semibold text-red-600 mb-2">🛠️ For Support</div>
                <p className="text-gray-600 text-sm">Use support@bigbulldigital.com for technical issues and assistance</p>
              </div>
              
              <div className="p-4 bg-white rounded-xl">
                <div className="text-lg font-semibold text-red-600 mb-2">🌍 Time Zones</div>
                <p className="text-gray-600 text-sm">Please consider time zone differences when calling international offices</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-gray-600 text-sm sm:text-base">
            © {new Date().getFullYear()} BigBull Digital. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            Connecting teams worldwide with seamless collaboration solutions
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
