import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Skeleton from 'react-loading-skeleton';
import { 
    IoCreateOutline, 
    IoTimeOutline, 
    IoCalendarOutline, 
    IoStatsChartOutline, 
    IoSchoolOutline,
    IoTrendingUpOutline,
    IoBookOutline,
    IoCheckmarkCircleOutline,
    IoCloudOfflineOutline
} from "react-icons/io5"; 
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import ScheduleView from '../components/ScheduleView';
import TimeSlotsEditorModal from '../components/TimeSlotsEditorModal';

// --- Optimized Components ---
const MobileActionButton = React.memo(({ onClick, to, icon: IconComponent, children, variant = 'secondary', fullWidth = false, disabled = false }) => {
    const baseClasses = "flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-colors duration-150 text-sm";
    const variantClasses = {
        primary: disabled 
            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
        secondary: disabled 
            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100"
    };
    const widthClasses = fullWidth ? "w-full" : "";
    
    const className = `${baseClasses} ${variantClasses[variant]} ${widthClasses}`;
    
    const content = (
        <>
            <IconComponent size={18} />
            <span>{children}</span>
        </>
    );

    if (to && !disabled) {
        return (
            <Link to={to} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button 
            onClick={disabled ? undefined : onClick} 
            className={className}
            disabled={disabled}
        >
            {content}
        </button>
    );
});

const StatCard = React.memo(({ icon: IconComponent, title, value, subtitle, color = "blue" }) => {
    const colorClasses = {
        blue: "bg-blue-50 border-blue-100 text-blue-600",
        green: "bg-green-50 border-green-100 text-green-600",
        purple: "bg-purple-50 border-purple-100 text-purple-600",
        orange: "bg-orange-50 border-orange-100 text-orange-600"
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-150">
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <IconComponent size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-600 font-medium">{title}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
});

const MobileSkeletonLoader = React.memo(() => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
        <div className="space-y-4">
            {/* Header skeleton */}
            <div className="space-y-3">
                <Skeleton height={28} className="w-3/4" />
                <Skeleton height={20} className="w-1/2" />
            </div>
            
            {/* Button skeletons */}
            <div className="flex gap-3">
                <Skeleton height={48} className="flex-1" />
                <Skeleton height={48} className="flex-1" />
            </div>
            
            {/* Schedule skeleton */}
            <div className="space-y-3">
                <Skeleton height={24} className="w-1/3" />
                <Skeleton height={300} />
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 gap-3">
                {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} height={80} />
                ))}
            </div>
        </div>
    </div>
));

const QuickInsights = React.memo(({ stats, timeSlots }) => {
    const getInsightMessage = useMemo(() => {
        const { utilization, activeDays, totalSubjects } = stats;
        
        if (utilization > 80) return { text: "High schedule utilization", color: "text-orange-600", icon: IoTrendingUpOutline };
        if (activeDays === 5) return { text: "Full week scheduled", color: "text-green-600", icon: IoCheckmarkCircleOutline };
        if (totalSubjects > 6) return { text: "Diverse subject coverage", color: "text-purple-600", icon: IoBookOutline };
        return { text: "Schedule looks good", color: "text-blue-600", icon: IoSchoolOutline };
    }, [stats]);

    const insight = getInsightMessage;
    const IconComponent = insight.icon;

    return (
        <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-100 p-4">
            <div className="flex items-center space-x-3">
                <IconComponent size={20} className={insight.color} />
                <div>
                    <p className={`text-sm font-medium ${insight.color}`}>Quick Insight</p>
                    <p className="text-sm text-gray-600">{insight.text}</p>
                </div>
            </div>
        </div>
    );
});

