import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';

import { FaPlus, FaBook, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoArrowBack, IoDocumentsOutline, IoCloudOfflineOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';
import { HiPlus } from 'react-icons/hi2';

const ResourceChapters = ({ setHeaderTitle }) => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: categoryDoc } = useFirestoreDocument(['resources', categoryId]);

  useEffect(() => {
    setHeaderTitle(categoryDoc?.name || 'Chapters');
  }, [categoryDoc, setHeaderTitle]);

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

  const handleSaveChapter = useCallback(async (e) => {
    e.preventDefault();
    if (newChapterName.trim() === '') return;
    await addItem({ name: newChapterName.trim() });
    toast.success(isOnline ? "Chapter added!" : "Chapter saved locally!");
    setNewChapterName('');
    setIsAdding(false);
  }, [newChapterName, addItem, isOnline]);

  const handleDelete = useCallback(async (chapterId) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
        await deleteItem(chapterId, true);
        toast.success(isOnline ? "Chapter deleted!" : "Deletion saved locally!");
    }
  }, [deleteItem, isOnline]);

  const handleSaveRename = useCallback(async (e) => {
    e.preventDefault();
    if (renamingChapterName.trim() === '') return;
    await updateItem(renamingChapterId, { name: renamingChapterName.trim() });
    toast.success(isOnline ? "Chapter renamed!" : "Rename saved locally!");
    setRenamingChapterId(null);
    setRenamingChapterName('');
  }, [renamingChapterName, renamingChapterId, updateItem, isOnline]);

  const handleRenameClick = useCallback((chapter) => {
    setRenamingChapterId(chapter.id);
    setRenamingChapterName(chapter.name);
  }, []);
  
  const handleNavigateToChapter = useCallback((chapterId) => {
    if (!renamingChapterId) {
        navigate(`/resources/${categoryId}/${chapterId}`);
    }
  }, [navigate, categoryId, renamingChapterId]);

  const cancelAdd = () => { setIsAdding(false); setNewChapterName(''); };
  const cancelRename = () => { setRenamingChapterId(null); setRenamingChapterName(''); };

  const ChaptersSkeleton = () => (
    <div className="space-y-2">{Array(4).fill(0).map((_, i) => (<div key={i} className="p-3 bg-white rounded-lg border border-gray-100 flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-lg"></div><div className="flex-1 h-4 bg-gray-200 rounded"></div></div>))}</div>
  );

  const EmptyState = () => (
    <div className="text-center py-12 px-4"><div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl mx-auto flex items-center justify-center mb-4"><IoDocumentsOutline size={28} className="text-purple-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">No Chapters Yet</h3><p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto leading-relaxed">{currentUser ? "Add the first chapter to start organizing resources." : "Chapters will appear here once added."}</p>{currentUser && (<button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-all hover:shadow-md"><HiPlus className="mr-1.5" size={16} />Add Chapter</button>)}</div>
  );

  if (loading && !chapters) {
      return <div className="min-h-screen bg-gray-50"><div className="px-3 pt-4 pb-6 max-w-2xl mx-auto"><ChaptersSkeleton /></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 pt-4 pb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center flex-1 min-w-0">
                <Link to="/resources" className="flex items-center text-gray-600 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-200 transition-colors mr-2 flex-shrink-0"><IoArrowBack size={18} /></Link>
                <div className="min-w-0 flex-1"><h1 className="text-xl font-bold text-gray-900 truncate">{categoryDoc?.name || 'Chapters'}</h1><p className="text-xs text-gray-600">{chapters?.length || 0} chapters</p></div>
            </div>
            {currentUser && !isAdding && (<button onClick={() => setIsAdding(true)} className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-all hover:shadow-md ml-3 flex-shrink-0"><HiPlus className="mr-1.5" size={14} /><span className="hidden sm:inline">Add Chapter</span><span className="sm:hidden">Add</span></button>)}
        </div>
        <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
        
        {currentUser && isAdding && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Chapter</h3><form onSubmit={handleSaveChapter} className="space-y-3"><input type="text" value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} placeholder="Chapter name" className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelAdd} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" disabled={!newChapterName.trim()} className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center">{isOnline ? <MdCheck className="mr-1" size={14} /> : <IoCloudOfflineOutline className="mr-1" size={14} />}Save</button></div></form></div>
        )}
        
        <div className="space-y-2 mt-4">
            {chapters && chapters.length > 0 ? (
                chapters.map((chapter, index) => (
                    currentUser && renamingChapterId === chapter.id ? (
                        <div key={chapter.id} className="p-3 bg-white rounded-lg border-2 border-purple-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Edit Chapter</h3><form onSubmit={handleSaveRename} className="space-y-3"><input type="text" value={renamingChapterName} onChange={(e) => setRenamingChapterName(e.target.value)} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelRename} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" disabled={!renamingChapterName.trim()} className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50">Save</button></div></form></div>
                    ) : (
                        <ChapterItem key={chapter.id} chapter={chapter} index={index} currentUser={currentUser} onNavigate={handleNavigateToChapter} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} />
                    )
                ))
            ) : (<EmptyState />)}
        </div>
      </div>
    </div>
  );
};

const ChapterItem = ({ chapter, index, currentUser, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = chapter._metadata?.hasPendingWrites;
    return (
        <div className={`group bg-white rounded-lg border transition-all duration-200 cursor-pointer ${isPending ? 'opacity-75' : ''} border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm`} onClick={() => onNavigate(chapter.id)}>
            <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaBook className="text-purple-600" size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 mb-0.5 break-words leading-snug group-hover:text-purple-600">
                        {chapter.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                        Chapter {index + 1}
                        {isPending && <span className="text-orange-600 font-medium ml-1">• Syncing...</span>}
                    </p>
                </div>
                {currentUser && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); onRenameClick(chapter); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit chapter"><MdEdit size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteClick(chapter.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete chapter"><MdDelete size={16} /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceChapters;