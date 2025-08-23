import React, { useState, useEffect } from 'react';
import { FaBars, FaGraduationCap } from 'react-icons/fa';
import { IoClose, IoNotifications, IoSearch } from 'react-icons/io5';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import { MdDashboard } from 'react-icons/md';

const Header = ({ toggleSidebar, title, isSidebarOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get appropriate icon based on title
  const getTitleIcon = () => {
    const titleLower = title?.toLowerCase() || '';
    if (titleLower.includes('note') || titleLower.includes('chapter')) {
      return <HiOutlineAcademicCap size={24} className="text-blue-500" />;
    }
    if (titleLower.includes('dashboard') || titleLower.includes('home')) {
      return <MdDashboard size={24} className="text-green-500" />;
    }
    return <FaGraduationCap size={22} className="text-purple-500" />;
  };

  // Generate breadcrumb from title
  const getBreadcrumb = () => {
    const defaultTitle = 'MathMate AHC';
    const currentTitle = title || defaultTitle;
    
    if (currentTitle === defaultTitle) {
      return [{ label: 'Home', isActive: true }];
    }
    
    return [
      { label: 'Home', isActive: false },
      { label: currentTitle, isActive: true }
    ];
  };

  const breadcrumbs = getBreadcrumb();

  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
          : 'bg-white shadow-md'
      } ${isSidebarOpen ? 'md:z-40' : 'z-40'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={toggleSidebar} 
              className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 md:hidden ${
                isSidebarOpen
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? (
                <IoClose size={20} />
              ) : (
                <FaBars size={18} />
              )}
            </button>

            {/* Logo & Title Section */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg shadow-sm">
                <FaGraduationCap size={20} className="text-white" />
              </div>
              
              <div className="flex flex-col">
                {/* Breadcrumb Navigation */}
                <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-500 mb-1">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="text-gray-300 mx-1">/</span>}
                      <span 
                        className={`${
                          crumb.isActive 
                            ? 'text-gray-700 font-medium' 
                            : 'hover:text-gray-700 cursor-pointer'
                        }`}
                      >
                        {crumb.label}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
                
                {/* Main Title */}
                <div className="flex items-center space-x-2">
                  <div className="sm:hidden">
                    {getTitleIcon()}
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate max-w-xs sm:max-w-none">
                    {title || 'MathMate AHC'}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Button (Desktop) */}
            <button 
              className="hidden md:flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-all duration-200"
              aria-label="Search"
            >
              <IoSearch size={20} />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 hover:text-gray-800 rounded-lg transition-all duration-200 relative"
                aria-label="Notifications"
              >
                <IoNotifications size={20} />
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  3
                </span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="p-4 hover:bg-gray-50 border-b border-gray-50">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-800 font-medium">New chapter added</p>
                            <p className="text-xs text-gray-500 mt-1">React Fundamentals chapter is now available</p>
                            <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-gray-50 border-b border-gray-50">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-800 font-medium">Note updated</p>
                            <p className="text-xs text-gray-500 mt-1">Your mathematics notes have been synced</p>
                            <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm text-gray-800 font-medium">System update</p>
                            <p className="text-xs text-gray-500 mt-1">MathMate has been updated with new features</p>
                            <p className="text-xs text-gray-400 mt-1">3 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <button className="w-full text-sm text-blue-500 hover:text-blue-600 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm sm:text-base font-semibold">U</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;