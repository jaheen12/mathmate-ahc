import React, { useMemo, useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, BookOpen, Calendar, BarChart3, Target, Activity } from 'lucide-react';

const TRACKED_SUBJECTS = ["Major", "NM-PHY", "NM-STAT"];
const COLORS = {
    "Major": "#6366f1",
    "NM-PHY": "#10b981",
    "NM-STAT": "#f59e0b",
};

// Enhanced custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-1">{data.name || label}</p>
                <p className="text-sm text-gray-600">Attendance: {data.percentage}%</p>
                <p className="text-xs text-gray-500 mt-1">
                    {data.present} out of {data.total} classes
                </p>
            </div>
        );
    }
    return null;
};

const AttendanceChart = ({ attendanceData = [] }) => {
    const [viewMode, setViewMode] = useState('radial'); // 'radial', 'bar', 'line', 'pie'
    
    const chartData = useMemo(() => {
        if (!attendanceData || attendanceData.length === 0) {
            return { 
                overall: 0, 
                bySubject: [], 
                totalClasses: 0, 
                attendedClasses: 0,
                missedClasses: 0,
                trendData: [],
                pieData: []
            };
        }

        const filteredRecords = attendanceData.filter(entry => TRACKED_SUBJECTS.includes(entry.subject));

        const totalClasses = filteredRecords.length;
        const attendedClasses = filteredRecords.filter(entry => entry.status === 'present').length;
        const missedClasses = totalClasses - attendedClasses;
        
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
            const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
            return {
                name: subject,
                percentage,
                present: stats.present,
                total: stats.total,
                fill: COLORS[subject],
            };
        });

        // Generate trend data (simplified - you might want to make this more sophisticated)
        const trendData = bySubject.map(subject => ({
            name: subject.name.replace('NM-', ''),
            current: subject.percentage,
            target: 75,
            fill: subject.fill
        }));

        // Generate pie chart data
        const pieData = [
            { name: 'Attended', value: attendedClasses, fill: '#10b981' },
            { name: 'Missed', value: missedClasses, fill: '#ef4444' }
        ];
        
        return { 
            overall, 
            bySubject, 
            totalClasses, 
            attendedClasses, 
            missedClasses,
            trendData,
            pieData
        };
    }, [attendanceData]);

    const { overall, bySubject, totalClasses, attendedClasses, missedClasses, trendData, pieData } = chartData;

    // Enhanced status determination
    const getAttendanceStatus = (percentage) => {
        if (percentage >= 90) return { status: 'Outstanding', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: TrendingUp };
        if (percentage >= 85) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50', icon: TrendingUp };
        if (percentage >= 75) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Users };
        if (percentage >= 60) return { status: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: TrendingDown };
        return { status: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50', icon: TrendingDown };
    };

    const overallStatus = getAttendanceStatus(overall);
    const StatusIcon = overallStatus.icon;

    

    // View mode options
    const viewModeOptions = [
        { key: 'radial', icon: Activity, title: 'Radial View' },
        { key: 'bar', icon: BarChart3, title: 'Bar Chart' },
        { key: 'line', icon: TrendingUp, title: 'Trend View' },
        { key: 'pie', icon: Target, title: 'Distribution' }
    ];

    // Calculate classes needed for 75% attendance
    const getClassesNeeded = (subject) => {
        if (subject.percentage >= 75) return 0;
        return Math.ceil((75 * subject.total - 100 * subject.present) / 25);
    };

    // Render different chart types
    const renderChart = () => {
        switch (viewMode) {
            case 'radial':
                return (
                    <div className="relative h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart 
                                innerRadius="50%" 
                                outerRadius="85%" 
                                barSize={25} 
                                data={[{ name: 'Overall', value: overall, fill: '#6366f1' }]} 
                                startAngle={90} 
                                endAngle={-270}
                            >
                                <RadialBar
                                    background={{ fill: '#f3f4f6' }}
                                    clockWise
                                    dataKey="value"
                                    cornerRadius={10}
                                />
                                <Tooltip content={() => null} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl sm:text-4xl font-bold text-gray-800">{overall}%</span>
                            <span className="text-xs sm:text-sm text-gray-500 font-medium">Overall</span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full mt-1 ${overallStatus.color} ${overallStatus.bgColor}`}>
                                {overallStatus.status}
                            </span>
                        </div>
                    </div>
                );
            
            case 'bar':
                return (
                    <div className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bySubject} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar 
                                    dataKey="percentage" 
                                    radius={[4, 4, 0, 0]}
                                    fill="#6366f1"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            
            case 'line':
                return (
                    <div className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                    type="monotone" 
                                    dataKey="current" 
                                    stroke="#6366f1" 
                                    strokeWidth={3}
                                    dot={{ r: 6, fill: '#6366f1' }}
                                    activeDot={{ r: 8 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="target" 
                                    stroke="#ef4444" 
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
            
            case 'pie':
                return (
                    <div className="h-48 sm:h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0];
                                            return (
                                                <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-3">
                                                    <p className="text-sm font-semibold text-gray-900">{data.name}</p>
                                                    <p className="text-sm text-gray-600">{data.value} classes</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center space-x-2 sm:space-x-4 mt-4">
                            {pieData.map((entry, index) => (
                                <div key={index} className="flex items-center space-x-1 sm:space-x-2">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: entry.fill }}
                                    />
                                    <span className="text-xs text-gray-600">{entry.name}: {entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-full overflow-hidden">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 sm:px-6 py-4 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg sm:text-xl font-bold">Attendance Analytics</h3>
                                <p className="text-indigo-100 text-xs sm:text-sm">Academic progress tracking</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1 self-start sm:self-auto">
                            {viewModeOptions.map(({ key, icon: Icon, title }) => (
                                <button
                                    key={key}
                                    onClick={() => setViewMode(key)}
                                    className={`p-2 rounded-lg transition-all duration-200 ${
                                        viewMode === key 
                                            ? 'bg-white/30 text-white shadow-lg' 
                                            : 'bg-white/10 text-indigo-200 hover:bg-white/20 hover:text-white'
                                    }`}
                                    title={title}
                                >
                                    <Icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Fixed Statistics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className={`${overallStatus.bgColor} rounded-lg p-3 sm:p-4 border border-gray-200`}>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className={`${overallStatus.color} bg-white p-2 rounded-lg flex-shrink-0`}>
                                    <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{overall}%</p>
                                    <p className={`text-xs sm:text-sm font-medium ${overallStatus.color} truncate`}>
                                        {overallStatus.status}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-100">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="bg-white p-2 rounded-lg text-green-600 flex-shrink-0">
                                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{attendedClasses}</p>
                                    <p className="text-xs sm:text-sm font-medium text-green-600">Attended</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-100">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="bg-white p-2 rounded-lg text-red-600 flex-shrink-0">
                                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{missedClasses}</p>
                                    <p className="text-xs sm:text-sm font-medium text-red-600">Missed</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-100">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="bg-white p-2 rounded-lg text-purple-600 flex-shrink-0">
                                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalClasses}</p>
                                    <p className="text-xs sm:text-sm font-medium text-purple-600">Total</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section - Fixed Layout */}
                    <div className="space-y-6">
                        {/* Chart Visualization */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 w-full">
                            <h4 className="font-semibold text-gray-800 mb-4 text-center text-sm sm:text-base">
                                {viewMode === 'radial' && 'Overall Performance'}
                                {viewMode === 'bar' && 'Subject Comparison'}
                                {viewMode === 'line' && 'Performance vs Target'}
                                {viewMode === 'pie' && 'Class Distribution'}
                            </h4>
                            
                            {renderChart()}
                        </div>

                        {/* Subject Breakdown */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4 w-full">
                            <h4 className="font-semibold text-gray-800 mb-4 text-sm sm:text-base">Subject Breakdown</h4>
                            <div className="space-y-3 sm:space-y-4">
                                {bySubject.map(subject => {
                                    const subjectStatus = getAttendanceStatus(subject.percentage);
                                    const classesNeeded = getClassesNeeded(subject);
                                    return (
                                        <div key={subject.name} className="group hover:bg-gray-50 rounded-lg p-3 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                                                    <div 
                                                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0" 
                                                        style={{ backgroundColor: subject.fill }}
                                                    />
                                                    <span className="font-medium text-gray-700 text-sm sm:text-base truncate">{subject.name}</span>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className="font-bold text-gray-900 text-sm sm:text-base">{subject.percentage}%</span>
                                                    <p className="text-xs text-gray-500">
                                                        {subject.present}/{subject.total} classes
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="h-2 rounded-full transition-all duration-300 ease-out"
                                                    style={{ 
                                                        width: `${subject.percentage}%`, 
                                                        backgroundColor: subject.fill 
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${subjectStatus.color} ${subjectStatus.bgColor}`}>
                                                    {subjectStatus.status}
                                                </span>
                                                {classesNeeded > 0 && (
                                                    <span className="text-xs text-red-500 font-medium">
                                                        Need {classesNeeded} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Alert Section */}
                    {overall < 75 && (
                        <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-semibold text-amber-800 text-sm sm:text-base">Attendance Alert</h5>
                                    <p className="text-xs sm:text-sm text-amber-700 mt-1">
                                        Your overall attendance is {overall}%, which is below the recommended 75% threshold. 
                                        Consider attending more classes to improve your academic standing.
                                    </p>
                                    <div className="mt-2">
                                        <p className="text-xs text-amber-600 font-medium">
                                            Recommended action: Focus on attending classes for subjects with low attendance rates.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Performance Insights */}
                    {overall >= 85 && (
                        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                </div>
                                <div className="min-w-0">
                                    <h5 className="font-semibold text-green-800 text-sm sm:text-base">Excellent Performance!</h5>
                                    <p className="text-xs sm:text-sm text-green-700 mt-1">
                                        Great job maintaining consistent attendance! Your {overall}% attendance rate reflects 
                                        strong academic commitment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceChart;