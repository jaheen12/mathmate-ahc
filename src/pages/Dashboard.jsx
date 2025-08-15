import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Edit, Clock } from 'lucide-react';

const MySwal = withReactContent(Swal);

// --- NEW CACHE KEYS ---
const TASKS_CACHE_KEY = 'mathmate-cache-tasks';
const SCHEDULE_CACHE_KEY = 'mathmate-cache-schedule'; // We can reuse the same schedule cache

function Dashboard() {
  // --- Initialize state from cache ---
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem(TASKS_CACHE_KEY)) || []);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, authLoading } = useAuth();

  const getToday = () => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[new Date().getDay()];
  };

  useEffect(() => {
    // We get today's classes from the schedule cache, which the Schedule page keeps updated.
    const cachedSchedule = JSON.parse(localStorage.getItem(SCHEDULE_CACHE_KEY)) || {};
    const today = getToday();
    setTodaysClasses(cachedSchedule[today] || []);

    const fetchDashboardData = async () => {
      // Data is already loaded from cache, so we don't need a hard loading state
      // unless both caches are empty.
      if (tasks.length === 0 && Object.keys(cachedSchedule).length === 0) {
        setIsLoading(true);
      } else {
        setIsLoading(false); // We have some data to show, no need to wait
      }

      try {
        const tasksRef = doc(db, 'tasks', 'main-list');
        const scheduleRef = doc(db, 'schedule', 'main-schedule');

        const [tasksSnap, scheduleSnap] = await Promise.all([
          getDoc(tasksRef),
          getDoc(scheduleRef)
        ]);
        
        // Process and cache tasks
        if (tasksSnap.exists()) {
          const freshTasks = tasksSnap.data().list || [];
          setTasks(freshTasks);
          localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(freshTasks));
        }

        // Process and cache schedule
        if (scheduleSnap.exists()) {
          const freshSchedule = scheduleSnap.data();
          const today = getToday();
          setTodaysClasses(freshSchedule[today] || []);
          localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(freshSchedule));
        }

      } catch (error) {
        console.error("Error fetching dashboard data (might be offline):", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Run once on component mount

  // ... (handleEditTasks function remains exactly the same)
  const handleEditTasks = () => { /* ... */ };

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>

      <Card title="Today's Schedule">
        {isLoading && todaysClasses.length === 0 ? <p>Loading schedule...</p> : (
          todaysClasses.length > 0 ? (
            <ul className="schedule-list">
              {todaysClasses.map((classInfo, index) => (
                <li key={index}>
                  <span className="class-time"><Clock size={14} /> {classInfo.time}</span>
                  <span className="class-name">{classInfo.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No classes scheduled for today. Take a break!</p>
          )
        )}
      </Card>

      <Card title="Upcoming Tasks">
        {!authLoading && currentUser && (
          <button className="card-edit-button" onClick={handleEditTasks}>
            <Edit size={18} />
          </button>
        )}
        {isLoading && tasks.length === 0 ? <p>Loading tasks...</p> : (
          tasks.length > 0 ? (
            <ul className="task-list">
              {tasks.map(task => (
                <li key={task.id}>
                  <span className="task-text">{task.text}</span>
                  <span className="task-due">{task.due}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No upcoming tasks. Enjoy your day!</p>
          )
        )}
      </Card>
      
      <Card title="Attendance Warning">
         <p>This feature will be implemented soon.</p>
      </Card>
    </div>
  );
}

export default Dashboard;