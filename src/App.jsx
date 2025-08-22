// src/App.jsx
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
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [headerTitle, setHeaderTitle] = useState(''); 

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const location = useLocation();
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
        <Header toggleSidebar={toggleSidebar} title={headerTitle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            {/* Pass setHeaderTitle to all main pages */}
            <Route path="/" element={<Dashboard setHeaderTitle={setHeaderTitle} />} />
            <Route path="/notes" element={<NoteSubjects setHeaderTitle={setHeaderTitle} />} />
            <Route path="/notes/:subjectId" element={<NoteChapters setHeaderTitle={setHeaderTitle} />} />
            <Route path="/notes/:subjectId/:chapterId" element={<NoteItems setHeaderTitle={setHeaderTitle} />} />
            <Route path="/personal-notes" element={<PersonalSubjects setHeaderTitle={setHeaderTitle} />} />
            <Route path="/personal-notes/:subjectId" element={<PersonalChapters setHeaderTitle={setHeaderTitle} />} />
            <Route path="/personal-notes/:subjectId/:chapterId" element={<PersonalNoteItems setHeaderTitle={setHeaderTitle} />} />
            <Route path="/resources" element={<ResourceCategories setHeaderTitle={setHeaderTitle} />} />
            <Route path="/resources/:categoryId" element={<ResourceChapters setHeaderTitle={setHeaderTitle} />} />
            <Route path="/resources/:categoryId/:chapterId" element={<ResourceItems setHeaderTitle={setHeaderTitle} />} />
            <Route path="/schedule" element={<Schedule setHeaderTitle={setHeaderTitle} />} />
            <Route path="/notices" element={<Notices setHeaderTitle={setHeaderTitle} />} />
            <Route path="/attendance" element={<Attendance setHeaderTitle={setHeaderTitle} />} />
            <Route path="/settings" element={<Settings setHeaderTitle={setHeaderTitle} />} />
            
            {/* Editor/Viewer pages don't need to set the title, so we don't pass the prop */}
            <Route path="/schedule-editor" element={<ScheduleEditor setHeaderTitle={setHeaderTitle} />} />
            <Route path="/notes/:subjectId/:chapterId/:itemId" element={<NoteViewer setHeaderTitle={setHeaderTitle} />} />
            <Route path="/personal-notes/:subjectId/:chapterId/:itemId" element={<NoteViewer setHeaderTitle={setHeaderTitle} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;