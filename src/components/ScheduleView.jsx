import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Star, Award } from 'lucide-react';

// --- NEW HELPER FUNCTIONS ---
const getCurrentDayIndex = () => new Date().getDay(); // Sunday = 0, Monday = 1, etc.

// Parses "9:45-10:30" into start and end minutes from midnight
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const [start, end] = timeStr.split('-');
  const [startHour, startMin] = start.trim().split(':').map(Number);
  const startTimeInMinutes = startHour * 60 + startMin;
  return { start: startTimeInMinutes, end: 0 }; // We only need the start time for now
};

// --- UPGRADED DAY COLUMN COMPONENT ---
function DayColumn({ day, dayIndex, classes, isCurrentDay, isNextDay, personalReminders, onCardClick }) {
  const [currentTimeInMinutes, setCurrentTimeInMinutes] = useState(new Date().getHours() * 60 + new Date().getMinutes());

  // This effect updates the current time every minute to keep the highlighting "live"
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeInMinutes(new Date().getHours() * 60 + new Date().getMinutes());
    }, 60000); // Update every 60 seconds
    return () => clearInterval(timer);
  }, []);
  
  // Determine the column's highlight class
  let columnClass = 'day-column';
  if (isCurrentDay) columnClass += ' current-day';
  if (isNextDay) columnClass += ' next-day';

  return (
    <div className={columnClass}>
      <div className="day-header">{day}</div>
      {classes && classes.length > 0 ? (
        classes.map((classInfo, index) => {
          const classTime = parseTime(classInfo.time);
          const isCurrentClass = isCurrentDay && classTime && currentTimeInMinutes >= classTime.start && (classes[index+1] ? currentTimeInMinutes < parseTime(classes[index+1].time).start : true);
          
          // A unique ID for each class card for reminders
          const classCardId = `${day.toLowerCase()}-${index}`;
          const hasReminder = personalReminders[classCardId];

          return (
            <div 
              key={index} 
              className={`class-card ${isCurrentClass ? 'current-class' : ''}`}
              onClick={() => onCardClick(classInfo, classCardId)}
            >
              {/* --- NEW: STATUS TAGS --- */}
              {classInfo.status && (
                <div className={`status-tag status-${classInfo.status.toLowerCase().replace(' ', '-')}`}>
                  {classInfo.status === 'Canceled' && <AlertTriangle size={14} />}
                  {classInfo.status === 'Exam' && <Star size={14} />}
                  {classInfo.status === 'Extra Class' && <Award size={14} />}
                  <span>{classInfo.status}</span>
                </div>
              )}

              {classInfo.time && <p className={`class-time ${classInfo.status === 'Canceled' ? 'canceled-text' : ''}`}>{classInfo.time}</p>}
              {classInfo.name && <p className={`class-name ${classInfo.status === 'Canceled' ? 'canceled-text' : ''}`}>{classInfo.name}</p>}
              {classInfo.topic && <p className={`class-topic ${classInfo.status === 'Canceled' ? 'canceled-text' : ''}`}>{classInfo.topic}</p>}
              {classInfo.teacher && <p className={`class-teacher ${classInfo.status === 'Canceled' ? 'canceled-text' : ''}`}>{classInfo.teacher}</p>}
              
              {/* --- NEW: REMINDER ICON --- */}
              {hasReminder && (
                <div className="reminder-indicator">
                  <Bell size={14} /> <span>Reminder set</span>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="no-class-card"><p>No Classes</p></div>
      )}
    </div>
  );
}

// --- UPGRADED MAIN SCHEDULE VIEW COMPONENT ---
function ScheduleView({ scheduleData, onCardClick }) {
  const [lastClassTime, setLastClassTime] = useState(0);
  const [currentTimeInMinutes, setCurrentTimeInMinutes] = useState(new Date().getHours() * 60 + new Date().getMinutes());
  const personalReminders = JSON.parse(localStorage.getItem('mathmate-reminders')) || {};
  
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu'];
  const currentDayIndex = getCurrentDayIndex();

  useEffect(() => {
    // Calculate the end time of the last class for the current day
    const todayClasses = scheduleData[daysOfWeek[currentDayIndex]];
    if (todayClasses && todayClasses.length > 0) {
      const lastClass = todayClasses[todayClasses.length - 1];
      const lastTime = parseTime(lastClass.time);
      // Let's assume a class is 45 mins long to find the end time
      if(lastTime) setLastClassTime(lastTime.start + 45); 
    }
     const timer = setInterval(() => {
      setCurrentTimeInMinutes(new Date().getHours() * 60 + new Date().getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, [scheduleData, currentDayIndex]);

  const findNextDayIndex = () => {
    for (let i = 1; i < 7; i++) {
      const nextDayIdx = (currentDayIndex + i) % 7;
      if (scheduleData[daysOfWeek[nextDayIdx]] && scheduleData[daysOfWeek[nextDayIdx]].length > 0) {
        return nextDayIdx;
      }
    }
    return -1; // No future classes
  };

  const isAfterClasses = currentTimeInMinutes > lastClassTime;
  const nextDayIndex = isAfterClasses ? findNextDayIndex() : -1;

  return (
    <div className="schedule-grid">
      {daysOfWeek.map((day, index) => (
        <DayColumn 
          key={day} 
          day={day.charAt(0).toUpperCase() + day.slice(1)} 
          dayIndex={index}
          classes={scheduleData[day]}
          isCurrentDay={index === currentDayIndex}
          isNextDay={index === nextDayIndex}
          personalReminders={personalReminders}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}

export default ScheduleView;