const Schedule = ({ setHeaderTitle }) => {
    // --- Data Fetching ---
    const { 
        data: scheduleDoc, 
        loading: scheduleLoading,
        isOnline,
        fromCache: scheduleFromCache,
        hasPendingWrites: scheduleHasPending
    } = useFirestoreDocument(['schedules', 'first_year']);
    
    const { 
        data: timeSlotsDoc, 
        loading: timeSlotsLoading, 
        updateDocument: updateTimeSlots,
        fromCache: timeSlotsFromCache,
        hasPendingWrites: timeSlotsHasPending
    } = useFirestoreDocument(['time_slots', 'default_periods']);
    
    useEffect(() => {
        setHeaderTitle('Class Schedule');
    }, [setHeaderTitle]);

    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Derived State ---
    const scheduleDays = useMemo(() => scheduleDoc?.days || {}, [scheduleDoc]);
    const timeSlots = useMemo(() => timeSlotsDoc?.periods || [], [timeSlotsDoc]);
    
    const fromCache = scheduleFromCache || timeSlotsFromCache;
    const hasPendingWrites = scheduleHasPending || timeSlotsHasPending;

    const scheduleStats = useMemo(() => {
        const allClasses = Object.values(scheduleDays).flat();
        const activeDays = Object.keys(scheduleDays).filter(day => scheduleDays[day]?.length > 0);
        const totalSubjects = new Set(allClasses.map(c => c.subject)).size;
        const totalSlots = timeSlots.length * 5;
        const utilization = totalSlots > 0 ? Math.round((allClasses.length / totalSlots) * 100) : 0;
        return { 
            totalClasses: allClasses.length, 
            activeDays: activeDays.length, 
            totalSubjects, 
            utilization 
        };
    }, [scheduleDays, timeSlots]);

    // --- Handlers ---
    const handleSaveTimeSlots = useCallback((newTimeSlots) => {
        const sortedTimeSlots = [...newTimeSlots].sort();
        updateTimeSlots({ periods: sortedTimeSlots });
    }, [updateTimeSlots]);

    const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
    const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

    // --- Guard clause ---
    if (!scheduleDoc || !timeSlotsDoc) {
        return <MobileSkeletonLoader />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
            {/* Header Section */}
            <div className="mb-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Weekly Schedule Overview
                    </h2>
                    <p className="text-sm text-gray-600">
                        Manage your class timetable and periods
                    </p>
                </div>

                {/* Action Buttons */}
                {currentUser && (
                    <div className="flex gap-3 mb-4">
                        <MobileActionButton 
                            onClick={handleOpenModal}
                            icon={IoTimeOutline}
                            variant="secondary"
                            fullWidth
                            disabled={!isOnline} 
                        >
                            {isOnline ? 'Edit Periods' : (
                                <>
                                    <IoCloudOfflineOutline size={18} />
                                    <span>Offline</span>
                                </>
                            )}
                        </MobileActionButton>
                        <MobileActionButton 
                            to="/schedule-editor"
                            icon={IoCreateOutline}
                            variant="primary"
                            fullWidth
                            disabled={!isOnline}
                        >
                            {isOnline ? 'Edit Schedule' : (
                                <>
                                    <IoCloudOfflineOutline size={18} />
                                    <span>Offline</span>
                                </>
                            )}
                        </MobileActionButton>
                    </div>
                )}

                {/* Network Status */}
                <div className="mb-4">
                    <NetworkStatus
                        isOnline={isOnline}
                        fromCache={fromCache}
                        hasPendingWrites={hasPendingWrites}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Schedule View */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-2">
                            <IoCalendarOutline size={20} className="text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Class Timetable</h3>
                        </div>
                    </div>
                    <div className="p-4">
                        <ScheduleView scheduleDays={scheduleDays} />
                    </div>
                </div>

                {/* Quick Insights */}
                <QuickInsights stats={scheduleStats} timeSlots={timeSlots} />

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        icon={IoSchoolOutline}
                        title="Total Classes"
                        value={scheduleStats.totalClasses}
                        subtitle="This week"
                        color="blue"
                    />
                    <StatCard
                        icon={IoCalendarOutline}
                        title="Active Days"
                        value={scheduleStats.activeDays}
                        subtitle="Out of 5 days"
                        color="green"
                    />
                    <StatCard
                        icon={IoBookOutline}
                        title="Subjects"
                        value={scheduleStats.totalSubjects}
                        subtitle="Different courses"
                        color="purple"
                    />
                    <StatCard
                        icon={IoStatsChartOutline}
                        title="Utilization"
                        value={`${scheduleStats.utilization}%`}
                        subtitle="Schedule efficiency"
                        color="orange"
                    />
                </div>

                {/* Time Slots Info */}
                {timeSlots.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900">Time Periods</h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {timeSlots.length} periods
                            </span>
                        </div>
                        <div className="space-y-2">
                            {timeSlots.slice(0, 3).map((slot, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Period {index + 1}</span>
                                    <span className="font-medium text-gray-900">{slot}</span>
                                </div>
                            ))}
                            {timeSlots.length > 3 && (
                                <button 
                                    onClick={handleOpenModal}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    +{timeSlots.length - 3} more periods
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <TimeSlotsEditorModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                initialTimeSlots={timeSlots}
                onSave={handleSaveTimeSlots}
                isOnline={isOnline} 
            />
        </div>
    );
};

export default Schedule;