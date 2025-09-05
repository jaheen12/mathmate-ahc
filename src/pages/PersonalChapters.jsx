import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';

import { FaPlus, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoArrowBack, IoDocumentsOutline, IoCloudOfflineOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const PersonalChapters = ({ setHeaderTitle }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const { data: subjectDoc } = useFirestoreDocument(['personal_notes', subjectId]);

    useEffect(() => {
        setHeaderTitle(subjectDoc?.name || 'Chapters');
    }, [subjectDoc, setHeaderTitle]);

    const chaptersPath = useMemo(() => subjectId ? ['personal_notes', subjectId, 'chapters'] : null, [subjectId]);
    const { 
        data: chapters, 
        loading, 
        addItem, 
        deleteItem, 
        updateItem,
        isOnline,
        fromCache,
        hasPendingWrites
    } = useFirestoreCollection(chaptersPath);
    
    const [newChapterName, setNewChapterName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [renamingChapterId, setRenamingChapterId] = useState(null);
    const [renamingChapterName, setRenamingChapterName] = useState('');

    const handleSaveChapter = useCallback(async (e) => {
        e.preventDefault();
        if (newChapterName.trim() === '' || !currentUser) return;
        try {
            await addItem({ name: newChapterName.trim() });
            toast.success(isOnline ? "Chapter created!" : "Chapter saved locally!");
            setNewChapterName('');
            setIsAdding(false);
        } catch (error) {
            toast.error("Failed to create chapter.");
        }
    }, [newChapterName, addItem, currentUser, isOnline]);

    const handleDelete = useCallback(async (chapterId) => {
        if (!currentUser) return;
        if (window.confirm('Are you sure you want to delete this chapter and all its notes?')) {
            try {
                await deleteItem(chapterId, true);
                toast.success(isOnline ? "Chapter deleted!" : "Deletion saved locally!");
            } catch (error) {
                toast.error("Failed to delete chapter.");
            }
        }
    }, [deleteItem, currentUser, isOnline]);

    const handleSaveRename = useCallback(async (e) => {
        e.preventDefault();
        if (renamingChapterName.trim() === '' || !currentUser) return;
        try {
            await updateItem(renamingChapterId, { name: renamingChapterName.trim() });
            toast.success(isOnline ? "Chapter renamed!" : "Rename saved locally!");
            setRenamingChapterId(null);
            setRenamingChapterName('');
        } catch (error) {
            toast.error("Failed to rename chapter.");
        }
    }, [renamingChapterName, renamingChapterId, updateItem, currentUser, isOnline]);
    
    const handleRenameClick = useCallback((chapter) => {
        setRenamingChapterId(chapter.id);
        setRenamingChapterName(chapter.name);
    }, []);

    const cancelAdd = () => {
        setIsAdding(false);
        setNewChapterName('');
    };
    
    const cancelRename = () => {
        setRenamingChapterId(null);
        setRenamingChapterName('');
    };

    const ChaptersSkeleton = () => (
        <ul className="space-y-3">
            {Array(4).fill(0).map((_, i) => (<li key={i} className="p-4 bg-white rounded-lg shadow-md"><Skeleton height={24} width="60%" /></li>))}
        </ul>
    );

    const EmptyState = () => (
        <div className="text-center mt-10">
            <IoDocumentsOutline size={64} className="mx-auto text-gray-300" />
            <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Chapters Yet</h2>
            <p className="text-gray-500 mt-2">Click "Add Chapter" to organize your notes.</p>
        </div>
    );
    
    if (loading && !chapters) {
        return (<div className="max-w-4xl mx-auto p-4 sm:p-6"><ChaptersSkeleton /></div>);
    }

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <Link to="/personal-notes" className="flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <IoArrowBack size={24} className="mr-2" />
                        <span className="font-semibold hidden sm:inline">Back to Subjects</span>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800 text-center flex-1 mx-4 truncate">{subjectDoc?.name || 'Chapters'}</h1>
                    {currentUser && !isAdding && !renamingChapterId && (
                        <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-transform transform hover:scale-105">
                            <FaPlus className="mr-2" /> Add Chapter
                        </button>
                    )}
                </div>
                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {isAdding && (
                    <form onSubmit={handleSaveChapter} className="my-4 p-4 bg-white rounded-lg shadow-md border animate-in fade-in-0 duration-300">
                        <input type="text" value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} placeholder="New chapter name" className="border p-2 w-full mb-2 rounded-md focus:ring-2 focus:ring-blue-500" autoFocus />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={cancelAdd} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"><FaTimes className="mr-1" />Cancel</button>
                            <button type="submit" disabled={!newChapterName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                                {isOnline ? <MdCheck /> : <IoCloudOfflineOutline />} Save
                            </button>
                        </div>
                    </form>
                )}

                {renamingChapterId && (
                     <form onSubmit={handleSaveRename} className="my-4 p-4 bg-white rounded-lg shadow-md border animate-in fade-in-0 duration-300">
                        <input type="text" value={renamingChapterName} onChange={(e) => setRenamingChapterName(e.target.value)} placeholder="Rename chapter" className="border p-2 w-full mb-2 rounded-md focus:ring-2 focus:ring-blue-500" autoFocus />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={cancelRename} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                            <button type="submit" disabled={!renamingChapterName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50">Save Changes</button>
                        </div>
                    </form>
                )}
            
                <div className="mt-4">
                    {loading && chapters.length === 0 ? <ChaptersSkeleton /> : chapters.length > 0 ? (
                        <ul className="space-y-3">
                            {chapters.map(chapter => (
                                <ChapterItem key={chapter.id} chapter={chapter} subjectId={subjectId} navigate={navigate} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} />
                            ))}
                        </ul>
                    ) : ( <EmptyState /> )}
                </div>
            </div>
        </div>
    );
};

// --- THIS IS THE ONLY CHANGE IN THIS FILE ---
const ChapterItem = ({ chapter, subjectId, navigate, onRenameClick, onDeleteClick }) => {
    const isPending = chapter._metadata?.hasPendingWrites;
    const handleNavigate = () => {
        // Pass the chapter name in the navigation state
        navigate(`/personal-notes/${subjectId}/${chapter.id}`, { state: { chapterName: chapter.name } });
    };

    return (
        <li className={`flex justify-between items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg ${isPending ? 'opacity-60' : ''}`}>
            <div onClick={handleNavigate} className="cursor-pointer font-semibold text-lg text-gray-800 flex-grow min-w-0 truncate">
                {chapter.name}
                {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => onRenameClick(chapter)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100"><MdEdit size={22} /></button>
                <button onClick={() => onDeleteClick(chapter.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100"><MdDelete size={22} /></button>
            </div>
        </li>
    );
};

export default PersonalChapters;