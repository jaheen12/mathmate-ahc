import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
    IoGridOutline, IoCalendarOutline, IoDocumentTextOutline, IoPersonOutline, 
    IoLibraryOutline, IoCheckmarkCircleOutline, IoMegaphoneOutline, IoSettingsOutline, 
    IoLogInOutline, IoLogOutOutline, IoCloseOutline, IoChevronDownOutline,
    IoChevronUpOutline, IoHelpCircleOutline, IoInformationCircleOutline,
    IoBookOutline, IoStarOutline
} from "react-icons/io5";
import { FaGraduationCap } from "react-icons/fa";
import { auth } from '../firebaseConfig';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const authContext = useAuth();
    const currentUser = authContext ? authContext.currentUser : null;
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        academic: true,
        personal: false
    });

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await auth.signOut();
            toggleSidebar();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const menuItems = [
        {
            section: 'main',
            items: [
                { path: '/', icon: IoGridOutline, label: 'Dashboard', badge: null },
                { path: '/schedule', icon: IoCalendarOutline, label: 'Schedule', badge: '3' }
            ]
        },
        {
            section: 'academic',
            title: 'Academic',
            expandable: true,
            items: [
                { path: '/notes', icon: IoDocumentTextOutline, label: 'Official Notes', badge: null },
                { path: '/resources', icon: IoLibraryOutline, label: 'Resources', badge: 'New' },
                { path: '/attendance', icon: IoCheckmarkCircleOutline, label: 'Attendance', badge: null }
            ]
        },
        {
            section: 'personal',
            title: 'Personal',
            expandable: true,
            items: [
                { path: '/personal-notes', icon: IoPersonOutline, label: 'Personal Notes', badge: null },
                { path: '/bookmarks', icon: IoStarOutline, label: 'Bookmarks', badge: '5' }
            ]
        },
        {
            section: 'communication',
            title: 'Communication',
            items: [
                { path: '/notices', icon: IoMegaphoneOutline, label: 'Notices', badge: '2' }
            ]
        }
    ];

    const MenuItem = ({ item, onClick }) => (
        <NavLink
            to={item.path}
            onClick={onClick}
            className={({ isActive }) =>
                `group flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 ${
                    isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-[1.02]'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:transform hover:scale-[1.01]'
                }`
            }
        >
            <div className="flex items-center">
                <item.icon className="mr-3 transition-colors duration-200" size={20} />
                <span className="font-medium">{item.label}</span>
            </div>
            {item.badge && (
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    item.badge === 'New' 
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-600 text-gray-200'
                }`}>
                    {item.badge}
                </span>
            )}
        </NavLink>
    );

    const SectionHeader = ({ section, title }) => (
        <button
            onClick={() => toggleSection(section.section)}
            className="w-full flex items-center justify-between py-2 px-4 text-gray-400 hover:text-gray-300 transition-colors duration-200"
        >
            <span className="text-sm font-semibold uppercase tracking-wider">{title}</span>
            {section.expandable && (
                expandedSections[section.section] ? 
                    <IoChevronUpOutline size={16} /> : 
                    <IoChevronDownOutline size={16} />
            )}
        </button>
    );

    const sidebarClasses = `
        bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white w-72 flex flex-col fixed inset-y-0 left-0 transform 
        md:relative md:translate-x-0 transition-all duration-300 ease-out
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        z-50 border-r border-gray-700/50
    `;

    return (
        <>
            {/* Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                    onClick={toggleSidebar}
                />
            )}

            <div className={sidebarClasses}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <FaGraduationCap size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">MathMate AHC</h2>
                            <p className="text-xs text-gray-400">Academic Hub</p>
                        </div>
                    </div>
                    <button 
                        onClick={toggleSidebar} 
                        className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
                    >
                        <IoCloseOutline size={20} />
                    </button>
                </div>

                {/* User Info */}
                {currentUser && (
                    <div className="p-4 mx-4 mt-4 bg-gray-700/30 backdrop-blur-sm rounded-xl border border-gray-600/30">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {currentUser.displayName || 'User'}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                    {currentUser.email}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {menuItems.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                            {section.title && (
                                <SectionHeader section={section} title={section.title} />
                            )}
                            
                            <div className={`space-y-1 transition-all duration-300 ${
                                section.expandable && !expandedSections[section.section] 
                                    ? 'max-h-0 overflow-hidden opacity-0' 
                                    : 'max-h-96 opacity-100'
                            }`}>
                                {section.items.map((item, itemIndex) => (
                                    <MenuItem 
                                        key={itemIndex} 
                                        item={item} 
                                        onClick={toggleSidebar}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700/50 space-y-2">
                    {/* Settings */}
                    <NavLink 
                        to="/settings" 
                        onClick={toggleSidebar}
                        className={({ isActive }) =>
                            `flex items-center py-3 px-4 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                            }`
                        }
                    >
                        <IoSettingsOutline className="mr-3" size={20} />
                        <span className="font-medium">Settings</span>
                    </NavLink>

                    {/* Help */}
                    <button className="w-full flex items-center py-3 px-4 rounded-xl text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                        <IoHelpCircleOutline className="mr-3" size={20} />
                        <span className="font-medium">Help & Support</span>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-700/50 pt-4">
                        {currentUser ? (
                            <button 
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IoLogOutOutline className="mr-3" size={20} />
                                <span className="font-medium">
                                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                                </span>
                            </button>
                        ) : (
                            <NavLink 
                                to="/login" 
                                onClick={toggleSidebar}
                                className="flex items-center justify-center py-3 px-4 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-all duration-200"
                            >
                                <IoLogInOutline className="mr-3" size={20} />
                                <span className="font-medium">Login</span>
                            </NavLink>
                        )}
                    </div>

                    {/* Version Info */}
                    <div className="flex items-center justify-center pt-2">
                        <span className="text-xs text-gray-500">v2.1.0</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;