import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { IoArrowBack } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton'; // Import the skeleton component

const ScheduleEditor = () => {
    const [scheduleData, setScheduleData] = useState({ days: {} });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const daysOfWeek = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);
            try {
                const scheduleDocRef = doc(db, "schedules", "first_year");
                const docSnap = await getDoc(scheduleDocRef);
                if (docSnap.exists()) {
                    setScheduleData(docSnap.data());
                } else {
                    const initialData = { days: {} };
                    daysOfWeek.forEach(day => {
                        initialData.days[day] = [];
                    });
                    setScheduleData(initialData);
                }
            } catch (error) {
                console.error("Error fetching schedule: ", error);
                toast.error("Failed to load the schedule data.");
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    const handleClassChange = (day, index, field, value) => {
        const updatedDays = { ...scheduleData.days };
        updatedDays[day][index][field] = value;
        setScheduleData({ ...scheduleData, days: updatedDays });
    };

    const addClass = (day) => {
        const updatedDays = { ...scheduleData.days };
        if (!updatedDays[day]) {
            updatedDays[day] = [];
        }
        updatedDays[day].push({ time: '', subject: '', teacher: '' });
        setScheduleData({ ...scheduleData, days: updatedDays });
    };

    const removeClass = (day, index) => {
        const updatedDays = { ...scheduleData.days };
        updatedDays[day].splice(index, 1);
        setScheduleData({ ...scheduleData, days: updatedDays });
    };

    const handleSave = async () => {
        try {
            const scheduleDocRef = doc(db, "schedules", "first_year");
            await setDoc(scheduleDocRef, scheduleData);
            toast.success('Schedule saved successfully!');
            navigate('/schedule');
        } catch (error) {
            console.error("Error saving schedule: ", error);
            toast.error('Failed to save schedule. Changes are saved locally and will sync when online.');
        }
    };

    // --- Loading Skeleton for the Schedule Editor ---
    const EditorSkeleton = () => (
        <div className="space-y-4">
            {Array(3).fill().map((_, dayIndex) => (
                <div key={dayIndex} className="p-4 border rounded shadow-sm">
                    <Skeleton height={28} width="40%" style={{ marginBottom: '12px' }} />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 items-center">
                        <Skeleton height={38} />
                        <Skeleton height={38} />
                        <Skeleton height={38} />
                        <Skeleton height={38} />
                    </div>
                     <Skeleton height={30} width={100} className="mt-2" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                 <Link to="/schedule" className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
                <h1 className="text-2xl font-bold">Edit Schedule</h1>
                <button onClick={handleSave} className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">
                    Save
                </button>
            </div>
            
            {loading ? <EditorSkeleton /> : (
                <div className="space-y-4">
                    {daysOfWeek.map(day => (
                        <div key={day} className="p-4 border rounded shadow-sm">
                            <h2 className="text-xl font-semibold mb-2">{day}</h2>
                            {scheduleData.days[day] && scheduleData.days[day].map((classInfo, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 items-center">
                                    <input type="text" placeholder="Time (e.g., 9:00 AM)" value={classInfo.time} onChange={(e) => handleClassChange(day, index, 'time', e.target.value)} className="border p-2 rounded" />
                                    <input type="text" placeholder="Subject" value={classInfo.subject} onChange={(e) => handleClassChange(day, index, 'subject', e.target.value)} className="border p-2 rounded" />
                                    <input type="text" placeholder="Teacher" value={classInfo.teacher} onChange={(e) => handleClassChange(day, index, 'teacher', e.target.value)} className="border p-2 rounded" />
                                    <button onClick={() => removeClass(day, index)} className="bg-red-500 text-white p-2 rounded">Remove</button>
                                </div>
                            ))}
                            <button onClick={() => addClass(day)} className="mt-2 bg-blue-500 text-white py-1 px-3 rounded text-sm">+ Add Class</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScheduleEditor;