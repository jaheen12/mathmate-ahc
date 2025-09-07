import React, { useState, useCallback, useMemo } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../AuthContext'; 
import { 
    IoGridOutline, 
    IoCalendarOutline, 
    IoDocumentTextOutline, 
    IoPersonOutline, 
    IoLibraryOutline, 
    IoCheckmarkCircleOutline, 
    IoMegaphoneOutline, 
    IoSettingsOutline, 
    IoLogInOutline, 
    IoLogOutOutline, 
    IoCloseOutline, 
    IoChevronDownOutline,
    IoBarChartOutline
} from "react-icons/io5";
import { FaGraduationCap } from "react-icons/fa";
import { auth } from '../firebaseConfig';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        academic: true,
        personal: true,
        communication: true
    });

    const handleLogout = useCallback(async () => {
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
    }, [navigate, toggleSidebar]);

    const toggleSection = useCallback((section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    const menuItems = useMemo(() => [
        {
            section: 'main',
            items: [
                { path: '/', icon: IoGridOutline, label: 'Dashboard' },
                { path: '/schedule', icon: IoCalendarOutline, label: 'Schedule' }
            ]
        },
        {
            section: 'academic',
            title: 'Academic',
            expandable: true,
            items: [
                { path: '/notes', icon: IoDocumentTextOutline, label: 'Official Notes' },
                { path: '/resources', icon: IoLibraryOutline, label: 'Resources' },
                { path: '/attendance', icon: IoCheckmarkCircleOutline, label: 'Attendance' },
                { path: '/progress', icon: IoBarChartOutline, label: 'Study Progress' }
            ]
        },
        {
            section: 'personal',
            title: 'Personal',
            expandable: true,
            items: [
                { path: '/personal-notes', icon: IoPersonOutline, label: 'My Notes' },
            ]
        },
        {
            section: 'communication',
            title: 'Communication',
            expandable: true,
            items: [
                { path: '/notices', icon: IoMegaphoneOutline, label: 'Notices' }
            ]
        }
    ], []);

    const MenuItem = ({ item, onClick }) => (
        <NavLink
            to={item.path}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center justify-between py-2.5 px-4 rounded-lg transition-colors duration-150 ${
                    isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
            }
        >
            <div className="flex items-center">
                <item.icon className="mr-3" size={18} />
                <span className="font-medium text-sm">{item.label}</span>
            </div>
        </NavLink>
    );

    const SectionHeader = ({ section, title }) => (
        <button
            onClick={() => toggleSection(section.section)}
            className="w-full flex items-center justify-between py-2 px-4 text-gray-400 hover:text-gray-200 transition-colors duration-150"
        >
            <span className="text-sm font-semibold uppercase tracking-wider">{title}</span>
            {section.expandable && (
                <IoChevronDownOutline 
                    size={14} 
                    className={`transition-transform duration-200 ${
                        expandedSections[section.section] ? 'rotate-180' : ''
                    }`}
                />
            )}
        </button>
    );

    return (
        <>
            {isSidebarOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={toggleSidebar} />)}
            <div className={`bg-gray-900 text-white w-72 flex flex-col fixed inset-y-0 left-0 transform md:relative md:translate-x-0 transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-50 border-r border-gray-700`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><FaGraduationCap size={20} className="text-white" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">MathMate AHC</h2>
                            <p className="text-xs text-gray-400">Academic Hub</p>
                        </div>
                    </div>
                    <button onClick={toggleSidebar} className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"><IoCloseOutline size={20} /></button>
                </div>
                <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {menuItems.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="space-y-1">
                            {section.title ? (<SectionHeader section={section} title={section.title} />) : <div className="pt-1"/>}
                            <div className={`space-y-1 transition-all duration-300 overflow-hidden ${section.expandable && !expandedSections[section.section] ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
                                {section.items.map((item, itemIndex) => (<MenuItem key={itemIndex} item={item} onClick={toggleSidebar} />))}
                            </div>
                        </div>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700 space-y-2">
                    <NavLink to="/settings" onClick={toggleSidebar} className={({ isActive }) => `flex items-center py-2.5 px-4 rounded-lg transition-colors duration-150 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                        <IoSettingsOutline className="mr-3" size={18} />
                        <span className="font-medium text-sm">Settings & About</span>
                    </NavLink>
                    <div className="border-t border-gray-700 pt-3">
                        {currentUser ? (
                            <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg bg-red-900 text-red-300 hover:bg-red-800 hover:text-red-200 transition-colors duration-150 disabled:opacity-50">
                                <IoLogOutOutline className="mr-3" size={18} />
                                <span className="font-medium text-sm">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                            </button>
                        ) : (
                            <NavLink to="/login" onClick={toggleSidebar} className="flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-900 text-blue-300 hover:bg-blue-800 hover:text-blue-200 transition-colors duration-150">
                                <IoLogInOutline className="mr-3" size={18} />
                                <span className="font-medium text-sm">Sign In</span>
                            </NavLink>
                        )}
                    </div>
                    <div className="text-center pt-4">
                        <Link to="/settings" className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
                           Made with ❤️ by Jafor Sadik
                        </Link>
                        <p className="text-xs text-gray-600 mt-1">v111.0.0-offline</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;