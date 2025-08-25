import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary'; // Import the new ErrorBoundary

// Page Imports
import Dashboard from './pages/Dashboard';
import NoteSubjects from './pages/NoteSubjects';
import NoteChapters from './pages/NoteChapters';
import NoteItems from './pages/NoteItems';
import NoteViewer from './pages/NoteViewer';
import PersonalSubjects from './pages/PersonalSubjects';
import PersonalChapters from './pages/PersonalChapters';
import PersonalNoteItems from './pages/PersonalNoteItems';
import PersonalNoteEditor from './pages/PersonalNoteEditor';
import ResourceCategories from './pages/ResourceCategories';
import ResourceChapters from './pages/ResourceChapters';
import ResourceItems from './pages/ResourceItems';
import Schedule from './pages/Schedule';
import ScheduleEditor from './pages/ScheduleEditor';
import Notices from './pages/Notices';
import Attendance from './pages/Attendance';
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';

// Component Imports
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { useTheme } from './hooks/useTheme';

// 404 Page
const NotFound = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
    <h2 className="text-2xl text-gray-800 dark:text-gray-200">Page Not Found</h2>
  </div>
);

function App() {
  // Apply the theme globally
  useTheme(); 
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState('');
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const location = useLocation();

  // Render login route separately
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
      </Routes>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen md:flex bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <Header toggleSidebar={toggleSidebar} title={headerTitle} />
          
          {/* Routes */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard setHeaderTitle={setHeaderTitle} />} />

              {/* Official Notes */}
              <Route path="/notes" element={<NoteSubjects setHeaderTitle={setHeaderTitle} />} />
              <Route path="/notes/:subjectId" element={<NoteChapters setHeaderTitle={setHeaderTitle} />} />
              <Route path="/notes/:subjectId/:chapterId" element={<NoteItems setHeaderTitle={setHeaderTitle} />} />
              <Route path="/notes/:subjectId/:chapterId/:itemId" element={<NoteViewer setHeaderTitle={setHeaderTitle} />} />

              {/* Personal Notes */}
              <Route path="/personal-notes" element={<PersonalSubjects setHeaderTitle={setHeaderTitle} />} />
              <Route path="/personal-notes/:subjectId" element={<PersonalChapters setHeaderTitle={setHeaderTitle} />} />
              <Route path="/personal-notes/:subjectId/:chapterId" element={<PersonalNoteItems setHeaderTitle={setHeaderTitle} />} />
              <Route path="/personal-notes/:subjectId/:chapterId/:itemId" element={<PersonalNoteEditor setHeaderTitle={setHeaderTitle} />} />

              {/* Resources */}
              <Route path="/resources" element={<ResourceCategories setHeaderTitle={setHeaderTitle} />} />
              <Route path="/resources/:categoryId" element={<ResourceChapters setHeaderTitle={setHeaderTitle} />} />
              <Route path="/resources/:categoryId/:chapterId" element={<ResourceItems setHeaderTitle={setHeaderTitle} />} />

              {/* Other Pages */}
              <Route path="/schedule" element={<Schedule setHeaderTitle={setHeaderTitle} />} />
              <Route path="/schedule-editor" element={<ScheduleEditor setHeaderTitle={setHeaderTitle} />} />
              <Route path="/notices" element={<Notices setHeaderTitle={setHeaderTitle} />} />
              <Route path="/attendance" element={<Attendance setHeaderTitle={setHeaderTitle} />} />
              <Route path="/settings" element={<Settings setHeaderTitle={setHeaderTitle} />} />
              
              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;