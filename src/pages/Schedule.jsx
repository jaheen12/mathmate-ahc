import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import ScheduleView from '../components/ScheduleView';
import { IoArrowBack } from "react-icons/io5";

const Schedule = () => {
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                // The schedule is stored in a single document for simplicity
                const scheduleDocRef = doc(db, "schedules", "first_year");
                const docSnap = await getDoc(scheduleDocRef);

                if (docSnap.exists()) {
                    setScheduleData(docSnap.data());
                } else {
                    // If no schedule is found, initialize with an empty structure
                    setScheduleData({ days: {} }); 
                    toast.info("No schedule has been set up yet.");
                }
            } catch (error) {
                console.error("Error fetching schedule: ", error);
                toast.error("Failed to load the schedule.");
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <Link to="/profile" className="text-blue-500 hover:underline">
                    <IoArrowBack size={24} />
                </Link>
                <h1 className="text-2xl font-bold">Class Schedule</h1>
                {currentUser && (
                    <Link to="/schedule-editor" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                        Edit
                    </Link>
                )}
            </div>

            {loading ? (
                <p>Loading schedule...</p>
            ) : (
                scheduleData && <ScheduleView scheduleData={scheduleData} />
            )}
        </div>
    );
};

export default Schedule;