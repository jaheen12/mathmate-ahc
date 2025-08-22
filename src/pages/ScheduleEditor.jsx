import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import { IoArrowBack, IoSaveOutline } from "react-icons/io5";
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';

const ScheduleEditor = () => {
    const { data: scheduleDoc, loading: scheduleLoading, updateDocument: updateSchedule } = useFirestoreDocument(['schedules', 'first_year']);
    const { data: timeSlotsDoc, loading: timeSlotsLoading } = useFirestoreDocument(['time_slots', 'default_periods']);
    
    const [editorDays, setEditorDays] = useState({});
    const navigate = useNavigate();
    const daysOfWeek = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const loading = scheduleLoading || timeSlotsLoading;
    const timeSlots = timeSlotsDoc?.periods || [];

    useEffect(() => {
        if (scheduleDoc) {
            setEditorDays(scheduleDoc.days || {});
        }
    }, [scheduleDoc]);

    const handleClassChange = (day, index, field, value) => {
        const newEditorDays = { ...editorDays };
        if (!newEditorDays[day]) newEditorDays[day] = [];
        newEditorDays[day][index][field] = value;
        setEditorDays(newEditorDays);
    };

    const addClass = (day) => {
        const newEditorDays = { ...editorDays };
        if (!newEditorDays[day]) newEditorDays[day] = [];
        newEditorDays[day].push({ time: '', subject: '', teacher: '' });
        setEditorDays(newEditorDays);
    };

    const removeClass = (day, index) => {
        const newEditorDays = { ...editorDays };
        if (!newEditorDays[day]) return;
        newEditorDays[day].splice(index, 1);
        setEditorDays(newEditorDays);
    };

    const handleSave = async () => {
        await updateSchedule({ days: editorDays });
        navigate('/schedule');
    };

    // This is the full, correct skeleton component
    const EditorSkeleton = () => (
        <div className="space-y-4">
            {Array(3).fill().map((_, dayIndex) => (
                <div key={dayIndex} className="p-4 border rounded shadow-sm">
                    <Skeleton height={28} width="40%" className="mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 items-center">
                        <Skeleton height={38} /><Skeleton height={38} /><Skeleton height={38} /><Skeleton height={38} />
                    </div>
                    <Skeleton height={30} width={100} className="mt-2" />
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-2">
            <div className="flex justify-between items-center mb-4">
                <Link to="/schedule" className="text-gray-600 hover:text-gray-800"><IoArrowBack size={28} /></Link>
                <h1 className="text-2xl font-bold">Edit Schedule</h1>
                <button onClick={handleSave} className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors">
                    <IoSaveOutline className="mr-2" />
                    Save
                </button>
            </div>
            
            {loading ? <EditorSkeleton /> : (
                <div className="space-y-6">
                    {daysOfWeek.map(day => (
                        <div key={day} className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-3">{day}</h2>
                            {(editorDays[day] || []).map((classInfo, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 items-center">
                                    <select
                                        value={classInfo.time}
                                        onChange={(e) => handleClassChange(day, index, 'time', e.target.value)}
                                        className="border p-2 rounded w-full bg-white"
                                    >
                                        <option value="">-- Select a time --</option>
                                        {timeSlots.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                    <input type="text" placeholder="Subject" value={classInfo.subject} onChange={(e) => handleClassChange(day, index, 'subject', e.target.value)} className="border p-2 rounded w-full" />
                                    <input type="text" placeholder="Teacher" value={classInfo.teacher} onChange={(e) => handleClassChange(day, index, 'teacher', e.target.value)} className="border p-2 rounded w-full" />
                                    <button onClick={() => removeClass(day, index)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600 w-full md:w-auto">Remove</button>
                                </div>
                            ))}
                            <button onClick={() => addClass(day)} className="mt-2 bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600">+ Add Class</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScheduleEditor;