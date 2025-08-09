// src/pages/Attendance.jsx

import React, { useState, useEffect } from 'react';
import AttendanceCard from '../components/AttendanceCard';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// --- UPDATED COURSE LIST BASED ON YOUR DECISION ---
const YOUR_COURSES = [
  'Fundamentals of Mathematics (223701)',
  'Analytic and Vector Geometry (223703)',
  'Calculus-II (223705)',
  'Linear Algebra (223709)',
  'Physics-II (222707)'
];
// --------------------------------------------------

const getInitialAttendance = () => {
  const storedData = localStorage.getItem('mathmate-attendance');
  if (storedData) {
    // Make sure new courses are added if the app is updated
    const parsedData = JSON.parse(storedData);
    YOUR_COURSES.forEach(course => {
      if (!parsedData[course]) {
        parsedData[course] = { attended: 0, missed: 0, lastAction: null };
      }
    });
    return parsedData;
  }
  
  const defaultData = {};
  YOUR_COURSES.forEach(course => {
    defaultData[course] = { attended: 0, missed: 0, lastAction: null };
  });
  return defaultData;
};

function Attendance() {
  const [attendanceData, setAttendanceData] = useState(getInitialAttendance);

  useEffect(() => {
    localStorage.setItem('mathmate-attendance', JSON.stringify(attendanceData));
  }, [attendanceData]);

  const showConfirmation = (title, text, action) => {
    MySwal.fire({
      title: title,
      text: text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, mark it!',
      cancelButtonText: 'No, cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        action();
        Swal.fire('Marked!', 'Your attendance has been updated.', 'success');
      }
    });
  };
  
  const handleAttend = (courseName) => {
    showConfirmation(
      'Mark as Attended?',
      `Are you sure you want to mark an attended class for ${courseName}?`,
      () => {
        setAttendanceData(prevData => ({
          ...prevData,
          [courseName]: {
            ...prevData[courseName],
            attended: prevData[courseName].attended + 1,
            lastAction: 'attended',
          }
        }));
      }
    );
  };

  const handleMiss = (courseName) => {
    showConfirmation(
      'Mark as Missed?',
      `This will affect your percentage. Are you sure you missed ${courseName}?`,
      () => {
        setAttendanceData(prevData => ({
          ...prevData,
          [courseName]: {
            ...prevData[courseName],
            missed: prevData[courseName].missed + 1,
            lastAction: 'missed',
          }
        }));
      }
    );
  };

  const handleUndo = (courseName) => {
    const lastAction = attendanceData[courseName].lastAction;
    if (!lastAction) return;

    setAttendanceData(prevData => {
        const newData = { ...prevData };
        if (lastAction === 'attended') {
            newData[courseName].attended -= 1;
        } else if (lastAction === 'missed') {
            newData[courseName].missed -= 1;
        }
        newData[courseName].lastAction = null; 
        return newData;
    });
    Swal.fire('Undone!', 'The last action has been reversed.', 'info');
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Attendance Tracker</h1>
      {YOUR_COURSES.map(courseName => (
        <AttendanceCard
          key={courseName}
          courseName={courseName}
          stats={attendanceData[courseName]}
          onAttend={handleAttend}
          onMiss={handleMiss}
          onUndo={handleUndo}
        />
      ))}
    </div>
  );
}

export default Attendance;