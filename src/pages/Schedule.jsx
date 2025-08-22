import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Skeleton from 'react-loading-skeleton';
import { IoCreateOutline, IoTimeOutline } from "react-icons/io5";
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import ScheduleView from '../components/ScheduleView';
import TimeSlotsEditorModal from '../components/TimeSlotsEditorModal';

const Schedule = () => {
    const { data: scheduleDoc, loading: scheduleLoading } = useFirestoreDocument(['schedules', 'first_year']);
    const { data: timeSlotsDoc, loading: timeSlotsLoading, updateDocument: updateTimeSlots } = useFirestoreDocument(['time_slots', 'default_periods']);
    
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const scheduleDays = scheduleDoc?.days || {};
    const timeSlots = timeSlotsDoc?.periods || [];
    const loading = scheduleLoading || timeSlotsLoading;

    const handleSaveTimeSlots = (newTimeSlots) => {
        // Sort the time slots before saving to maintain a consistent order
        const sortedTimeSlots = newTimeSlots.sort();
        updateTimeSlots({ periods: sortedTimeSlots });
    };

    // This is the full, correct skeleton component
    const SchedulePageSkeleton = () => (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <Skeleton height={40} className="mb-2" />
            <Skeleton height={200} />
        </div>
    );

    return (
        <div className="p-2">
            {currentUser && (
                <div className="flex flex-wrap justify-end gap-2 mb-4">
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors"
                    >
                        <IoTimeOutline className="mr-2" />
                        Edit Time Periods
                    </button>
                    <Link 
                        to="/schedule-editor" 
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors"
                    >
                        <IoCreateOutline className="mr-2" />
                        Edit Routine
                    </Link>
                </div>
            )}
            
            {loading ? <SchedulePageSkeleton /> : <ScheduleView scheduleDays={scheduleDays} />}

            <TimeSlotsEditorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialTimeSlots={timeSlots}
                onSave={handleSaveTimeSlots}
            />
        </div>
    );
};

export default Schedule;