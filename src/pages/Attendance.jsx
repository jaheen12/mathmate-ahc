import React, { useState, useEffect } from 'react';
import AttendanceCard from '../components/AttendanceCard';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Edit } from 'lucide-react';

const MySwal = withReactContent(Swal);

// Helper function to manage local attendance data
const getLocalAttendanceData = (courses) => {
  const storedData = localStorage.getItem('mathmate-attendance');
  let attendance = storedData ? JSON.parse(storedData) : {};
  // Ensure every official course has an entry in the local data
  courses.forEach(course => {
    if (!attendance[course]) {
      attendance[course] = { attended: 0, missed: 0, lastAction: null };
    }
  });
  return attendance;
};

function Attendance() {
  const [courses, setCourses] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchCourseList = async () => {
    setIsLoading(true);
    try {
      const coursesRef = doc(db, 'courses', 'main-list');
      const docSnap = await getDoc(coursesRef);
      if (docSnap.exists()) {
        const courseList = docSnap.data().list;
        setCourses(courseList);
        // Initialize local attendance data based on the fetched course list
        setAttendanceData(getLocalAttendanceData(courseList));
      }
    } catch (error) {
      console.error("Error fetching course list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseList();
  }, []);

  // Save to local storage whenever attendanceData changes
  useEffect(() => {
    // Only save if there is data to prevent overwriting on initial load
    if (Object.keys(attendanceData).length > 0) {
      localStorage.setItem('mathmate-attendance', JSON.stringify(attendanceData));
    }
  }, [attendanceData]);

  const handleEditCourses = () => {
    MySwal.fire({
      title: 'Edit Course List',
      html: `
        <p>Enter one course name per line.</p>
        <textarea id="swal-courses" class="swal2-textarea">${courses.join('\n')}</textarea>
      `,
      confirmButtonText: 'Save List',
      showCancelButton: true,
      preConfirm: () => {
        const textarea = document.getElementById('swal-courses');
        // Split by new line, trim whitespace, and remove any empty lines
        return textarea.value.split('\n').map(line => line.trim()).filter(line => line);
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const newList = result.value;
        try {
          const coursesRef = doc(db, 'courses', 'main-list');
          await updateDoc(coursesRef, { list: newList });
          Swal.fire('Success!', 'The course list has been updated.', 'success');
          fetchCourseList(); // Refresh the list
        } catch (error) {
          Swal.fire('Error!', 'Could not update the list: ' + error.message, 'error');
        }
      }
    });
  };

  // --- Attendance marking logic (handleAttend, handleMiss, handleUndo) remains the same ---
  const showConfirmation = (title, text, action) => { MySwal.fire({ title, text, icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, mark it!', cancelButtonText: 'No, cancel' }).then(result => { if (result.isConfirmed) { action(); Swal.fire('Marked!', 'Your attendance has been updated.', 'success'); } }); };
  const handleAttend = (courseName) => { showConfirmation('Mark as Attended?', `Are you sure for ${courseName}?`, () => { setAttendanceData(prevData => ({ ...prevData, [courseName]: { ...prevData[courseName], attended: prevData[courseName].attended + 1, lastAction: 'attended' } })); }); };
  const handleMiss = (courseName) => { showConfirmation('Mark as Missed?', `Are you sure you missed ${courseName}?`, () => { setAttendanceData(prevData => ({ ...prevData, [courseName]: { ...prevData[courseName], missed: prevData[courseName].missed + 1, lastAction: 'missed' } })); }); };
  const handleUndo = (courseName) => { const lastAction = attendanceData[courseName]?.lastAction; if (!lastAction) return; setAttendanceData(prevData => { const newData = { ...prevData }; if (lastAction === 'attended') { newData[courseName].attended -= 1; } else if (lastAction === 'missed') { newData[courseName].missed -= 1; } newData[courseName].lastAction = null; return newData; }); Swal.fire('Undone!', 'The last action has been reversed.', 'info'); };
  // --- End of attendance logic ---

  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">Attendance Tracker</h1>
        {currentUser && (
          <button className="page-action-button" onClick={handleEditCourses}>
            <Edit size={22} />
          </button>
        )}
      </div>
      {isLoading ? (
        <p>Loading course list...</p>
      ) : (
        <div>
          {courses.map(courseName => (
            <AttendanceCard
              key={courseName}
              courseName={courseName}
              stats={attendanceData[courseName] || { attended: 0, missed: 0 }}
              onAttend={handleAttend}
              onMiss={handleMiss}
              onUndo={handleUndo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Attendance;