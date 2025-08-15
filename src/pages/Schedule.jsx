import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScheduleView from '../components/ScheduleView';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Edit } from 'lucide-react';

const MySwal = withReactContent(Swal);

// --- NEW CACHING LOGIC ---
const SCHEDULE_CACHE_KEY = 'mathmate-cache-schedule';

function Schedule() {
  // We initialize the state from the cache first for instant offline loading
  const [scheduleData, setScheduleData] = useState(() => {
    const cachedData = localStorage.getItem(SCHEDULE_CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : {};
  });

  const [isLoading, setIsLoading] = useState(true);
  const [reminders, setReminders] = useState(() => JSON.parse(localStorage.getItem('mathmate-reminders')) || {});
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedule = async () => {
      // If we have cached data, we can show it immediately and not show a full loading screen
      // The fetch will just happen in the background.
      if (Object.keys(scheduleData).length === 0) {
        setIsLoading(true);
      }

      try {
        const scheduleRef = doc(db, 'schedule', 'main-schedule');
        const scheduleSnap = await getDoc(scheduleRef);
        
        if (scheduleSnap.exists()) {
          const freshData = scheduleSnap.data();
          // Update the screen with the fresh data
          setScheduleData(freshData);
          // --- CRITICAL STEP: Save the fresh data to local storage for next time ---
          localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(freshData));
        } else {
          console.log("No schedule document found in Firestore!");
        }
      } catch (error) {
        console.error("Error fetching schedule from Firebase (might be offline): ", error);
        // If the fetch fails (e.g., no internet), the app will just continue
        // showing the old data from the cache, which is what we want.
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []);
  
  // --- The rest of the functions (handleCardClick, handleEditDay) are unchanged ---
  const handleCardClick = (classInfo, classCardId) => {
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
      
      {isLoading && Object.keys(scheduleData).length === 0 ? (
        <p>Loading schedule from cloud...</p> 
      ) : (
        <ScheduleView 
          scheduleData={scheduleData}
          onCardClick={handleCardClick}
        />
      )}
    </div>
  );
}

export default Schedule;