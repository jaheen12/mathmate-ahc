import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  IoBookOutline, 
  IoPersonOutline, 
  IoTimeOutline, 
  IoCalendarOutline, 
  IoSchoolOutline, 
  IoClose, 
  IoReorderTwoOutline, 
  IoBookmarksOutline,
  IoLocationOutline,
  IoInformationCircleOutline
} from 'react-icons/io5';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';

// Helper to convert "9:30 AM" to minutes for reliable sorting
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, ampm] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0; // Midnight case
    return hours * 60 + minutes;
};

// Helper component for Empty Schedule State
const EmptyScheduleState = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <IoSchoolOutline className="w-10 h-10 text-blue-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">No Schedule Available</h3>
      <p className="text-gray-600 text-center max-w-sm text-sm leading-relaxed">
        The schedule is currently empty. Use the "Edit Schedule" button to add classes and get started.
      </p>
    </div>
);

// Helper component for an empty slot in the grid
const EmptySlot = ({ time, day }) => (
    <div className="w-full h-full flex items-center justify-center border border-dashed border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-200 group cursor-pointer">
      <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-2 h-2 rounded-full bg-gray-300 mb-1 mx-auto"></div>
        <p className="text-xs text-gray-400">Free</p>
      </div>
    </div>
);

// Helper component for a class card - Memoized for performance
const ClassCard = React.memo(({ classInfo, day, time, getSubjectColor, setSelectedClass }) => {
    const colorClass = getSubjectColor(classInfo.subject);
    
    const handleClick = useCallback(() => {
        setSelectedClass({ ...classInfo, day, time });
    }, [classInfo, day, time, setSelectedClass]);
    
    return (
      <button 
        className={`w-full h-full ${colorClass} rounded-lg p-3 text-white shadow-sm flex flex-col justify-between
          transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50
          active:scale-95 relative overflow-hidden group will-change-transform`}
        onClick={handleClick}
        title={`${classInfo.subject} - ${classInfo.teacher}`}
      >        
        <div className="text-left w-full relative z-10">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold text-sm leading-tight break-words hyphens-auto flex-1">
              {classInfo.subject}
            </h4>
            <IoInformationCircleOutline className="w-3 h-3 opacity-60 ml-1 flex-shrink-0" />
          </div>
          <p className="text-xs opacity-90 break-words hyphens-auto font-medium">
            {classInfo.teacher}
          </p>
        </div>
        
        <div className="text-left text-xs opacity-80 mt-2 break-words hyphens-auto relative z-10 flex items-center gap-1">
          <IoBookmarksOutline className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{classInfo.chapter}</span>
        </div>
        
        {/* Simplified hover effect */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-150 rounded-lg"></div>
      </button>
    );
});

// Current time indicator - Memoized for performance
const CurrentTimeIndicator = React.memo(({ currentTime, timeSlots }) => {
    const position = useMemo(() => {
        const now = currentTime;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        for (let i = 0; i < timeSlots.length; i++) {
            const [startTime, endTime] = timeSlots[i].split('-');
            const startMinutes = timeToMinutes(startTime + ' ' + (startTime.includes('AM') || startTime.includes('PM') ? '' : 'AM'));
            const endMinutes = timeToMinutes(endTime + ' ' + (endTime.includes('AM') || endTime.includes('PM') ? '' : 'AM'));
            
            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
                const progress = (currentMinutes - startMinutes) / (endMinutes - startMinutes);
                return { slotIndex: i, progress };
            }
        }
        return null;
    }, [currentTime, timeSlots]);
    
    if (!position) return null;
    
    const leftOffset = 96 + (position.slotIndex * 192) + (position.progress * 192);
    
    return (
        <div 
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none will-change-transform"
            style={{ left: `${leftOffset}px` }}
        >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
        </div>
    );
});

