import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { query, orderBy, collection, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../AuthContext'; // Import useAuth to get the current user

import { FaBars } from 'react-icons/fa';
import { 
    IoNotifications, 
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

const Header = ({ toggleSidebar, title }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuth(); // Get the current user

  const notificationsQuery = useMemo(() => {
    const notificationsRef = collection(db, 'notifications');
    return query(notificationsRef, orderBy('createdAt', 'desc'), limit(5)); // Limit to 5
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

  useEffect(() => {
    let ticking = false;
    const mainContent = document.querySelector('main');
    const handleScroll = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(e.target.scrollTop > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    mainContent?.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainContent?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenNotifications = useCallback(() => {
    setShowNotifications(prev => {
      const newState = !prev;
      if (newState && unreadCount > 0 && notifications) {
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

  const iconMap = useMemo(() => ({
    '/': IoHome,
    '/schedule': IoCalendar,
    '/notes': IoDocument,
    '/personal-notes': IoPerson,
    '/resources': IoLibrary,
    '/attendance': IoCheckmarkCircle,
    '/notices': IoMegaphone,
    '/settings': IoSettings
  }), []);

  const getTitleIcon = useCallback(() => {
    const basePath = '/' + location.pathname.split('/')[1];
    const IconComponent = iconMap[basePath];
    return IconComponent ? <IconComponent size={20} className="text-gray-600" /> : null;
  }, [location.pathname, iconMap]);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [{ name: 'Dashboard', href: '/' }];
    return segments.map((segment, index) => {
      const path = '/' + segments.slice(0, index + 1).join('/');
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      return { name, href: path };
    });
  }, [location.pathname]);

  const titleIcon = getTitleIcon();

  return (
    <header className={`sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b transition-shadow duration-200 ${isScrolled ? 'shadow-lg border-gray-200' : 'shadow-sm border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <button onClick={toggleSidebar} className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors duration-150 md:hidden"><FaBars size={18} /></button>
            <div className="flex items-center space-x-3 min-w-0">
              {titleIcon}
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{title}</h1>
                {breadcrumbs.length > 1 && (
                  <nav className="hidden sm:flex items-center space-x-1 text-sm">
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={crumb.href}>
                        {index > 0 && <IoChevronForward size={12} className="text-gray-400" />}
                        <Link to={crumb.href} className={`hover:text-blue-600 transition-colors duration-150 ${index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{crumb.name}</Link>
                      </React.Fragment>
                    ))}
                  </nav>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <button onClick={handleOpenNotifications} className="flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-lg relative transition-colors duration-150">
                <IoNotifications size={20} />
                {unreadCount > 0 && (<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">{unreadCount > 9 ? '9+' : unreadCount}</span>)}
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-10" onClick={closeNotifications} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                    <div className="p-4 border-b border-gray-100"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-800">Notifications</h3>{unreadCount > 0 && (<span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">{unreadCount} new</span>)}</div></div>
                    <div className="max-h-64 overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="p-4 space-y-3">{[...Array(3)].map((_, i) => (<div key={i} className="animate-pulse"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></div>))}</div>
                      ) : notifications && notifications.length > 0 ? (
                        notifications.map(notification => (<NotificationItem key={notification.id} notification={notification} />))
                      ) : (
                        <div className="p-8 text-center"><IoNotifications size={32} className="text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">No notifications yet</p></div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {currentUser && (
                <div className="flex items-center space-x-3 pl-2 sm:pl-4 border-l border-gray-200">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm sm:text-base font-semibold">
                            {currentUser.email?.charAt(0).toUpperCase() || 'A'}
                        </span>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const NotificationItem = React.memo(({ notification }) => {
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp.seconds * 1000);
        const now = new Date();
        const diffInMinutes = Math.round((now - date) / (1000 * 60));
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.round(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString();
    };
    return (
        <div className={`p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors duration-150 ${!notification.seen ? 'bg-blue-50' : ''}`}>
            <div className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notification.seen ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0"><p className={`text-sm font-medium ${!notification.seen ? 'text-gray-900' : 'text-gray-700'}`}>{notification.title}</p><p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p><p className="text-xs text-gray-400 mt-2">{formatTime(notification.createdAt)}</p></div>
            </div>
        </div>
    );
});
NotificationItem.displayName = 'NotificationItem';

export default Header;
