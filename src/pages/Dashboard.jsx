import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import Skeleton from 'react-loading-skeleton';
import { IoArrowForwardCircleOutline, IoMegaphoneOutline } from "react-icons/io5";
import AttendanceChart from '../components/AttendanceChart'; // Import the new component

const Dashboard = () => {
    const [schedule, setSchedule] = useState(null);
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [upcomingDay, setUpcomingDay] = useState('');
    const [latestNotice, setLatestNotice] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]); // State for attendance
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // (The getUpcomingClasses function is unchanged)
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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch schedule
                const scheduleDocRef = doc(db, "schedules", "first_year");
                const scheduleSnap = await getDoc(scheduleDocRef);
                if (scheduleSnap.exists()) {
                    const scheduleData = scheduleSnap.data();
                    setSchedule(scheduleData);
                    getUpcomingClasses(scheduleData);
                }

                // Fetch latest notice
                const noticesRef = collection(db, "notices");
                const noticeQuery = query(noticesRef, orderBy("createdAt", "desc"), limit(1));
                const noticeSnap = await getDocs(noticeQuery);
                if (!noticeSnap.empty) {
                    setLatestNotice({ id: noticeSnap.docs[0].id, ...noticeSnap.docs[0].data() });
                }
                
                // --- NEW: Fetch attendance data ---
                const attendanceRef = collection(db, "attendance");
                const attendanceSnap = await getDocs(attendanceRef);
                const attData = attendanceSnap.docs.map(doc => doc.data());
                setAttendanceData(attData);

            } catch (error) {
                console.error("Error fetching dashboard data: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    
    // Skeletons for all sections
    const LoadingSkeletons = () => (
        <>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <Skeleton width={150} height={28} />
                <div className="mt-4 space-y-3"><Skeleton count={2} height={40} /></div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <Skeleton width={130} height={28} />
                <div className="mt-4"><Skeleton height={24} /></div>
            </div>
             <div className="bg-white p-4 rounded-lg shadow-md">
                <Skeleton width={180} height={28} />
                <div className="mt-4"><Skeleton height={150} /></div>
            </div>
        </>
    );

    return (
        <div className="p-2 space-y-6">
            {loading ? <LoadingSkeletons /> : (
                <>
                    {/* Upcoming Classes Section */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Upcoming Classes</h2>
                        <div className="bg-white p-4 rounded-lg shadow-md">
                             {upcomingClasses.length > 0 ? (
                                <>
                                    <h3 className="text-lg font-semibold text-blue-600 mb-3">{upcomingDay}</h3>
                                    <ul className="space-y-2">
                                        {upcomingClasses.map((classInfo, index) => (
                                            <li key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                                                <div>
                                                    <p className="font-semibold text-gray-700">{classInfo.subject}</p>
                                                    <p className="text-sm text-gray-500">{classInfo.teacher}</p>
                                                </div>
                                                <p className="font-medium text-gray-600">{classInfo.time}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/schedule" className="mt-4 flex items-center justify-end text-sm text-blue-500 hover:text-blue-700">
                                        Full Schedule <IoArrowForwardCircleOutline className="ml-1" size={16} />
                                    </Link>
                                </>
                            ) : (
                                <p className="text-gray-500">No classes scheduled.</p>
                            )}
                        </div>
                    </section>

                    {/* Latest Notice Section */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Latest Notice</h2>
                        <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/notices')}>
                            {latestNotice ? (
                                <div className="flex items-center">
                                    <IoMegaphoneOutline size={24} className="text-indigo-500 mr-4" />
                                    <p className="font-semibold text-gray-700 truncate">{latestNotice.title}</p>
                                </div>
                            ) : (
                                <p className="text-gray-500">No recent notices.</p>
                            )}
                        </div>
                    </section>
                    
                    {/* --- NEW: Attendance Summary Section --- */}
                    <section>
                         <h2 className="text-xl font-bold text-gray-800 mb-3">Attendance Summary</h2>
                         <AttendanceChart attendanceData={attendanceData} />
                    </section>
                </>
            )}
        </div>
    );
};

export default Dashboard;