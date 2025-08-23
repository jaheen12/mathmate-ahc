import React, { useState, useEffect } from 'react';
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

const ScheduleEditor = () => {
    const { data: scheduleDoc, loading: scheduleLoading, updateDocument: updateSchedule } = useFirestoreDocument(['schedules', 'first_year']);
    const { data: timeSlotsDoc, loading: timeSlotsLoading } = useFirestoreDocument(['time_slots', 'default_periods']);
    
    const [editorDays, setEditorDays] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [expandedDays, setExpandedDays] = useState({});
    
    const navigate = useNavigate();
    const daysOfWeek = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const loading = scheduleLoading || timeSlotsLoading;
    const timeSlots = timeSlotsDoc?.periods || [];

    useEffect(() => {
        if (scheduleDoc) {
            setEditorDays(scheduleDoc.days || {});
            // Auto-expand days with classes
            const expanded = {};
            Object.keys(scheduleDoc.days || {}).forEach(day => {
                if (scheduleDoc.days[day]?.length > 0) {
                    expanded[day] = true;
                }
            });
            setExpandedDays(expanded);
        }
    }, [scheduleDoc]);

    const handleClassChange = (day, index, field, value) => {
        const newEditorDays = { ...editorDays };
        if (!newEditorDays[day]) newEditorDays[day] = [];
        newEditorDays[day][index][field] = value;
        setEditorDays(newEditorDays);
        setSaveStatus(null); // Clear save status when editing
    };

    const addClass = (day) => {
        const newEditorDays = { ...editorDays };
        if (!newEditorDays[day]) newEditorDays[day] = [];
        newEditorDays[day].push({ time: '', subject: '', teacher: '' });
        setEditorDays(newEditorDays);
        setExpandedDays(prev => ({ ...prev, [day]: true }));
    };

    const removeClass = (day, index) => {
        const newEditorDays = { ...editorDays };
        if (!newEditorDays[day]) return;
        newEditorDays[day].splice(index, 1);
        if (newEditorDays[day].length === 0) {
            setExpandedDays(prev => ({ ...prev, [day]: false }));
        }
        setEditorDays(newEditorDays);
    };

    const toggleDay = (day) => {
        setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
    };

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
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const getDayColor = (index) => {
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
    };

    const getClassCount = (day) => {
        return editorDays[day]?.length || 0;
    };

    const MobileEditorSkeleton = () => (
        <div className="space-y-4 animate-pulse">
            {/* Header skeleton */}
            <div className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="h-6 bg-gray-200 rounded-lg w-32"></div>
                    <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
            
            {/* Day cards skeleton */}
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

    const ClassCard = ({ day, classInfo, index }) => (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            {/* Time Selection */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <IoTimeOutline className="w-4 h-4 text-blue-500" />
                    Time Period
                </label>
                <select
                    value={classInfo.time}
                    onChange={(e) => handleClassChange(day, index, 'time', e.target.value)}
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
                    value={classInfo.subject} 
                    onChange={(e) => handleClassChange(day, index, 'subject', e.target.value)}
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
                    value={classInfo.teacher} 
                    onChange={(e) => handleClassChange(day, index, 'teacher', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-300 focus:border-transparent transition-all duration-200"
                />
            </div>

            {/* Remove Button */}
            <button 
                onClick={() => removeClass(day, index)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
                <IoTrashOutline className="w-4 h-4" />
                Remove Class
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
            {/* Mobile Header */}
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

                {/* Save Status */}
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
                            {/* Day Header */}
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
                                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                            expandedDays[day] ? 'rotate-180' : ''
                                        }`} 
                                    />
                                </div>
                            </button>

                            {/* Day Content */}
                            {expandedDays[day] && (
                                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                                    {(editorDays[day] || []).map((classInfo, index) => (
                                        <ClassCard 
                                            key={index}
                                            day={day}
                                            classInfo={classInfo}
                                            index={index}
                                        />
                                    ))}
                                    
                                    {/* Add Class Button */}
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

                    {/* Quick Stats */}
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