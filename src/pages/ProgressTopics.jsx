import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import { useLocalStorageAsArray as useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from '../AuthContext';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';

import { FaPlus, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoArrowBack, IoCloudOfflineOutline, IoSchoolOutline } from "react-icons/io5";
import { HiPlus } from "react-icons/hi2";

const ProgressTopics = ({ setHeaderTitle }) => {
    const { subjectId, chapterId } = useParams();
    const { currentUser } = useAuth();

    const { data: chapterDoc } = useFirestoreDocument(['study_progress', subjectId, 'chapters', chapterId]);

    useEffect(() => {
        setHeaderTitle(chapterDoc?.name || 'Topics');
    }, [chapterDoc, setHeaderTitle]);

    const topicsPath = useMemo(() => ['study_progress', subjectId, 'chapters', chapterId, 'topics'], [subjectId, chapterId]);
    const { 
        data: topics, 
        loading, 
        addItem, 
        deleteItem, 
        updateItem,
        isOnline,
        fromCache,
        hasPendingWrites
    } = useFirestoreCollection(topicsPath);
    
    const [newTopicName, setNewTopicName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [renamingTopicId, setRenamingTopicId] = useState(null);
    const [renamingTopicName, setRenamingTopicName] = useState('');
    const [progress, setProgress] = useLocalStorage('studyProgress', { completedTopicIds: {} });

    const handleSaveTopic = useCallback(async (e) => {
        e.preventDefault();
        if (newTopicName.trim() === '') return;
        await addItem({ name: newTopicName.trim() });
        toast.success(isOnline ? "Topic added!" : "Topic saved locally!");
        setNewTopicName('');
        setIsAdding(false);
    }, [newTopicName, addItem, isOnline]);

    const handleDelete = useCallback(async (topicId) => {
        if (window.confirm('Are you sure you want to delete this topic?')) {
            await deleteItem(topicId);
            setProgress(current => {
                const newCompleted = { ...current.completedTopicIds };
                delete newCompleted[topicId];
                return { completedTopicIds: newCompleted };
            });
            toast.success(isOnline ? "Topic deleted!" : "Deletion saved locally!");
        }
    }, [deleteItem, isOnline, setProgress]);

    const handleSaveRename = useCallback(async (e) => {
        e.preventDefault();
        if (renamingTopicName.trim() === '') return;
        await updateItem(renamingTopicId, { name: renamingTopicName.trim() });
        toast.success(isOnline ? "Topic renamed!" : "Rename saved locally!");
        setRenamingTopicId(null);
        setRenamingTopicName('');
    }, [renamingTopicName, renamingTopicId, updateItem, isOnline]);
    
    const handleRenameClick = useCallback((topic) => {
        setRenamingTopicId(topic.id);
        setRenamingTopicName(topic.name);
    }, []);

    const cancelAdd = () => { setIsAdding(false); setNewTopicName(''); };
    const cancelRename = () => { setRenamingTopicId(null); setRenamingTopicName(''); };
    
    const TopicsSkeleton = () => (
        <div className="space-y-2">{Array(5).fill(0).map((_, i) => (<div key={i} className="bg-white rounded-lg p-3 border border-gray-100 flex items-center gap-3"><div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div><div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div></div>))}</div>
    );
    
    const EmptyState = () => (
        <div className="text-center py-12 px-4"><div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-green-100 rounded-2xl mx-auto flex items-center justify-center mb-4"><IoSchoolOutline size={28} className="text-blue-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">No Topics Yet</h3><p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto leading-relaxed">{currentUser ? "Add your first topic to start tracking your progress." : "Topics for this chapter will appear here."}</p>{currentUser && (<button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md"><HiPlus className="mr-1.5" size={16} />Add Topic</button>)}</div>
    );

    if (loading && !topics) {
        return <div className="min-h-screen bg-gray-50"><div className="px-3 pt-4 pb-6 max-w-2xl mx-auto"><TopicsSkeleton /></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-3 pt-4 pb-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center flex-1 min-w-0">
                        <Link to={`/progress/${subjectId}`} className="flex items-center text-gray-600 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-200 transition-colors mr-2 flex-shrink-0"><IoArrowBack size={18} /></Link>
                        <div className="min-w-0 flex-1"><h1 className="text-xl font-bold text-gray-900 truncate">{chapterDoc?.name || 'Topics'}</h1><p className="text-xs text-gray-600">{topics?.length || 0} topics</p></div>
                    </div>
                    {currentUser && !isAdding && (<button onClick={() => setIsAdding(true)} className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-md ml-3 flex-shrink-0"><HiPlus className="mr-1.5" size={14} /><span className="hidden sm:inline">Add Topic</span><span className="sm:hidden">Add</span></button>)}
                </div>
                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {currentUser && isAdding && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Topic</h3><form onSubmit={handleSaveTopic} className="space-y-3"><input type="text" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="Topic name" className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelAdd} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" disabled={!newTopicName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">{isOnline ? <MdCheck className="mr-1" size={14} /> : <IoCloudOfflineOutline className="mr-1" size={14} />}Save</button></div></form></div>
                )}

                <div className="space-y-2">
                    {topics && topics.length > 0 ? (
                        topics.map(topic => (
                            currentUser && renamingTopicId === topic.id ? (
                                <div key={topic.id} className="p-3 bg-white rounded-lg border-2 border-blue-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Edit Topic</h3><form onSubmit={handleSaveRename} className="space-y-3"><input type="text" value={renamingTopicName} onChange={(e) => setRenamingTopicName(e.target.value)} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelRename} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" disabled={!renamingTopicName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">Save</button></div></form></div>
                            ) : (
                                <TopicItem key={topic.id} topic={topic} progress={progress} setProgress={setProgress} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} currentUser={currentUser} />
                            )
                        ))
                    ) : ( <EmptyState /> )}
                </div>
            </div>
        </div>
    );
};

const TopicItem = ({ topic, progress, setProgress, onRenameClick, onDeleteClick, currentUser }) => {
    const isPending = topic._metadata?.hasPendingWrites;
    const isComplete = !!progress.completedTopicIds[topic.id];

    const handleCheck = useCallback((e) => {
        const isChecked = e.target.checked;
        setProgress(currentProgress => {
            const newCompleted = { ...currentProgress.completedTopicIds };
            // --- NEW: Add a timestamp when completing a topic ---
            if (isChecked) {
                newCompleted[topic.id] = new Date().toISOString();
            } else {
                delete newCompleted[topic.id];
            }
            return { completedTopicIds: newCompleted };
        });
    }, [topic.id, setProgress]);

    return (
        <div className={`group bg-white rounded-lg border transition-all duration-200 ${isPending ? 'opacity-75' : ''} ${isComplete ? 'bg-green-50 border-green-200' : 'border-gray-100 hover:border-gray-200'}`}>
            <label className="p-3 flex items-center gap-3 cursor-pointer">
                <div className="flex-shrink-0">
                    <input type="checkbox" className="h-4 w-4 rounded text-green-600 focus:ring-2 focus:ring-green-500 border-gray-300" checked={isComplete} onChange={handleCheck} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-medium text-gray-800 break-words leading-snug transition-colors ${isComplete ? 'line-through text-gray-500' : 'group-hover:text-blue-600'}`}>
                        {topic.name}
                    </p>
                    {isPending && <span className="text-xs text-orange-600 font-medium">Syncing...</span>}
                </div>
                {currentUser && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onRenameClick(topic); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit topic"><MdEdit size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteClick(topic.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete topic"><MdDelete size={16} /></button>
                    </div>
                )}
            </label>
        </div>
    );
};

export default ProgressTopics;