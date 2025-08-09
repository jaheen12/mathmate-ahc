import React, { useState, useEffect } from 'react';
import ScheduleView from '../components/ScheduleView';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function Schedule() {
  const [scheduleData, setScheduleData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // We need to keep track of reminders to force a re-render when they change
  const [reminders, setReminders] = useState(() => JSON.parse(localStorage.getItem('mathmate-reminders')) || {});

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        // We now fetch from the 'main-schedule' document specifically
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
  
  // --- NEW: Function to handle when a class card is clicked ---
  const handleCardClick = (classInfo, classCardId) => {
    const currentReminder = reminders[classCardId] || '';
    
    MySwal.fire({
      title: `${classInfo.name}`,
      html: `
        <div style="text-align: left; margin-top: 1em;">
          <p><strong>Time:</strong> ${classInfo.time}</p>
          <p><strong>Teacher:</strong> ${classInfo.teacher}</p>
          <p><strong>Topic:</strong> ${classInfo.topic}</p>
          <hr/>
          <label for="swal-reminder" style="display: block; margin-top: 1em;"><strong>My Personal Reminder:</strong></label>
          <textarea id="swal-reminder" class="swal2-textarea">${currentReminder}</textarea>
        </div>
      `,
      showDenyButton: true,
      confirmButtonText: 'Save Reminder',
      denyButtonText: 'Delete Reminder',
      showCancelButton: true,
      cancelButtonText: 'Close',
    }).then((result) => {
      if (result.isConfirmed) {
        const newReminderText = document.getElementById('swal-reminder').value;
        const updatedReminders = { ...reminders, [classCardId]: newReminderText };
        localStorage.setItem('mathmate-reminders', JSON.stringify(updatedReminders));
        setReminders(updatedReminders); // Update state to trigger re-render
        Swal.fire('Saved!', 'Your reminder has been saved locally.', 'success');
      } else if (result.isDenied) {
        const { [classCardId]: _, ...remainingReminders } = reminders;
        localStorage.setItem('mathmate-reminders', JSON.stringify(remainingReminders));
        setReminders(remainingReminders); // Update state to trigger re-render
        Swal.fire('Deleted!', 'Your reminder has been deleted.', 'info');
      }
    });
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Class Schedule</h1>
      {isLoading ? <p>Loading schedule from cloud...</p> : (
        <ScheduleView 
          scheduleData={scheduleData}
          onCardClick={handleCardClick} // Pass the handler function down
        />
      )}
    </div>
  );
}

export default Schedule;