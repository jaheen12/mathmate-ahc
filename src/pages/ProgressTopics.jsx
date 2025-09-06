import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import { useLocalStorageAsArray as useLocalStorage } from '../hooks/useLocalStorage';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';

import { FaPlus, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoArrowBack, IoNewspaperOutline, IoCloudOfflineOutline } from "react-icons/io5";

const ProgressTopics = ({ setHeaderTitle }) => {
    const { subjectId, chapterId } = useParams();

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
    
    // UI State for forms
    const [newTopicName, setNewTopicName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [renamingTopicId, setRenamingTopicId] = useState(null);
    const [renamingTopicName, setRenamingTopicName] = useState('');

    const [progress, setProgress] = useLocalStorage('studyProgress', { completedTopicIds: {} });

    // Handlers for Admin CRUD operations
    const handleSaveTopic = useCallback(async (e) => {
        e.preventDefault();
        if (newTopicName.trim() === '') return;
        try {
            await addItem({ name: newTopicName.trim() });
            toast.success(isOnline ? "Topic added!" : "Topic saved locally!");
            setNewTopicName('');
            setIsAdding(false);
        } catch (error) { toast.error("Failed to add topic."); }
    }, [newTopicName, addItem, isOnline]);

    const handleDelete = useCallback(async (topicId) => {
        if (window.confirm('Are you sure you want to delete this topic?')) {
            try {
                await deleteItem(topicId);
                // Also remove it from local progress if it exists
                setProgress(current => {
                    const newCompleted = { ...current.completedTopicIds };
                    delete newCompleted[topicId];
                    return { completedTopicIds: newCompleted };
                });
                toast.success(isOnline ? "Topic deleted!" : "Deletion saved locally!");
            } catch (error) { toast.error("Failed to delete topic."); }
        }
    }, [deleteItem, isOnline, setProgress]);

    const handleSaveRename = useCallback(async (e) => {
        e.preventDefault();
        if (renamingTopicName.trim() === '') return;
        try {
            await updateItem(renamingTopicId, { name: renamingTopicName.trim() });
            toast.success(isOnline ? "Topic renamed!" : "Rename saved locally!");
            setRenamingTopicId(null);
            setRenamingTopicName('');
        } catch (error) { toast.error("Failed to rename topic."); }
    }, [renamingTopicName, renamingTopicId, updateItem, isOnline]);
    
    const handleRenameClick = useCallback((topic) => {
        setRenamingTopicId(topic.id);
        setRenamingTopicName(topic.name);
    }, []);

    const cancelAdd = () => { setIsAdding(false); setNewTopicName(''); };
    const cancelRename = () => { setRenamingTopicId(null); setRenamingTopicName(''); };
    
    if (loading && !topics) {
        return <div className="max-w-4xl mx-auto p-4 sm:p-6">Loading...</div>;
    }

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <Link to={`/progress/${subjectId}`} className="flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <IoArrowBack size={24} className="mr-2" />
                        <span className="font-semibold hidden sm:inline">Back to Chapters</span>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800 text-center flex-1 mx-4 truncate">{chapterDoc?.name || 'Topics'}</h1>
                    {!isAdding && (
                        <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                            <FaPlus className="mr-2" /> Add Topic
                        </button>
                    )}
                </div>
                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {isAdding && (
                    <form onSubmit={handleSaveTopic} className="my-4 p-4 bg-white rounded-lg shadow-md border">
                        <input type="text" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="New topic name" className="border p-2 w-full mb-2 rounded-md" autoFocus />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={cancelAdd} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                            <button type="submit" disabled={!newTopicName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                                {isOnline ? <MdCheck /> : <IoCloudOfflineOutline />} Save
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-4">
                    {topics && topics.length > 0 ? (
                        <ul className="space-y-3">
                            {topics.map(topic => (
                                renamingTopicId === topic.id ? (
                                    <form onSubmit={handleSaveRename} key={topic.id} className="p-4 bg-white rounded-lg shadow-md border-2 border-blue-500">
                                        <input type="text" value={renamingTopicName} onChange={(e) => setRenamingTopicName(e.target.value)} className="border p-2 w-full mb-2 rounded-md" autoFocus />
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={cancelRename} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                                            <button type="submit" disabled={!renamingTopicName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50">Save Changes</button>
                                        </div>
                                    </form>
                                ) : (
                                    <TopicItem key={topic.id} topic={topic} progress={progress} setProgress={setProgress} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} />
                                )
                            ))}
                        </ul>
                    ) : ( <div className="text-center mt-10"><p>No topics yet. Add one to get started!</p></div> )}
                </div>
            </div>
        </div>
    );
};

const TopicItem = ({ topic, progress, setProgress, onRenameClick, onDeleteClick }) => {
    const isPending = topic._metadata?.hasPendingWrites;
    const isComplete = !!progress.completedTopicIds[topic.id];

    const handleCheck = useCallback((e) => {
        const isChecked = e.target.checked;
        setProgress(currentProgress => {
            const newCompleted = { ...currentProgress.completedTopicIds };
            if (isChecked) {
                newCompleted[topic.id] = true;
            } else {
                delete newCompleted[topic.id];
            }
            return { completedTopicIds: newCompleted };
        });
    }, [topic.id, setProgress]);

    return (
        <li className={`flex items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg group ${isPending ? 'opacity-60' : ''} ${isComplete ? 'bg-green-50' : ''}`}>
            <div className="flex-shrink-0 mr-4">
                <input
                    type="checkbox"
                    className="h-6 w-6 rounded text-green-600 focus:ring-green-500 border-gray-300"
                    checked={isComplete}
                    onChange={handleCheck}
                />
            </div>
            <div className="flex-grow min-w-0">
                <p className={`font-medium text-lg text-gray-800 truncate ${isComplete ? 'line-through text-gray-500' : ''}`}>
                    {topic.name}
                </p>
                {isPending && <span className="text-xs text-gray-500"> (saving...)</span>}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onRenameClick(topic)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"><MdEdit size={22} /></button>
                <button onClick={() => onDeleteClick(topic.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"><MdDelete size={22} /></button>
            </div>
        </li>
    );
};

export default ProgressTopics;
