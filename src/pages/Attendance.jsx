import React, { useState, useEffect } from 'react';
import AttendanceCard from '../components/AttendanceCard';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const YOUR_COURSES = [
  'Linear Algebra', 'Calculus II', 'Physics II', 'Physics Lab', 'Statistics'
];

const getInitialAttendance = () => {
  const storedData = localStorage.getItem('mathmate-attendance');
  if (storedData) {
    return JSON.parse(storedData);
  }
  const defaultData = {};
  YOUR_COURSES.forEach(course => {
    // The data structure now includes 'lastAction'
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
            lastAction: 'attended', // Track the last action
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
            lastAction: 'missed', // Track the last action
          }
        }));
      }
    );
  };

  const handleUndo = (courseName) => {
    const lastAction = attendanceData[courseName].lastAction;
    if (!lastAction) return; // Do nothing if there's nothing to undo

    setAttendanceData(prevData => {
        const newData = { ...prevData };
        if (lastAction === 'attended') {
            newData[courseName].attended -= 1;
        } else if (lastAction === 'missed') {
            newData[courseName].missed -= 1;
        }
        // Clear the last action so undo can only be used once
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
          onUndo={handleUndo} // Pass the new undo handler
        />
      ))}
    </div>
  );
}

export default Attendance;