// src/components/Sidebar.jsx
import React from 'react';
import { slide as Menu } from 'react-burger-menu';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, NotebookText, Library, UserCheck, Megaphone, Cog } from 'lucide-react';

// THE FIX: We added onLinkClick to the function and the onClick event to the Links
function Sidebar({ isOpen, onStateChange, onLinkClick }) {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/schedule', icon: Calendar, label: 'Schedule' },
    { path: '/notes/subjects', icon: BookOpen, label: 'Official Notes' },
    { path: '/personal-notes', icon: NotebookText, label: 'Personal Notes' },
    { path: '/resources', icon: Library, label: 'Resources' },
    { path: '/attendance', icon: UserCheck, label: 'Attendance' },
    { path: '/notices', icon: Megaphone, label: 'Notices' },
  ];

  return (
    <Menu
      isOpen={isOpen}
      onStateChange={onStateChange}
      customBurgerIcon={false}
      customCrossIcon={false}
    >
      <h2 className="sidebar-title">MathMate AHC</h2>
      {navItems.map(item => (
        <Link key={item.label} to={item.path} className="menu-item" onClick={onLinkClick}>
          <item.icon className="menu-icon" />
          <span>{item.label}</span>
        </Link>
      ))}
      <hr className="sidebar-divider" />
      <Link to="/settings" className="menu-item settings-link" onClick={onLinkClick}>
        <Cog className="menu-icon" />
        <span>Settings</span>
      </Link>
    </Menu>
  );
}

export default Sidebar;