import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStorageAsArray as useLocalStorage } from '../hooks/useLocalStorage';
import { collectionGroup, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Skeleton from 'react-loading-skeleton';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

import { 
    IoArrowBack, 
    IoBarChartOutline, 
    IoCheckmarkDoneCircleOutline, 
    IoLibraryOutline, 
    IoWarningOutline,
    IoRefreshOutline,
    IoTimeOutline,
    IoTrendingUpOutline
} from "react-icons/io5";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Memoized StatCard component to prevent unnecessary re-renders
const StatCard = React.memo(({ icon: Icon, label, value, trend, color = "green" }) => (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center gap-4">
        <div className={`p-3 bg-${color}-100 text-${color}-600 rounded-full`}>
            <Icon size={24} />
        </div>
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-800">{value}</p>
                {trend && (
                    <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <p className="text-gray-500">{label}</p>
        </div>
    </div>
));

StatCard.displayName = 'StatCard';

// Chart options configuration
const chartOptions = {
    bar: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.parsed.y}% completed`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: (value) => `${value}%`
                }
            }
        }
    },
    doughnut: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.label}: ${context.parsed} topics`
                }
            }
        }
    }
};

const ProgressDetails = ({ setHeaderTitle }) => {
    const [progressData, setProgressData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [progress] = useLocalStorage('studyProgress', { completedTopicIds: {} });

    useEffect(() => {
        setHeaderTitle('Progress Overview');
    }, [setHeaderTitle]);

    const fetchDataAndCalculateProgress = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        
        setError(null);
        
        try {
            // Use Promise.all for concurrent fetching
            const [subjectsSnapshot, chaptersSnapshot, topicsSnapshot] = await Promise.all([
                getDocs(collection(db, 'study_progress')),
                getDocs(collectionGroup(db, 'chapters')),
                getDocs(collectionGroup(db, 'topics'))
            ]);

            const subjects = subjectsSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
            const chapters = chaptersSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                parentId: doc.ref.parent.parent.id, 
                ...doc.data() 
            }));
            
            const topics = topicsSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                parentId: doc.ref.parent.parent.id, 
                ...doc.data() 
            }));
            
            const completedIds = progress.completedTopicIds || {};
            const totalTopics = topics.length;
            const completedTopics = Object.keys(completedIds).length;
            const overallPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            // Calculate subject statistics with additional metrics
            const subjectStats = subjects.map(subject => {
                const subjectChapters = chapters.filter(c => c.parentId === subject.id);
                const subjectTopics = topics.filter(t => 
                    subjectChapters.some(c => c.id === t.parentId)
                );
                const completedInSubject = subjectTopics.filter(t => completedIds[t.id]).length;
                const percentage = subjectTopics.length > 0 ? 
                    Math.round((completedInSubject / subjectTopics.length) * 100) : 0;
                
                return {
                    id: subject.id,
                    name: subject.name,
                    total: subjectTopics.length,
                    completed: completedInSubject,
                    percentage: percentage,
                    chaptersCount: subjectChapters.length
                };
            }).sort((a, b) => b.percentage - a.percentage); // Sort by completion percentage

            setProgressData({
                totalSubjects: subjects.length,
                totalChapters: chapters.length,
                totalTopics,
                completedTopics,
                overallPercentage,
                subjectStats,
                averageSubjectProgress: subjectStats.length > 0 ? 
                    Math.round(subjectStats.reduce((sum, s) => sum + s.percentage, 0) / subjectStats.length) : 0
            });

            setLastUpdated(new Date());

        } catch (err) {
            console.error("Error calculating progress:", err);
            setError(err.message);
            
            // More specific error messaging
            if (err.code === 'failed-precondition') {
                setError('Database index required. Please check the Firebase console for index creation instructions.');
            } else if (err.code === 'permission-denied') {
                setError('Permission denied. Please check your Firestore security rules.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [progress]);

    useEffect(() => {
        fetchDataAndCalculateProgress();
    }, [fetchDataAndCalculateProgress]);

    // Memoized chart data to prevent unnecessary recalculations
    const chartData = useMemo(() => {
        if (!progressData) return { bar: null, doughnut: null };

        const barData = {
            labels: progressData.subjectStats.map(s => s.name),
            datasets: [{
                label: 'Completion %',
                data: progressData.subjectStats.map(s => s.percentage),
                backgroundColor: progressData.subjectStats.map(s => 
                    s.percentage >= 80 ? 'rgba(34, 197, 94, 0.8)' :
                    s.percentage >= 60 ? 'rgba(251, 191, 36, 0.8)' :
                    s.percentage >= 40 ? 'rgba(249, 115, 22, 0.8)' :
                    'rgba(239, 68, 68, 0.8)'
                ),
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }],
        };

        const doughnutData = {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [progressData.completedTopics, progressData.totalTopics - progressData.completedTopics],
                backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(229, 231, 235, 0.8)'],
                borderColor: ['rgba(34, 197, 94, 1)', 'rgba(156, 163, 175, 1)'],
                borderWidth: 2,
                hoverOffset: 8,
            }],
        };

        return { bar: barData, doughnut: doughnutData };
    }, [progressData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <Skeleton height={40} width={200} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-6 rounded-xl shadow-md">
                                <Skeleton height={80} />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Skeleton height={400} />
                        <Skeleton height={400} />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
                <div className="max-w-2xl mx-auto text-center bg-white p-8 rounded-xl shadow-md">
                    <IoWarningOutline size={64} className="mx-auto text-red-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Progress Data</h2>
                    <p className="text-gray-600 mb-4">There was an error fetching the curriculum data.</p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-red-700 font-mono">{error}</p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => fetchDataAndCalculateProgress()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <IoRefreshOutline size={20} />
                            Retry
                        </button>
                        <Link
                            to="/progress"
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Go Back
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!progressData) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex items-center justify-center">
                <div className="text-center">
                    <IoBarChartOutline size={64} className="mx-auto text-gray-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No Progress Data Available</h2>
                    <p className="text-gray-600">Start studying to see your progress here!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <Link 
                        to="/progress" 
                        className="flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <IoArrowBack size={24} className="mr-2" />
                        Back
                    </Link>
                    <div className="text-center flex-1">
                        <h1 className="text-3xl font-bold text-gray-800">Progress Overview</h1>
                        {lastUpdated && (
                            <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                                <IoTimeOutline size={16} />
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => fetchDataAndCalculateProgress(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Refresh data"
                    >
                        <IoRefreshOutline size={20} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard 
                        icon={IoLibraryOutline} 
                        label="Total Subjects" 
                        value={progressData.totalSubjects}
                        color="blue"
                    />
                    <StatCard 
                        icon={IoCheckmarkDoneCircleOutline} 
                        label="Topics Completed" 
                        value={`${progressData.completedTopics} / ${progressData.totalTopics}`}
                        color="green"
                    />
                    <StatCard 
                        icon={IoBarChartOutline} 
                        label="Overall Progress" 
                        value={`${progressData.overallPercentage}%`}
                        color="purple"
                    />
                    <StatCard 
                        icon={IoTrendingUpOutline} 
                        label="Average Subject Progress" 
                        value={`${progressData.averageSubjectProgress}%`}
                        color="orange"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <IoBarChartOutline className="text-blue-600" />
                            Progress by Subject
                        </h3>
                        <div style={{ height: '300px' }}>
                            {chartData.bar && (
                                <Bar data={chartData.bar} options={chartOptions.bar} />
                            )}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <h3 className="text-xl font-semibold mb-4 text-center">Overall Completion</h3>
                        <div style={{ height: '300px' }}>
                            {chartData.doughnut && (
                                <Doughnut data={chartData.doughnut} options={chartOptions.doughnut} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Subject Details Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-xl font-semibold">Subject Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chapters
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Topics
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Progress
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {progressData.subjectStats.map((subject) => (
                                    <tr key={subject.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{subject.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {subject.chaptersCount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {subject.completed} / {subject.total}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                                    <div 
                                                        className={`h-2 rounded-full ${
                                                            subject.percentage >= 80 ? 'bg-green-500' :
                                                            subject.percentage >= 60 ? 'bg-yellow-500' :
                                                            subject.percentage >= 40 ? 'bg-orange-500' :
                                                            'bg-red-500'
                                                        }`}
                                                        style={{ width: `${subject.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    {subject.percentage}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressDetails;
