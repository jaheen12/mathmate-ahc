import React, { useEffect } from 'react';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { useTheme } from '../hooks/useTheme';

// Placeholder components for demonstration
const SettingSection = ({ title, icon: Icon, children }) => (
  <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
    <div className="flex items-center mb-4">
      {Icon && <Icon className="w-6 h-6 mr-2 text-gray-600 dark:text-gray-300" />}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

const ToggleSwitch = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between">
    <div>
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
        checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const Settings = ({ setHeaderTitle }) => {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';

  useEffect(() => {
    setHeaderTitle('Settings');
  }, [setHeaderTitle]);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto">
        {/* App Appearance Section */}
        <SettingSection title="Appearance" icon={darkMode ? IoMoonOutline : IoSunnyOutline}>
          <ToggleSwitch
            checked={darkMode}
            onChange={toggleTheme}
            label="Dark Mode"
            description="Switch between light and dark themes"
          />
        </SettingSection>

        {/* Example: Notification Settings */}
        <SettingSection title="Notifications" icon={IoSunnyOutline}>
          {/* Add toggle switches or notification options here */}
          <ToggleSwitch
            checked={false}
            onChange={() => {}}
            label="Enable Push Notifications"
            description="Receive notifications for important updates"
          />
        </SettingSection>

        {/* Example: Account Settings */}
        <SettingSection title="Account" icon={IoSunnyOutline}>
          <p className="text-gray-600 dark:text-gray-300">Manage your account preferences</p>
        </SettingSection>
      </div>
    </div>
  );
};

export default Settings;