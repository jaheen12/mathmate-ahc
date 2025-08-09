// src/components/ScheduleView.jsx
import React from 'react';

function DayColumn({ day, classes }) {
  // A helper to check if a class card has any real content
  const hasContent = (classInfo) => classInfo.name || classInfo.topic || classInfo.teacher;

  return (
    <div className="day-column">
      <div className="day-header">{day}</div>
      {classes && classes.length > 0 ? (
        classes.map((classInfo, index) => (
          // Only render a card if it has content
          hasContent(classInfo) ? (
            <div key={index} className="class-card">
              {classInfo.time && <p className="class-time">{classInfo.time}</p>}
              {classInfo.name && <p className="class-name">{classInfo.name}</p>}
              {classInfo.topic && <p className="class-topic">{classInfo.topic}</p>}
              {classInfo.teacher && <p className="class-teacher">{classInfo.teacher}</p>}
            </div>
          ) : null // Don't render a card for empty slots
        ))
      ) : (
        <div className="no-class-card">
          <p>No Classes</p>
        </div>
      )}
    </div>
  );
}

function ScheduleView({ scheduleData }) {
  // Use a fixed order for the days of the week
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu'];

  return (
    <div className="schedule-grid">
      {daysOfWeek.map(day => (
        <DayColumn 
          key={day} 
          day={day.charAt(0).toUpperCase() + day.slice(1)} 
          classes={scheduleData[day]} 
        />
      ))}
    </div>
  );
}

export default ScheduleView;