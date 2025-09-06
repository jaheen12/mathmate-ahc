import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import Skeleton from 'react-loading-skeleton';
import { 
  IoTimeOutline,
  IoNotificationsOutline,
  IoSchoolOutline,
  IoCalendarOutline,
  IoStatsChartOutline,
  IoMegaphoneOutline,
  IoArrowForwardCircleOutline,
  IoTrophyOutline,
  IoBookOutline,
  IoSunnyOutline,
  IoMoonOutline,
  IoPartlySunnyOutline
} from "react-icons/io5";
import useLocalStorage from '../hooks/useLocalStorage';
import { query, collection, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import StudyProgressWidget from '../components/StudyProgressWidget';

// Memoized AttendanceChart component for better performance
const AttendanceChart = React.memo(({ percentage }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercentage(percentage), 300);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  const getAttendanceColor = (p) => 
    p >= 90 ? 'text-emerald-600' : 
    p >= 80 ? 'text-green-600' : 
    p >= 60 ? 'text-yellow-600' : 
    'text-red-600';
  
  const getAttendanceMessage = (p) => 
    p >= 95 ? 'Outstanding' :
    p >= 90 ? 'Excellent' : 
    p >= 80 ? 'Good' : 
    p >= 60 ? 'Average' : 
    'Needs Improvement';
  
  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center w-24 h-24 mb-3">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
          <path 
            className="text-gray-200" 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
          />
          <path 
            className={`transition-all duration-1000 ease-out ${getAttendanceColor(animatedPercentage)}`} 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeDasharray={`${animatedPercentage}, 100`} 
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold tabular-nums ${getAttendanceColor(animatedPercentage)}`}>
            {animatedPercentage}%
          </span>
        </div>
      </div>
      <p className="text-gray-600 text-sm font-medium">{getAttendanceMessage(animatedPercentage)}</p>
      <p className="text-gray-400 text-xs mt-1">Overall Attendance</p>
    </div>
  );
});

AttendanceChart.displayName = 'AttendanceChart';

// Loading skeleton component for better UX
const LoadingSkeletons = React.memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 mb-6">
      <Skeleton height={60} borderRadius="0.5rem" className="animate-pulse" />
    </div>
    <div className="px-4 space-y-6">
      {Array.from({ length: 4 }, (_, index) => (
        <div 
          key={index} 
          style={{ animationDelay: `${index * 0.1}s` }} 
          className="animate-fade-in"
        >
          <Skeleton height={120} borderRadius="1rem" />
        </div>
      ))}
    </div>
  </div>
));

LoadingSkeletons.displayName = 'LoadingSkeletons';

// Widget card wrapper for consistent styling
const WidgetCard = React.memo(({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200 ${className}`}>
    {children}
  </div>
));

WidgetCard.displayName = 'WidgetCard';

