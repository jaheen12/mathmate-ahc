import React from 'react';
import { RotateCcw } from 'lucide-react'; // Import the Undo icon

// The component now also receives an 'onUndo' function
function AttendanceCard({ courseName, stats, onAttend, onMiss, onUndo }) {
  const { attended, missed, lastAction } = stats; // We now get 'lastAction' from stats
  const totalTaken = attended + missed;
  const percentage = totalTaken > 0 ? ((attended / totalTaken) * 100).toFixed(0) : 100;

  let progressBarColor = 'green';
  if (percentage < 80) progressBarColor = 'orange';
  if (percentage < 75) progressBarColor = 'red';

  return (
    <div className="attendance-card">
      <div className="card-header-flex">
        <span className="course-name-attendance">{courseName}</span>
        {/* The Undo button is only visible if there's a last action to undo */}
        {lastAction && (
          <button className="undo-button" onClick={() => onUndo(courseName)}>
            <RotateCcw size={16} /> Undo
          </button>
        )}
      </div>
      
      <div className="course-info">
        <span className="attendance-stats">
          {attended} / {totalTaken}
        </span>
        <span className="attendance-percentage">
          {percentage}%
        </span>
      </div>
      
      <div className="progress-bar-container">
        <div 
          className={`progress-bar ${progressBarColor}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="action-buttons">
        <button className="attend-button" onClick={() => onAttend(courseName)}>
          ✔️ Attended
        </button>
        <button className="miss-button" onClick={() => onMiss(courseName)}>
          ❌ Missed
        </button>
      </div>
    </div>
  );
}

export default AttendanceCard;