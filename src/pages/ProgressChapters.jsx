import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import { useLocalStorageAsArray as useLocalStorage } from '../hooks/useLocalStorage';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

import { FaPlus, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoArrowBack, IoDocumentsOutline, IoCloudOfflineOutline } from "react-icons/io5";

const ProgressChapters = ({ setHeaderTitle }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();

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
    
    // UI State for forms
    const [newChapterName, setNewChapterName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [renamingChapterId, setRenamingChapterId] = useState(null);
    const [renamingChapterName, setRenamingChapterName] = useState('');

    const [progress, setProgress] = useLocalStorage('studyProgress', { completedTopicIds: {} });

    // Handlers for Admin CRUD operations
    const handleSaveChapter = useCallback(async (e) => {
        e.preventDefault();
        if (newChapterName.trim() === '') return;
        try {
            await addItem({ name: newChapterName.trim() });
            toast.success(isOnline ? "Chapter added!" : "Chapter saved locally!");
            setNewChapterName('');
            setIsAdding(false);
        } catch (error) { toast.error("Failed to add chapter."); }
    }, [newChapterName, addItem, isOnline]);

    const handleDelete = useCallback(async (chapterId) => {
        if (window.confirm('Are you sure you want to delete this chapter and all its topics?')) {
            try {
                await deleteItem(chapterId, true);
                toast.success(isOnline ? "Chapter deleted!" : "Deletion saved locally!");
            } catch (error) { toast.error("Failed to delete chapter."); }
        }
    }, [deleteItem, isOnline]);

    const handleSaveRename = useCallback(async (e) => {
        e.preventDefault();
        if (renamingChapterName.trim() === '') return;
        try {
            await updateItem(renamingChapterId, { name: renamingChapterName.trim() });
            toast.success(isOnline ? "Chapter renamed!" : "Rename saved locally!");
            setRenamingChapterId(null);
            setRenamingChapterName('');
        } catch (error) { toast.error("Failed to rename chapter."); }
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

    if (loading && !chapters) {
        return <div className="max-w-4xl mx-auto p-4 sm:p-6">Loading...</div>; // Simple loading state
    }

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <Link to="/progress" className="flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <IoArrowBack size={24} className="mr-2" />
                        <span className="font-semibold hidden sm:inline">Back to Subjects</span>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800 text-center flex-1 mx-4 truncate">{subjectDoc?.name || 'Chapters'}</h1>
                    {!isAdding && (
                        <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                            <FaPlus className="mr-2" /> Add Chapter
                        </button>
                    )}
                </div>
                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {isAdding && (
                    <form onSubmit={handleSaveChapter} className="my-4 p-4 bg-white rounded-lg shadow-md border">
                        <input type="text" value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} placeholder="New chapter name" className="border p-2 w-full mb-2 rounded-md" autoFocus />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={cancelAdd} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                            <button type="submit" disabled={!newChapterName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                                {isOnline ? <MdCheck /> : <IoCloudOfflineOutline />} Save
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-4">
                    {chapters && chapters.length > 0 ? (
                        <ul className="space-y-3">
                            {chapters.map(chapter => (
                                renamingChapterId === chapter.id ? (
                                    <form onSubmit={handleSaveRename} key={chapter.id} className="p-4 bg-white rounded-lg shadow-md border-2 border-blue-500">
                                        <input type="text" value={renamingChapterName} onChange={(e) => setRenamingChapterName(e.target.value)} className="border p-2 w-full mb-2 rounded-md" autoFocus />
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={cancelRename} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                                            <button type="submit" disabled={!renamingChapterName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50">Save Changes</button>
                                        </div>
                                    </form>
                                ) : (
                                    <ChapterItem key={chapter.id} subjectId={subjectId} chapter={chapter} progress={progress} setProgress={setProgress} onNavigate={handleNavigate} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} />
                                )
                            ))}
                        </ul>
                    ) : ( <div className="text-center mt-10"><p>No chapters yet. Add one to get started!</p></div> )}
                </div>
            </div>
        </div>
    );
};

const ChapterItem = ({ subjectId, chapter, progress, setProgress, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = chapter._metadata?.hasPendingWrites;
    const [topics, setTopics] = useState([]);
    const [isLoadingTopics, setIsLoadingTopics] = useState(true);

    // Fetch all topics for this chapter once to determine completion status
    useEffect(() => {
        const fetchTopics = async () => {
            const topicsPath = ['study_progress', subjectId, 'chapters', chapter.id, 'topics'];
            const topicsCollection = collection(db, ...topicsPath);
            const snapshot = await getDocs(topicsCollection);
            const topicIds = snapshot.docs.map(doc => doc.id);
            setTopics(topicIds);
            setIsLoadingTopics(false);
        };
        fetchTopics();
    }, [subjectId, chapter.id]);

    const completedCount = useMemo(() => {
        if (isLoadingTopics) return 0;
        return topics.filter(topicId => progress.completedTopicIds[topicId]).length;
    }, [progress, topics, isLoadingTopics]);

    const isAllComplete = !isLoadingTopics && topics.length > 0 && completedCount === topics.length;

    const handleMasterCheck = useCallback((e) => {
        const isChecked = e.target.checked;
        setProgress(currentProgress => {
            const newCompleted = { ...currentProgress.completedTopicIds };
            if (isChecked) {
                topics.forEach(id => { newCompleted[id] = true; });
            } else {
                topics.forEach(id => { delete newCompleted[id]; });
            }
            return { completedTopicIds: newCompleted };
        });
    }, [topics, setProgress]);

    return (
        <li className={`flex items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg group ${isPending ? 'opacity-60' : ''}`}>
            <div className="flex-shrink-0 mr-4">
                <input
                    type="checkbox"
                    className="h-6 w-6 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                    checked={isAllComplete}
                    onChange={handleMasterCheck}
                    disabled={isLoadingTopics || topics.length === 0}
                />
            </div>
            <div onClick={() => onNavigate(chapter.id)} className="cursor-pointer flex-grow min-w-0">
                <p className="font-semibold text-lg text-gray-800 truncate">{chapter.name}</p>
                <p className="text-sm text-gray-500">
                    {isLoadingTopics ? "Loading..." : `${completedCount} / ${topics.length} topics completed`}
                </p>
                {isPending && <span className="text-xs text-gray-500"> (saving...)</span>}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onRenameClick(chapter)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"><MdEdit size={22} /></button>
                <button onClick={() => onDeleteClick(chapter.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"><MdDelete size={22} /></button>
            </div>
        </li>
    );
};

export default ProgressChapters;
