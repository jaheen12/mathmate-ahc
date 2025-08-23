import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import Skeleton from 'react-loading-skeleton';
import { 
    IoArrowForwardCircleOutline, 
    IoMegaphoneOutline, 
    IoTimeOutline, 
    IoPersonOutline,
    IoCalendarOutline,
    IoStatsChartOutline,
    IoSchoolOutline,
    IoTrophyOutline,
    IoBookOutline,
    IoNotificationsOutline,
    IoRefreshOutline
} from "react-icons/io5";
import AttendanceChart from '../components/AttendanceChart';
import useLocalStorage from '../hooks/useLocalStorage';

const Dashboard = ({ setHeaderTitle }) => {
    const [schedule, setSchedule] = useState(null);
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [upcomingDay, setUpcomingDay] = useState('');
    const [latestNotice, setLatestNotice] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    
    const { value: attendanceData } = useLocalStorage('attendanceRecords', []);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setHeaderTitle('Dashboard');
    }, [setHeaderTitle]);

    const getUpcomingClasses = (scheduleData) => {
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const now = new Date();
        const todayIndex = now.getDay();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        
        const parseTime = (timeStr) => {
            if (!timeStr) return 0;
            const period = timeStr.slice(-2).toUpperCase();
            const timePart = timeStr.slice(0, -2).trim();
            let [hours, minutes] = timePart.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 100 + (minutes || 0);
        };

        const todayName = daysOfWeek[todayIndex];
        const todayClasses = scheduleData?.days?.[todayName] || [];
        const remainingToday = todayClasses.filter(c => parseTime(c.time) > currentTime);
        
        if (remainingToday.length > 0) {
            setUpcomingClasses(remainingToday);
            setUpcomingDay('Today');
            return;
        }
        
        for (let i = 1; i <= 7; i++) {
            const nextDayIndex = (todayIndex + i) % 7;
            const nextDayName = daysOfWeek[nextDayIndex];
            const nextDayClasses = scheduleData?.days?.[nextDayName] || [];
            if (nextDayClasses.length > 0) {
                setUpcomingClasses(nextDayClasses);
                setUpcomingDay(nextDayName);
                return;
            }
        }
    };

    const fetchRemoteData = async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        
        try {
            const scheduleDocRef = doc(db, "schedules", "first_year");
            const scheduleSnap = await getDoc(scheduleDocRef);
            if (scheduleSnap.exists()) {
                const scheduleData = scheduleSnap.data();
                setSchedule(scheduleData);
                getUpcomingClasses(scheduleData);
            }

            const noticesRef = collection(db, "notices");
            const noticeQuery = query(noticesRef, orderBy("createdAt", "desc"), limit(1));
            const noticeSnap = await getDocs(noticeQuery);
            if (!noticeSnap.empty) {
                setLatestNotice({ id: noticeSnap.docs[0].id, ...noticeSnap.docs[0].data() });
            }

        } catch (error) {
            console.error("Error fetching dashboard data: ", error);
        } finally {
            if (showRefreshing) setRefreshing(false);
            else setLoading(false);
        }
    };

    useEffect(() => {
        fetchRemoteData();
    }, []);

    const handleRefresh = () => {
        fetchRemoteData(true);
    };

    const getCurrentTimeInfo = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        const dateString = now.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric' 
        });
        return { timeString, dateString };
    };

    const { timeString, dateString } = getCurrentTimeInfo();

    // Calculate attendance percentage
    const getAttendancePercentage = () => {
        if (!attendanceData || attendanceData.length === 0) return 0;
        const totalClasses = attendanceData.length;
        const attendedClasses = attendanceData.filter(record => record.status === 'present').length;
        return Math.round((attendedClasses / totalClasses) * 100);
    };

    const attendancePercentage = getAttendancePercentage();
    
    const LoadingSkeletons = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-2xl">
                <Skeleton width={200} height={32} baseColor="#ffffff40" highlightColor="#ffffff60" />
                <Skeleton width={150} height={20} className="mt-2" baseColor="#ffffff40" highlightColor="#ffffff60" />
            </div>
            <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <Skeleton width={150} height={28} className="mb-4" />
                        <Skeleton count={3} height={20} className="mb-2" />
                    </div>
                ))}
            </div>
        </div>
    );

    const EmptyState = ({ icon: Icon, title, description, action }) => (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Icon size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm mb-4">{description}</p>
            {action}
        </div>
    );

    if (loading) return <div className="p-4"><LoadingSkeletons /></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Enhanced Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white mb-1">
                            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}! 👋
                        </h1>
                        <p className="text-blue-100 text-sm">{dateString} • {timeString}</p>
                        <div className="mt-3 flex items-center space-x-4">
                            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                <p className="text-xs text-white font-medium">Active Student</p>
                            </div>
                            {attendancePercentage > 0 && (
                                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                                    <IoTrophyOutline size={12} className="text-yellow-200" />
                                    <p className="text-xs text-white font-medium">{attendancePercentage}% Attendance</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-all duration-200 disabled:opacity-50"
                        >
                            <IoRefreshOutline 
                                size={24} 
                                className={`text-white ${refreshing ? 'animate-spin' : ''}`} 
                            />
                        </button>
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <IoSchoolOutline size={28} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 pb-6 space-y-6">
                {/* Enhanced Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-h-[100px]">
                        <div className="flex items-center justify-between h-full">
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide truncate">Next Class</p>
                                <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                                    {upcomingClasses.length > 0 ? upcomingClasses[0].time : 'None'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                    {upcomingClasses.length > 0 ? upcomingClasses[0].subject : 'Free time'}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0 ml-2">
                                <IoTimeOutline size={20} className="text-blue-500" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-h-[100px]">
                        <div className="flex items-center justify-between h-full">
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide truncate">Today's Classes</p>
                                <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                                    {upcomingDay === 'Today' ? upcomingClasses.length : 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                    {upcomingDay === 'Today' ? 'Scheduled' : 'No classes today'}
                                </p>
                            </div>
                            <div className="bg-green-50 p-2 rounded-lg flex-shrink-0 ml-2">
                                <IoCalendarOutline size={20} className="text-green-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-h-[100px]">
                        <div className="flex items-center justify-between h-full">
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide truncate">Attendance</p>
                                <p className="text-lg font-bold text-gray-900 mt-1 truncate">{attendancePercentage}%</p>
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                    {attendanceData.length} total classes
                                </p>
                            </div>
                            <div className={`p-2 rounded-lg flex-shrink-0 ml-2 ${
                                attendancePercentage >= 75 ? 'bg-green-50' : 
                                attendancePercentage >= 60 ? 'bg-yellow-50' : 'bg-red-50'
                            }`}>
                                <IoStatsChartOutline size={20} className={
                                    attendancePercentage >= 75 ? 'text-green-500' : 
                                    attendancePercentage >= 60 ? 'text-yellow-500' : 'text-red-500'
                                } />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-h-[100px]">
                        <div className="flex items-center justify-between h-full">
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide truncate">New Notices</p>
                                <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                                    {latestNotice ? '1' : '0'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                    {latestNotice ? 'Unread' : 'All caught up'}
                                </p>
                            </div>
                            <div className="bg-orange-50 p-2 rounded-lg flex-shrink-0 ml-2">
                                <IoNotificationsOutline size={20} className="text-orange-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Upcoming Classes Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <IoCalendarOutline size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Upcoming Classes</h2>
                                    <p className="text-sm text-gray-600">Your schedule for {upcomingDay.toLowerCase()}</p>
                                </div>
                            </div>
                            {upcomingClasses.length > 0 && (
                                <Link 
                                    to="/schedule" 
                                    className="flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors bg-white px-3 py-2 rounded-lg hover:shadow-sm"
                                >
                                    <span>View All</span>
                                    <IoArrowForwardCircleOutline size={16} />
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        {upcomingClasses.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingClasses.slice(0, 3).map((classInfo, index) => (
                                    <div key={index} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-3 h-3 rounded-full ${
                                                index === 0 ? 'bg-blue-500' : 
                                                index === 1 ? 'bg-green-500' : 'bg-purple-500'
                                            }`}></div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{classInfo.subject}</h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <IoPersonOutline size={14} className="text-gray-400" />
                                                    <p className="text-sm text-gray-600">{classInfo.teacher}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{classInfo.time}</p>
                                            <p className="text-xs text-gray-500">{upcomingDay}</p>
                                            {index === 0 && (
                                                <span className="inline-block mt-1 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                                                    Next
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {upcomingClasses.length > 3 && (
                                    <p className="text-sm text-gray-500 text-center pt-2">
                                        +{upcomingClasses.length - 3} more classes today
                                    </p>
                                )}
                            </div>
                        ) : (
                            <EmptyState
                                icon={IoCalendarOutline}
                                title="No Upcoming Classes"
                                description="Looks like you have some free time! Perfect opportunity to review your notes or prepare for tomorrow."
                                action={
                                    <Link 
                                        to="/schedule" 
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        View Full Schedule →
                                    </Link>
                                }
                            />
                        )}
                    </div>
                </div>

                {/* Enhanced Latest Notice Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                    <IoMegaphoneOutline size={20} className="text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Latest Notice</h2>
                                    <p className="text-sm text-gray-600">Stay updated with important announcements</p>
                                </div>
                            </div>
                            {latestNotice && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                    New
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        {latestNotice ? (
                            <div 
                                className="group p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                                onClick={() => navigate('/notices')}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-orange-700 transition-colors">{latestNotice.title}</h3>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {latestNotice.content?.substring(0, 100)}...
                                        </p>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full">
                                                {latestNotice.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                                            </span>
                                            <div className="flex items-center space-x-1 text-sm font-medium text-orange-600 group-hover:text-orange-700 transition-colors">
                                                <span>View Details</span>
                                                <IoArrowForwardCircleOutline size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                icon={IoMegaphoneOutline}
                                title="No Recent Notices"
                                description="You're all caught up! New announcements will appear here when available."
                                action={
                                    <Link 
                                        to="/notices" 
                                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        View All Notices →
                                    </Link>
                                }
                            />
                        )}
                    </div>
                </div>

                {/* Enhanced Attendance Summary Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <IoStatsChartOutline size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Attendance Overview</h2>
                                    <p className="text-sm text-gray-600">Track your class participation</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                attendancePercentage >= 75 ? 'bg-green-100 text-green-700' : 
                                attendancePercentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {attendancePercentage >= 75 ? 'Excellent' : 
                                 attendancePercentage >= 60 ? 'Good' : 'Needs Improvement'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <AttendanceChart attendanceData={attendanceData || []} />
                        {attendanceData.length === 0 && (
                            <div className="text-center py-8">
                                <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <IoStatsChartOutline size={24} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Data</h3>
                                <p className="text-gray-500 text-sm">Start marking your attendance to see insights here.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link 
                        to="/schedule" 
                        className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 hover:scale-[1.02]"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-50 group-hover:bg-blue-100 p-3 rounded-lg transition-colors">
                                <IoCalendarOutline size={24} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Full Schedule</p>
                                <p className="text-sm text-gray-500">View all your classes and timings</p>
                            </div>
                            <IoArrowForwardCircleOutline size={20} className="text-gray-400 group-hover:text-blue-500 ml-auto transition-colors" />
                        </div>
                    </Link>
                    
                    <Link 
                        to="/notices" 
                        className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all duration-200 hover:scale-[1.02]"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="bg-orange-50 group-hover:bg-orange-100 p-3 rounded-lg transition-colors">
                                <IoMegaphoneOutline size={24} className="text-orange-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">All Notices</p>
                                <p className="text-sm text-gray-500">View all announcements and updates</p>
                            </div>
                            <IoArrowForwardCircleOutline size={20} className="text-gray-400 group-hover:text-orange-500 ml-auto transition-colors" />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;