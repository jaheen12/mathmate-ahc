import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStorageAsArray as useLocalStorage } from '../hooks/useLocalStorage';
import { collectionGroup, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Skeleton from 'react-loading-skeleton';
import { 
    IoBarChartOutline, 
    IoArrowForwardCircleOutline, 
    IoTrophyOutline,
    IoFlameOutline,
    IoCalendarOutline,
    IoCheckmarkCircleOutline,
    IoWarningOutline
} from "react-icons/io5";

// Memoized circular progress component
const CircularProgress = React.memo(({ percentage, size = 96, strokeWidth = 4, showAnimation = true }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    // Color based on progress
    const getProgressColor = (percent) => {
        if (percent >= 90) return 'text-emerald-500';
        if (percent >= 75) return 'text-green-500';
        if (percent >= 50) return 'text-blue-500';
        if (percent >= 25) return 'text-yellow-500';
        return 'text-red-400';
    };

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg 
                className="transform -rotate-90" 
                width={size} 
                height={size}
                viewBox={`0 0 ${size} ${size}`}
            >
                {/* Background circle */}
                <circle
                    className="text-gray-200"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <circle
                    className={getProgressColor(percentage)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ 
                        transition: showAnimation ? 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                        transformOrigin: 'center'
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-800 tabular-nums">
                    {percentage}%
                </span>
            </div>
        </div>
    );
});

CircularProgress.displayName = 'CircularProgress';

// Achievement badges component
const AchievementBadge = React.memo(({ type, value, label, icon: Icon, color = "gray" }) => (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-${color}-100 text-${color}-700 text-sm font-medium`}>
        <Icon size={16} />
        <span>{value}</span>
        <span className="text-xs opacity-75">{label}</span>
    </div>
));

AchievementBadge.displayName = 'AchievementBadge';

const StudyProgressWidget = ({ compact = false, showDetails = true }) => {
    const [stats, setStats] = useState({ 
        percentage: 0, 
        completed: 0, 
        total: 0,
        recentlyCompleted: 0,
        streak: 0,
        subjectsInProgress: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [progress] = useLocalStorage('studyProgress', { completedTopicIds: {} });

    // Memoized greeting message
    const greeting = useMemo(() => {
        const { percentage } = stats;
        
        const greetings = [
            { threshold: 100, message: "🎉 Congratulations! All topics completed!", color: "text-emerald-600" },
            { threshold: 90, message: "🔥 Almost perfect! Just a few more!", color: "text-green-600" },
            { threshold: 75, message: "⭐ Excellent progress! Keep it up!", color: "text-blue-600" },
            { threshold: 50, message: "📈 Great momentum! You're halfway there!", color: "text-blue-500" },
            { threshold: 25, message: "🚀 Good start! Building knowledge!", color: "text-yellow-600" },
            { threshold: 0, message: "✨ Ready to begin your learning journey?", color: "text-gray-600" }
        ];

        return greetings.find(g => percentage >= g.threshold);
    }, [stats.percentage]);

    // Calculate additional metrics
    const calculateEnhancedStats = useCallback(async () => {
        try {
            setError(null);
            
            // Fetch data concurrently
            const [topicsSnapshot, subjectsSnapshot, chaptersSnapshot] = await Promise.all([
                getDocs(collectionGroup(db, 'topics')),
                getDocs(collection(db, 'study_progress')),
                getDocs(collectionGroup(db, 'chapters'))
            ]);

            const totalTopics = topicsSnapshot.size;
            const completedIds = progress.completedTopicIds || {};
            const completedTopics = Object.keys(completedIds).length;
            const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

            // Calculate subjects with progress
            const subjects = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

            let subjectsInProgress = 0;
            subjects.forEach(subject => {
                const subjectChapters = chapters.filter(c => c.parentId === subject.id);
                const subjectTopics = topics.filter(t => 
                    subjectChapters.some(c => c.id === t.parentId)
                );
                const completedInSubject = subjectTopics.filter(t => completedIds[t.id]).length;
                
                if (completedInSubject > 0 && completedInSubject < subjectTopics.length) {
                    subjectsInProgress++;
                }
            });

            // Calculate recent progress (topics completed today)
            const today = new Date().toDateString();
            const recentlyCompleted = Object.values(completedIds).filter(timestamp => {
                if (!timestamp) return false;
                const completedDate = new Date(timestamp).toDateString();
                return completedDate === today;
            }).length;

            // Simple streak calculation (consecutive days with activity)
            let streak = 0;
            const completionDates = Object.values(completedIds)
                .filter(Boolean)
                .map(timestamp => new Date(timestamp).toDateString())
                .sort((a, b) => new Date(b) - new Date(a));

            if (completionDates.length > 0) {
                const uniqueDates = [...new Set(completionDates)];
                const today = new Date();
                
                for (let i = 0; i < uniqueDates.length; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(today.getDate() - i);
                    
                    if (uniqueDates.includes(checkDate.toDateString())) {
                        streak++;
                    } else {
                        break;
                    }
                }
            }
            
            setStats({ 
                percentage, 
                completed: completedTopics, 
                total: totalTopics,
                recentlyCompleted,
                streak,
                subjectsInProgress
            });
            
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Failed to calculate study stats:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [progress]);

    useEffect(() => {
        calculateEnhancedStats();
    }, [calculateEnhancedStats]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                    <Skeleton height={compact ? 80 : 150} borderRadius="0.5rem" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <IoWarningOutline size={20} className="text-red-500" />
                        <h2 className="text-lg font-bold text-gray-900">Study Progress</h2>
                    </div>
                    <div className="text-center py-4">
                        <p className="text-red-600 text-sm mb-2">Unable to load progress data</p>
                        <button
                            onClick={calculateEnhancedStats}
                            className="text-xs text-blue-600 hover:text-blue-700 underline"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CircularProgress 
                                percentage={stats.percentage} 
                                size={48} 
                                strokeWidth={3}
                                showAnimation={false}
                            />
                            <div>
                                <p className="font-semibold text-gray-900">{stats.percentage}% Complete</p>
                                <p className="text-sm text-gray-500">{stats.completed}/{stats.total} topics</p>
                            </div>
                        </div>
                        <Link 
                            to="/progress" 
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            <IoArrowForwardCircleOutline size={20} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-200">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <IoBarChartOutline size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Study Progress</h2>
                            {lastUpdated && (
                                <p className="text-xs text-gray-500">
                                    Updated {lastUpdated.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                    <Link 
                        to="/progress" 
                        className="group flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <span>View Details</span>
                        <IoArrowForwardCircleOutline 
                            size={16} 
                            className="group-hover:translate-x-1 transition-transform" 
                        />
                    </Link>
                </div>

                {/* Main Content */}
                <div className="flex items-center gap-6 mb-6">
                    {/* Circular Progress */}
                    <CircularProgress percentage={stats.percentage} />

                    {/* Progress Info */}
                    <div className="flex-1">
                        <div className="mb-3">
                            <p className={`font-semibold text-base ${greeting.color}`}>
                                {greeting.message}
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Topics completed:</span>
                                <span className="font-bold text-gray-900 tabular-nums">
                                    {stats.completed} / {stats.total}
                                </span>
                            </div>
                            
                            {stats.total > 0 && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${stats.percentage}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Achievement Badges */}
                {showDetails && (
                    <div className="flex flex-wrap gap-2">
                        {stats.recentlyCompleted > 0 && (
                            <AchievementBadge
                                type="today"
                                value={stats.recentlyCompleted}
                                label="today"
                                icon={IoCheckmarkCircleOutline}
                                color="green"
                            />
                        )}
                        
                        {stats.streak > 0 && (
                            <AchievementBadge
                                type="streak"
                                value={stats.streak}
                                label={stats.streak === 1 ? "day" : "days"}
                                icon={IoFlameOutline}
                                color="orange"
                            />
                        )}
                        
                        {stats.subjectsInProgress > 0 && (
                            <AchievementBadge
                                type="subjects"
                                value={stats.subjectsInProgress}
                                label="in progress"
                                icon={IoCalendarOutline}
                                color="blue"
                            />
                        )}
                        
                        {stats.percentage === 100 && (
                            <AchievementBadge
                                type="complete"
                                value="🏆"
                                label="All Done!"
                                icon={IoTrophyOutline}
                                color="yellow"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyProgressWidget;
