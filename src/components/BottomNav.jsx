import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Notebook, Library, UserCheck } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  const activePath = location.pathname;

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/schedule', icon: Calendar, label: 'Schedule' },
    { path: '/notes', icon: Notebook, label: 'Notes' },
    { path: '/resources', icon: Library, label: 'Resources' },
    { path: '/attendance', icon: UserCheck, label: 'Attendance' },
  ];

  return (
    <nav className="nav-container">
      {navItems.map((item) => (
        <Link 
          key={item.path} 
          to={item.path} 
          className={`nav-item ${activePath === item.path ? 'active' : ''}`}
        >
          <item.icon size={24} />
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default BottomNav;