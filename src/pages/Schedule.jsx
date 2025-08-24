import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Skeleton from 'react-loading-skeleton';
import { IoCreateOutline, IoTimeOutline, IoCalendarOutline, IoStatsChartOutline, IoSchoolOutline } from "react-icons/io5"; 
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus'; // Import NetworkStatus
import ScheduleView from '../components/ScheduleView';
import TimeSlotsEditorModal from '../components/TimeSlotsEditorModal';

// --- Helper & Skeleton Components (moved outside main component for performance) ---
const MobileActionButton = React.memo(({ onClick, to, icon: IconComponent, children, variant = 'secondary', fullWidth = false, disabled = false }) => {
    // ... component implementation remains the same
});

const MobileSkeletonLoader = React.memo(() => (
    <div className="space-y-4 p-4">
        {/* ... skeleton implementation remains the same ... */}
    </div>
));


const Schedule = ({ setHeaderTitle }) => {
    // --- Data Fetching ---
    const { 
        data: scheduleDoc, 
        loading: scheduleLoading,
        isOnline, // Get isOnline from one of the hooks
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

    // --- Derived State (now safe because of the guard clause below) ---
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
        return { totalClasses: allClasses.length, activeDays: activeDays.length, totalSubjects, utilization };
    }, [scheduleDays, timeSlots]);

    // --- Handlers ---
    const handleSaveTimeSlots = useCallback((newTimeSlots) => {
        const sortedTimeSlots = [...newTimeSlots].sort(); // Create a new sorted array
        updateTimeSlots({ periods: sortedTimeSlots });
    }, [updateTimeSlots]);

    const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
    const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

    // --- CRITICAL: Robust guard clause that waits for ALL data ---
    // This is the primary fix for the crash.
    if (!scheduleDoc || !timeSlotsDoc) {
        return <MobileSkeletonLoader />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
            <div className="mb-6">
                {/* ... Header Content ... */}
                {currentUser && (
                    <div className="flex gap-3 mb-4">
                        <MobileActionButton 
                            onClick={handleOpenModal}
                            icon={IoTimeOutline}
                            variant="secondary"
                            fullWidth
                            disabled={!isOnline} 
                        >
                            {isOnline ? 'Edit Periods' : 'Offline'}
                        </MobileActionButton>
                        <MobileActionButton 
                            to="/schedule-editor"
                            icon={IoCreateOutline}
                            variant="primary"
                            fullWidth
                            disabled={!isOnline}
                        >
                            {isOnline ? 'Edit Schedule' : 'Offline'}
                        </MobileActionButton>
                    </div>
                )}
            </div>

            <div className="relative">
                <div className="mb-4">
                    <NetworkStatus
                        isOnline={isOnline}
                        fromCache={fromCache}
                        hasPendingWrites={hasPendingWrites}
                    />
                </div>
                
                {/* Schedule Container */}
                <div className="mb-6">
                    <ScheduleView scheduleDays={scheduleDays} />
                </div>
                
                {/* ... Stats Cards and other JSX ... */}
            </div>

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