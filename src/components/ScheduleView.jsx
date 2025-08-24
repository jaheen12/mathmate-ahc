import React, { useMemo, useState, useCallback } from 'react';
import { 
  IoBookOutline, IoPersonOutline, IoTimeOutline, IoCalendarOutline, 
  IoSchoolOutline, IoClose, IoStatsChartOutline
} from 'react-icons/io5';

const ScheduleView = ({ scheduleDays }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  
  const daysOfWeek = useMemo(() => 
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"], 
    []
  );

  // Optimized time slots calculation
  const timeSlots = useMemo(() => {
    if (!scheduleDays) return [];
    const allTimes = new Set();
    Object.values(scheduleDays).forEach(dayClasses => {
      dayClasses.forEach(classInfo => allTimes.add(classInfo.time));
    });
    return Array.from(allTimes).sort();
  }, [scheduleDays]);

  const hasScheduleData = useMemo(() => {
    return Object.values(scheduleDays || {}).some(day => day.length > 0);
  }, [scheduleDays]);

  // Optimized subject colors with memoization
  const subjectColors = useMemo(() => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-emerald-500',
    ];
    
    const colorMap = {};
    if (scheduleDays) {
      const allSubjects = new Set();
      Object.values(scheduleDays).forEach(dayClasses => {
        dayClasses.forEach(classInfo => allSubjects.add(classInfo.subject));
      });
      
      Array.from(allSubjects).forEach((subject, index) => {
        colorMap[subject] = colors[index % colors.length];
      });
    }
    return colorMap;
  }, [scheduleDays]);

  const getSubjectColor = useCallback((subject) => {
    return subjectColors[subject] || 'bg-gray-500';
  }, [subjectColors]);

  const closeModal = useCallback(() => setSelectedClass(null), []);

  const EmptyScheduleState = () => (
    <div className="flex flex-col items-center justify-center min-h-80 px-6 py-12 bg-white rounded-2xl border border-gray-100">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
        <IoSchoolOutline className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">No Schedule Available</h3>
      <p className="text-gray-600 text-center max-w-sm text-sm leading-relaxed mb-4">
        Your weekly class schedule is currently empty. Contact your administrator to add classes.
      </p>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-600">💡</span>
          <span className="font-medium text-blue-900 text-sm">Quick Tip</span>
        </div>
        <p className="text-blue-700 text-sm">
          Schedules are typically updated at the beginning of each semester.
        </p>
      </div>
    </div>
  );

  if (!hasScheduleData) return <EmptyScheduleState />;

  // Optimized ClassCard component
  const ClassCard = ({ classInfo, day, time }) => {
    const colorClass = getSubjectColor(classInfo.subject);
    const isSelected = selectedClass?.subject === classInfo.subject &&
                       selectedClass?.day === day &&
                       selectedClass?.time === time;

    return (
      <button 
        className={`
          w-full h-18 ${colorClass} rounded-lg p-3 text-white shadow-sm
          transition-all duration-200 hover:shadow-md active:scale-95
          ${isSelected ? 'ring-2 ring-blue-400' : ''}
          focus:outline-none focus:ring-2 focus:ring-blue-400
        `}
        onClick={() => setSelectedClass({ ...classInfo, day, time })}
      >
        <div className="text-left">
          <h4 className="font-semibold text-sm leading-tight mb-1 truncate">
            {classInfo.subject}
          </h4>
          <p className="text-xs opacity-90 truncate">
            {classInfo.teacher}
          </p>
          <div className="flex items-center justify-between text-xs opacity-80 mt-2">
            <IoBookOutline className="w-3 h-3" />
            <span className="font-medium">{time.slice(0,5)}</span>
          </div>
        </div>
      </button>
    );
  };

  const EmptySlot = () => (
    <div className="w-full h-18 flex items-center justify-center border border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200">
      <div className="text-center">
        <div className="w-3 h-3 mx-auto mb-1 rounded-full bg-gray-200"></div>
        <span className="text-gray-400 text-xs">Free</span>
      </div>
    </div>
  );

  const dayColors = ['bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-indigo-400'];

  return (
    <div className="space-y-4">
      {/* Simplified Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IoSchoolOutline className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Weekly Schedule</h2>
              <p className="text-sm text-gray-600">Tap classes for details</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-700">{timeSlots.length} Periods</div>
            <div className="text-xs text-gray-500">{daysOfWeek.length} Days</div>
          </div>
        </div>
      </div>

      {/* Simplified Schedule Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header */}
            <div className="flex bg-gray-50 border-b border-gray-200">
              <div className="w-24 p-3 font-semibold text-gray-700 border-r border-gray-200 text-sm">
                Day
              </div>
              <div className="flex">
                {timeSlots.map((time, index) => (
                  <div key={time} className={`w-32 p-3 text-center font-medium text-gray-700 text-sm ${index < timeSlots.length - 1 ? 'border-r border-gray-200' : ''}`}>
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div>
              {daysOfWeek.map((day, dayIndex) => (
                <div key={day} className={`flex border-b border-gray-100 ${dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <div className="w-24 p-3 border-r border-gray-200 font-medium text-gray-800 text-sm flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${dayColors[dayIndex]}`}></div>
                    <span>{day.slice(0, 3)}</span>
                  </div>
                  <div className="flex">
                    {timeSlots.map((time, timeIndex) => {
                      const classInfo = (scheduleDays[day] || []).find(c => c.time === time);
                      return (
                        <div key={time} className={`w-32 p-2 ${timeIndex < timeSlots.length - 1 ? 'border-r border-gray-100' : ''}`}>
                          {classInfo ? <ClassCard classInfo={classInfo} day={day} time={time} /> : <EmptySlot />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-700">{Object.values(scheduleDays).flat().length}</div>
          <div className="text-xs text-blue-600 font-medium">Classes</div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-purple-700">{new Set(Object.values(scheduleDays).flat().map(c => c.subject)).size}</div>
          <div className="text-xs text-purple-600 font-medium">Subjects</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-700">{timeSlots.length * daysOfWeek.length}</div>
          <div className="text-xs text-green-600 font-medium">Slots</div>
        </div>
      </div>

      {/* Optimized Modal */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${getSubjectColor(selectedClass.subject)}`}></div>
                <h3 className="text-lg font-bold text-gray-900">{selectedClass.subject}</h3>
              </div>
              <button 
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors duration-150"
                onClick={closeModal}
              >
                <IoClose className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <IoPersonOutline className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Instructor</p>
                  <p className="text-gray-800 font-semibold">{selectedClass.teacher}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <IoTimeOutline className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Time</p>
                  <p className="text-gray-800 font-semibold">{selectedClass.time}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <IoCalendarOutline className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-medium">Day</p>
                  <p className="text-gray-800 font-semibold">{selectedClass.day}</p>
                </div>
              </div>
            </div>

            <button 
              className="w-full mt-4 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors duration-150 active:scale-95"
              onClick={closeModal}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ScheduleView;