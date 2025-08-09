// src/pages/ScheduleEditor.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

function ScheduleEditor() {
  const { dayId } = useParams(); // e.g., 'sun', 'mon'
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the schedule for this specific day
  useEffect(() => {
    const fetchDaySchedule = async () => {
      setIsLoading(true);
      try {
        const scheduleRef = doc(db, 'schedule', 'main-schedule');
        const scheduleSnap = await getDoc(scheduleRef);
        if (scheduleSnap.exists()) {
          const scheduleData = scheduleSnap.data();
          setClasses(scheduleData[dayId] || []);
        }
      } catch (error) {
        console.error("Error fetching day schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDaySchedule();
  }, [dayId]);

  // Handle changes to any input field for a class
  const handleClassChange = (index, field, value) => {
    const updatedClasses = [...classes];
    updatedClasses[index][field] = value;
    setClasses(updatedClasses);
  };

  // Add a new, empty class to the list
  const handleAddClass = () => {
    setClasses([...classes, { time: '', name: '', topic: '', teacher: '', status: '' }]);
  };

  // Remove a class from the list
  const handleRemoveClass = (index) => {
    const updatedClasses = classes.filter((_, i) => i !== index);
    setClasses(updatedClasses);
  };

  // Save all changes back to Firestore
  const handleSaveChanges = async () => {
    try {
      const scheduleRef = doc(db, 'schedule', 'main-schedule');
      // We update only the field for the specific day (e.g., 'sun')
      await updateDoc(scheduleRef, {
        [dayId]: classes
      });
      Swal.fire('Saved!', 'The schedule has been updated.', 'success');
      navigate('/schedule'); // Go back to the main schedule view
    } catch (error) {
      Swal.fire('Error!', 'Could not save the schedule: ' + error.message, 'error');
    }
  };

  const dayName = dayId.charAt(0).toUpperCase() + dayId.slice(1);

  if (isLoading) {
    return <div className="page-container"><p>Loading editor...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <button onClick={() => navigate('/schedule')} className="back-button-page"><ArrowLeft /></button>
        <h1 className="page-title">Edit {dayName}</h1>
        <button onClick={handleSaveChanges} className="page-action-button save-schedule-button"><Save size={22} /></button>
      </div>

      <div className="schedule-editor-list">
        {classes.map((classInfo, index) => (
          <div key={index} className="editor-class-card">
            <input type="text" placeholder="Time (e.g., 9:45-10:30)" value={classInfo.time} onChange={e => handleClassChange(index, 'time', e.target.value)} />
            <input type="text" placeholder="Class Name" value={classInfo.name} onChange={e => handleClassChange(index, 'name', e.target.value)} />
            <input type="text" placeholder="Topic" value={classInfo.topic} onChange={e => handleClassChange(index, 'topic', e.target.value)} />
            <input type="text" placeholder="Teacher" value={classInfo.teacher} onChange={e => handleClassChange(index, 'teacher', e.target.value)} />
            <select value={classInfo.status || ''} onChange={e => handleClassChange(index, 'status', e.target.value)}>
              <option value="">Normal</option>
              <option value="Canceled">Canceled</option>
              <option value="Exam">Exam</option>
              <option value="Extra Class">Extra Class</option>
            </select>
            <button className="remove-class-button" onClick={() => handleRemoveClass(index)}><Trash2 size={20} /></button>
          </div>
        ))}
        <button className="add-class-button" onClick={handleAddClass}><Plus size={20} /> Add Class</button>
      </div>
    </div>
  );
}

export default ScheduleEditor;