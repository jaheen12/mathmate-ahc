import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, writeBatch, doc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { format, startOfDay } from 'date-fns';
import Skeleton from 'react-loading-skeleton';
import { IoCheckmarkCircle, IoCloseCircle, IoSaveOutline } from 'react-icons/io5';

// The component now accepts the 'setHeaderTitle' prop
const Attendance = ({ setHeaderTitle }) => {
    const { currentUser } = useAuth();
    const [allRecords, setAllRecords] = useState([]);
    const [selectedDate, setSelectedDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
    const [draftForDate, setDraftForDate] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // --- NEW: Set the header title for this page ---
    useEffect(() => {
        setHeaderTitle('Attendance');
    }, [setHeaderTitle]);

    const mainSubjects = ["Major", "NM-PHY", "NM-STAT"];

    // Fetch all historical records for stats
    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const allRecordsQuery = query(collection(db, "attendance"), where("userId", "==", currentUser.uid));
        
        const unsubscribe = onSnapshot(allRecordsQuery, (snapshot) => {
            const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllRecords(records);
            setLoading(false);
        }, () => { setLoading(false); });

        return () => unsubscribe();
    }, [currentUser]);

    // When allRecords or selectedDate changes, update the draft for the selected date
    useEffect(() => {
        const recordsForSelectedDate = {};
        allRecords.forEach(rec => {
            if (rec.date === selectedDate) {
                recordsForSelectedDate[rec.subject] = { status: rec.status };
            }
        });
        setDraftForDate(recordsForSelectedDate);
        setHasUnsavedChanges(false);
    }, [allRecords, selectedDate]);

    // Calculate overall stats from all historical records
    const attendanceStats = useMemo(() => {
        const stats = {};
        mainSubjects.forEach(subject => {
            const subjectRecords = allRecords.filter(r => r.subject === subject);
            const total = subjectRecords.length;
            const present = subjectRecords.filter(r => r.status === 'present').length;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
            stats[subject] = { percentage, present, total };
        });
        return stats;
    }, [allRecords]);

    // Handle local state changes for the current draft
    const handleStatusChange = (subject, status) => {
        setDraftForDate(prevDraft => {
            const currentStatus = prevDraft[subject]?.status;
            const newDraft = { ...prevDraft };

            if (currentStatus === status) {
                delete newDraft[subject];
            } else {
                newDraft[subject] = { status };
            }
            return newDraft;
        });
        setHasUnsavedChanges(true);
    };
    
    // Save all changes for the selected date to Firestore
    const handleSaveChanges = async () => {
        if (!currentUser) return;
        if (window.confirm(`Save attendance changes for ${selectedDate}?`)) {
            try {
                const batch = writeBatch(db);
                const recordsForDateQuery = query(collection(db, "attendance"), where("userId", "==", currentUser.uid), where("date", "==", selectedDate));
                const existingDocs = await getDocs(recordsForDateQuery);

                existingDocs.forEach(doc => batch.delete(doc.ref));

                Object.entries(draftForDate).forEach(([subject, { status }]) => {
                    const newDocRef = doc(collection(db, "attendance"));
                    batch.set(newDocRef, { date: selectedDate, subject, status, userId: currentUser.uid });
                });

                await batch.commit();
                toast.success(`Attendance for ${selectedDate} saved!`);
                setHasUnsavedChanges(false);
            } catch (error) {
                console.error("Error saving attendance: ", error);
                toast.error("Failed to save changes.");
            }
        }
    };
    
    if (loading) {
        return <div className="p-4"><Skeleton count={5} height={80} /></div>;
    }

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">
                            Showing attendance for:
                        </label>
                        <input
                            id="attendance-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border p-2 rounded-md shadow-sm"
                        />
                    </div>
                    {hasUnsavedChanges && (
                        <button 
                            onClick={handleSaveChanges} 
                            className="flex items-center w-full md:w-auto justify-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 animate-pulse"
                        >
                            <IoSaveOutline className="mr-2" />
                            Save Changes for {selectedDate}
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {mainSubjects.map(subject => {
                    const stats = attendanceStats[subject] || { percentage: 0, present: 0, total: 0 };
                    const draftStatus = draftForDate[subject]?.status;
                    return (
                        <div key={subject} className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-700">{subject}</h3>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-600">{stats.percentage}%</p>
                                    <p className="text-xs text-gray-500">({stats.present} / {stats.total} classes)</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleStatusChange(subject, 'present')}
                                    className={`p-3 rounded-lg flex items-center justify-center font-semibold transition-all ${draftStatus === 'present' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-200 hover:bg-green-200'}`}
                                >
                                    <IoCheckmarkCircle className="mr-2" />
                                    Attended
                                </button>
                                <button
                                    onClick={() => handleStatusChange(subject, 'absent')}
                                    className={`p-3 rounded-lg flex items-center justify-center font-semibold transition-all ${draftStatus === 'absent' ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-200 hover:bg-red-200'}`}
                                >
                                    <IoCloseCircle className="mr-2" />
                                    Absent
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Attendance;