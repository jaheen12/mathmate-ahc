import React, { useState, useEffect } from 'react';
import ScheduleView from '../components/ScheduleView';
import { db } from '../firebaseConfig'; // Import your db connection
import { collection, getDocs } from 'firebase/firestore';

function Schedule() {
  const [scheduleData, setScheduleData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      // Set loading to true every time we fetch
      setIsLoading(true);
      try {
        const scheduleCollectionRef = collection(db, 'schedule');
        const scheduleSnapshot = await getDocs(scheduleCollectionRef);
        
        if (!scheduleSnapshot.empty) {
          // Get the very first document, regardless of its ID
          const scheduleDoc = scheduleSnapshot.docs[0].data();
          
          // --- THIS IS THE DEBUGGING LINE ---
          // It will print the data your app is receiving to the developer console.
          
          // ------------------------------------

          setScheduleData(scheduleDoc);
        } else {
          // This will log if the 'schedule' collection is empty in your database
          console.log("No schedule document found in Firestore!");
        }
      } catch (error) {
        // This will log if there is a permission error or network problem
        console.error("Error fetching schedule from Firebase: ", error);
      } finally {
        // Set loading to false once we are done, successful or not
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []); // The empty array [] means this useEffect runs only once when the page loads.

  return (
    <div className="page-container">
      <h1 className="page-title">Class Schedule</h1>
      {/* Show a loading message while fetching data */}
      {isLoading ? <p>Loading schedule from cloud...</p> : <ScheduleView scheduleData={scheduleData} />}
    </div>
  );
}

export default Schedule;