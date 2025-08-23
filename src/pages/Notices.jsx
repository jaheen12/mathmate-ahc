import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { FaPlus, FaSearch } from "react-icons/fa";
import NoticeCard from '../components/NoticeCard';
import NoticeEditorModal from '../components/NoticeEditorModal';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Skeleton from 'react-loading-skeleton';
import { IoMegaphoneOutline, IoFilterOutline } from "react-icons/io5";
import { toast } from 'react-toastify';

const Notices = ({ setHeaderTitle }) => {
    const [notices, setNotices] = useState([]);
    const [filteredNotices, setFilteredNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setEditorOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const { currentUser } = useAuth();

    useEffect(() => {
        setHeaderTitle('Notices');
    }, [setHeaderTitle]);

    useEffect(() => {
        setLoading(true);
        const noticesQuery = query(
            collection(db, "notices"), 
            orderBy("createdAt", sortOrder)
        );

        const unsubscribe = onSnapshot(noticesQuery, (querySnapshot) => {
            const noticesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotices(noticesData);
            setFilteredNotices(noticesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notices: ", error);
            toast.error("Failed to load notices.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sortOrder]);

    // Filter notices based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredNotices(notices);
        } else {
            const filtered = notices.filter(notice => 
                notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notice.content?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredNotices(filtered);
        }
    }, [searchTerm, notices]);

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
            // Update
            try {
                const noticeDoc = doc(db, "notices", id);
                await updateDoc(noticeDoc, { title, content });
                toast.success("Notice updated successfully!");
            } catch (error) {
                toast.error("Failed to update notice.");
            }
        } else {
            // Add new
            try {
                await addDoc(collection(db, "notices"), { 
                    title, 
                    content, 
                    createdAt: new Date() 
                });
                toast.success("Notice added successfully!");
            } catch (error) {
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
                toast.error("Failed to delete notice.");
            }
        }
    };

    const handleSortToggle = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    const NoticePageSkeleton = () => (
        <div className="space-y-6">
            {Array(3).fill().map((_, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm border border-gray-200 p-6 rounded-xl shadow-sm">
                    <Skeleton height={32} width="70%" className="mb-4" />
                    <Skeleton count={3} className="mb-2" />
                    <div className="flex justify-between items-center mt-4">
                        <Skeleton width={120} height={20} />
                        <div className="flex space-x-2">
                            <Skeleton width={32} height={32} />
                            <Skeleton width={32} height={32} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-16 px-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <IoMegaphoneOutline size={48} className="text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
                {searchTerm ? 'No matching notices' : 'No notices yet'}
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                {searchTerm 
                    ? `No notices found matching "${searchTerm}". Try a different search term.`
                    : 'Stay tuned for important announcements and updates from your organization.'
                }
            </p>
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    Clear Search
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notice Board</h1>
                            <p className="text-gray-600">Stay updated with the latest announcements</p>
                        </div>
                        
                        {currentUser && (
                            <button 
                                onClick={handleOpenAddModal} 
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 focus:outline-none"
                            >
                                <FaPlus className="mr-2" />
                                Add Notice
                            </button>
                        )}
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search notices by title or content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/80"
                                />
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSortToggle}
                                    className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    title={`Sort ${sortOrder === 'desc' ? 'oldest first' : 'newest first'}`}
                                >
                                    <IoFilterOutline className="mr-2" />
                                    {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                                </button>
                                
                                {filteredNotices.length > 0 && (
                                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                                        {filteredNotices.length} notice{filteredNotices.length !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {loading ? (
                    <NoticePageSkeleton />
                ) : (
                    filteredNotices.length > 0 ? (
                        <div className="space-y-6">
                            {filteredNotices.map((notice, index) => (
                                <div 
                                    key={notice.id}
                                    className="transform transition-all duration-300 hover:scale-[1.02]"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        animation: 'fadeInUp 0.6s ease-out forwards'
                                    }}
                                >
                                    <NoticeCard 
                                        notice={notice} 
                                        onDelete={handleDeleteNotice}
                                        onEdit={handleOpenEditModal}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState />
                    )
                )}
            </div>

            <NoticeEditorModal 
                isOpen={isEditorOpen}
                onClose={handleCloseModal}
                onSave={handleSaveNotice}
                notice={editingNotice}
            />

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default Notices;