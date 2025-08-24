import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack, IoDocumentsOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const PersonalChapters = ({ setHeaderTitle }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Fetch parent subject's name for the header
    const { data: subjectDoc } = useFirestoreDocument(['personal_notes', subjectId]);

    useEffect(() => {
        setHeaderTitle(subjectDoc?.name || 'Chapters');
    }, [subjectDoc, setHeaderTitle]);

    // Fetch the chapters sub-collection using a dynamic path
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
    
    // UI State for forms
    const [newChapterName, setNewChapterName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [renamingChapterId, setRenamingChapterId] = useState(null);
    const [renamingChapterName, setRenamingChapterName] = useState('');

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
        <ul className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
                <li key={i} className="p-4 bg-white rounded-lg shadow-md">
                    <Skeleton height={24} width="60%" />
                </li>
            ))}
        </ul>
    );

    const EmptyState = () => (
        <div className="text-center mt-10">
            <IoDocumentsOutline size={64} className="mx-auto text-gray-300" />
            <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Chapters Yet</h2>
            <p className="text-gray-500 mt-2">Click "Add Chapter" to organize your notes.</p>
        </div>
    );
    
    // --- CRITICAL: Guard clause to prevent rendering crashes ---
    if (chapters === null) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <ChaptersSkeleton />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <Link to="/personal-notes" className="flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <IoArrowBack size={24} className="mr-2" />
                        <span className="font-semibold hidden sm:inline">Back to Subjects</span>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">{subjectDoc?.name || 'Chapters'}</h1>
                    {currentUser && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            disabled={!isOnline || isAdding || renamingChapterId}
                            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50"
                        >
                            <FaPlus className="mr-2" />
                            {isOnline ? 'Add Chapter' : 'Offline'}
                        </button>
                    )}
                </div>

                <NetworkStatus 
                    isOnline={isOnline}
                    fromCache={fromCache}
                    hasPendingWrites={hasPendingWrites}
                />

                {isAdding && (
                    <div className="my-4 p-4 bg-white rounded-lg shadow-md border">
                        {/* Add form implementation */}
                    </div>
                )}
                {renamingChapterId && (
                     <div className="my-4 p-4 bg-white rounded-lg shadow-md border">
                        {/* Rename form implementation */}
                    </div>
                )}
            
                <div className="mt-4">
                    {loading && chapters.length === 0 ? (
                        <ChaptersSkeleton />
                    ) : chapters.length > 0 ? (
                        <ul className="space-y-3">
                            {chapters.map(chapter => (
                                <ChapterItem 
                                    key={chapter.id}
                                    chapter={chapter}
                                    subjectId={subjectId}
                                    isOnline={isOnline}
                                    onNavigate={navigate}
                                    onRenameClick={handleRenameClick}
                                    onDeleteClick={handleDelete}
                                />
                            ))}
                        </ul>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
};

const ChapterItem = ({ chapter, subjectId, isOnline, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = chapter._metadata?.hasPendingWrites;
    return (
        <li className={`flex justify-between items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg ${isPending ? 'opacity-60' : ''}`}>
            <div onClick={() => onNavigate(`/personal-notes/${subjectId}/${chapter.id}`)} className="cursor-pointer font-semibold text-lg text-gray-800 flex-grow">
                {chapter.name}
                {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onRenameClick(chapter)} disabled={!isOnline} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50">
                    <MdEdit size={22} />
                </button>
                <button onClick={() => onDeleteClick(chapter.id)} disabled={!isOnline} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50">
                    <MdDelete size={22} />
                </button>
            </div>
        </li>
    );
};

export default PersonalChapters;