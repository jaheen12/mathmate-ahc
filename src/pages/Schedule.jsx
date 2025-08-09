import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import ScheduleView from '../components/ScheduleView';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext'; // Import useAuth
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Edit } from 'lucide-react'; // Import Edit icon

const MySwal = withReactContent(Swal);

function Schedule() {
  const [scheduleData, setScheduleData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [reminders, setReminders] = useState(() => JSON.parse(localStorage.getItem('mathmate-reminders')) || {});
  const { currentUser } = useAuth(); // Get admin status
  const navigate = useNavigate(); // Get navigate function

  useEffect(() => {
    // ... (fetchSchedule logic is exactly the same)
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const scheduleRef = doc(db, 'schedule', 'main-schedule');
        const scheduleSnap = await getDoc(scheduleRef);
        if (scheduleSnap.exists()) {
          setScheduleData(scheduleSnap.data());
        } else {
          console.log("No schedule document found!");
        }
      } catch (error) {
        console.error("Error fetching schedule: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, []);
  
  const handleCardClick = (classInfo, classCardId) => {
    // ... (handleCardClick logic is exactly the same)
    const currentReminder = reminders[classCardId] || '';
    MySwal.fire({
      title: `${classInfo.name}`,
      html: `<div style="text-align: left; margin-top: 1em;"><p><strong>Time:</strong> ${classInfo.time}</p><p><strong>Teacher:</strong> ${classInfo.teacher}</p><p><strong>Topic:</strong> ${classInfo.topic}</p><hr/><label for="swal-reminder" style="display: block; margin-top: 1em;"><strong>My Personal Reminder:</strong></label><textarea id="swal-reminder" class="swal2-textarea">${currentReminder}</textarea></div>`,
      showDenyButton: true, confirmButtonText: 'Save Reminder', denyButtonText: 'Delete Reminder',
      showCancelButton: true, cancelButtonText: 'Close',
    }).then((result) => {
      if (result.isConfirmed) {
        const newReminderText = document.getElementById('swal-reminder').value;
        const updatedReminders = { ...reminders, [classCardId]: newReminderText };
        localStorage.setItem('mathmate-reminders', JSON.stringify(updatedReminders));
        setReminders(updatedReminders);
        Swal.fire('Saved!', 'Your reminder has been saved locally.', 'success');
      } else if (result.isDenied) {
        const { [classCardId]: _, ...remainingReminders } = reminders;
        localStorage.setItem('mathmate-reminders', JSON.stringify(remainingReminders));
        setReminders(remainingReminders);

        Swal.fire('Deleted!', 'Your reminder has been deleted.', 'info');
      }
    });
  };

  const handleEditDay = (dayId) => {
    navigate(`/schedule/edit/${dayId}`);
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">Class Schedule</h1>
        {/* --- NEW: ADMIN EDIT BUTTON --- */}
        {currentUser && (
          <div className="dropdown">
            <button className="page-action-button"><Edit size={22} /></button>
            <div className="dropdown-content">
              {Object.keys(scheduleData).map(day => (
                <a key={day} onClick={() => handleEditDay(day)}>
                  Edit {day.charAt(0).toUpperCase() + day.slice(1)}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? <p>Loading schedule from cloud...</p> : (
        <ScheduleView 
          scheduleData={scheduleData}
          onCardClick={handleCardClick}
        />
      )}
    </div>
  );
}

export default Schedule;