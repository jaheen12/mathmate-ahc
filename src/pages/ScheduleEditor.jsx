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
    IoCalendarOutline,
    IoCheckmarkCircleOutline,
    IoWarningOutline
} from "react-icons/io5";
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import { toast } from 'react-toastify'; // ✅ Fixed missing import

// Move ClassCard OUTSIDE the main component to prevent recreation on every render
const ClassCard = React.memo(({ day, classInfo, index, timeSlots, onClassChange, onRemoveClass }) => (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
        {/* Time Selection */}
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <IoTimeOutline className="w-4 h-4 text-blue-500" />
                Time Period
            </label>
            <select
                value={classInfo.time || ''}
                onChange={(e) => onClassChange(day, index, 'time', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all duration-200"
            >
                <option value="">Select time period...</option>
                {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                ))}
            </select>
        </div>

        {/* Subject Input */}
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <IoBookOutline className="w-4 h-4 text-purple-500" />
                Subject
            </label>
            <input 
                type="text" 
                placeholder="Enter subject name..." 
                value={classInfo.subject || ''} 
                onChange={(e) => onClassChange(day, index, 'subject', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-300 focus:border-transparent transition-all duration-200"
            />
        </div>

        {/* Teacher Input */}
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <IoPersonOutline className="w-4 h-4 text-green-500" />
                Instructor
            </label>
            <input 
                type="text" 
                placeholder="Enter teacher name..." 
                value={classInfo.teacher || ''} 
                onChange={(e) => onClassChange(day, index, 'teacher', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-300 focus:border-transparent transition-all duration-200"
            />
        </div>

        {/* Remove Button */}
        <button 
            onClick={() => onRemoveClass(day, index)}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
        >
            <IoTrashOutline className="w-4 h-4" />
            Remove Class
        </button>
    </div>
));

ClassCard.displayName = 'ClassCard';

const ScheduleEditor = () => {
    const { data: scheduleDoc, loading: scheduleLoading, updateDocument: updateSchedule } = useFirestoreDocument(['schedules', 'first_year']);
    const { data: timeSlotsDoc, loading: timeSlotsLoading } = useFirestoreDocument(['time_slots', 'default_periods']);
    
    const [editorDays, setEditorDays] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [expandedDays, setExpandedDays] = useState({});
    
    const navigate = useNavigate();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const loading = scheduleLoading || timeSlotsLoading;
    const timeSlots = timeSlotsDoc?.periods || [];

    useEffect(() => {
        if (scheduleDoc) {
            setEditorDays(scheduleDoc.days || {});
            const expanded = {};
            Object.keys(scheduleDoc.days || {}).forEach(day => {
                if (scheduleDoc.days[day]?.length > 0) {
                    expanded[day] = true;
                }
            });
            setExpandedDays(expanded);
        }
    }, [scheduleDoc]);

    const handleClassChange = useCallback((day, index, field, value) => {
        setEditorDays(prev => {
            const newEditorDays = { ...prev };
            if (!newEditorDays[day]) newEditorDays[day] = [];
            newEditorDays[day] = [...newEditorDays[day]];
            newEditorDays[day][index] = { ...newEditorDays[day][index], [field]: value };
            return newEditorDays;
        });
        setSaveStatus(null);
    }, []);

    const addClass = useCallback((day) => {
        setEditorDays(prev => {
            const newEditorDays = { ...prev };
            if (!newEditorDays[day]) newEditorDays[day] = [];
            newEditorDays[day] = [...newEditorDays[day], { time: '', subject: '', teacher: '' }];
            return newEditorDays;
        });
        setExpandedDays(prev => ({ ...prev, [day]: true }));
    }, []);

    const removeClass = useCallback((day, index) => {
        setEditorDays(prev => {
            const newEditorDays = { ...prev };
            if (!newEditorDays[day]) return prev;
            newEditorDays[day] = [...newEditorDays[day]];
            newEditorDays[day].splice(index, 1);
            if (newEditorDays[day].length === 0) {
                setExpandedDays(prevExpanded => ({ ...prevExpanded, [day]: false }));
            }
            return newEditorDays;
        });
    }, []);

    const toggleDay = useCallback((day) => {
        setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            await updateSchedule({ days: editorDays });
            setSaveStatus('success');
            setTimeout(() => {
                navigate('/schedule');
            }, 1500);
        } catch (error) {
            console.error("Error saving schedule: ", error);
            toast.error("Failed to save schedule."); // ✅ toast now works
            setIsSaving(false);
            setSaveStatus('error');
        }
    };

    const getDayColor = useCallback((index) => {
        const colors = [
            'from-red-400 to-red-500',
            'from-orange-400 to-orange-500', 
            'from-yellow-400 to-yellow-500',
            'from-green-400 to-green-500',
            'from-blue-400 to-blue-500',
            'from-indigo-400 to-indigo-500',
            'from-purple-400 to-purple-500'
        ];
        return colors[index % colors.length];
    }, []);

    const getClassCount = useCallback((day) => {
        return editorDays[day]?.length || 0;
    }, [editorDays]);

    const MobileEditorSkeleton = () => (
        <div className="space-y-4 animate-pulse">
            <div className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="h-6 bg-gray-200 rounded-lg w-32"></div>
                    <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
            {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                            <div className="h-5 bg-gray-200 rounded-lg w-24"></div>
                        </div>
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            <div className="h-12 bg-gray-200 rounded-xl"></div>
                            <div className="h-12 bg-gray-200 rounded-xl"></div>
                            <div className="h-12 bg-gray-200 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
            {/* Header */}
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
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center gap-2 ${
                            isSaving 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg'
                        }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <IoSaveOutline className="w-4 h-4" />
                                <span>Save</span>
                            </>
                        )}
                    </button>
                </div>
                {saveStatus && (
                    <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 ${
                        saveStatus === 'success' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {saveStatus === 'success' ? (
                            <>
                                <IoCheckmarkCircleOutline className="w-5 h-5" />
                                <span className="text-sm font-medium">Schedule saved successfully! Redirecting...</span>
                            </>
                        ) : (
                            <>
                                <IoWarningOutline className="w-5 h-5" />
                                <span className="text-sm font-medium">Failed to save schedule. Please try again.</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {loading ? <MobileEditorSkeleton /> : (
                <div className="space-y-4 pb-6">
                    {daysOfWeek.map((day, dayIndex) => (
                        <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <button
                                onClick={() => toggleDay(day)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getDayColor(dayIndex)}`}></div>
                                    <div className="text-left">
                                        <h2 className="text-lg font-semibold text-gray-900">{day}</h2>
                                        <p className="text-sm text-gray-600">
                                            {getClassCount(day)} {getClassCount(day) === 1 ? 'class' : 'classes'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getClassCount(day) > 0 && (
                                        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                            {getClassCount(day)}
                                        </div>
                                    )}
                                    <IoCalendarOutline 
                                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedDays[day] ? 'rotate-180' : ''}`} 
                                    />
                                </div>
                            </button>
                            {expandedDays[day] && (
                                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                                    {(editorDays[day] || []).map((classInfo, index) => (
                                        <ClassCard 
                                            key={`${day}-${index}`}
                                            day={day}
                                            classInfo={classInfo}
                                            index={index}
                                            timeSlots={timeSlots}
                                            onClassChange={handleClassChange}
                                            onRemoveClass={removeClass}
                                        />
                                    ))}
                                    <button 
                                        onClick={() => addClass(day)}
                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <IoAddOutline className="w-5 h-5" />
                                        Add New Class
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-blue-900 text-sm mb-1">Schedule Overview</h3>
                                <p className="text-blue-700 text-xs">
                                    Total classes: {Object.values(editorDays).flat().length} • 
                                    Active days: {Object.keys(editorDays).filter(day => editorDays[day]?.length > 0).length}
                                </p>
                            </div>
                            <div className="text-2xl">📚</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleEditor;