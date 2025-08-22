// src/components/ScheduleView.jsx
import React, { useMemo } from 'react';

const ScheduleView = ({ scheduleDays }) => {
    const daysOfWeek = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // The logic to find all unique time slots remains the same.
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

    if (!hasScheduleData) {
        return (
            <div className="text-center mt-10">
                <h2 className="text-2xl font-semibold text-gray-700">No Schedule Found</h2>
                <p className="text-gray-500 mt-2">The schedule is empty. An admin can add classes in the editor.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-center">
                <thead>
                    <tr className="bg-gray-100">
                        {/* --- TRANSPOSED: Header row is now Time Slots --- */}
                        <th className="p-3 font-semibold text-gray-600 border">Day</th>
                        {timeSlots.map(time => (
                            <th key={time} className="p-3 font-semibold text-gray-600 border">{time}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* --- TRANSPOSED: Body rows are now Days of the Week --- */}
                    {daysOfWeek.map(day => (
                        <tr key={day} className="even:bg-gray-50">
                            <td className="p-3 font-medium text-gray-700 border">{day}</td>
                            {timeSlots.map(time => {
                                // The logic to find the class remains the same
                                const classInfo = (scheduleDays[day] || []).find(c => c.time === time);
                                return (
                                    <td key={time} className="p-3 border">
                                        {classInfo ? (
                                            <div>
                                                <p className="font-semibold text-blue-700">{classInfo.subject}</p>
                                                <p className="text-sm text-gray-500">{classInfo.teacher}</p>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ScheduleView;