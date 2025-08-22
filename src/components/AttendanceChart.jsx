// src/components/AttendanceChart.jsx
import React, { useMemo } from 'react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';

const TRACKED_SUBJECTS = ["Major", "NM-PHY", "NM-STAT"];
const COLORS = {
    "Major": "#8884d8",
    "NM-PHY": "#82ca9d",
    "NM-STAT": "#ffc658",
};

const AttendanceChart = ({ attendanceData }) => {
    
    const chartData = useMemo(() => {
        if (!attendanceData || attendanceData.length === 0) {
            return { overall: 0, bySubject: [] };
        }

        const filteredRecords = attendanceData.filter(entry => TRACKED_SUBJECTS.includes(entry.subject));

        const totalClasses = filteredRecords.length;
        const attendedClasses = filteredRecords.filter(entry => entry.status === 'present').length;
        
        const overall = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

        const subjectStats = {};
        filteredRecords.forEach(entry => {
            if (!subjectStats[entry.subject]) {
                subjectStats[entry.subject] = { total: 0, present: 0 };
            }
            subjectStats[entry.subject].total += 1;
            if (entry.status === 'present') {
                subjectStats[entry.subject].present += 1;
            }
        });

        const bySubject = TRACKED_SUBJECTS.map(subject => {
            const stats = subjectStats[subject] || { total: 0, present: 0 };
            return {
                name: subject,
                percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
                fill: COLORS[subject],
            };
        });
        
        return { overall, bySubject };
    }, [attendanceData]);

    const { overall, bySubject } = chartData;

    // Data for the radial chart. It needs an array.
    const radialData = [{ name: 'Overall', value: overall, fill: '#16a34a' }]; // A nice green color

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">

                {/* Left Side: The Radial Chart */}
                <div className="relative h-48">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                            innerRadius="70%" 
                            outerRadius="100%" 
                            barSize={15} 
                            data={radialData} 
                            startAngle={90} 
                            endAngle={-270}
                        >
                            <RadialBar
                                background
                                clockWise
                                dataKey="value"
                            />
                            <Tooltip content={() => null} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    {/* Text in the middle of the circle */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-800">{overall}%</span>
                        <span className="text-sm text-gray-500">Overall</span>
                    </div>
                </div>

                {/* Right Side: The "By Subject" List */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-700 mb-2 text-center md:text-left">By Subject</h4>
                    {bySubject.map(subject => (
                        <div key={subject.name} className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: subject.fill }}></div>
                            <div className="flex justify-between w-full text-sm">
                                <span className="font-medium text-gray-600">{subject.name}</span>
                                <span className="font-semibold text-gray-800">{subject.percentage}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AttendanceChart;