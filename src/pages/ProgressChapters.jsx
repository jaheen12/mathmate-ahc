import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import { useLocalStorageAsArray as useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../AuthContext'; // --- 1. IMPORT useAuth ---
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import { FaPlus, FaTimes, FaBook } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck, MdCheckCircle } from "react-icons/md";
import { IoArrowBack, IoBarChartOutline, IoCloudOfflineOutline, IoBookOutline } from "react-icons/io5";
import { HiPlus } from "react-icons/hi2";

const ProgressChapters = ({ setHeaderTitle }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth(); // --- 2. GET THE CURRENT USER ---

    const { data: subjectDoc } = useFirestoreDocument(['study_progress', subjectId]);

    useEffect(() => {
        setHeaderTitle(subjectDoc?.name || 'Chapters');
    }, [subjectDoc, setHeaderTitle]);

    const chaptersPath = useMemo(() => ['study_progress', subjectId, 'chapters'], [subjectId]);
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
    const [progress, setProgress] = useLocalStorage('studyProgress', { completedTopicIds: {} });

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

    const cancelAdd = () => { setIsAdding(false); setNewChapterName(''); };
    const cancelRename = () => { setRenamingChapterId(null); setRenamingChapterName(''); };

    const handleNavigate = (chapterId) => {
        if (!renamingChapterId) navigate(`/progress/${subjectId}/${chapterId}`);
    };

    const ChaptersSkeleton = () => (
        <div className="space-y-2">{Array(4).fill(0).map((_, i) => (<div key={i} className="bg-white rounded-lg p-3 border border-gray-100"><div className="flex items-center space-x-3"><div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div><div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div><div className="flex-1 space-y-1"><div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div><div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div><div className="h-1.5 bg-gray-200 rounded animate-pulse w-full mt-2"></div></div></div></div>))}</div>
    );

    const EmptyState = () => (
        <div className="text-center py-12 px-4"><div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl mx-auto flex items-center justify-center mb-4"><IoBookOutline size={28} className="text-indigo-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">No Chapters Yet</h3><p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto leading-relaxed">{currentUser ? "Add your first chapter to start organizing study topics." : "Chapters will appear here once they are added."}</p>{currentUser && (<button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md"><HiPlus className="mr-1.5" size={16} /> Add Chapter</button>)}</div>
    );

    if (loading && !chapters) {
        return <div className="min-h-screen bg-gray-50"><div className="px-3 pt-4 pb-6 max-w-2xl mx-auto"><div className="flex items-center mb-5"><div className="w-6 h-6 bg-gray-200 rounded animate-pulse mr-3"></div><div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div></div><ChaptersSkeleton /></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-3 pt-4 pb-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center flex-1 min-w-0">
                        <Link to="/progress" className="flex items-center text-gray-600 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-200 transition-colors mr-2 flex-shrink-0"><IoArrowBack size={18} /></Link>
                        <div className="min-w-0 flex-1"><h1 className="text-xl font-bold text-gray-900 truncate">{subjectDoc?.name || 'Chapters'}</h1><p className="text-xs text-gray-600">{chapters?.length || 0} chapters</p></div>
                    </div>
                    {/* --- 3. ADD AUTH CHECK HERE --- */}
                    {currentUser && !isAdding && (<button onClick={() => setIsAdding(true)} className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md ml-3 flex-shrink-0"><HiPlus className="mr-1.5" size={14} /><span className="hidden sm:inline">Add Chapter</span><span className="sm:hidden">Add</span></button>)}
                </div>

                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {/* --- 4. ADD AUTH CHECK HERE --- */}
                {currentUser && isAdding && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Chapter</h3><form onSubmit={handleSaveChapter} className="space-y-3"><input type="text" value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} placeholder="Chapter name" className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelAdd} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button><button type="submit" disabled={!newChapterName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">{isOnline ? <MdCheck className="mr-1" size={14} /> : <IoCloudOfflineOutline className="mr-1" size={14} />}Save</button></div></form></div>
                )}

                <div className="space-y-2">
                    {chapters && chapters.length > 0 ? (
                        chapters.map(chapter => (
                             // --- 5. ADD AUTH CHECK HERE ---
                            currentUser && renamingChapterId === chapter.id ? (
                                <div key={chapter.id} className="p-3 bg-white rounded-lg border-2 border-blue-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Edit Chapter</h3><form onSubmit={handleSaveRename} className="space-y-3"><input type="text" value={renamingChapterName} onChange={(e) => setRenamingChapterName(e.target.value)} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelRename} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button><button type="submit" disabled={!renamingChapterName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Save</button></div></form></div>
                            ) : (
                                <ChapterItem key={chapter.id} subjectId={subjectId} chapter={chapter} progress={progress} setProgress={setProgress} onNavigate={handleNavigate} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} currentUser={currentUser} />
                            )
                        ))
                    ) : ( <EmptyState /> )}
                </div>
            </div>
        </div>
    );
};

const ChapterItem = ({ subjectId, chapter, progress, setProgress, onNavigate, onRenameClick, onDeleteClick, currentUser }) => {
    const isPending = chapter._metadata?.hasPendingWrites;
    const [topics, setTopics] = useState([]);
    const [isLoadingTopics, setIsLoadingTopics] = useState(true);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const topicsPath = ['study_progress', subjectId, 'chapters', chapter.id, 'topics'];
                const topicsCollection = collection(db, ...topicsPath);
                const snapshot = await getDocs(topicsCollection);
                const topicIds = snapshot.docs.map(doc => doc.id);
                setTopics(topicIds);
            } catch (error) { console.error('Error fetching topics:', error); setTopics([]); } 
            finally { setIsLoadingTopics(false); }
        };
        fetchTopics();
    }, [subjectId, chapter.id]);

    const completedCount = useMemo(() => {
        if (isLoadingTopics) return 0;
        return topics.filter(topicId => progress.completedTopicIds[topicId]).length;
    }, [progress, topics, isLoadingTopics]);

    const isAllComplete = !isLoadingTopics && topics.length > 0 && completedCount === topics.length;
    const progressPercentage = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

    const handleMasterCheck = useCallback((e) => {
        e.stopPropagation();
        const isChecked = e.target.checked;
        setProgress(currentProgress => {
            const newCompleted = { ...currentProgress.completedTopicIds };
            if (isChecked) { topics.forEach(id => { newCompleted[id] = true; }); } 
            else { topics.forEach(id => { delete newCompleted[id]; }); }
            return { completedTopicIds: newCompleted };
        });
    }, [topics, setProgress]);

    const getProgressColor = () => {
        if (isAllComplete) return 'text-green-600';
        if (completedCount > 0) return 'text-blue-600';
        return 'text-gray-500';
    };
    const getCheckboxColor = () => {
        if (isAllComplete) return 'text-green-600 border-green-600 bg-green-50';
        if (completedCount > 0) return 'text-blue-600 border-blue-600 bg-blue-50';
        return 'border-gray-300';
    };

    return (
        <div className={`group bg-white rounded-lg border transition-all duration-200 cursor-pointer ${isPending ? 'opacity-75' : ''} border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm`} onClick={() => onNavigate(chapter.id)}>
            <div className="p-3 flex items-center gap-3">
                <div className="flex-shrink-0"><input type="checkbox" className={`h-4 w-4 rounded focus:ring-2 focus:ring-blue-500 transition-all ${getCheckboxColor()}`} checked={isAllComplete} onChange={handleMasterCheck} disabled={isLoadingTopics || topics.length === 0} onClick={(e) => e.stopPropagation()} /></div>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">{isAllComplete ? (<MdCheckCircle className="text-green-600" size={18} />) : (<FaBook className="text-indigo-600" size={14} />)}</div>
                <div className="flex-1 min-w-0"><h3 className="font-semibold text-base text-gray-900 mb-0.5 break-words leading-snug">{chapter.name}</h3><div className="flex items-center gap-1.5 text-xs"><IoBarChartOutline size={12} className={getProgressColor()} /><span className={`font-medium ${getProgressColor()}`}>{isLoadingTopics ? "Loading..." : topics.length === 0 ? "No topics yet" : `${completedCount}/${topics.length} topics (${progressPercentage}%)`}</span>{isPending && (<><span className="text-gray-300">•</span><span className="text-orange-600 font-medium">Syncing...</span></>)}</div>{topics.length > 0 && (<div className="mt-1.5"><div className="w-full bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full transition-all duration-300 ${isAllComplete ? 'bg-gradient-to-r from-green-400 to-green-500' : completedCount > 0 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gray-300'}`} style={{ width: `${progressPercentage}%` }}></div></div></div>)}</div>
                {/* --- 6. ADD AUTH CHECK HERE --- */}
                {currentUser && (<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); onRenameClick(chapter); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200" title="Edit chapter"><MdEdit size={16} /></button><button onClick={(e) => { e.stopPropagation(); onDeleteClick(chapter.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200" title="Delete chapter"><MdDelete size={16} /></button></div>)}
            </div>
        </div>
    );
};

export default ProgressChapters;