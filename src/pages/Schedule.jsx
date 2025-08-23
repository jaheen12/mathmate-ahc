import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Skeleton from 'react-loading-skeleton';
import { IoCreateOutline, IoTimeOutline, IoCalendarOutline, IoStatsChartOutline } from "react-icons/io5"; 
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import ScheduleView from '../components/ScheduleView';
import TimeSlotsEditorModal from '../components/TimeSlotsEditorModal';

// Move MobileActionButton outside to prevent re-creation
const MobileActionButton = React.memo(({ onClick, to, icon: IconComponent, children, variant = 'secondary', fullWidth = false }) => {
    const baseClasses = `group relative inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95 ${fullWidth ? 'w-full' : ''}`;
    
    const variants = {
        primary: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl focus:ring-blue-300 px-4 py-3",
        secondary: "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 focus:ring-blue-300 px-4 py-3",
        accent: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl focus:ring-purple-300 px-4 py-3",
        compact: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300 px-3 py-2 text-sm"
    };

    const buttonClasses = `${baseClasses} ${variants[variant]}`;

    const content = (
        <>
            <IconComponent className={`${variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} ${children ? 'mr-2' : ''} transition-transform group-hover:scale-110`} />
            {children && <span className="relative font-medium">{children}</span>}
        </>
    );

    if (to) {
        return (
            <Link to={to} className={buttonClasses}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={buttonClasses}>
            {content}
        </button>
    );
});

MobileActionButton.displayName = 'MobileActionButton';

// Move skeleton outside as well
const MobileSkeletonLoader = React.memo(() => (
    <div className="space-y-4 animate-pulse">
        {/* Mobile Header Skeleton */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded-lg w-3/4"></div>
                </div>
            </div>
        </div>
        
        {/* Mobile Action Buttons Skeleton */}
        <div className="flex gap-3">
            <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
        </div>
        
        {/* Mobile Table Skeleton */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="flex gap-2">
                            <div className="w-20 h-16 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1 space-y-1">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Mobile Stats Skeleton */}
        <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-xl p-3">
                    <div className="h-6 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
            ))}
        </div>
    </div>
));

MobileSkeletonLoader.displayName = 'MobileSkeletonLoader';

const Schedule = ({ setHeaderTitle }) => {
    const { data: scheduleDoc, loading: scheduleLoading } = useFirestoreDocument(['schedules', 'first_year']);
    const { data: timeSlotsDoc, loading: timeSlotsLoading, updateDocument: updateTimeSlots } = useFirestoreDocument(['time_slots', 'default_periods']);
    
    useEffect(() => {
        setHeaderTitle('Class Schedule');
    }, [setHeaderTitle]);

    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Memoize scheduleDays and timeSlots to prevent dependency array changes
    const scheduleDays = useMemo(() => scheduleDoc?.days || {}, [scheduleDoc]);
    const timeSlots = useMemo(() => timeSlotsDoc?.periods || [], [timeSlotsDoc]);
    const loading = scheduleLoading || timeSlotsLoading;

    // Memoize calculations for better performance
    const scheduleStats = useMemo(() => {
        const allClasses = Object.values(scheduleDays).flat();
        const activeDays = Object.keys(scheduleDays).filter(day => scheduleDays[day]?.length > 0);
        const totalSubjects = new Set(allClasses.map(c => c.subject)).size;
        const totalSlots = timeSlots.length * 5; // 5 weekdays (Sunday-Thursday)
        const utilization = totalSlots > 0 ? Math.round((allClasses.length / totalSlots) * 100) : 0;

        return {
            totalClasses: allClasses.length,
            activeDays: activeDays.length,
            totalSubjects,
            utilization
        };
    }, [scheduleDays, timeSlots]);

    const handleSaveTimeSlots = useCallback((newTimeSlots) => {
        const sortedTimeSlots = newTimeSlots.sort();
        updateTimeSlots({ periods: sortedTimeSlots });
    }, [updateTimeSlots]);

    const handleOpenModal = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
            {/* Mobile Header */}
            <div className="mb-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
                                <IoCalendarOutline className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Your Schedule</h1>
                                <p className="text-sm text-gray-600">Class timetable overview</p>
                            </div>
                        </div>
                        {/* Quick Stats Badge */}
                        <div className="text-right">
                            <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                                {scheduleStats.activeDays} active days
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Action Buttons */}
                {currentUser && (
                    <div className="flex gap-3 mb-4">
                        <MobileActionButton 
                            onClick={handleOpenModal}
                            icon={IoTimeOutline}
                            variant="secondary"
                            fullWidth
                        >
                            Edit Periods
                        </MobileActionButton>
                        <MobileActionButton 
                            to="/schedule-editor"
                            icon={IoCreateOutline}
                            variant="primary"
                            fullWidth
                        >
                            Edit Schedule
                        </MobileActionButton>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="relative">
                {loading ? (
                    <MobileSkeletonLoader />
                ) : (
                    <>
                        {/* Schedule Container */}
                        <div className="mb-6">
                            <ScheduleView scheduleDays={scheduleDays} />
                        </div>

                        {/* Enhanced Mobile Stats Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                                        <IoCalendarOutline className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-blue-700">Active Days</p>
                                        <p className="text-2xl font-bold text-blue-900">{scheduleStats.activeDays}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/70 border border-purple-200 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
                                        <IoTimeOutline className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-purple-700">Time Periods</p>
                                        <p className="text-2xl font-bold text-purple-900">{timeSlots.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Mobile Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                                <div className="text-lg font-bold text-green-600">
                                    {scheduleStats.totalClasses}
                                </div>
                                <div className="text-xs text-gray-600 font-medium">Total Classes</div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                                <div className="text-lg font-bold text-orange-600">
                                    {scheduleStats.totalSubjects}
                                </div>
                                <div className="text-xs text-gray-600 font-medium">Subjects</div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
                                <div className="text-lg font-bold text-blue-600">
                                    {scheduleStats.utilization}%
                                </div>
                                <div className="text-xs text-gray-600 font-medium">Utilization</div>
                            </div>
                        </div>

                        {/* Improved Mobile Tip Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <IoStatsChartOutline className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-blue-900 text-sm mb-1">Schedule Tips</h4>
                                    <p className="text-blue-700 text-xs leading-relaxed">
                                        Swipe horizontally on the schedule table to view all time periods. Tap any class for detailed information.
                                        {scheduleStats.utilization < 50 && ' Your schedule has room for more classes.'}
                                        {scheduleStats.utilization >= 80 && ' Your schedule is well-utilized.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Subtle Mobile Decorations */}
                <div className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-xl -z-10"></div>
                <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full blur-xl -z-10"></div>
            </div>

            {/* Modal */}
            <TimeSlotsEditorModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                initialTimeSlots={timeSlots}
                onSave={handleSaveTimeSlots}
            />
        </div>
    );
};

export default Schedule;