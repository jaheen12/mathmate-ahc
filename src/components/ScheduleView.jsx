// src/components/ScheduleView.jsx
import React, { useMemo, useState } from 'react';
import { IoBookOutline, IoPersonOutline, IoTimeOutline, IoCalendarOutline, IoSchoolOutline, IoClose } from 'react-icons/io5';

const ScheduleView = ({ scheduleDays }) => {
  const [selectedClass, setSelectedClass] = useState(null);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

  const timeSlots = useMemo(() => {
    if (!scheduleDays) return [];
    const allTimes = new Set();
    Object.values(scheduleDays).forEach(dayClasses => {
      dayClasses.forEach(classInfo => {
        allTimes.add(classInfo.time);
      });
    });
    return Array.from(allTimes).sort();
  }, [scheduleDays]);

  const hasScheduleData = useMemo(() => {
    return Object.values(scheduleDays).some(day => day.length > 0);
  }, [scheduleDays]);

  // Generate colors for subjects
  const getSubjectColor = (subject) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600', 
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
      'from-emerald-500 to-emerald-600',
    ];
    
    const hash = subject.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const EmptyScheduleState = () => (
    <div className="flex flex-col items-center justify-center min-h-96 px-6 py-12">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-lg">
          <IoSchoolOutline className="w-12 h-12 text-gray-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-sm font-bold">!</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">No Schedule Available</h3>
      <p className="text-gray-600 text-center max-w-md leading-relaxed mb-6">
        Your weekly class schedule is currently empty. Contact your administrator to add classes or check back later.
      </p>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-600 text-lg">💡</span>
          <span className="font-semibold text-blue-900 text-sm">Quick Tip</span>
        </div>
        <p className="text-blue-700 text-sm">
          Schedules are typically updated at the beginning of each semester.
        </p>
      </div>
    </div>
  );

  if (!hasScheduleData) {
    return <EmptyScheduleState />;
  }

  const ClassCard = ({ classInfo, day, time }) => {
    const colorClass = getSubjectColor(classInfo.subject);
    const isSelected = selectedClass?.subject === classInfo.subject && selectedClass?.day === day && selectedClass?.time === time;
    
    return (
      <button 
        className={`
          relative w-full h-20 bg-gradient-to-br ${colorClass} rounded-xl p-3 text-white shadow-md
          transition-all duration-300 transform active:scale-95 hover:scale-105 hover:shadow-lg
          ${isSelected ? 'ring-4 ring-blue-300 ring-opacity-60 scale-105' : ''}
          focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-60
        `}
        onClick={() => setSelectedClass({ ...classInfo, day, time })}
      >
        <div className="flex flex-col h-full justify-between text-left">
          <div className="flex-1 min-h-0">
            <h4 className="font-bold text-sm leading-tight mb-1 truncate" title={classInfo.subject}>
              {classInfo.subject}
            </h4>
            <p className="text-xs opacity-90 truncate" title={classInfo.teacher}>
              {classInfo.teacher}
            </p>
          </div>
          
          <div className="flex items-center justify-between text-xs opacity-80">
            <IoBookOutline className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium">{time.slice(0, 5)}</span>
          </div>
        </div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-xl transform -skew-x-12"></div>
      </button>
    );
  };

  const EmptySlot = () => (
    <div className="w-full h-20 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
      <div className="text-center">
        <div className="w-4 h-4 mx-auto mb-1 rounded-full bg-gray-200"></div>
        <span className="text-gray-400 text-xs font-medium">Free</span>
      </div>
    </div>
  );

  const getDayColor = (index) => {
    const colors = ['bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Mobile-Optimized Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
            <IoSchoolOutline className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
            <p className="text-sm text-gray-600">Tap any class for details</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-700">
            {timeSlots.length} Periods
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full mt-1">
            {daysOfWeek.length} Days
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Schedule Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Horizontal scrollable container */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Table Header */}
            <div className="flex bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex-shrink-0 w-32 p-4 border-r border-blue-400 font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700">
                <IoCalendarOutline className="w-4 h-4" />
                <span>Day</span>
              </div>
              <div className="flex">
                {timeSlots.map((time, index) => (
                  <div key={time} className={`flex-shrink-0 w-36 p-4 text-center font-semibold ${index < timeSlots.length - 1 ? 'border-r border-blue-400' : ''}`}>
                    <div className="flex flex-col items-center gap-1">
                      <IoTimeOutline className="w-4 h-4 opacity-90" />
                      <span className="text-sm">{time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table Body */}
            <div className="max-h-96 overflow-y-auto">
              {daysOfWeek.map((day, dayIndex) => (
                <div key={day} className={`flex border-b border-gray-200 hover:bg-blue-50/30 transition-all duration-200 ${dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <div className="flex-shrink-0 w-32 p-4 border-r border-gray-200 font-semibold text-gray-800 bg-gray-50/80">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getDayColor(dayIndex)}`}></div>
                      <span className="text-sm">{day}</span>
                    </div>
                  </div>
                  <div className="flex">
                    {timeSlots.map((time, timeIndex) => {
                      const classInfo = (scheduleDays[day] || []).find(c => c.time === time);
                      return (
                        <div key={time} className={`flex-shrink-0 w-36 p-3 ${timeIndex < timeSlots.length - 1 ? 'border-r border-gray-100' : ''}`}>
                          {classInfo ? (
                            <ClassCard classInfo={classInfo} day={day} time={time} />
                          ) : (
                            <EmptySlot />
                          )}
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

      {/* Mobile Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {Object.values(scheduleDays).flat().length}
          </div>
          <div className="text-xs text-blue-600 font-medium">Total Classes</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">
            {new Set(Object.values(scheduleDays).flat().map(c => c.subject)).size}
          </div>
          <div className="text-xs text-purple-600 font-medium">Subjects</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {timeSlots.length * daysOfWeek.length}
          </div>
          <div className="text-xs text-green-600 font-medium">Total Slots</div>
        </div>
      </div>

      {/* Mobile Modal for Class Details */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 transform transition-transform duration-300 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${getSubjectColor(selectedClass.subject)}`}></div>
                <h3 className="text-xl font-bold text-gray-900">{selectedClass.subject}</h3>
              </div>
              <button 
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                onClick={() => setSelectedClass(null)}
              >
                <IoClose className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <IoPersonOutline className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">Instructor</p>
                  <p className="text-gray-800 font-semibold">{selectedClass.teacher}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <IoTimeOutline className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Time</p>
                  <p className="text-gray-800 font-semibold">{selectedClass.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <IoCalendarOutline className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium">Day</p>
                  <p className="text-gray-800 font-semibold">{selectedClass.day}</p>
                </div>
              </div>
            </div>

            <button 
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 active:scale-95"
              onClick={() => setSelectedClass(null)}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ScheduleView;