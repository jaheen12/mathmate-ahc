import React from 'react';
import ScheduleView from '../components/ScheduleView'; // Import our new component

function Schedule() {
  // --- EDIT THIS DATA TO MATCH YOUR REAL SCHEDULE ---
  const scheduleData = {
    sun: [
      { time: '9:00 AM', name: 'Linear Algebra', teacher: 'Dr. Rahman' },
      { time: '11:15 AM', name: 'Calculus II', teacher: 'Mrs. Sultana' },
    ],
    mon: [
      { time: '10:00 AM', name: 'Physics II', teacher: 'Mr. Khan' },
      { time: '12:30 PM', name: 'Linear Algebra', teacher: 'Dr. Rahman' },
    ],
    tue: [
      { time: '9:00 AM', name: 'Calculus II', teacher: 'Mrs. Sultana' },
    ],
    wed: [
      { time: '10:00 AM', name: 'Physics II', teacher: 'Mr. Khan' },
      { time: '1:30 PM', name: 'Physics Lab', teacher: 'Lab Assistant' },
    ],
    thu: [], // Example of a day with no classes
  };
  // ----------------------------------------------------

  return (
    <div className="page-container">
      <h1 className="page-title">Class Schedule</h1>
      <ScheduleView scheduleData={scheduleData} />
    </div>
  );
}

export default Schedule;