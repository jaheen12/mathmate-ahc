import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { 
    IoArrowBack, 
    IoSaveOutline, 
    IoAddOutline, 
    IoTrashOutline, 
    IoTimeOutline,
    IoPersonOutline,
    IoBookOutline,
    IoCalendarOutline,
    IoChevronDown,
    IoCheckmarkCircleOutline,
    IoAlertCircleOutline,
    IoBookmarksOutline
} from "react-icons/io5";
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import { doc, updateDoc } from 'firebase/firestore'; // Import updateDoc for saving
import { db } from '../firebaseConfig'; // Import your db instance

// --- Helper Component: ClassCard ---
const ClassCard = React.memo(({ 
    day, 
    classInfo, 
    index, 
    timeSlots, 
    onClassChange, 
    onRemoveClass, 
    hasTimeConflict,
    isEmpty 
}) => {
    const [isExpanded, setIsExpanded] = useState(!isEmpty);

    const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

    const handleInputChange = useCallback((field, value) => {
        onClassChange(day, index, { ...classInfo, [field]: value });
    }, [day, index, classInfo, onClassChange]);

    const isComplete = classInfo.subject && classInfo.teacher && classInfo.timeSlot && classInfo.chapter;

    return (
        <div className={`bg-white border rounded-xl shadow-sm transition-all duration-200 mb-3 ${
            hasTimeConflict ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'
        }`}>
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <button
                    onClick={toggleExpanded}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                    <IoChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                    <span>Class {index + 1}</span>
                    {classInfo.subject && <span className="text-xs text-gray-500">• {classInfo.subject}</span>}
                </button>
                <div className="flex items-center gap-2">
                    {hasTimeConflict && <IoAlertCircleOutline className="w-4 h-4 text-red-500" title="Time conflict" />}
                    {isComplete && <IoCheckmarkCircleOutline className="w-4 h-4 text-green-500" title="Complete" />}
                    <button
                        onClick={() => onRemoveClass(day, index)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors"
                        title="Remove class"
                    >
                        <IoTrashOutline className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="p-3 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg"><IoBookOutline className="w-4 h-4 text-blue-600" /></div>
                        <input
                            type="text"
                            value={classInfo.subject || ""}
                            onChange={(e) => handleInputChange('subject', e.target.value)}
                            placeholder="Enter subject name"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg"><IoBookmarksOutline className="w-4 h-4 text-orange-600" /></div>
                        <input
                            type="text"
                            value={classInfo.chapter || ""}
                            onChange={(e) => handleInputChange('chapter', e.target.value)}
                            placeholder="Enter chapter name/topic"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg"><IoPersonOutline className="w-4 h-4 text-purple-600" /></div>
                        <input
                            type="text"
                            value={classInfo.teacher || ""}
                            onChange={(e) => handleInputChange('teacher', e.target.value)}
                            placeholder="Enter teacher name"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg"><IoTimeOutline className="w-4 h-4 text-green-600" /></div>
                        <select
                            value={classInfo.timeSlot || ""}
                            onChange={(e) => handleInputChange('timeSlot', e.target.value)}
                            className={`flex-1 border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${
                                hasTimeConflict 
                                    ? 'border-red-200 focus:ring-red-500 bg-red-50' 
                                    : 'border-gray-200 focus:ring-green-500'
                            }`}
                        >
                            <option value="">Select time period</option>
                            {timeSlots.map((slot, i) => (
                                <option key={i} value={slot}>{slot}</option>
                            ))}
                        </select>
                    </div>

                    {hasTimeConflict && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <IoAlertCircleOutline className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-xs text-red-700">Time conflict with another class</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
ClassCard.displayName = 'ClassCard';

// --- Main ScheduleEditor Component ---
const ScheduleEditor = () => {
    const { 
        data: scheduleDoc, 
        loading: scheduleLoading, 
        isOnline,
        fromCache: scheduleFromCache,
        hasPendingWrites: scheduleHasPending
    } = useFirestoreDocument(['schedules', 'first_year'], {
        cacheFirst: true // Enable instant loading from cache
    });
    
    const { 
        data: timeSlotsDoc, 
        loading: timeSlotsLoading,
        fromCache: timeSlotsFromCache,
        hasPendingWrites: timeSlotsHasPending
    } = useFirestoreDocument(['time_slots', 'default_periods'], {
        cacheFirst: true // Enable instant loading from cache
    });
    
    const [editorDays, setEditorDays] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [expandedDays, setExpandedDays] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    const navigate = useNavigate();
    const daysOfWeek = useMemo(() => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], []);
    
    const timeSlots = timeSlotsDoc?.periods || [];
    const fromCache = scheduleFromCache || timeSlotsFromCache;
    const hasPendingWrites = scheduleHasPending || timeSlotsHasPending;
    const isLoading = scheduleLoading || timeSlotsLoading;

    const dayColors = useMemo(() => ({
        Sunday: { bg: "from-orange-100 to-orange-50", border: "border-orange-200", text: "text-orange-700" },
        Monday: { bg: "from-blue-100 to-blue-50", border: "border-blue-200", text: "text-blue-700" },
        Tuesday: { bg: "from-green-100 to-green-50", border: "border-green-200", text: "text-green-700" },
        Wednesday: { bg: "from-yellow-100 to-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
        Thursday: { bg: "from-purple-100 to-purple-50", border: "border-purple-200", text: "text-purple-700" }
    }), []);

    useEffect(() => {
        if (scheduleDoc) {
            setEditorDays(scheduleDoc.days || {});
            const expanded = {};
            daysOfWeek.forEach(day => {
                expanded[day] = (scheduleDoc.days?.[day]?.length || 0) > 0;
            });
            setExpandedDays(expanded);
        }
    }, [scheduleDoc, daysOfWeek]);

    const getTimeConflicts = useCallback((day) => {
        const dayClasses = editorDays[day] || [];
        const conflicts = new Set();
        dayClasses.forEach((classInfo, index) => {
            if (classInfo.timeSlot) {
                const duplicates = dayClasses.filter((c, i) => i !== index && c.timeSlot === classInfo.timeSlot);
                if (duplicates.length > 0) conflicts.add(index);
            }
        });
        return conflicts;
    }, [editorDays]);

    const stats = useMemo(() => {
        const allClasses = Object.values(editorDays).flat();
        const filledClasses = allClasses.filter(c => c.subject && c.teacher && c.timeSlot && c.chapter).length;
        const activeDays = Object.keys(editorDays).filter(day => (editorDays[day] || []).length > 0).length;
        return { totalClasses: allClasses.length, filledClasses, activeDays };
    }, [editorDays]);

    const handleClassChange = useCallback((day, index, updatedClass) => {
        setEditorDays(prev => ({...prev, [day]: (prev[day] || []).map((c, i) => i === index ? updatedClass : c)}));
    }, []);

    const addClass = useCallback((day) => {
        setEditorDays(prev => {
            const dayClasses = prev[day] || [];
            return {...prev, [day]: [...dayClasses, { subject: "", teacher: "", timeSlot: "", chapter: "" }]};
        });
        setExpandedDays(prev => ({ ...prev, [day]: true }));
    }, []);

    const removeClass = useCallback((day, index) => {
        setEditorDays(prev => ({...prev, [day]: (prev[day] || []).filter((_, i) => i !== index)}));
    }, []);

    const toggleDay = useCallback((day) => setExpandedDays(prev => ({ ...prev, [day]: !prev[day] })), []);

    const getClassCount = useCallback((day) => editorDays[day]?.length || 0, [editorDays]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        const docRef = doc(db, 'schedules', 'first_year');
        try {
            await updateDoc(docRef, { days: editorDays });
            setSaveSuccess(true);
            setTimeout(() => navigate('/schedule'), 1200);
        } catch (error) {
            console.error("Failed to save schedule:", error);
        } finally {
            setIsSaving(false);
        }
    }, [editorDays, navigate]);

    const MobileEditorSkeleton = () => (
        <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
                <Skeleton height={20} width="40%" className="mb-2" />
                <Skeleton height={16} width="60%" />
            </div>
            {daysOfWeek.map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center justify-between mb-3"><Skeleton width={100} height={20} /><Skeleton width={60} height={16} /></div>
                    <div className="space-y-2"><Skeleton height={80} /><Skeleton height={80} /></div>
                </div>
            ))}
        </div>
    );

    if (isLoading && !scheduleDoc && !timeSlotsDoc) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
                <MobileEditorSkeleton />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 sticky top-2 z-20">
                <div className="flex items-center justify-between">
                    <Link to="/schedule" className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <IoArrowBack className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div className="text-center"><h1 className="text-xl font-bold text-gray-900">Schedule Editor</h1><p className="text-sm text-gray-600">Manage your weekly timetable</p></div>
                    <button onClick={handleSave} disabled={isSaving || !isOnline} className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center gap-2 min-w-[90px] justify-center ${
                        saveSuccess ? 'bg-green-100 text-green-700 border border-green-200' :
                        isSaving || !isOnline ? 'bg-gray-100 text-gray-500 cursor-not-allowed' :
                        'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
                    >
                        {saveSuccess ? <><IoCheckmarkCircleOutline/>Saved!</> : isSaving ? <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>Saving</> : !isOnline ? 'Offline' : <><IoSaveOutline/>Save</>}
                    </button>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        <span><span className="font-medium text-gray-900">{stats.totalClasses}</span> classes</span>
                        <span><span className="font-medium text-gray-900">{stats.filledClasses}</span> complete</span>
                        <span><span className="font-medium text-gray-900">{stats.activeDays}</span> active days</span>
                    </div>
                    <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} compact />
                </div>
            </div>

            <div className="space-y-4 pb-6">
                {daysOfWeek.map((day) => {
                    const dayColor = dayColors[day];
                    const classCount = getClassCount(day);
                    const conflicts = getTimeConflicts(day);
                    return (
                        <div key={day} className="rounded-2xl shadow-sm border border-gray-200 overflow-hidden bg-white">
                            <button onClick={() => toggleDay(day)} className={`w-full flex items-center justify-between p-4 bg-gradient-to-r ${dayColor.bg} hover:opacity-90 transition-opacity ${dayColor.border} border-b`}>
                                <div className="flex items-center gap-3">
                                    <IoCalendarOutline className={`w-5 h-5 ${dayColor.text}`} />
                                    <span className={`font-semibold ${dayColor.text}`}>{day}</span>
                                    {conflicts.size > 0 && <IoAlertCircleOutline className="w-4 h-4 text-red-500" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">{classCount} {classCount === 1 ? 'class' : 'classes'}</span>
                                    <IoChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${expandedDays[day] ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {expandedDays[day] && (
                                <div className="p-4 bg-gray-50/50">
                                    {(editorDays[day] || []).map((classInfo, index) => (
                                        <ClassCard key={index} day={day} index={index} classInfo={classInfo} timeSlots={timeSlots} onClassChange={handleClassChange} onRemoveClass={removeClass} hasTimeConflict={conflicts.has(index)} isEmpty={!classInfo.subject && !classInfo.teacher && !classInfo.timeSlot && !classInfo.chapter} />
                                    ))}
                                    <button onClick={() => addClass(day)} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all">
                                        <IoAddOutline className="w-5 h-5" /><span className="font-medium">Add New Class</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ScheduleEditor;