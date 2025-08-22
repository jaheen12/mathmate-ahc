import React, { useEffect } from 'react';
import { IoBuildOutline } from 'react-icons/io5';

// The component now accepts the 'setHeaderTitle' prop
const Settings = ({ setHeaderTitle }) => {
    
    // --- NEW: Set the header title for this page ---
    useEffect(() => {
        setHeaderTitle('Settings');
    }, [setHeaderTitle]);

    return (
        <div className="p-4">
            <div className="text-center mt-10">
                <IoBuildOutline size={64} className="mx-auto text-gray-300" />
                <h2 className="text-2xl font-semibold text-gray-700 mt-4">Settings</h2>
                <p className="text-gray-500 mt-2">
                    This page is under construction. Future app settings will appear here.
                </p>
                {/* 
                    Future ideas for this page:
                    - Dark Mode / Light Mode toggle
                    - Manage Subjects (the cleanup feature we discussed)
                    - User Profile Information
                    - Notification Preferences
                */}
            </div>
        </div>
    );
};

export default Settings;