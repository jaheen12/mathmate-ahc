import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';

import { FaPlus, FaSearch, FaBook, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoArrowBack, IoDocumentsOutline, IoCloudOfflineOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const ResourceChapters = ({ setHeaderTitle }) => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = !!currentUser;

  // --- CHANGE: Simplified data hook ---
  const { data: categoryDoc } = useFirestoreDocument(['resources', categoryId]);

  useEffect(() => {
    setHeaderTitle(categoryDoc?.name || 'Chapters');
  }, [categoryDoc, setHeaderTitle]);

  // --- CHANGE: Simplified data hook ---
  const { 
    data: chapters, 
    loading, 
    addItem, 
    deleteItem, 
    updateItem,
    isOnline,
    fromCache,
    hasPendingWrites
  } = useFirestoreCollection(['resources', categoryId, 'chapters']);
  
  const [newChapterName, setNewChapterName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [renamingChapterId, setRenamingChapterId] = useState(null);
  const [renamingChapterName, setRenamingChapterName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChapters = useMemo(() => {
    if (!chapters) return [];
    return chapters.filter(chapter =>
      chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chapters, searchTerm]);

  // --- Handlers with toast feedback and offline support ---
  const handleSaveChapter = useCallback(async (e) => {
    e.preventDefault();
    if (newChapterName.trim() === '' || !isAdmin) return;
    try {
        await addItem({ name: newChapterName.trim() });
        toast.success(isOnline ? "Chapter added!" : "Chapter saved locally!");
        setNewChapterName('');
        setIsAdding(false);
    } catch (error) {
        toast.error("Failed to add chapter.");
        console.error(error);
    }
  }, [newChapterName, addItem, isAdmin, isOnline]);

  const handleDelete = useCallback(async (chapterId) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this chapter and all items inside it?')) {
        try {
            await deleteItem(chapterId, false);
            toast.success(isOnline ? "Chapter deleted!" : "Deletion saved locally!");
        } catch (error) {
            toast.error("Failed to delete chapter.");
            console.error(error);
        }
    }
  }, [deleteItem, isAdmin, isOnline]);

  const handleSaveRename = useCallback(async (e) => {
    e.preventDefault();
    if (renamingChapterName.trim() === '' || !isAdmin) return;
    try {
        await updateItem(renamingChapterId, { name: renamingChapterName.trim() });
        toast.success(isOnline ? "Chapter renamed!" : "Rename saved locally!");
        setRenamingChapterId(null);
        setRenamingChapterName('');
    } catch (error) {
        toast.error("Failed to rename chapter.");
        console.error(error);
    }
  }, [renamingChapterName, renamingChapterId, updateItem, isAdmin, isOnline]);

  const handleRenameClick = useCallback((chapter) => {
    setRenamingChapterId(chapter.id);
    setRenamingChapterName(chapter.name);
  }, []);
  
  const handleNavigateToChapter = useCallback((chapterId) => {
    if (!renamingChapterId) {
        navigate(`/resources/${categoryId}/${chapterId}`);
    }
  }, [navigate, categoryId, renamingChapterId]);

  const cancelAdd = () => {
    setIsAdding(false);
    setNewChapterName('');
  };

  const cancelRename = () => {
    setRenamingChapterId(null);
    setRenamingChapterName('');
  };

  const ChaptersSkeleton = () => (
    <div className="space-y-3">
        {Array(4).fill().map((_, i) => (<div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100"><Skeleton height={28} width="60%" /></div>))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20">
        <IoDocumentsOutline size={80} className="mx-auto text-gray-300" />
        <h3 className="text-2xl font-bold text-gray-700 mt-4">No Chapters Yet</h3>
        <p className="text-gray-500 mt-2">Create the first chapter to start adding resources.</p>
    </div>
  );

  if (loading && !chapters) {
      return (<div className="max-w-6xl mx-auto p-6"><ChaptersSkeleton /></div>);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <Link to="/resources" className="p-3 rounded-xl hover:bg-white/70 transition-colors"><IoArrowBack size={24} /></Link>
            <h1 className="text-3xl font-bold text-gray-800 text-center flex-1 mx-4 truncate">{categoryDoc?.name || 'Chapters'}</h1>
            {isAdmin && !isAdding && (
              <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl shadow-lg hover:bg-purple-700 transform hover:scale-105 transition-all">
                <FaPlus className="mr-2" /> Add Chapter
              </button>
            )}
        </div>
        <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
        
        {isAdding && (
            <form onSubmit={handleSaveChapter} className="my-6 p-4 bg-white rounded-xl shadow-md border animate-in fade-in-0 duration-300">
                <h4 className="font-semibold mb-2">Add New Chapter</h4>
                <div className="flex gap-2">
                    <input type="text" value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} placeholder="Enter chapter name..." className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" autoFocus />
                    <button type="button" onClick={cancelAdd} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"><FaTimes /></button>
                    <button type="submit" disabled={!newChapterName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                        {isOnline ? <MdCheck /> : <IoCloudOfflineOutline />} Create
                    </button>
                </div>
            </form>
        )}
        
        <div className="mt-6">
            {loading && filteredChapters.length === 0 ? <ChaptersSkeleton /> : filteredChapters.length > 0 ? (
                <div className="space-y-3">
                    {filteredChapters.map((chapter, index) => (
                        renamingChapterId === chapter.id ? (
                            <form onSubmit={handleSaveRename} key={chapter.id} className="p-4 bg-white rounded-xl shadow-lg border-2 border-purple-500">
                                <div className="flex gap-2 items-center">
                                    <input type="text" value={renamingChapterName} onChange={(e) => setRenamingChapterName(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" autoFocus />
                                    <button type="button" onClick={cancelRename} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"><FaTimes /></button>
                                    <button type="submit" disabled={!renamingChapterName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                                        <MdCheck /> Save
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <ChapterItem key={chapter.id} chapter={chapter} index={index} isAdmin={isAdmin} onNavigate={handleNavigateToChapter} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} />
                        )
                    ))}
                </div>
            ) : (<EmptyState />)}
        </div>
      </div>
    </div>
  );
};

const ChapterItem = ({ chapter, index, isAdmin, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = chapter._metadata?.hasPendingWrites;
    const [hovered, setHovered] = useState(false);
    return (
        <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-purple-300 transition-all duration-300 ${isPending ? 'opacity-60' : ''}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div className="p-6 flex items-center justify-between">
                <div onClick={() => onNavigate(chapter.id)} className="flex items-center space-x-4 cursor-pointer flex-grow min-w-0">
                    <div className="p-3 bg-purple-100 rounded-lg"><FaBook className="text-purple-600" /></div>
                    <div>
                        <h3 className="font-semibold text-xl text-gray-900 group-hover:text-purple-600 truncate">
                            {chapter.name}
                            {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Chapter {index + 1}</p>
                    </div>
                </div>
                {isAdmin && (
                    <div className={`flex items-center space-x-2 ml-4 transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                        <button onClick={() => onRenameClick(chapter)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><MdEdit className="text-lg" /></button>
                        <button onClick={() => onDeleteClick(chapter.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><MdDelete className="text-lg" /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceChapters;