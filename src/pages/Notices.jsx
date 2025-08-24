import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';
import { db } from '../firebaseConfig';
import { collection, query, orderBy } from 'firebase/firestore';

import { FaPlus, FaSearch } from "react-icons/fa";
import { IoFilterOutline, IoMegaphoneOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';
import NoticeCard from '../components/NoticeCard';
import NoticeEditorModal from '../components/NoticeEditorModal';

const EMPTY_NOTICE = { title: '', content: '', priority: 'normal' };

const Notices = ({ setHeaderTitle }) => {
  const { currentUser } = useAuth();
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => setHeaderTitle('Notices'), [setHeaderTitle]);

  const noticesQuery = useMemo(() => {
    return query(collection(db, "notices"), orderBy("createdAt", sortOrder));
  }, [sortOrder]);

  const {
    data: notices,
    loading,
    error,
    isOnline,
    fromCache,
    hasPendingWrites,
    addItem,
    updateItem,
    deleteItem
  } = useFirestoreCollection(noticesQuery);

  const filteredNotices = useMemo(() => {
    if (!notices) return [];
    if (!searchTerm.trim()) {
      return notices;
    }
    return notices.filter(notice =>
        notice.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, notices]);

  const handleOpenAddModal = () => {
    setEditingNotice(EMPTY_NOTICE);
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
    const { id, title, content, priority } = noticeData;
    if (id) {
        await updateItem(id, { title, content, priority });
    } else {
        await addItem({ title, content, priority });
    }
  };
  const handleDeleteNotice = async (id) => {
      await deleteItem(id, false);
  };
  const handleSortToggle = () => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');

  const NoticePageSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <Skeleton height={24} width="70%" className="mb-3" />
          <Skeleton count={3} />
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20">
        <IoMegaphoneOutline size={64} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Notices Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm 
                ? `We couldn't find any notices matching "${searchTerm}".`
                : "There are no announcements right now. Please check back later."
            }
        </p>
    </div>
  );

  if (notices === null) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <NoticePageSkeleton />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notice Board</h1>
            <p className="text-gray-600">Stay updated with the latest announcements</p>
          </div>
          {currentUser && (
            <button 
              onClick={handleOpenAddModal} 
              disabled={!isOnline}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaPlus className="mr-2" />
              {isOnline ? 'Add Notice' : 'Offline'}
            </button>
          )}
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search notices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={handleSortToggle}
                    className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                    <IoFilterOutline className="mr-2" />
                    {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </button>
            </div>
        </div>

        <div className="mb-6">
          <NetworkStatus 
            isOnline={isOnline}
            fromCache={fromCache}
            hasPendingWrites={hasPendingWrites}
          />
        </div>

        {loading && filteredNotices.length === 0 ? (
          <NoticePageSkeleton />
        ) : filteredNotices.length > 0 ? (
          <div className="space-y-6">
            {filteredNotices.map(notice => (
              <NoticeCard 
                key={notice.id}
                notice={notice}
                onDelete={handleDeleteNotice}
                onEdit={handleOpenEditModal}
                isOnline={isOnline}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {isEditorOpen && editingNotice && (
          <NoticeEditorModal 
            isOpen={isEditorOpen}
            onClose={handleCloseModal}
            onSave={handleSaveNotice}
            notice={editingNotice}
            isOnline={isOnline}
          />
      )}
    </div>
  );
};

export default Notices;