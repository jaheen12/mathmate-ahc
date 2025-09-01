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
  IoInformationCircleOutline,
  IoSunnyOutline,
  IoMoonOutline,
  IoTodayOutline
} from 'react-icons/io5';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';

// Helper to convert "9:30 AM" to minutes for reliable sorting
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, ampm] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

// Helper component for Empty Schedule State
const EmptyScheduleState = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-8 py-16 bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-8 shadow-lg">
        <IoSchoolOutline className="w-12 h-12 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">No Classes Scheduled</h3>
      <p className="text-gray-600 text-center max-w-md text-base leading-relaxed">
        Your schedule is empty. Add classes using the "Edit Schedule" button to get started with your academic journey.
      </p>
    </div>
);

// Helper component for an empty slot in the grid
const EmptySlot = ({ time, day }) => (
    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 group cursor-pointer">
      <div className="text-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
        <div className="w-3 h-3 rounded-full bg-blue-200 mb-2 mx-auto"></div>
        <p className="text-xs text-gray-500 font-medium">Free Period</p>
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
        className={`w-full h-full ${colorClass} rounded-xl p-4 text-white shadow-md flex flex-col justify-between
          transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-3 focus:ring-white/40
          active:scale-95 relative overflow-hidden group will-change-transform border border-white/20`}
        onClick={handleClick}
        title={`${classInfo.subject} - ${classInfo.teacher}`}
      >        
        <div className="text-left w-full relative z-10">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-base leading-tight break-words hyphens-auto flex-1">
              {classInfo.subject}
            </h4>
            <IoInformationCircleOutline className="w-4 h-4 opacity-70 ml-2 flex-shrink-0" />
          </div>
          <p className="text-sm opacity-90 break-words hyphens-auto font-medium">
            {classInfo.teacher}
          </p>
        </div>
        
        <div className="text-left text-sm opacity-85 mt-3 break-words hyphens-auto relative z-10 flex items-center gap-2">
          <IoBookmarksOutline className="w-4 h-4 flex-shrink-0" />
          <span className="truncate font-medium">{classInfo.chapter}</span>
        </div>
        
        {/* Enhanced hover effect with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"></div>
        <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
      </button>
    );
});

// Day indicator component
const DayIndicator = ({ day, isToday, dayIndex }) => {
    const dayIcons = {
        0: IoSunnyOutline,
        1: IoCalendarOutline,
        2: IoCalendarOutline,
        3: IoCalendarOutline,
        4: IoCalendarOutline,
        5: IoMoonOutline,
        6: IoSunnyOutline
    };
    
    const Icon = dayIcons[dayIndex] || IoCalendarOutline;
    
    return (
        <div className={`flex items-center justify-center p-6 transition-all duration-300 ${
            isToday 
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg' 
                : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200'
        } rounded-2xl border ${isToday ? 'border-blue-300' : 'border-gray-200'}`}>
            <div className="text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${isToday ? 'text-white' : 'text-gray-600'}`} />
                <div className={`font-bold text-base ${isToday ? 'text-white' : 'text-gray-900'}`}>
                    {day}
                </div>
                {isToday && (
                    <div className="flex items-center justify-center mt-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs ml-1 font-medium opacity-90">Today</span>
                    </div>
                )}
            </div>
        </div>
    );
};

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
    
    // Updated calculation to account for day column being part of table flow
    const leftOffset = 160 + (position.slotIndex * 192) + (position.progress * 192);
    
    return (
        <div 
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-600 z-20 pointer-events-none will-change-transform rounded-full shadow-lg"
            style={{ left: `${leftOffset}px` }}
        >
            <div className="absolute -top-2 -left-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div className="absolute -bottom-2 -left-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full"></div>
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
            'bg-gradient-to-br from-blue-500 to-blue-700', 
            'bg-gradient-to-br from-purple-500 to-purple-700', 
            'bg-gradient-to-br from-green-500 to-green-700', 
            'bg-gradient-to-br from-orange-500 to-orange-700', 
            'bg-gradient-to-br from-red-500 to-red-700', 
            'bg-gradient-to-br from-indigo-500 to-indigo-700', 
            'bg-gradient-to-br from-pink-500 to-pink-700', 
            'bg-gradient-to-br from-teal-500 to-teal-700',
            'bg-gradient-to-br from-cyan-500 to-cyan-700',
            'bg-gradient-to-br from-emerald-500 to-emerald-700'
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

    const getSubjectColor = useCallback((subject) => subjectColors[subject] || 'bg-gradient-to-br from-gray-500 to-gray-700', [subjectColors]);
    const closeModal = useCallback(() => setSelectedClass(null), []);

    if (!hasScheduleData) return <EmptyScheduleState />;

    return (
        <div className="space-y-6">
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-max relative">
                            {/* Time Slots Header */}
                            <Droppable droppableId="time-slots-header" direction="horizontal">
                                {(provided) => (
                                    <div className="flex bg-gradient-to-r from-gray-800 to-gray-900 border-b-4 border-gray-700" {...provided.droppableProps} ref={provided.innerRef}>
                                        {/* Day column header - removed sticky positioning */}
                                        <div className="w-40 p-6 font-bold text-white border-r-2 border-gray-600 text-center bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl">
                                            <IoTimeOutline className="w-6 h-6 mx-auto mb-2" />
                                            <div className="text-sm">Schedule</div>
                                        </div>
                                        {timeSlots.map((time, index) => (
                                            <Draggable key={time} draggableId={time} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        className={`w-48 p-6 text-center font-bold text-white border-r-2 border-gray-600 flex flex-col items-center justify-center gap-2 transition-all duration-300
                                                            ${snapshot.isDragging ? 'bg-blue-600 shadow-2xl scale-105 border-blue-400' : 'bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800'}`}
                                                        ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                    >
                                                        <IoReorderTwoOutline className="text-gray-400 cursor-grab hover:text-white transition-colors w-5 h-5" />
                                                        <span className="text-sm font-semibold">{time}</span>
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
                            
                            {/* Schedule Grid */}
                            <div className="bg-gradient-to-br from-gray-50 to-white">
                                {daysOfWeek.map((day, dayIndex) => {
                                    const isToday = dayIndex === currentDayIndex;
                                    return (
                                        <div key={day} className={`flex min-h-[140px] border-b-2 border-gray-100 last:border-b-0 transition-all duration-300
                                            ${isToday ? 'bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-transparent' : 'hover:bg-gray-50/50'}`}>
                                            {/* Day column - removed sticky positioning and z-index */}
                                            <div className="w-40 p-4 border-r-2 border-gray-200 flex items-center justify-center bg-white">
                                                <DayIndicator day={day} isToday={isToday} dayIndex={dayIndex} />
                                            </div>
                                            {/* Time slot columns */}
                                            {timeSlots.map((time) => {
                                                const classInfo = (scheduleDays[day] || []).find(c => c.timeSlot === time);
                                                return (
                                                    <div key={`${day}-${time}`} className="w-48 p-3 border-r border-gray-100">
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
                </div>
            </DragDropContext>

            {/* Enhanced Modal */}
            {selectedClass && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg animate-slide-up shadow-2xl border border-gray-200">
                        {/* Modal Header with enhanced gradient */}
                        <div className={`${getSubjectColor(selectedClass.subject)} p-8 rounded-t-3xl sm:rounded-t-3xl text-white relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold break-words pr-4 leading-tight mb-2">{selectedClass.subject}</h3>
                                    <div className="flex items-center gap-2 text-sm opacity-90">
                                        <IoCalendarOutline className="w-4 h-4" />
                                        <span>{selectedClass.day} • {selectedClass.time}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={closeModal} 
                                    className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-200 flex-shrink-0 active:scale-95 border border-white/20"
                                >
                                    <IoClose className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-5 p-5 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-2xl border-2 border-orange-200/50 shadow-sm">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <IoBookmarksOutline className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mb-2">Chapter/Topic</p>
                                    <p className="text-gray-900 font-bold text-lg break-words">{selectedClass.chapter}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-5 p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl border-2 border-blue-200/50 shadow-sm">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <IoPersonOutline className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Instructor</p>
                                    <p className="text-gray-900 font-bold text-lg break-words">{selectedClass.teacher}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-5 p-5 bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl border-2 border-green-200/50 shadow-sm">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <IoTimeOutline className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">Schedule</p>
                                    <p className="text-gray-900 font-bold text-lg break-words">{selectedClass.day} at {selectedClass.time}</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={closeModal} 
                                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-5 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-98 border border-blue-500"
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
                .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
                
                @keyframes fade-in { 
                    from { opacity: 0; } 
                    to { opacity: 1; } 
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out; }
                
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
