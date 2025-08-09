import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Import Pages
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import OfficialNotes from './pages/OfficialNotes'; // New
import PersonalNotes from './pages/PersonalNotes'; // Renamed
import Resources from './pages/Resources';
import Attendance from './pages/Attendance';
import Notices from './pages/Notices'; // New
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';

// Import Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// A helper component to get the current page title
const getHeaderTitle = (pathname) => {
  switch (pathname) {
    case '/': return 'Dashboard';
    case '/schedule': return 'Schedule';
    case '/official-notes': return 'Official Notes';
    case '/personal-notes': return 'Personal Notes';
    case '/resources': return 'Resource Hub';
    case '/attendance': return 'Attendance Tracker';
    case '/notices': return 'Notice Board';
    case '/settings': return 'Settings';
    case '/admin-login': return 'Admin Login';
    default: return 'MathMate AHC';
  }
};

const AppLayout = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const headerTitle = getHeaderTitle(location.pathname);

  const handleStateChange = (state) => {
    setMenuOpen(state.isOpen);
  };

  // Helper to close the menu, useful for when we click a link
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div id="outer-container">
      <Sidebar
        pageWrapId={"page-wrap"}
        outerContainerId={"outer-container"}
        isOpen={isMenuOpen}
        onStateChange={handleStateChange}
        onLinkClick={closeMenu} // Pass closeMenu to the sidebar
      />
      <div id="page-wrap">
        <Header title={headerTitle} onMenuClick={() => setMenuOpen(true)} />
        <main>
          {/* We don't need the onClick wrapper here anymore */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/official-notes" element={<OfficialNotes />} />
            <Route path="/personal-notes" element={<PersonalNotes />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin-login" element={<AdminLogin />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;