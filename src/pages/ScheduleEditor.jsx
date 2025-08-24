import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import { 
    IoArrowBack, 
    IoSaveOutline, 
    IoAddOutline, 
    IoTrashOutline, 
    IoTimeOutline,
    IoPersonOutline,
    IoBookOutline,
    IoCalendarOutline
} from "react-icons/io5";
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';

// ---------------- CLASS CARD ----------------
const ClassCard = React.memo(({ day, classInfo, index, timeSlots, onClassChange, onRemoveClass }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-3 mb-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
            <IoBookOutline className="text-blue-500 w-4 h-4" />
            <input
                type="text"
                value={classInfo.subject || ""}
                onChange={(e) =>
                    onClassChange(day, index, { ...classInfo, subject: e.target.value })
                }
                placeholder="Subject"
                className="flex-1 border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
            />
        </div>
        <div className="flex items-center gap-2 mb-2">
            <IoPersonOutline className="text-purple-500 w-4 h-4" />
            <input
                type="text"
                value={classInfo.teacher || ""}
                onChange={(e) =>
                    onClassChange(day, index, { ...classInfo, teacher: e.target.value })
                }
                placeholder="Teacher"
                className="flex-1 border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-purple-400"
            />
        </div>
        <div className="flex items-center gap-2">
            <IoTimeOutline className="text-green-500 w-4 h-4" />
            <select
                value={classInfo.timeSlot || ""}
                onChange={(e) =>
                    onClassChange(day, index, { ...classInfo, timeSlot: e.target.value })
                }
                className="flex-1 border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-green-400"
            >
                <option value="">Select Time</option>
                {timeSlots.map((slot, i) => (
                    <option key={i} value={slot}>{slot}</option>
                ))}
            </select>
            <button
                onClick={() => onRemoveClass(day, index)}
                className="ml-2 text-red-500 hover:text-red-600 p-1"
            >
                <IoTrashOutline className="w-4 h-4" />
            </button>
        </div>
    </div>
));
ClassCard.displayName = 'ClassCard';

// ---------------- SCHEDULE EDITOR ----------------
const ScheduleEditor = () => {
    const { 
        data: scheduleDoc, 
        loading: scheduleLoading, 
        updateDocument: updateSchedule,
        isOnline,
        fromCache: scheduleFromCache,
        hasPendingWrites: scheduleHasPending
    } = useFirestoreDocument(['schedules', 'first_year']);
    
    const { 
        data: timeSlotsDoc, 
        loading: timeSlotsLoading,
        fromCache: timeSlotsFromCache,
        hasPendingWrites: timeSlotsHasPending
    } = useFirestoreDocument(['time_slots', 'default_periods']);
    
    const [editorDays, setEditorDays] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [expandedDays, setExpandedDays] = useState({});
    
    const navigate = useNavigate();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    
    const loading = (scheduleLoading && !scheduleDoc) || (timeSlotsLoading && !timeSlotsDoc);
    const fromCache = scheduleFromCache || timeSlotsFromCache;
    const hasPendingWrites = scheduleHasPending || timeSlotsHasPending;
    const timeSlots = timeSlotsDoc?.periods || [];

    useEffect(() => {
        if (scheduleDoc) {
            setEditorDays(scheduleDoc.days || {});
            const expanded = {};
            Object.keys(scheduleDoc.days || {}).forEach(day => {
                if (scheduleDoc.days[day]?.length > 0) expanded[day] = true;
            });
            setExpandedDays(expanded);
        }
    }, [scheduleDoc]);

    const handleClassChange = useCallback((day, index, updatedClass) => {
        setEditorDays(prev => {
            const updated = { ...prev };
            updated[day][index] = updatedClass;
            return updated;
        });
    }, []);

    const addClass = useCallback((day) => {
        setEditorDays(prev => {
            const updated = { ...prev };
            if (!updated[day]) updated[day] = [];
            updated[day].push({ subject: "", teacher: "", timeSlot: "" });
            return updated;
        });
        setExpandedDays(prev => ({ ...prev, [day]: true }));
    }, []);

    const removeClass = useCallback((day, index) => {
        setEditorDays(prev => {
            const updated = { ...prev };
            updated[day].splice(index, 1);
            return updated;
        });
    }, []);

    const toggleDay = useCallback((day) => {
        setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
    }, []);

    const getDayColor = useCallback((day) => {
        const colors = {
            Sunday: "from-pink-100 to-pink-50",
            Monday: "from-blue-100 to-blue-50",
            Tuesday: "from-green-100 to-green-50",
            Wednesday: "from-yellow-100 to-yellow-50",
            Thursday: "from-purple-100 to-purple-50"
        };
        return colors[day] || "from-gray-100 to-gray-50";
    }, []);

    const getClassCount = useCallback((day) => editorDays[day]?.length || 0, [editorDays]);

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateSchedule({ days: editorDays });
        if (result.success) {
            setTimeout(() => navigate('/schedule'), 800);
        } else {
            setIsSaving(false);
        }
    };

    const MobileEditorSkeleton = () => (
        <div className="space-y-4">
            {daysOfWeek.map((day, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <Skeleton width={100} height={20} />
                    <div className="mt-2 space-y-2">
                        <Skeleton height={30} />
                        <Skeleton height={30} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex items-center justify-between">
                    <Link 
                        to="/schedule" 
                        className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-95"
                    >
                        <IoArrowBack className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-gray-900">Edit Schedule</h1>
                        <p className="text-sm text-gray-600">Manage your class timetable</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !isOnline}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center gap-2 ${
                            isSaving || !isOnline 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg'
                        }`}
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : !isOnline ? (
                            <span>Offline</span>
                        ) : (
                            <>
                                <IoSaveOutline className="w-4 h-4" />
                                <span>Save</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="mt-3">
                    <NetworkStatus 
                        isOnline={isOnline}
                        fromCache={fromCache}
                        hasPendingWrites={hasPendingWrites}
                    />
                </div>
            </div>

            {loading ? <MobileEditorSkeleton /> : (
                <div className="space-y-4 pb-6">
                    {daysOfWeek.map((day, idx) => (
                        <div key={idx} className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <button
                                onClick={() => toggleDay(day)}
                                className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${getDayColor(day)} hover:opacity-90 transition`}
                            >
                                <div className="flex items-center gap-2">
                                    <IoCalendarOutline className="text-gray-700" />
                                    <span className="font-semibold">{day}</span>
                                </div>
                                <span className="text-sm text-gray-600">{getClassCount(day)} classes</span>
                            </button>
                            {expandedDays[day] && (
                                <div className="p-4">
                                    {(editorDays[day] || []).map((classInfo, index) => (
                                        <ClassCard
                                            key={index}
                                            day={day}
                                            index={index}
                                            classInfo={classInfo}
                                            timeSlots={timeSlots}
                                            onClassChange={handleClassChange}
                                            onRemoveClass={removeClass}
                                        />
                                    ))}
                                    <button
                                        onClick={() => addClass(day)}
                                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-2"
                                    >
                                        <IoAddOutline className="w-5 h-5" />
                                        <span>Add Class</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScheduleEditor;