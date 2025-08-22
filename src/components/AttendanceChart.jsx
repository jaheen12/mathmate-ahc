// src/components/AttendanceChart.jsx
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const AttendanceChart = ({ attendanceData }) => {
    
    // useMemo will prevent recalculating this data on every re-render
    const chartData = useMemo(() => {
        if (!attendanceData || attendanceData.length === 0) {
            return { overall: 0, bySubject: [] };
        }

        let totalClasses = attendanceData.length;
        let attendedClasses = attendanceData.filter(entry => entry.status === 'present').length;
        
        const overall = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

        const subjectStats = {};
        attendanceData.forEach(entry => {
            if (!subjectStats[entry.subject]) {
                subjectStats[entry.subject] = { total: 0, present: 0 };
            }
            subjectStats[entry.subject].total += 1;
            if (entry.status === 'present') {
                subjectStats[entry.subject].present += 1;
            }
        });

        const bySubject = Object.keys(subjectStats).map(subject => ({
            name: subject,
            // Use 'attendance' as the key for the Bar component
            attendance: Math.round((subjectStats[subject].present / subjectStats[subject].total) * 100),
        }));
        
        return { overall, bySubject };

    }, [attendanceData]);

    const { overall, bySubject } = chartData;

    // Custom colors for the bars
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-green-600 mb-1">Overall Attendance</h3>
            <p className="text-3xl font-bold text-gray-800 mb-4">{overall}%</p>
            
            <h4 className="font-semibold text-gray-700 mb-3">By Subject</h4>
            {bySubject.length > 0 ? (
                 <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={bySubject} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} unit="%" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="attendance" fill="#8884d8">
                            {bySubject.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-gray-500 text-sm">No subject data to display.</p>
            )}
        </div>
    );
};

export default AttendanceChart;