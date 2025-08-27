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
  IoBookmarksOutline
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
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12 bg-white rounded-2xl border border-gray-100">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
        <IoSchoolOutline className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">No Schedule Available</h3>
      <p className="text-gray-600 text-center max-w-sm text-sm leading-relaxed">
        The schedule is currently empty. Use the "Edit Schedule" button to add classes.
      </p>
    </div>
);

// Helper component for an empty slot in the grid
const EmptySlot = () => (
    <div className="w-full h-full flex items-center justify-center border border-dashed border-gray-200 rounded-lg">
      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
    </div>
);

// Helper component for a class card
const ClassCard = ({ classInfo, day, time, getSubjectColor, setSelectedClass }) => {
    const colorClass = getSubjectColor(classInfo.subject);
    return (
      <button 
        className={`w-full h-full ${colorClass} rounded-lg p-3 text-white shadow-sm flex flex-col justify-between
          transition-all duration-200 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400`}
        onClick={() => setSelectedClass({ ...classInfo, day, time })}
      >
        <div className="text-left">
          <h4 className="font-semibold text-sm leading-tight mb-1 truncate">{classInfo.subject}</h4>
          <p className="text-xs opacity-90 truncate">{classInfo.teacher}</p>
        </div>
        <div className="text-left text-xs opacity-80 mt-2 truncate">
            {classInfo.chapter}
        </div>
      </button>
    );
};

// --- Main ScheduleView Component ---
const ScheduleView = ({ scheduleDays }) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);

    const { 
        data: timeSlotsDoc, 
        updateDocument: updateTimeSlots 
    } = useFirestoreDocument(['time_slots', 'default_periods']);

    const daysOfWeek = useMemo(() => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], []);

    useEffect(() => {
        if (timeSlotsDoc?.periods) {
            const sortedPeriods = [...timeSlotsDoc.periods].sort((a, b) => {
                const startA = timeToMinutes(a.split('-')[0]);
                const startB = timeToMinutes(b.split('-')[0]);
                return startA - startB;
            });
            setTimeSlots(sortedPeriods);
        }
    }, [timeSlotsDoc]);

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

    const subjectColors = useMemo(() => {
        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'];
        const colorMap = {};
        if (scheduleDays) {
            const allSubjects = new Set(Object.values(scheduleDays).flat().map(c => c.subject));
            Array.from(allSubjects).forEach((subject, index) => {
                colorMap[subject] = colors[index % colors.length];
            });
        }
        return colorMap;
    }, [scheduleDays]);

    const getSubjectColor = useCallback((subject) => subjectColors[subject] || 'bg-gray-500', [subjectColors]);
    const closeModal = useCallback(() => setSelectedClass(null), []);

    if (!hasScheduleData) return <EmptyScheduleState />;

    return (
        <div className="space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="overflow-x-auto">
                    <div className="min-w-max">
                        <Droppable droppableId="time-slots-header" direction="horizontal">
                            {(provided) => (
                                <div className="flex bg-gray-50 border-b border-gray-200" {...provided.droppableProps} ref={provided.innerRef}>
                                    <div className="w-24 p-3 font-semibold text-gray-700 border-r border-gray-200 text-sm sticky left-0 bg-gray-50 z-10">Day</div>
                                    {timeSlots.map((time, index) => (
                                        <Draggable key={time} draggableId={time} index={index}>
                                            {(provided) => (
                                                <div
                                                    className="w-40 p-3 text-center font-medium text-gray-700 text-sm border-r border-gray-200 flex items-center justify-center gap-2 bg-gray-50"
                                                    ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                >
                                                    <IoReorderTwoOutline className="text-gray-400 cursor-grab" />
                                                    <span>{time}</span>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        <div>
                            {daysOfWeek.map((day) => (
                                <div key={day} className="flex h-24 border-b border-gray-100 last:border-b-0">
                                    <div className="w-24 p-3 border-r border-gray-200 font-medium text-gray-800 text-sm flex items-center sticky left-0 bg-white z-10">{day}</div>
                                    {timeSlots.map((time) => {
                                        const classInfo = (scheduleDays[day] || []).find(c => c.timeSlot === time);
                                        return (
                                            <div key={`${day}-${time}`} className="w-40 p-2 border-r border-gray-100">
                                                {classInfo ? <ClassCard classInfo={classInfo} day={day} time={time} getSubjectColor={getSubjectColor} setSelectedClass={setSelectedClass} /> : <EmptySlot />}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DragDropContext>

            {selectedClass && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-t-2xl w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{selectedClass.subject}</h3>
                            <button onClick={closeModal} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <IoClose className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                                <IoBookmarksOutline className="w-5 h-5 text-orange-600" />
                                <div><p className="text-xs text-orange-600 font-medium">Chapter/Topic</p><p className="text-gray-800 font-semibold">{selectedClass.chapter}</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                <IoPersonOutline className="w-5 h-5 text-blue-600" />
                                <div><p className="text-xs text-blue-600 font-medium">Instructor</p><p className="text-gray-800 font-semibold">{selectedClass.teacher}</p></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                <IoTimeOutline className="w-5 h-5 text-green-600" />
                                <div><p className="text-xs text-green-600 font-medium">Time</p><p className="text-gray-800 font-semibold">{selectedClass.time}</p></div>
                            </div>
                        </div>
                        <button onClick={closeModal} className="w-full mt-4 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">Close</button>
                    </div>
                </div>
            )}
             <style jsx>{`
                @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default ScheduleView;