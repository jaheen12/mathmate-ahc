import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { 
    IoCreateOutline, 
    IoTimeOutline, 
    IoCalendarOutline, 
    IoStatsChartOutline, 
    IoSchoolOutline,
    IoTrendingUpOutline,
    IoBookOutline,
    IoCheckmarkCircleOutline,
    IoCloudOfflineOutline,
    IoBookmarksOutline,
    IoRefreshOutline // Icon for the new refresh button
} from "react-icons/io5"; 
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import ScheduleView from '../components/ScheduleView';
import TimeSlotsEditorModal from '../components/TimeSlotsEditorModal';
import { doc, updateDoc } from 'firebase/firestore'; // Import updateDoc for saving
import { db } from '../firebaseConfig'; // Import your db instance

// --- Helper Component: MobileActionButton ---
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
        return <Link to={to} className={className}>{content}</Link>;
    }

    return <button onClick={disabled ? undefined : onClick} className={className} disabled={disabled}>{content}</button>;
});

// --- Helper Component: StatCard ---
const StatCard = React.memo(({ icon: IconComponent, title, value, color = "blue" }) => {
    const colorClasses = {
        blue: "bg-blue-50 border-blue-100 text-blue-600",
        green: "bg-green-50 border-green-100 text-green-600",
        purple: "bg-purple-50 border-purple-100 text-purple-600",
        orange: "bg-orange-50 border-orange-100 text-orange-600",
        indigo: "bg-indigo-50 border-indigo-100 text-indigo-600"
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow duration-150">
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}><IconComponent size={20} /></div>
                <div className="flex-1">
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-600 font-medium">{title}</p>
                </div>
            </div>
        </div>
    );
});

// --- Helper Component: MobileSkeletonLoader ---
const MobileSkeletonLoader = React.memo(() => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2">
        <div className="space-y-4">
            <div className="space-y-3"><Skeleton height={28} className="w-3/4" /><Skeleton height={20} className="w-1/2" /></div>
            <div className="flex gap-3"><Skeleton height={48} className="flex-1" /><Skeleton height={48} className="flex-1" /></div>
            <div className="space-y-3"><Skeleton height={24} className="w-1/3" /><Skeleton height={300} /></div>
            <div className="grid grid-cols-2 gap-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} height={80} />)}</div>
        </div>
    </div>
));

// --- Helper Component: QuickInsights ---
const QuickInsights = React.memo(({ stats }) => {
    const insight = useMemo(() => {
        const { utilization, activeDays, totalSubjects, totalChapters } = stats;
        
        if (utilization > 80) return { text: "High schedule utilization", icon: IoTrendingUpOutline, color: "text-orange-600" };
        if (totalChapters > 10) return { text: "Great topic diversity this week", icon: IoBookmarksOutline, color: "text-indigo-600" };
        if (activeDays === 5) return { text: "Full week scheduled", icon: IoCheckmarkCircleOutline, color: "text-green-600" };
        if (totalSubjects > 6) return { text: "Diverse subject coverage", icon: IoBookOutline, color: "text-purple-600" };
        
        return { text: "Schedule looks well-balanced", icon: IoSchoolOutline, color: "text-blue-600" };
    }, [stats]);

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

// --- Main Schedule Component ---
const Schedule = ({ setHeaderTitle }) => {
    const { 
        data: scheduleDoc, 
        loading: scheduleLoading,
        isOnline,
        fromCache: scheduleFromCache,
        hasPendingWrites: scheduleHasPending,
        refresh: refreshSchedule
    } = useFirestoreDocument(['schedules', 'first_year'], {
        cacheFirst: true,
        backgroundSyncInterval: 60000
    });
    
    const { 
        data: timeSlotsDoc, 
        loading: timeSlotsLoading, 
        fromCache: timeSlotsFromCache,
        hasPendingWrites: timeSlotsHasPending,
        refresh: refreshTimeSlots
    } = useFirestoreDocument(['time_slots', 'default_periods'], {
        cacheFirst: true,
        backgroundSyncInterval: 60000
    });
    
    useEffect(() => {
        setHeaderTitle('Class Schedule');
    }, [setHeaderTitle]);

    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const scheduleDays = useMemo(() => scheduleDoc?.days || {}, [scheduleDoc]);
    const timeSlots = useMemo(() => timeSlotsDoc?.periods || [], [timeSlotsDoc]);
    const fromCache = scheduleFromCache || timeSlotsFromCache;
    const hasPendingWrites = scheduleHasPending || timeSlotsHasPending;
    const isLoading = scheduleLoading || timeSlotsLoading;

    const scheduleStats = useMemo(() => {
        const allClasses = Object.values(scheduleDays).flat();
        const activeDays = Object.keys(scheduleDays).filter(day => scheduleDays[day]?.length > 0).length;
        const totalSubjects = new Set(allClasses.map(c => c.subject)).size;
        const totalChapters = new Set(allClasses.map(c => c.chapter).filter(Boolean)).size;
        const totalSlots = timeSlots.length * 5;
        const utilization = totalSlots > 0 ? Math.round((allClasses.length / totalSlots) * 100) : 0;
        
        return { 
            totalClasses: allClasses.length, 
            activeDays, 
            totalSubjects, 
            totalChapters,
            utilization 
        };
    }, [scheduleDays, timeSlots]);

    const handleSaveTimeSlots = useCallback(async (newTimeSlots) => {
        const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [time, ampm] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };
        const sortedTimeSlots = [...newTimeSlots].sort((a, b) => timeToMinutes(a.split('-')[0]) - timeToMinutes(b.split('-')[0]));
        
        const docRef = doc(db, 'time_slots', 'default_periods');
        try {
            await updateDoc(docRef, { periods: sortedTimeSlots });
        } catch (error) {
            console.error("Failed to save time slots:", error);
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        if (!isOnline || refreshing) return;
        
        setRefreshing(true);
        try {
          await Promise.all([
            refreshSchedule(),
            refreshTimeSlots()
          ]);
        } catch (error) {
          console.error('Schedule refresh failed:', error);
        } finally {
          setTimeout(() => setRefreshing(false), 500);
        }
    }, [isOnline, refreshing, refreshSchedule, refreshTimeSlots]);

    const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
    const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

    if (isLoading && !scheduleDoc && !timeSlotsDoc) {
        return <MobileSkeletonLoader />;
    }
    if (!isLoading && (!scheduleDoc || !timeSlotsDoc)) {
         return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">System Not Ready</h2>
                <p className="text-gray-600">The class schedule has not been set up by an administrator yet.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 px-4 py-2 pb-6">
            <div className="mb-6">
                <div className="mb-4">
                     <h2 className="text-lg font-semibold text-gray-900 mb-2">Weekly Schedule Overview</h2>
                     <p className="text-sm text-gray-600">Manage your class timetable, periods, and topics.</p>
                </div>
                {currentUser && (
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                             <MobileActionButton onClick={handleOpenModal} icon={IoTimeOutline} fullWidth disabled={!isOnline}>
                                {isOnline ? 'Edit Periods' : 'Offline'}
                            </MobileActionButton>
                            <MobileActionButton to="/schedule-editor" icon={IoCreateOutline} variant="primary" fullWidth disabled={!isOnline}>
                                {isOnline ? 'Edit Schedule' : 'Offline'}
                            </MobileActionButton>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing || !isOnline}
                            className="bg-white p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95"
                            aria-label="Refresh Schedule"
                        >
                            <IoRefreshOutline 
                                size={20} 
                                className={`text-gray-600 transition-transform duration-300 ${refreshing ? 'animate-spin' : ''}`} 
                            />
                        </button>
                    </div>
                )}
                <div className="mb-4">
                    <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                     <ScheduleView scheduleDays={scheduleDays} />
                </div>
                <QuickInsights stats={scheduleStats} />
                <div className="grid grid-cols-2 gap-3">
                    <StatCard icon={IoSchoolOutline} title="Total Classes" value={scheduleStats.totalClasses} color="blue" />
                    <StatCard icon={IoBookOutline} title="Subjects" value={scheduleStats.totalSubjects} color="purple" />
                    <StatCard icon={IoBookmarksOutline} title="Unique Topics" value={scheduleStats.totalChapters} color="indigo" />
                    <StatCard icon={IoStatsChartOutline} title="Utilization" value={`${scheduleStats.utilization}%`} color="orange" />
                </div>
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