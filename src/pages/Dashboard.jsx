import React from 'react';
import Card from '../components/Card'; // Import our new Card component

function Dashboard() {
  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>

      <Card title="Today's Schedule">
        {/* We will add real data here later */}
        <p>9:00 AM - Linear Algebra</p>
        <p>11:15 AM - Calculus II</p>
        <p>1:30 PM - Physics Lab</p>
      </Card>

      <Card title="Upcoming Tasks">
        {/* We will add real data here later */}
        <p>Calculus Assignment 1 - Due in 2 days</p>
        <p>Prepare Physics Lab Report - Due in 4 days</p>
      </Card>
      
      <Card title="Attendance Warning">
         <p>Your attendance for Physics is low (72%).</p>
      </Card>

    </div>
  );
}

export default Dashboard;