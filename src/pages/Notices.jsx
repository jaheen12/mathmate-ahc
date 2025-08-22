import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { FaPlus } from "react-icons/fa";
import NoticeCard from '../components/NoticeCard';
import NoticeEditorModal from '../components/NoticeEditorModal';
import { db } from '../firebaseConfig'; // Direct db import
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'; // Import all needed functions
import Skeleton from 'react-loading-skeleton';
import { IoMegaphoneOutline } from "react-icons/io5";
import { toast } from 'react-toastify';

const Notices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setEditorOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const { currentUser } = useAuth();

    // --- STANDARD and ROBUST data fetching with useEffect and onSnapshot ---
    useEffect(() => {
        setLoading(true);
        const noticesQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"));

        // onSnapshot creates a real-time listener that works offline
        const unsubscribe = onSnapshot(noticesQuery, (querySnapshot) => {
            const noticesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotices(noticesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notices: ", error);
            toast.error("Failed to load notices.");
            setLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, []); // Empty array ensures this runs only once on mount

    const handleOpenAddModal = () => {
        setEditingNotice({}); 
        setEditorOpen(true);
    };

    const handleOpenEditModal = (notice) => {
        setEditingNotice(notice);
        setEditorOpen(true);
    };

    const handleCloseModal = () => {
        setEditorOpen(false);
        setEditingNotice(null);
    };

    const handleSaveNotice = async (noticeData) => {
        const { id, title, content } = noticeData;

        if (id) {
            // This is an UPDATE
            try {
                const noticeDoc = doc(db, "notices", id);
                await updateDoc(noticeDoc, { title, content });
                toast.success("Notice updated successfully!");
            } catch (error) {
                console.error("Error updating notice: ", error);
                toast.error("Failed to update notice.");
            }
        } else {
            // This is a NEW notice
            try {
                await addDoc(collection(db, "notices"), { 
                    title, 
                    content, 
                    createdAt: new Date() 
                });
                toast.success("Notice added successfully!");
            } catch (error) {
                console.error("Error adding new notice: ", error);
                toast.error("Failed to add new notice.");
            }
        }
    };

    const handleDeleteNotice = async (id) => {
        if (window.confirm("Are you sure you want to delete this notice?")) {
            try {
                await deleteDoc(doc(db, "notices", id));
                toast.success("Notice deleted successfully!");
            } catch (error) {
                console.error("Error deleting notice: ", error);
                toast.error("Failed to delete notice.");
            }
        }
    };

    const NoticePageSkeleton = () => (
        <div className="space-y-4">
            {Array(3).fill().map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                    <Skeleton height={28} width="70%" className="mb-3" />
                    <Skeleton count={3} />
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-2">
            {currentUser && (
                <div className="flex justify-end mb-4">
                    <button onClick={handleOpenAddModal} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                        <FaPlus className="mr-2" />
                        Add Notice
                    </button>
                </div>
            )}

            {loading ? (
                <NoticePageSkeleton />
            ) : (
                notices.length > 0 ? (
                    <div className="space-y-4">
                        {notices.map(notice => (
                            <NoticeCard 
                                key={notice.id} 
                                notice={notice} 
                                onDelete={handleDeleteNotice}
                                onEdit={handleOpenEditModal}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center mt-10">
                        <IoMegaphoneOutline size={64} className="mx-auto text-gray-300" />
                        <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Notices Found</h2>
                        <p className="text-gray-500 mt-2">Check back later for important announcements.</p>
                    </div>
                )
            )}

            <NoticeEditorModal 
                isOpen={isEditorOpen}
                onClose={handleCloseModal}
                onSave={handleSaveNotice}
                notice={editingNotice}
            />
        </div>
    );
};

export default Notices;