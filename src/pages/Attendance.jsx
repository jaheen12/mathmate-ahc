import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format, startOfDay, parseISO } from 'date-fns';
import Skeleton from 'react-loading-skeleton';
import { 
    IoCheckmarkCircle, 
    IoCloseCircle, 
    IoSaveOutline, 
    IoCalendarOutline,
    IoStatsChartOutline,
    IoDownloadOutline,
    IoTrashOutline,
    IoWarningOutline
} from 'react-icons/io5';
import useLocalStorage from '../hooks/useLocalStorage';

const AttendanceCard = React.memo(({ 
    subject, 
    stats, 
    draftStatus, 
    onStatusChange, 
    isHistoricalDate 
}) => {
    const getPercentageColor = (percentage) => {
        if (percentage >= 75) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getPercentageBackground = (percentage) => {
        if (percentage >= 75) return 'from-green-50 to-green-100';
        if (percentage >= 60) return 'from-yellow-50 to-yellow-100';
        return 'from-red-50 to-red-100';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${getPercentageBackground(stats.percentage)} p-4 border-b border-gray-100`}>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">{subject}</h3>
                    <div className="text-right">
                        <p className={`text-3xl font-bold ${getPercentageColor(stats.percentage)}`}>
                            {stats.percentage}%
                        </p>
                        <p className="text-xs text-gray-600">
                            {stats.present} / {stats.total} classes
                        </p>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3 bg-white/50 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${
                            stats.percentage >= 75 ? 'bg-green-500' :
                            stats.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4">
                {isHistoricalDate && (
                    <div className="mb-3 p-2 bg-gray-100 rounded-lg flex items-center gap-2">
                        <IoWarningOutline className="w-4 h-4 text-gray-600" />
                        <span className="text-xs text-gray-600">Editing past attendance</span>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onStatusChange(subject, 'present')}
                        className={`p-4 rounded-xl flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 ${
                            draftStatus === 'present' 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl' 
                                : 'bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 border-2 border-transparent hover:border-green-200'
                        }`}
                    >
                        <IoCheckmarkCircle className="mr-2 w-5 h-5" />
                        Present
                    </button>
                    <button
                        onClick={() => onStatusChange(subject, 'absent')}
                        className={`p-4 rounded-xl flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 ${
                            draftStatus === 'absent' 
                                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl' 
                                : 'bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 border-2 border-transparent hover:border-red-200'
                        }`}
                    >
                        <IoCloseCircle className="mr-2 w-5 h-5" />
                        Absent
                    </button>
                </div>
            </div>
        </div>
    );
});

AttendanceCard.displayName = 'AttendanceCard';

const AttendanceSkeleton = React.memo(() => (
    <div className="p-4 space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded w-40"></div>
            </div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm animate-pulse">
                    <div className="flex justify-between items-center mb-4">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="text-right">
                            <div className="h-8 bg-gray-200 rounded w-12 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-12 bg-gray-200 rounded-xl"></div>
                        <div className="h-12 bg-gray-200 rounded-xl"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
));

AttendanceSkeleton.displayName = 'AttendanceSkeleton';

const Attendance = ({ setHeaderTitle }) => {
    const { value: allRecords, setValue: setAllRecords } = useLocalStorage('attendanceRecords', []);
    const [selectedDate, setSelectedDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
    const [draftForDate, setDraftForDate] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        setHeaderTitle('Attendance');
    }, [setHeaderTitle]);

    const mainSubjects = useMemo(() => ["Major", "NM-PHY", "NM-STAT"], []);
    
    // Check if selected date is in the past
    const isHistoricalDate = useMemo(() => {
        const today = startOfDay(new Date());
        const selected = startOfDay(parseISO(selectedDate));
        return selected < today;
    }, [selectedDate]);

    // Load records and set initial draft
    useEffect(() => {
        setLoading(true);
        const recordsForSelectedDate = {};
        allRecords.forEach(rec => {
            if (rec.date === selectedDate) {
                recordsForSelectedDate[rec.subject] = { status: rec.status };
            }
        });
        setDraftForDate(recordsForSelectedDate);
        setHasUnsavedChanges(false);
        setLoading(false);
    }, [allRecords, selectedDate]);

    // Calculate overall stats from all historical records
    const attendanceStats = useMemo(() => {
        const stats = {};
        mainSubjects.forEach(subject => {
            const subjectRecords = allRecords.filter(r => r.subject === subject);
            const total = subjectRecords.length;
            const present = subjectRecords.filter(r => r.status === 'present').length;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
            stats[subject] = { percentage, present, total };
        });
        return stats;
    }, [allRecords, mainSubjects]);

    // Overall statistics across all subjects
    const overallStats = useMemo(() => {
        const totalClasses = allRecords.length;
        const totalPresent = allRecords.filter(r => r.status === 'present').length;
        const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
        return { totalClasses, totalPresent, overallPercentage };
    }, [allRecords]);

    const handleStatusChange = useCallback((subject, status) => {
        setDraftForDate(prevDraft => {
            const currentStatus = prevDraft[subject]?.status;
            const newDraft = { ...prevDraft };

            if (currentStatus === status) {
                delete newDraft[subject];
            } else {
                newDraft[subject] = { status };
            }
            return newDraft;
        });
        setHasUnsavedChanges(true);
    }, []);
    
    const handleSaveChanges = useCallback(() => {
        if (window.confirm(`Save attendance changes for ${selectedDate}?`)) {
            try {
                // Filter out old records for the selected date
                const otherDayRecords = allRecords.filter(rec => rec.date !== selectedDate);
                
                // Create new records for the selected date from the draft
                const newRecordsForDate = Object.entries(draftForDate).map(([subject, { status }]) => ({
                    date: selectedDate,
                    subject,
                    status,
                    timestamp: new Date().toISOString() // Add timestamp for data tracking
                }));

                // Combine and set the new state
                setAllRecords([...otherDayRecords, ...newRecordsForDate]);
                
                toast.success(`Attendance for ${selectedDate} saved locally!`);
                setHasUnsavedChanges(false);
            } catch (error) {
                console.error("Error saving attendance to local storage: ", error);
                toast.error("Failed to save changes.");
            }
        }
    }, [selectedDate, draftForDate, allRecords, setAllRecords]);

    // Export attendance data as JSON
    const handleExportData = useCallback(() => {
        try {
            const dataStr = JSON.stringify(allRecords, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `attendance-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Attendance data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export data.');
        }
    }, [allRecords]);

    // Clear all attendance data
    const handleClearAllData = useCallback(() => {
        if (window.confirm('Are you sure you want to delete ALL attendance data? This cannot be undone.')) {
            setAllRecords([]);
            setDraftForDate({});
            setHasUnsavedChanges(false);
            toast.success('All attendance data cleared.');
        }
    }, [setAllRecords]);

    if (loading) {
        return <AttendanceSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <IoCalendarOutline className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Attendance Tracker</h1>
                            <label htmlFor="attendance-date" className="text-sm text-gray-600">
                                Select date to track attendance
                            </label>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <input
                            id="attendance-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="flex-1 md:flex-initial border-2 border-gray-200 p-2 rounded-xl shadow-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-20 transition-all"
                        />
                        
                        {hasUnsavedChanges && (
                            <button 
                                onClick={handleSaveChanges} 
                                className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 animate-pulse"
                            >
                                <IoSaveOutline className="mr-2 w-4 h-4" />
                                <span className="hidden sm:inline">Save Changes</span>
                                <span className="sm:hidden">Save</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Overall Stats Card */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <IoStatsChartOutline className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900">Overall Statistics</h3>
                            <p className="text-xs text-blue-700">
                                {overallStats.totalPresent} / {overallStats.totalClasses} total classes
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">{overallStats.overallPercentage}%</p>
                        <p className="text-xs text-blue-600">Overall Attendance</p>
                    </div>
                </div>
            </div>

            {/* Subject Cards */}
            <div className="space-y-4 mb-6">
                {mainSubjects.map(subject => {
                    const stats = attendanceStats[subject] || { percentage: 0, present: 0, total: 0 };
                    const draftStatus = draftForDate[subject]?.status;
                    return (
                        <AttendanceCard
                            key={subject}
                            subject={subject}
                            stats={stats}
                            draftStatus={draftStatus}
                            onStatusChange={handleStatusChange}
                            isHistoricalDate={isHistoricalDate}
                        />
                    );
                })}
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <button 
                    onClick={handleExportData}
                    disabled={allRecords.length === 0}
                    className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <IoDownloadOutline className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700">Export Data</span>
                </button>
                
                <button 
                    onClick={handleClearAllData}
                    disabled={allRecords.length === 0}
                    className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-red-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <IoTrashOutline className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-700">Clear All Data</span>
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IoWarningOutline className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 text-sm mb-1">Local Storage Notice</h4>
                        <p className="text-blue-700 text-xs leading-relaxed">
                            Your attendance data is stored locally on this device. Export your data regularly to avoid loss. 
                            Data will not sync across different devices or browsers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;