import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import your pages and components
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Notes from './pages/Notes';
import Resources from './pages/Resources';
import Attendance from './pages/Attendance';
import BottomNav from './components/BottomNav';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/attendance" element={<Attendance />} />
          </Routes>
        </main>
        
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;