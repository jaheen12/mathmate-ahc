import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NoteSubjects from './pages/NoteSubjects';
import NoteChapters from './pages/NoteChapters';
import NoteItems from './pages/NoteItems';
import NoteViewer from './pages/NoteViewer';
import PersonalSubjects from './pages/PersonalSubjects';
import PersonalChapters from './pages/PersonalChapters';
import PersonalNoteItems from './pages/PersonalNoteItems';
import ResourceCategories from './pages/ResourceCategories';
import ResourceChapters from './pages/ResourceChapters';
import ResourceItems from './pages/ResourceItems';
import Schedule from './pages/Schedule';
import ScheduleEditor from './pages/ScheduleEditor';
import Notices from './pages/Notices';
import Attendance from './pages/Attendance';
import Settings from './pages/Settings'; // Import the Settings page
import AdminLogin from './pages/AdminLogin';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // --- Logic to get the current page title ---
  const getPageTitle = (pathname) => {
    // This removes the slash and replaces dashes with spaces
    const formattedPath = pathname.substring(1).replace(/-/g, ' '); 
    if (formattedPath === '') return 'Dashboard';
    // Capitalize the first letter of each word
    return formattedPath.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const pageTitle = getPageTitle(location.pathname);

  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
      </Routes>
    );
  }

  return (
    <div className="relative min-h-screen md:flex bg-gray-100">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col h-screen">
        {/* Pass the dynamic pageTitle to the Header */}
        <Header toggleSidebar={toggleSidebar} title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/notes" element={<NoteSubjects />} />
            <Route path="/notes/:subjectId" element={<NoteChapters />} />
            <Route path="/notes/:subjectId/:chapterId" element={<NoteItems />} />
            <Route path="/notes/:subjectId/:chapterId/:itemId" element={<NoteViewer />} />
            <Route path="/personal-notes" element={<PersonalSubjects />} />
            <Route path="/personal-notes/:subjectId" element={<PersonalChapters />} />
            <Route path="/personal-notes/:subjectId/:chapterId" element={<PersonalNoteItems />} />
            <Route path="/personal-notes/:subjectId/:chapterId/:itemId" element={<NoteViewer />} />
            <Route path="/resources" element={<ResourceCategories />} />
            <Route path="/resources/:categoryId" element={<ResourceChapters />} />
            <Route path="/resources/:categoryId/:chapterId" element={<ResourceItems />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/schedule-editor" element={<ScheduleEditor />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/settings" element={<Settings />} /> {/* Add the route for Settings */}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;