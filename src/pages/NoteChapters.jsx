import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus, FaSearch, FaBookOpen } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack, IoBook } from "react-icons/io5";
import { HiOutlineCollection } from "react-icons/hi";
import Skeleton from 'react-loading-skeleton';

const NoteChapters = ({ setHeaderTitle }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Fetch parent subject name for the header
    const { data: subjectDoc } = useFirestoreDocument(['official_notes', subjectId]);

    useEffect(() => {
        setHeaderTitle(subjectDoc?.name || 'Chapters');
    }, [subjectDoc, setHeaderTitle]);

    // Fetch chapters for this subject
    const { 
        data: chapters, 
        loading, 
        addItem, 
        deleteItem, 
        updateItem, 
        isOnline, 
        fromCache, 
        hasPendingWrites 
    } = useFirestoreCollection(['official_notes', subjectId, 'chapters'], {
        enableRealtime: true,
        cacheFirst: true
    });
    
    // UI state
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

    // --- Handlers ---
    const handleSaveChapter = async () => {
        if (newChapterName.trim() === '') return;
        await addItem({ name: newChapterName.trim() });
        setNewChapterName('');
        setIsAdding(false);
    };

    const handleDelete = async (chapterId) => {
        await deleteItem(chapterId, false);
    };

    const handleSaveRename = async () => {
        if (renamingChapterName.trim() === '') return;
        await updateItem(renamingChapterId, { name: renamingChapterName.trim() });
        setRenamingChapterId(null);
        setRenamingChapterName('');
    };

    const handleRenameClick = (chapter) => {
        setRenamingChapterId(chapter.id);
        setRenamingChapterName(chapter.name);
    };

    // --- UI Components ---
    const ChaptersSkeleton = () => (
        <div className="space-y-3">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="p-5 bg-white rounded-xl border border-gray-100">
                    <Skeleton height={24} width="60%" />
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-20">
            <HiOutlineCollection size={80} className="mx-auto text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-700 mt-4">No Chapters Yet</h3>
            <p className="text-gray-500 mt-2">Start organizing by creating the first chapter.</p>
        </div>
    );
    
    // --- CRITICAL: Guard clause to prevent rendering crashes ---
    if (!chapters) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <ChaptersSkeleton />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <Link to="/notes" className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <IoArrowBack size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">{subjectDoc?.name || 'Chapters'}</h1>
                    {currentUser && (
                        <button onClick={() => setIsAdding(true)} disabled={!isOnline} className="inline-flex items-center px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-600 disabled:opacity-50">
                            <FaPlus className="mr-2" />
                            {isOnline ? 'Add Chapter' : 'Offline'}
                        </button>
                    )}
                </div>

                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {/* Add/Rename Forms */}
                {isAdding && (<div>Add form here...</div>)}
                {renamingChapterId && (<div>Rename form here...</div>)}

                {/* Content */}
                <div className="mt-6">
                    {loading && filteredChapters.length === 0 ? (
                        <ChaptersSkeleton />
                    ) : filteredChapters.length > 0 ? (
                        <div className="space-y-3">
                            {filteredChapters.map((chapter) => (
                                <ChapterItem
                                    key={chapter.id}
                                    chapter={chapter}
                                    subjectId={subjectId}
                                    isOnline={isOnline}
                                    onNavigate={navigate}
                                    onRename={handleRenameClick}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
};

const ChapterItem = ({ chapter, subjectId, isOnline, onNavigate, onRename, onDelete }) => {
    const isPending = chapter._metadata?.hasPendingWrites;

    return (
        <div className={`group flex justify-between items-center p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ${isPending ? 'opacity-60' : ''}`}>
            <div onClick={() => onNavigate(`/notes/${subjectId}/${chapter.id}`)} className="cursor-pointer flex items-center space-x-4 flex-grow">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                <div className="flex items-center space-x-3">
                    <FaBookOpen className="text-gray-400 group-hover:text-purple-500" size={16} />
                    <span className="font-medium text-gray-800 group-hover:text-purple-600 text-lg">
                        {chapter.name}
                        {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                    </span>
                </div>
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onRename(chapter)} disabled={!isOnline} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 disabled:opacity-50">
                    <MdEdit size={20} />
                </button>
                <button onClick={() => onDelete(chapter.id)} disabled={!isOnline} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 disabled:opacity-50">
                    <MdDelete size={20} />
                </button>
            </div>
        </div>
    );
};

export default NoteChapters;