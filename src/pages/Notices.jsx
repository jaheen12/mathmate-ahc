import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import NoticeCard from '../components/NoticeCard';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton'; // Import the skeleton component

const Notices = () => {
    const [notices, setNotices] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newNotice, setNewNotice] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchNotices = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "notices"));
                const noticesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                noticesData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
                setNotices(noticesData);
            } catch (error) {
                console.error("Error fetching notices: ", error);
                toast.error("Failed to fetch notices.");
            } finally {
                setLoading(false);
            }
        };

        fetchNotices();
    }, []);

    const handleSaveNotice = async () => {
        if (newNotice.title.trim() === '' || newNotice.content.trim() === '') {
            toast.error('Title and content cannot be empty');
            return;
        }
        try {
            const docRef = await addDoc(collection(db, "notices"), {
                ...newNotice,
                createdAt: new Date()
            });
            const newNoticesList = [{ id: docRef.id, ...newNotice, createdAt: { toDate: () => new Date() } }, ...notices];
            setNotices(newNoticesList);
            setNewNotice({ title: '', content: '' });
            setIsAdding(false);
            toast.success('Notice added successfully!');
        } catch (error) {
            console.error("Error adding notice: ", error);
            toast.error('Failed to add notice.');
        }
    };
    
    const handleDelete = async (noticeId) => {
        if (window.confirm("Are you sure you want to delete this notice?")) {
            try {
                await deleteDoc(doc(db, "notices", noticeId));
                setNotices(notices.filter(notice => notice.id !== noticeId));
                toast.success('Notice deleted successfully!');
            } catch (error) {
                console.error("Error deleting notice: ", error);
                toast.error('Failed to delete notice.');
            }
        }
    };
    
    const handleUpdate = async (noticeId, updatedTitle, updatedContent) => {
        try {
            const noticeDoc = doc(db, "notices", noticeId);
            await updateDoc(noticeDoc, {
                title: updatedTitle,
                content: updatedContent
            });
            setNotices(notices.map(n => n.id === noticeId ? { ...n, title: updatedTitle, content: updatedContent } : n));
            toast.success('Notice updated successfully!');
        } catch (error) {
            console.error("Error updating notice: ", error);
            toast.error('Failed to update notice.');
        }
    };

    // --- Loading Skeleton for Notices ---
    const NoticesSkeleton = () => (
        <div className="space-y-4">
            {Array(3).fill().map((_, index) => (
                <div key={index} className="p-4 border rounded-lg shadow bg-white">
                    <Skeleton height={28} width="70%" style={{ marginBottom: '12px' }} />
                    <Skeleton count={3} />
                    <div className="flex justify-end mt-4">
                        <Skeleton height={32} width={32} circle style={{ marginRight: '10px' }} />
                        <Skeleton height={32} width={32} circle />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto p-4">
             <div className="flex justify-between items-center mb-4">
                <Link to="/profile" className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
                <h1 className="text-2xl font-bold">Notices</h1>
                {currentUser && (
                    <button onClick={() => setIsAdding(true)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                        <FaPlus />
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-4 p-4 border rounded shadow">
                    <input
                        type="text"
                        value={newNotice.title}
                        onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                        placeholder="Notice title"
                        className="border p-2 w-full mb-2"
                    />
                    <textarea
                        value={newNotice.content}
                        onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                        placeholder="Notice content"
                        className="border p-2 w-full mb-2"
                        rows="4"
                    />
                    <button onClick={handleSaveNotice} className="bg-green-500 text-white p-2 rounded mr-2">Save</button>
                    <button onClick={() => setIsAdding(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                </div>
            )}

            {loading ? <NoticesSkeleton /> : (
                <div>
                    {notices.length > 0 ? (
                        <div className="space-y-4">
                            {notices.map(notice => (
                                <NoticeCard 
                                    key={notice.id} 
                                    notice={notice} 
                                    onDelete={handleDelete}
                                    onUpdate={handleUpdate}
                                />
                            ))}
                        </div>
                    ) : (
                        <p>No notices found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notices;