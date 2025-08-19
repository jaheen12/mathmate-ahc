import React, { useState, useEffect } from 'react';
import AttendanceCard from '../components/AttendanceCard';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Edit } from 'lucide-react';

const MySwal = withReactContent(Swal);
const COURSES_CACHE_KEY = 'mathmate-cache-courses';

const getLocalAttendanceData = (courses) => {
  const storedData = localStorage.getItem('mathmate-attendance');
  let attendance = storedData ? JSON.parse(storedData) : {};
  courses.forEach(course => {
    if (!attendance[course]) {
      attendance[course] = { attended: 0, missed: 0, lastAction: null };
    }
  });
  return attendance;
};

function Attendance() {
  const [courses, setCourses] = useState(() => JSON.parse(localStorage.getItem(COURSES_CACHE_KEY)) || []);
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoading, setIsLoading] = useState(courses.length === 0);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchCourseList = async () => {
      try {
        const coursesRef = doc(db, 'courses', 'main-list');
        const docSnap = await getDoc(coursesRef);
        if (docSnap.exists()) {
          const courseList = docSnap.data().list;
          if (JSON.stringify(courseList) !== JSON.stringify(courses)) {
            setCourses(courseList);
            localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(courseList));
          }
        }
      } catch (error) {
        console.error("Error fetching course list (might be offline):", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initialize local attendance based on the current course list (from cache or initial state)
    setAttendanceData(getLocalAttendanceData(courses));

    if (navigator.onLine) {
      fetchCourseList();
    } else {
      setIsLoading(false);
    }
  }, []); // Run only once

  useEffect(() => {
    if (Object.keys(attendanceData).length > 0) {
      localStorage.setItem('mathmate-attendance', JSON.stringify(attendanceData));
    }
  }, [attendanceData]);

  const handleEditCourses = () => {
    MySwal.fire({
      title: 'Edit Course List',
      html: `<p>Enter one course name per line.</p><textarea id="swal-courses" class="swal2-textarea">${courses.join('\n')}</textarea>`,
      confirmButtonText: 'Save List', showCancelButton: true,
      preConfirm: () => {
        const textarea = document.getElementById('swal-courses');
        return textarea.value.split('\n').map(line => line.trim()).filter(line => line);
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const newList = result.value;
        try {
          const coursesRef = doc(db, 'courses', 'main-list');
          await updateDoc(coursesRef, { list: newList });
          Swal.fire('Success!', 'The course list has been updated.', 'success');
          // Update state and cache immediately
          setCourses(newList);
          localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(newList));
        } catch (error) {
          Swal.fire('Error!', 'Could not update the list: ' + error.message, 'error');
        }
      }
    });
  };

  const showConfirmation = (title, text, action) => { MySwal.fire({ title, text, icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, mark it!', cancelButtonText: 'No, cancel' }).then(result => { if (result.isConfirmed) { action(); Swal.fire('Marked!', 'Your attendance has been updated.', 'success'); } }); };
  const handleAttend = (courseName) => { showConfirmation('Mark as Attended?', `Are you sure for ${courseName}?`, () => { setAttendanceData(prevData => ({ ...prevData, [courseName]: { ...prevData[courseName], attended: prevData[courseName].attended + 1, lastAction: 'attended' } })); }); };
  const handleMiss = (courseName) => { showConfirmation('Mark as Missed?', `Are you sure you missed ${courseName}?`, () => { setAttendanceData(prevData => ({ ...prevData, [courseName]: { ...prevData[courseName], missed: prevData[courseName].missed + 1, lastAction: 'missed' } })); }); };
  const handleUndo = (courseName) => { setAttendanceData(currentData => { const lastAction = currentData[courseName]?.lastAction; if (!lastAction) { return currentData; } const newData = { ...currentData }; const courseData = { ...newData[courseName] }; if (lastAction === 'attended') { courseData.attended -= 1; } else if (lastAction === 'missed') { courseData.missed -= 1; } courseData.lastAction = null; newData[courseName] = courseData; return newData; }); Swal.fire('Undone!', 'The last action has been reversed.', 'info'); };

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
      {isLoading ? <p>Loading course list...</p> : (
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