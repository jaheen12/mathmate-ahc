import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { query, orderBy, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import { FaBars, FaGraduationCap } from 'react-icons/fa';
import { 
    IoClose, 
    IoNotifications, 
    IoSearch,
    IoChevronDownOutline
} from 'react-icons/io5';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import { MdDashboard } from 'react-icons/md';

const Header = ({ toggleSidebar, title, isSidebarOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- THIS IS THE FIX ---
  // 1. Create the full, valid Firestore Query object first.
  const notificationsQuery = useMemo(() => {
    const notificationsRef = collection(db, 'notifications');
    return query(notificationsRef, orderBy('createdAt', 'desc'));
  }, []);

  // 2. Pass the entire query object directly to our new universal hook.
  const { 
    data: notifications,
    loading: notificationsLoading, 
    updateItem 
  } = useFirestoreCollection(notificationsQuery);

  const unreadCount = useMemo(() => {
    if (!notifications) return 0; // Guard against null state
    return notifications.filter(n => !n.seen).length;
  }, [notifications]);

  const handleOpenNotifications = () => {
    setShowNotifications(prev => !prev);
    if (!showNotifications && unreadCount > 0 && notifications) {
      notifications.forEach(notification => {
        if (!notification.seen) {
          updateItem(notification.id, { seen: true });
        }
      });
    }
  };
  
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getTitleIcon = () => { /* ... (no changes) ... */ };
  const getBreadcrumb = () => { /* ... (no changes) ... */ };
  const breadcrumbs = getBreadcrumb();

  return (
    <header 
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
          : 'bg-white shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left Section (no changes) */}
          <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="flex items-center justify-center w-10 h-10 rounded-lg md:hidden">
              {isSidebarOpen ? <IoClose size={20} /> : <FaBars size={18} />}
            </button>
            {/* ... title and breadcrumbs ... */}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="hidden md:flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-lg">
              <IoSearch size={20} />
            </button>
            <div className="relative">
              <button 
                onClick={handleOpenNotifications}
                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-lg relative"
              >
                <IoNotifications size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications === null ? (
                        <p className="p-4 text-sm text-gray-500">Loading...</p>
                      ) : notifications.length > 0 ? (
                        notifications.map(notification => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))
                      ) : (
                        <p className="p-4 text-sm text-gray-500 text-center py-8">No new notifications.</p>
                      )}
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
            <div className="flex items-center space-x-3 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm sm:text-base font-semibold">U</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>
    </header>
  );
};

// NotificationItem component remains the same.
const NotificationItem = ({ notification }) => {
    // ... (no changes)
};

export default Header;