// --- Main ScheduleView Component ---
const ScheduleView = ({ scheduleDays }) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    const { 
        data: timeSlotsDoc, 
        updateDocument: updateTimeSlots 
    } = useFirestoreDocument(['time_slots', 'default_periods']);

    const daysOfWeek = useMemo(() => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], []);

    // Memoize current day calculation
    const currentDayIndex = useMemo(() => {
        return new Date().getDay();
    }, []);

    // Update current time every minute with cleanup
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Memoize time slots processing
    const sortedTimeSlots = useMemo(() => {
        if (timeSlotsDoc?.periods) {
            return [...timeSlotsDoc.periods].sort((a, b) => {
                const startA = timeToMinutes(a.split('-')[0]);
                const startB = timeToMinutes(b.split('-')[0]);
                return startA - startB;
            });
        }
        return [];
    }, [timeSlotsDoc?.periods]);

    useEffect(() => {
        setTimeSlots(sortedTimeSlots);
    }, [sortedTimeSlots]);

    const handleDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;

        const items = Array.from(timeSlots);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        setTimeSlots(items);
        updateTimeSlots({ periods: items });
    };
    
    const hasScheduleData = useMemo(() => Object.values(scheduleDays || {}).some(day => day.length > 0), [scheduleDays]);

    // Memoize subject colors to prevent recalculation
    const subjectColors = useMemo(() => {
        const colors = [
            'bg-gradient-to-br from-blue-500 to-blue-600', 
            'bg-gradient-to-br from-purple-500 to-purple-600', 
            'bg-gradient-to-br from-green-500 to-green-600', 
            'bg-gradient-to-br from-orange-500 to-orange-600', 
            'bg-gradient-to-br from-red-500 to-red-600', 
            'bg-gradient-to-br from-indigo-500 to-indigo-600', 
            'bg-gradient-to-br from-pink-500 to-pink-600', 
            'bg-gradient-to-br from-teal-500 to-teal-600',
            'bg-gradient-to-br from-cyan-500 to-cyan-600',
            'bg-gradient-to-br from-emerald-500 to-emerald-600'
        ];
        const colorMap = {};
        if (scheduleDays) {
            const allSubjects = new Set(Object.values(scheduleDays).flat().map(c => c.subject));
            Array.from(allSubjects).forEach((subject, index) => {
                colorMap[subject] = colors[index % colors.length];
            });
        }
        return colorMap;
    }, [scheduleDays]);

    const getSubjectColor = useCallback((subject) => subjectColors[subject] || 'bg-gradient-to-br from-gray-500 to-gray-600', [subjectColors]);
    const closeModal = useCallback(() => setSelectedClass(null), []);

    // Get current day highlight
    const getCurrentDayIndex = () => {
        const today = new Date().getDay();
        return today; // 0 = Sunday, 1 = Monday, etc.
    };

    if (!hasScheduleData) return <EmptyScheduleState />;

    return (
        <div className="space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="overflow-x-auto">
                    <div className="min-w-max relative">
                        <Droppable droppableId="time-slots-header" direction="horizontal">
                            {(provided) => (
                                <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200" {...provided.droppableProps} ref={provided.innerRef}>
                                    <div className="w-24 p-4 font-bold text-gray-700 border-r border-gray-200 text-sm sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10 shadow-sm">
                                        Day
                                    </div>
                                    {timeSlots.map((time, index) => (
                                        <Draggable key={time} draggableId={time} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    className={`w-48 p-4 text-center font-semibold text-gray-700 text-sm border-r border-gray-200 flex items-center justify-center gap-2 transition-all duration-200
                                                        ${snapshot.isDragging ? 'bg-blue-100 shadow-lg scale-105' : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'}`}
                                                    ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                >
                                                    <IoReorderTwoOutline className="text-gray-400 cursor-grab hover:text-gray-600 transition-colors" />
                                                    <span>{time}</span>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        
                        {/* Current time indicator */}
                        <CurrentTimeIndicator currentTime={currentTime} timeSlots={timeSlots} />
                        
                        <div>
                            {daysOfWeek.map((day, dayIndex) => {
                                const isToday = dayIndex === currentDayIndex;
                                return (
                                    <div key={day} className={`flex h-32 border-b border-gray-100 last:border-b-0 transition-colors duration-200
                                        ${isToday ? 'bg-gradient-to-r from-blue-50/30 to-transparent' : 'hover:bg-gray-50/20'}`}>
                                        <div className={`w-24 p-4 border-r border-gray-200 font-semibold text-sm flex items-center sticky left-0 z-10 transition-colors duration-200
                                            ${isToday ? 'bg-gradient-to-r from-blue-100/80 to-blue-50/80 text-blue-800' : 'bg-white text-gray-800'}`}>
                                            <div className="flex items-center gap-2">
                                                {isToday && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                                                {day}
                                            </div>
                                        </div>
                                        {timeSlots.map((time) => {
                                            const classInfo = (scheduleDays[day] || []).find(c => c.timeSlot === time);
                                            return (
                                                <div key={`${day}-${time}`} className="w-48 p-2 border-r border-gray-100">
                                                    {classInfo ? 
                                                        <ClassCard classInfo={classInfo} day={day} time={time} getSubjectColor={getSubjectColor} setSelectedClass={setSelectedClass} /> : 
                                                        <EmptySlot time={time} day={day} />
                                                    }
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </DragDropContext>

            {/* Enhanced Modal */}
            {selectedClass && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md animate-slide-up shadow-2xl">
                        {/* Modal Header with gradient */}
                        <div className={`${getSubjectColor(selectedClass.subject)} p-6 rounded-t-2xl sm:rounded-t-2xl text-white relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold break-words pr-4 leading-tight">{selectedClass.subject}</h3>
                                    <p className="text-sm opacity-90 mt-1">{selectedClass.day} • {selectedClass.time}</p>
                                </div>
                                <button 
                                    onClick={closeModal} 
                                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-200 flex-shrink-0 active:scale-95"
                                >
                                    <IoClose className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200/50">
                                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <IoBookmarksOutline className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">Chapter/Topic</p>
                                    <p className="text-gray-800 font-semibold break-words">{selectedClass.chapter}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <IoPersonOutline className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Instructor</p>
                                    <p className="text-gray-800 font-semibold break-words">{selectedClass.teacher}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-200/50">
                                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <IoTimeOutline className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Schedule</p>
                                    <p className="text-gray-800 font-semibold break-words">{selectedClass.day} at {selectedClass.time}</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={closeModal} 
                                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-98"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                @keyframes slide-up { 
                    from { transform: translateY(100%); opacity: 0; } 
                    to { transform: translateY(0); opacity: 1; } 
                }
                .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                
                @keyframes fade-in { 
                    from { opacity: 0; } 
                    to { opacity: 1; } 
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                
                .hyphens-auto { hyphens: auto; }
                .active\\:scale-95:active { transform: scale(0.95); }
                .active\\:scale-98:active { transform: scale(0.98); }
                
                /* GPU acceleration for better performance */
                .will-change-transform {
                    will-change: transform;
                }
                
                /* Reduce motion for users who prefer it */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ScheduleView;
