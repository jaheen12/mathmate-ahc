import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// ... (other page imports are the same)
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import NoteSubjects from './pages/NoteSubjects';
import NoteChapters from './pages/NoteChapters';
import NoteItems from './pages/NoteItems';
import ResourceCategories from './pages/ResourceCategories';
import ResourceChapters from './pages/ResourceChapters';
import ResourceItems from './pages/ResourceItems';
import Attendance from './pages/Attendance';
import Notices from './pages/Notices';
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';
import ScheduleEditor from './pages/ScheduleEditor';

// --- NEW: Import our new PERSONAL note pages ---
import PersonalSubjects from './pages/PersonalSubjects';
import PersonalChapters from './pages/PersonalChapters';
import PersonalNoteItems from './pages/PersonalNoteItems';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

const getHeaderTitle = (pathname) => {
  if (pathname.startsWith('/resources')) return 'Resource Hub';
  if (pathname.startsWith('/notes/subjects')) return 'Official Notes';
  if (pathname.startsWith('/notes/personal')) return 'Personal Notes'; // New title
  if (pathname.startsWith('/notes/')) return 'Official Notes'; // Fallback
  if (pathname.startsWith('/schedule/edit')) return 'Schedule Editor';
  
  switch (pathname) {
    // ... (rest of switch is the same)
    case '/': return 'Dashboard';
    case '/schedule': return 'Schedule';
    case '/attendance': return 'Attendance Tracker';
    case '/notices': return 'Notice Board';
    case '/settings': return 'Settings';
    case '/admin-login': return 'Admin Login';
    default: return 'MathMate AHC';
  }
};

const AppLayout = () => {
  // ... (This component's logic is unchanged)
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
            {/* --- NEW NESTED ROUTES FOR PERSONAL NOTES --- */}
            <Route path="/notes/personal/subjects" element={<PersonalSubjects />} />
            <Route path="/notes/personal/:subjectId" element={<PersonalChapters />} />
            <Route path="/notes/personal/:subjectId/:chapterId" element={<PersonalNoteItems />} />
            
            {/* --- Existing Routes --- */}
            <Route path="/notes/subjects" element={<NoteSubjects />} />
            <Route path="/notes/:subjectId" element={<NoteChapters />} />
            <Route path="/notes/:subjectId/:chapterId" element={<NoteItems />} />
            <Route path="/resources" element={<ResourceCategories />} />
            <Route path="/resources/:categoryId" element={<ResourceChapters />} />
            <Route path="/resources/:categoryId/:chapterId" element={<ResourceItems />} />
            <Route path="/schedule/edit/:dayId" element={<ScheduleEditor />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/" element={<Dashboard />} />
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