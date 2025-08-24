import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import Skeleton from 'react-loading-skeleton';
import { 
  IoTimeOutline,
  IoNotificationsOutline,
  IoSchoolOutline,
  IoRefreshOutline,
  IoCalendarOutline,
  IoStatsChartOutline,
  IoMegaphoneOutline,
  IoArrowForwardCircleOutline,
  IoPersonOutline,
  IoTrophyOutline
} from "react-icons/io5";
import useLocalStorage from '../hooks/useLocalStorage';
import { query, collection, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// This is an example, assuming you have a chart component
const AttendanceChart = ({ percentage }) => (
    <div className="text-center">
        <div className="text-4xl font-bold text-green-600">{percentage}%</div>
        <p className="text-gray-500 text-sm mt-1">Attendance</p>
    </div>
);


const Dashboard = ({ setHeaderTitle }) => {
  // --- STATE MANAGEMENT ---
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [upcomingDay, setUpcomingDay] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const { value: attendanceData } = useLocalStorage('attendanceRecords', []);

  // --- DATA FETCHING (using offline-first hooks) ---
  const { 
    data: scheduleDoc, 
    loading: scheduleLoading, 
    refresh: refreshSchedule 
  } = useFirestoreDocument(['schedules', 'first_year']);

  const noticeQuery = useMemo(() => query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(1)), []);
  const {
    data: latestNotices,
    loading: noticesLoading,
    isOnline,
    fromCache,
    hasPendingWrites,
    refresh: refreshNotices
  } = useFirestoreCollection(noticeQuery, { cacheFirst: true, backgroundSyncInterval: 60000 });
  
  const latestNotice = latestNotices?.[0];

  // --- DERIVED STATE & EFFECTS ---
  useEffect(() => { setHeaderTitle('Dashboard'); }, [setHeaderTitle]);

  useEffect(() => {
    if (scheduleDoc) {
      getUpcomingClasses(scheduleDoc.days);
    }
  }, [scheduleDoc]);

  const handleRefresh = async () => {
    if (!isOnline) return;
    setRefreshing(true);
    await Promise.all([
      refreshSchedule(true),
      refreshNotices(true)
    ]);
    setRefreshing(false);
  };
  
  // --- HELPERS ---
  const getUpcomingClasses = (scheduleDays) => {
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
    const todayClasses = scheduleDays?.[todayName] || [];
    const remainingToday = todayClasses.filter(c => parseTime(c.time) > currentTime);
    
    if (remainingToday.length > 0) {
        setUpcomingClasses(remainingToday);
        setUpcomingDay('Today');
        return;
    }
    
    for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (todayIndex + i) % 7;
        const nextDayName = daysOfWeek[nextDayIndex];
        const nextDayClasses = scheduleDays?.[nextDayName] || [];
        if (nextDayClasses.length > 0) {
            setUpcomingClasses(nextDayClasses);
            setUpcomingDay(nextDayName);
            return;
        }
    }
    // If no classes are found in the next 7 days, clear the state
    setUpcomingClasses([]);
    setUpcomingDay('');
  };

  const { timeString, dateString } = (() => {
    const now = new Date();
    return {
      timeString: now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}),
      dateString: now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})
    };
  })();

  const attendancePercentage = attendanceData?.length ? Math.round((attendanceData.filter(r=>r.status==='present').length/attendanceData.length)*100) : 0;
  
  // --- RENDER LOGIC ---
  const LoadingSkeletons = () => (
    <div className="space-y-6 p-4">
        <Skeleton height={120} borderRadius="1rem" />
        <Skeleton height={80} count={3} borderRadius="1rem" />
    </div>
  );

  // CRITICAL: Guard clause to prevent rendering with incomplete data
  if ((scheduleLoading && !scheduleDoc) || (noticesLoading && !latestNotices)) {
      return <LoadingSkeletons />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 mb-6 relative overflow-hidden">
        <div className="relative flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                    Welcome Back!
                </h1>
                <p className="text-blue-100 text-sm">{dateString} • {timeString}</p>
            </div>
            <div className="flex items-center space-x-3">
                <button
                    onClick={handleRefresh}
                    disabled={refreshing || !isOnline}
                    className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-all duration-200 disabled:opacity-50"
                >
                    <IoRefreshOutline size={24} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <IoSchoolOutline size={28} className="text-white" />
                </div>
            </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-6 space-y-6">
        <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
        
        {/* Upcoming Classes Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Upcoming Classes ({upcomingDay || 'Soon'})</h2>
                    <Link to="/schedule" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
                </div>
                {upcomingClasses.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingClasses.slice(0, 3).map((classInfo, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{classInfo.subject}</h3>
                                    <p className="text-sm text-gray-600">{classInfo.teacher}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">{classInfo.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No upcoming classes. Enjoy your free time!</p>
                )}
            </div>
        </div>

        {/* Latest Notice Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Latest Notice</h2>
                    <Link to="/notices" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
                </div>
                {latestNotice ? (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <h3 className="font-semibold text-blue-800">{latestNotice.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{latestNotice.content}</p>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No new notices to show.</p>
                )}
            </div>
        </div>

        {/* Attendance Summary Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Attendance</h2>
                    <Link to="/attendance" className="text-sm font-medium text-blue-600 hover:text-blue-700">Details</Link>
                </div>
                {attendanceData?.length > 0 ? (
                    <AttendanceChart percentage={attendancePercentage} />
                ) : (
                    <p className="text-center text-gray-500 py-8">No attendance data recorded yet.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;