const Dashboard = ({ setHeaderTitle }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const { value: attendanceData } = useLocalStorage('attendanceRecords', []);

  const { 
    data: scheduleDoc, 
    loading: scheduleLoading 
  } = useFirestoreDocument(['schedules', 'first_year']);

  const noticeQuery = useMemo(() => 
    query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(1)), 
    []
  );

  const {
    data: latestNotices,
    loading: noticesLoading,
    isOnline,
    fromCache,
    hasPendingWrites,
  } = useFirestoreCollection(noticeQuery);
  
  const latestNotice = latestNotices?.[0];

  // Update time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { 
    setHeaderTitle('Dashboard'); 
    setMounted(true);
  }, [setHeaderTitle]);
  
  // Memoized time parsing functions
  const parseTimeToMinutes = useCallback((timeStr) => {
    if (!timeStr) return 0;
    let cleanTime = timeStr.toString().trim();
    const hasAmPm = /AM|PM/i.test(cleanTime);
    
    if (hasAmPm) {
      const period = cleanTime.slice(-2).toUpperCase();
      const timePart = cleanTime.slice(0, -2).trim();
      let [hours, minutes] = timePart.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    } else {
      const parts = cleanTime.split(':');
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      return hours * 60 + minutes;
    }
  }, []);

  const parseTimeRange = useCallback((timeSlot) => {
    if (!timeSlot) return { startMinutes: 0, endMinutes: 0 };
    const timeStr = timeSlot.toString().trim();
    
    if (timeStr.includes('-')) {
      const [startTime, endTime] = timeStr.split('-').map(time => time.trim());
      return { 
        startMinutes: parseTimeToMinutes(startTime), 
        endMinutes: parseTimeToMinutes(endTime) 
      };
    } else {
      const startMinutes = parseTimeToMinutes(timeStr);
      return { startMinutes, endMinutes: startMinutes + 60 };
    }
  }, [parseTimeToMinutes]);

  // Enhanced upcoming classes calculation
  const upcomingClassesData = useMemo(() => {
    if (!scheduleDoc?.days) return { classes: [], day: '', nextClassCountdown: null };
    
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const todayIndex = currentTime.getDay();
    const todayName = daysOfWeek[todayIndex];
    
    const todayClasses = scheduleDoc.days[todayName] || [];
    const remainingTodayClasses = todayClasses
      .filter(classInfo => parseTimeRange(classInfo.timeSlot).endMinutes > currentTimeMinutes)
      .sort((a, b) => parseTimeRange(a.timeSlot).startMinutes - parseTimeRange(b.timeSlot).startMinutes);
    
    if (remainingTodayClasses.length > 0) {
      const nextClass = remainingTodayClasses[0];
      const { startMinutes: nextClassStartMinutes } = parseTimeRange(nextClass.timeSlot);
      const minutesUntilNext = nextClassStartMinutes - currentTimeMinutes;
      let countdown = null;
      
      if (minutesUntilNext > 0) {
        const hours = Math.floor(minutesUntilNext / 60);
        const mins = minutesUntilNext % 60;
        countdown = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      }
      
      return { 
        classes: remainingTodayClasses, 
        day: 'Today', 
        nextClassCountdown: countdown 
      };
    }
    
    // Look for next day with classes
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (todayIndex + i) % 7;
      const nextDayName = daysOfWeek[nextDayIndex];
      const nextDayClasses = scheduleDoc.days[nextDayName] || [];
      
      if (nextDayClasses.length > 0) {
        const sortedClasses = [...nextDayClasses]
          .sort((a, b) => parseTimeRange(a.timeSlot).startMinutes - parseTimeRange(b.timeSlot).startMinutes);
        return { 
          classes: sortedClasses, 
          day: nextDayName, 
          nextClassCountdown: null 
        };
      }
    }
    
    return { classes: [], day: '', nextClassCountdown: null };
  }, [scheduleDoc, currentTime, parseTimeRange]);

  // Memoized time and date strings
  const { timeString, dateString, greeting } = useMemo(() => {
    const hour = currentTime.getHours();
    const timeString = currentTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const dateString = currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let greeting = "Welcome Back!";
    if (hour < 12) greeting = "Good Morning!";
    else if (hour < 17) greeting = "Good Afternoon!";
    else greeting = "Good Evening!";
    
    return { timeString, dateString, greeting };
  }, [currentTime]);

  // Memoized attendance percentage
  const attendancePercentage = useMemo(() => 
    attendanceData?.length ? 
      Math.round((attendanceData.filter(r => r.status === 'present').length / attendanceData.length) * 100) : 
      0,
    [attendanceData]
  );

  // Get appropriate time icon
  const getTimeIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 12) return IoSunnyOutline;
    if (hour >= 12 && hour < 18) return IoPartlySunnyOutline;
    return IoMoonOutline;
  };

  const TimeIcon = getTimeIcon();
  
  if ((scheduleLoading && !scheduleDoc) || (noticesLoading && !latestNotices)) {
    return <LoadingSkeletons />;
  }
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              {greeting} 👋
            </h1>
            <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
              <TimeIcon size={16} />
              {dateString} • {timeString}
            </p>
            
            {upcomingClassesData.nextClassCountdown && (
              <div className="mt-3 inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <IoTimeOutline size={16} className="text-white mr-2" />
                <span className="text-white text-sm font-medium">
                  Next class in {upcomingClassesData.nextClassCountdown}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/20">
              <IoSchoolOutline size={28} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-6">
        <NetworkStatus 
          isOnline={isOnline} 
          fromCache={fromCache} 
          hasPendingWrites={hasPendingWrites} 
        />
        
        {/* Upcoming Classes Widget */}
        <WidgetCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <IoCalendarOutline size={20} className="text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Upcoming Classes
                  {upcomingClassesData.day && (
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      • {upcomingClassesData.day}
                    </span>
                  )}
                </h2>
              </div>
              <Link 
                to="/schedule" 
                className="group flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>View All</span>
                <IoArrowForwardCircleOutline 
                  size={16} 
                  className="group-hover:translate-x-1 transition-transform" 
                />
              </Link>
            </div>
            
            {upcomingClassesData.classes.length > 0 ? (
              <div className="space-y-3">
                {upcomingClassesData.classes.map((classInfo, index) => (
                  <div 
                    key={`${classInfo.subject}-${classInfo.timeSlot}-${index}`} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl transition-all duration-200 hover:shadow-sm hover:from-blue-50 hover:to-indigo-50 border border-gray-100 hover:border-blue-200" 
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IoBookOutline size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{classInfo.subject}</h3>
                        <p className="text-sm text-gray-600">{classInfo.teacher}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 tabular-nums">{classInfo.timeSlot}</p>
                      {upcomingClassesData.day === 'Today' && index === 0 && upcomingClassesData.nextClassCountdown && (
                        <p className="text-xs text-blue-600 font-medium">
                          in {upcomingClassesData.nextClassCountdown}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IoSchoolOutline size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No upcoming classes</p>
                <p className="text-gray-400 text-sm">Enjoy your free time! 🎉</p>
              </div>
            )}
          </div>
        </WidgetCard>

        {/* Latest Notice Widget */}
        <WidgetCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <IoNotificationsOutline size={20} className="text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Latest Notice</h2>
              </div>
              <Link 
                to="/notices" 
                className="group flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>View All</span>
                <IoArrowForwardCircleOutline 
                  size={16} 
                  className="group-hover:translate-x-1 transition-transform" 
                />
              </Link>
            </div>
            
            {latestNotice ? (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl transition-all duration-200 hover:shadow-sm hover:border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 mb-2">{latestNotice.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{latestNotice.content}</p>
                  </div>
                  <div className="ml-3 bg-blue-100 rounded-full p-2">
                    <IoMegaphoneOutline size={16} className="text-blue-600" />
                  </div>
                </div>
                {latestNotice.createdAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(latestNotice.createdAt.seconds * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <IoMegaphoneOutline size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No new notices</p>
                <p className="text-gray-400 text-sm">You're all caught up! ✅</p>
              </div>
            )}
          </div>
        </WidgetCard>

        {/* Enhanced Study Progress Widget */}
        <StudyProgressWidget showDetails={true} />

        {/* Enhanced Attendance Summary Widget */}
        <WidgetCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <IoStatsChartOutline size={20} className="text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Attendance Summary</h2>
              </div>
              <Link 
                to="/attendance" 
                className="group flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>Details</span>
                <IoArrowForwardCircleOutline 
                  size={16} 
                  className="group-hover:translate-x-1 transition-transform" 
                />
              </Link>
            </div>
            
            {attendanceData?.length > 0 ? (
              <div className="flex items-center justify-between">
                <AttendanceChart percentage={attendancePercentage} />
                <div className="flex-1 ml-6 space-y-3">
                  <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      Total Classes
                    </span>
                    <span className="font-semibold tabular-nums">{attendanceData.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Present
                    </span>
                    <span className="font-semibold text-green-600 tabular-nums">
                      {attendanceData.filter(r => r.status === 'present').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-3 bg-red-50 rounded-lg">
                    <span className="text-gray-600 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      Absent
                    </span>
                    <span className="font-semibold text-red-600 tabular-nums">
                      {attendanceData.filter(r => r.status === 'absent').length}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <IoTrophyOutline size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No attendance data yet</p>
                <p className="text-gray-400 text-sm">Start tracking your progress! 📊</p>
              </div>
            )}
          </div>
        </WidgetCard>
      </div>
    </div>
  );
};

export default Dashboard;
