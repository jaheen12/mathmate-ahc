import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Use NavLink for active styling
import { useAuth } from '../AuthContext'; 
import { 
    IoGridOutline, IoCalendarOutline, IoDocumentTextOutline, IoPersonOutline, 
    IoLibraryOutline, IoCheckmarkCircleOutline, IoMegaphoneOutline, IoSettingsOutline, 
    IoLogInOutline, IoLogOutOutline, IoCloseOutline 
} from "react-icons/io5"; // Using the 'io5' icons from your screenshot
import { auth } from '../firebaseConfig'; 

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const authContext = useAuth();
    const currentUser = authContext ? authContext.currentUser : null;
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            toggleSidebar(); // Close sidebar on logout
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };
    
    // Style for the active link
    const activeLinkStyle = {
        backgroundColor: '#4a5568', // A gray color for the active link
    };

    const sidebarClasses = `
        bg-gray-800 text-white w-64 flex flex-col fixed inset-y-0 left-0 transform 
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        z-30
    `;

    return (
        <>
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
                    onClick={toggleSidebar}
                ></div>
            )}

            <div className={sidebarClasses}>
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">MathMate AHC</h2>
                    <button onClick={toggleSidebar} className="md:hidden text-gray-300 hover:text-white">
                        <IoCloseOutline size={28} />
                    </button>
                </div>

                <nav className="flex-1 p-2 space-y-1">
                    {/* Using NavLink to automatically style the active page link */}
                    <NavLink to="/" onClick={toggleSidebar} style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"><IoGridOutline className="mr-3" size={20} />Dashboard</NavLink>
                    <NavLink to="/schedule" onClick={toggleSidebar} style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"><IoCalendarOutline className="mr-3" size={20} />Schedule</NavLink>
                    <NavLink to="/notes" onClick={toggleSidebar} style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"><IoDocumentTextOutline className="mr-3" size={20} />Official Notes</NavLink>
                    <NavLink to="/personal-notes" onClick={toggleSidebar} style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"><IoPersonOutline className="mr-3" size={20} />Personal Notes</NavLink>
                    <NavLink to="/resources" onClick={toggleSidebar} style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"><IoLibraryOutline className="mr-3" size={20} />Resources</NavLink>
                    <NavLink to="/attendance" onClick={toggleSidebar} style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"><IoCheckmarkCircleOutline className="mr-3" size={20} />Attendance</NavLink>
                    <NavLink to="/notices" onClick={toggleSidebar} style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"><IoMegaphoneOutline className="mr-3" size={20} />Notices</NavLink>
                </nav>

                <div className="p-2 border-t border-gray-700">
                     <NavLink to="/settings" onClick={toggleSidebar} style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"><IoSettingsOutline className="mr-3" size={20} />Settings</NavLink>
                    <hr className="my-2 border-gray-700" />
                    {currentUser ? (
                        <button onClick={handleLogout} className="w-full flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors">
                            <IoLogOutOutline className="mr-3" size={20} />
                            Logout
                        </button>
                    ) : (
                        <NavLink to="/login" onClick={toggleSidebar} style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-colors">
                            <IoLogInOutline className="mr-3" size={20} />
                            Login
                        </NavLink>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;