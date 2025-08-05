import React from 'react';

// This component will display the schedule for a single day
function DayColumn({ day, classes }) {
  return (
    <div className="day-column">
      <div className="day-header">{day}</div>
      {classes.length > 0 ? (
        classes.map((classInfo, index) => (
          <div key={index} className="class-card">
            <p className="class-time">{classInfo.time}</p>
            <p className="class-name">{classInfo.name}</p>
            <p className="class-teacher">{classInfo.teacher}</p>
          </div>
        ))
      ) : (
        <div className="no-class-card">
          <p>No Classes</p>
        </div>
      )}
    </div>
  );
}

// This is the main component for the weekly schedule view
function ScheduleView({ scheduleData }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

  return (
    <div className="schedule-grid">
      {days.map(day => (
        <DayColumn key={day} day={day} classes={scheduleData[day.toLowerCase()] || []} />
      ))}
    </div>
  );
}

export default ScheduleView;