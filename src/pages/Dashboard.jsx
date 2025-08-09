// src/pages/Dashboard.jsx
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

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, authLoading } = useAuth();
  
  const getToday = () => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[new Date().getDay()];
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const tasksRef = doc(db, 'tasks', 'main-list');
        const scheduleRef = doc(db, 'schedule', 'main-schedule');
        const [tasksSnap, scheduleSnap] = await Promise.all([ getDoc(tasksRef), getDoc(scheduleRef) ]);
        if (tasksSnap.exists()) { setTasks(tasksSnap.data().list || []); }
        if (scheduleSnap.exists()) {
          const today = getToday();
          const allSchedules = scheduleSnap.data();
          setTodaysClasses(allSchedules[today] || []);
        }
      } catch (error) { console.error("Error fetching dashboard data:", error); }
      finally { setIsLoading(false); }
    };
    fetchDashboardData();
  }, []);

  const handleEditTasks = () => {
    const tasksHtml = tasks.map(task => `<div class="task-editor-item" data-id="${task.id}"><input class="swal2-input task-text" value="${task.text}"><input class="swal2-input task-due" value="${task.due}" placeholder="Due date"><button class="swal2-deny task-delete-btn" type="button">Delete</button></div>`).join('');
    MySwal.fire({
      title: 'Edit Upcoming Tasks',
      html: `<div id="task-editor-list">${tasksHtml}</div><button id="add-task-btn" class="swal2-confirm swal2-styled" style="margin-top: 1em;">Add New Task</button>`,
      confirmButtonText: 'Save All Changes', showCancelButton: true,
      didOpen: () => {
        document.getElementById('add-task-btn').addEventListener('click', () => {
          const list = document.getElementById('task-editor-list');
          const newItem = document.createElement('div');
          newItem.className = 'task-editor-item';
          newItem.dataset.id = uuidv4();
          newItem.innerHTML = `<input class="swal2-input task-text" placeholder="New task description"><input class="swal2-input task-due" placeholder="Due date"><button class="swal2-deny task-delete-btn" type="button">Delete</button>`;
          list.appendChild(newItem);
        });
        document.getElementById('task-editor-list').addEventListener('click', (e) => { if(e.target.classList.contains('task-delete-btn')) { e.target.parentElement.remove(); } });
      },
      preConfirm: () => {
        const items = document.querySelectorAll('.task-editor-item');
        const newTasksList = [];
        items.forEach(item => { const text = item.querySelector('.task-text').value; const due = item.querySelector('.task-due').value; if (text) { newTasksList.push({ id: item.dataset.id, text, due }); } });
        return newTasksList;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const tasksRef = doc(db, 'tasks', 'main-list');
          await updateDoc(tasksRef, { list: result.value });
          Swal.fire('Success!', 'The task list has been updated.', 'success');
          setTasks(result.value);
        } catch (error) { Swal.fire('Error!', 'Could not update the tasks: ' + error.message, 'error'); }
      }
    });
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>
      <Card title="Today's Schedule">
        {isLoading ? <p>Loading schedule...</p> : ( todaysClasses.length > 0 ? ( <ul className="schedule-list">{todaysClasses.map((classInfo, index) => ( <li key={index}><span className="class-time"><Clock size={14} /> {classInfo.time}</span><span className="class-name">{classInfo.name}</span></li>))}</ul>) : (<p>No classes scheduled for today. Take a break!</p>) )}
      </Card>
      <Card title="Upcoming Tasks">
        {!authLoading && currentUser && (
          <button className="card-edit-button" onClick={handleEditTasks}>
            <Edit size={18} />
          </button>
        )}
        {isLoading ? <p>Loading tasks...</p> : ( tasks.length > 0 ? ( <ul className="task-list">{tasks.map(task => ( <li key={task.id}><span className="task-text">{task.text}</span><span className="task-due">{task.due}</span></li>))}</ul>) : (<p>No upcoming tasks. Enjoy your day!</p>) )}
      </Card>
      <Card title="Attendance Warning">
         <p>This feature will be implemented soon.</p>
      </Card>
    </div>
  );
}
export default Dashboard;