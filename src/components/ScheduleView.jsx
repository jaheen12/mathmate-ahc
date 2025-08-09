// src/components/ScheduleView.jsx

import React from 'react';

// This component now displays the 'topic' as well
function DayColumn({ day, classes }) {
  return (
    <div className="day-column">
      <div className="day-header">{day}</div>
      {classes.length > 0 ? (
        classes.map((classInfo, index) => (
          <div key={index} className="class-card">
            <p className="class-time">{classInfo.time}</p>
            <p className="class-name">{classInfo.name}</p>
            {/* We only show the topic if it exists */}
            {classInfo.topic && <p className="class-topic">{classInfo.topic}</p>}
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

function ScheduleView({ scheduleData }) {
  // We use Object.keys to handle the days present in your data
  const days = Object.keys(scheduleData);

  return (
    <div className="schedule-grid">
      {days.map(day => (
        <DayColumn key={day} day={day.charAt(0).toUpperCase() + day.slice(1)} classes={scheduleData[day] || []} />
      ))}
    </div>
  );
}

export default ScheduleView;