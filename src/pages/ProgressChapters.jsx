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

import { FaPlus, FaTimes, FaBook, FaChartLine } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck, MdCheckCircle } from "react-icons/md";
import { IoArrowBack, IoBarChartOutline, IoCloudOfflineOutline, IoBookOutline } from "react-icons/io5";
import { HiOutlineAcademicCap, HiPlus } from "react-icons/hi2";

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
        } catch (error) { 
            toast.error("Failed to add chapter"); 
        }
    }, [newChapterName, addItem, isOnline]);

    const handleDelete = useCallback(async (chapterId) => {
        if (window.confirm('Are you sure you want to delete this chapter and all its topics?')) {
            try {
                await deleteItem(chapterId, true);
                toast.success(isOnline ? "Chapter deleted!" : "Deletion saved locally!");
            } catch (error) { 
                toast.error("Failed to delete chapter"); 
            }
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
        } catch (error) { 
            toast.error("Failed to rename chapter"); 
        }
    }, [renamingChapterName, renamingChapterId, updateItem, isOnline]);
    
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

    const handleNavigate = (chapterId) => {
        if (!renamingChapterId) {
            navigate(`/progress/${subjectId}/${chapterId}`);
        }
    };

    const ChaptersSkeleton = () => (
        <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        </div>
                        <div className="flex space-x-2">
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl mx-auto flex items-center justify-center mb-6">
                <IoBookOutline size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Chapters Yet</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
                Add your first chapter to start organizing your study topics.
            </p>
            <button 
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
                <HiPlus className="mr-2" size={18} />
                Add Chapter
            </button>
        </div>
    );

    if (loading && !chapters) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="px-4 pt-6 pb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse mr-3"></div>
                        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                    <ChaptersSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-6 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center flex-1 min-w-0">
                        <Link 
                            to="/progress" 
                            className="flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors mr-3 flex-shrink-0"
                        >
                            <IoArrowBack size={20} />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-bold text-gray-900 truncate">
                                {subjectDoc?.name || 'Chapters'}
                            </h1>
                            <p className="text-sm text-gray-600">
                                {chapters?.length || 0} chapters
                            </p>
                        </div>
                    </div>
                    
                    {!isAdding && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors ml-4 flex-shrink-0"
                        >
                            <HiPlus className="mr-2" size={16} />
                            <span className="hidden sm:inline">Add Chapter</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    )}
                </div>

                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {/* Add Chapter Form */}
                {isAdding && (
                    <div className="mb-6 p-4 bg-white rounded-xl">
                        <h3 className="font-medium text-gray-900 mb-3">Add New Chapter</h3>
                        <form onSubmit={handleSaveChapter} className="space-y-4">
                            <input 
                                type="text" 
                                value={newChapterName} 
                                onChange={(e) => setNewChapterName(e.target.value)} 
                                placeholder="Chapter name" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                autoFocus 
                            />
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={cancelAdd} 
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={!newChapterName.trim()} 
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {isOnline ? <MdCheck className="mr-1" size={16} /> : <IoCloudOfflineOutline className="mr-1" size={16} />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Chapters List */}
                <div className="space-y-3">
                    {chapters && chapters.length > 0 ? (
                        chapters.map(chapter => (
                            renamingChapterId === chapter.id ? (
                                <div key={chapter.id} className="p-4 bg-white rounded-xl border border-blue-200">
                                    <h3 className="font-medium text-gray-900 mb-3">Edit Chapter</h3>
                                    <form onSubmit={handleSaveRename} className="space-y-4">
                                        <input 
                                            type="text" 
                                            value={renamingChapterName} 
                                            onChange={(e) => setRenamingChapterName(e.target.value)} 
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                            autoFocus 
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                type="button" 
                                                onClick={cancelRename} 
                                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={!renamingChapterName.trim()} 
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <ChapterItem 
                                    key={chapter.id} 
                                    subjectId={subjectId} 
                                    chapter={chapter} 
                                    progress={progress} 
                                    setProgress={setProgress} 
                                    onNavigate={handleNavigate} 
                                    onRenameClick={handleRenameClick} 
                                    onDeleteClick={handleDelete} 
                                />
                            )
                        ))
                    ) : ( 
                        <EmptyState /> 
                    )}
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
            try {
                const topicsPath = ['study_progress', subjectId, 'chapters', chapter.id, 'topics'];
                const topicsCollection = collection(db, ...topicsPath);
                const snapshot = await getDocs(topicsCollection);
                const topicIds = snapshot.docs.map(doc => doc.id);
                setTopics(topicIds);
            } catch (error) {
                console.error('Error fetching topics:', error);
                setTopics([]);
            } finally {
                setIsLoadingTopics(false);
            }
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
            if (isChecked) {
                topics.forEach(id => { newCompleted[id] = true; });
            } else {
                topics.forEach(id => { delete newCompleted[id]; });
            }
            return { completedTopicIds: newCompleted };
        });
    }, [topics, setProgress]);

    // Color based on progress
    const getProgressColor = () => {
        if (isAllComplete) return 'text-green-600';
        if (completedCount > 0) return 'text-blue-600';
        return 'text-gray-500';
    };

    const getCheckboxColor = () => {
        if (isAllComplete) return 'text-green-600 border-green-600';
        if (completedCount > 0) return 'text-blue-600 border-blue-600';
        return 'border-gray-300';
    };

    return (
        <div 
            className={`
                group bg-white rounded-xl transition-all duration-200 cursor-pointer
                hover:bg-gray-50 hover:shadow-sm
                ${isPending ? 'opacity-75' : ''}
            `}
            onClick={() => onNavigate(chapter.id)}
        >
            <div className="p-4 flex items-center gap-4">
                {/* Checkbox */}
                <div className="flex-shrink-0">
                    <input
                        type="checkbox"
                        className={`h-5 w-5 rounded focus:ring-2 focus:ring-blue-500 transition-colors ${getCheckboxColor()}`}
                        checked={isAllComplete}
                        onChange={handleMasterCheck}
                        disabled={isLoadingTopics || topics.length === 0}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Chapter Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    {isAllComplete ? (
                        <MdCheckCircle className="text-green-600" size={20} />
                    ) : (
                        <FaBook className="text-indigo-600" size={16} />
                    )}
                </div>
                
                {/* Chapter Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 break-words leading-tight">
                        {chapter.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                        <IoBarChartOutline size={14} className={getProgressColor()} />
                        <span className={`font-medium ${getProgressColor()}`}>
                            {isLoadingTopics ? (
                                "Loading..."
                            ) : topics.length === 0 ? (
                                "No topics yet"
                            ) : (
                                `${completedCount}/${topics.length} topics (${progressPercentage}%)`
                            )}
                        </span>
                        {isPending && (
                            <>
                                <span className="text-gray-400">•</span>
                                <span className="text-orange-600">Syncing...</span>
                            </>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {topics.length > 0 && (
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        isAllComplete 
                                            ? 'bg-gradient-to-r from-green-400 to-green-500' 
                                            : completedCount > 0 
                                                ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                                                : 'bg-gray-300'
                                    }`}
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRenameClick(chapter);
                        }} 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit chapter"
                    >
                        <MdEdit size={18} />
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(chapter.id);
                        }} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete chapter"
                    >
                        <MdDelete size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProgressChapters;