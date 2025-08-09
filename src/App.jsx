import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// ... (other page imports remain the same)
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import OfficialNotes from './pages/OfficialNotes';
import PersonalNotes from './pages/PersonalNotes';
import Attendance from './pages/Attendance';
import Notices from './pages/Notices';
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';

// --- NEW: Import our new resource pages ---
import ResourceCategories from './pages/ResourceCategories';
import ResourceChapters from './pages/ResourceChapters';
import ResourceItems from './pages/ResourceItems';

// Import Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

const getHeaderTitle = (pathname) => {
  // We'll simplify this for now. A more advanced solution might be needed later.
  if (pathname.startsWith('/resources')) return 'Resource Hub';
  
  switch (pathname) {
    case '/': return 'Dashboard';
    case '/schedule': return 'Schedule';
    case '/official-notes': return 'Official Notes';
    case '/personal-notes': return 'Personal Notes';
    case '/attendance': return 'Attendance Tracker';
    case '/notices': return 'Notice Board';
    case '/settings': return 'Settings';
    case '/admin-login': return 'Admin Login';
    default: return 'MathMate AHC';
  }
};

const AppLayout = () => {
  // ... (This component's logic remains the same)
  const [isMenuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const headerTitle = getHeaderTitle(location.pathname);
  const handleStateChange = (state) => setMenuOpen(state.isOpen);
  const closeMenu = () => setMenuOpen(false);
  return (
    <div id="outer-container">
      <Sidebar pageWrapId={"page-wrap"} outerContainerId={"outer-container"} isOpen={isMenuOpen} onStateChange={handleStateChange} onLinkClick={closeMenu} />
      <div id="page-wrap">
        <Header title={headerTitle} onMenuClick={() => setMenuOpen(true)} />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/official-notes" element={<OfficialNotes />} />
            <Route path="/personal-notes" element={<PersonalNotes />} />
            
            {/* --- NEW NESTED ROUTES FOR RESOURCES --- */}
            <Route path="/resources" element={<ResourceCategories />} />
            <Route path="/resources/:categoryId" element={<ResourceChapters />} />
            <Route path="/resources/:categoryId/:chapterId" element={<ResourceItems />} />
            
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