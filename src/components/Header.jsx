import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { query, orderBy, collection, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import { FaBars, FaGraduationCap } from 'react-icons/fa';
import { 
    IoClose, 
    IoNotifications, 
    IoSearch,
    IoChevronForward,
    IoHome,
    IoCalendar,
    IoDocument,
    IoPerson,
    IoLibrary,
    IoCheckmarkCircle,
    IoMegaphone,
    IoSettings
} from 'react-icons/io5';

const Header = ({ toggleSidebar, title, isSidebarOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  // Optimized notifications query with limit
  const notificationsQuery = useMemo(() => {
    const notificationsRef = collection(db, 'notifications');
    return query(notificationsRef, orderBy('createdAt', 'desc'), limit(10));
  }, []);

  const { 
    data: notifications,
    loading: notificationsLoading, 
    updateItem 
  } = useFirestoreCollection(notificationsQuery);

  const unreadCount = useMemo(() => {
    if (!notifications) return 0;
    return notifications.filter(n => !n.seen).length;
  }, [notifications]);

  // Optimized scroll handler with throttling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenNotifications = useCallback(() => {
    setShowNotifications(prev => {
      const newState = !prev;
      // Mark as read only when opening
      if (newState && unreadCount > 0 && notifications) {
        // Batch update to reduce re-renders
        const unreadNotifications = notifications.filter(n => !n.seen);
        unreadNotifications.forEach(notification => {
          updateItem(notification.id, { seen: true });
        });
      }
      return newState;
    });
  }, [unreadCount, notifications, updateItem]);

  const closeNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  // Memoized icon mapping
  const iconMap = useMemo(() => ({
    '/': IoHome,
    '/schedule': IoCalendar,
    '/notes': IoDocument,
    '/personal-notes': IoPerson,
    '/resources': IoLibrary,
    '/attendance': IoCheckmarkCircle,
    '/notices': IoMegaphone,
    '/bookmarks': IoPerson,
    '/settings': IoSettings
  }), []);

  const getTitleIcon = useCallback(() => {
    const IconComponent = iconMap[location.pathname];
    return IconComponent ? <IconComponent size={20} className="text-gray-600" /> : null;
  }, [location.pathname, iconMap]);

  const getBreadcrumb = useCallback(() => {
    const pathMap = {
      '/': 'Dashboard',
      '/schedule': 'Schedule',
      '/notes': 'Official Notes',
      '/personal-notes': 'Personal Notes',
      '/resources': 'Resources',
      '/attendance': 'Attendance',
      '/notices': 'Notices',
      '/bookmarks': 'Bookmarks',
      '/settings': 'Settings'
    };

    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [{ name: 'Dashboard', href: '/' }];

    return segments.map((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/');
      return {
        name: pathMap[path] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: path
      };
    });
  }, [location.pathname]);

  const breadcrumbs = getBreadcrumb();
  const titleIcon = getTitleIcon();

  return (
    <header 
      className={`sticky top-0 z-40 bg-white border-b transition-shadow duration-200 ${
        isScrolled ? 'shadow-lg border-gray-200' : 'shadow-sm border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Left Section */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <button 
              onClick={toggleSidebar} 
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors duration-150 md:hidden"
            >
              {isSidebarOpen ? <IoClose size={20} /> : <FaBars size={18} />}
            </button>

            <div className="flex items-center space-x-3 min-w-0">
              {titleIcon}
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {title}
                </h1>
                {breadcrumbs.length > 1 && (
                  <nav className="hidden sm:flex items-center space-x-1 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={crumb.href}>
                        {index > 0 && <IoChevronForward size={12} className="text-gray-400" />}
                        <Link 
                          to={crumb.href}
                          className={`hover:text-blue-600 transition-colors duration-150 ${
                            index === breadcrumbs.length - 1 
                              ? 'text-gray-900 font-medium' 
                              : 'text-gray-500'
                          }`}
                        >
                          {crumb.name}
                        </Link>
                      </React.Fragment>
                    ))}
                  </nav>
                )}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search - Desktop only */}
            <button className="hidden md:flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150">
              <IoSearch size={20} />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={handleOpenNotifications}
                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-lg relative transition-colors duration-150"
              >
                <IoNotifications size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-10" onClick={closeNotifications} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="p-4 space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      ) : notifications && notifications.length > 0 ? (
                        notifications.map(notification => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <IoNotifications size={32} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      )}
                    </div>

                    {notifications && notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-100">
                        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-150">
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User Avatar */}
            <div className="flex items-center space-x-3 pl-2 sm:pl-4 border-l border-gray-200">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm sm:text-base font-semibold">U</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-4 border-t border-gray-100">
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150" 
          />
        </div>
      </div>
    </header>
  );
};

// Optimized NotificationItem component
const NotificationItem = React.memo(({ notification }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className={`p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors duration-150 ${
      !notification.seen ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
    }`}>
      <div className="flex items-start space-x-3">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
          !notification.seen ? 'bg-blue-500' : 'bg-gray-300'
        }`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${!notification.seen ? 'text-gray-900' : 'text-gray-700'}`}>
            {notification.title}
          </p>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {formatTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default Header;