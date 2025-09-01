import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus, FaSearch, FaBookOpen, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoArrowBack, IoBook } from "react-icons/io5";
import { HiOutlineCollection } from "react-icons/hi";
import Skeleton from 'react-loading-skeleton';

const NoteChapters = ({ setHeaderTitle }) => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Since only admin account exists, currentUser = admin
    const isAdmin = !!currentUser;

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
    const [hoveredChapter, setHoveredChapter] = useState(null);

    const filteredChapters = useMemo(() => {
        if (!chapters) return [];
        if (!searchTerm.trim()) return chapters;
        return chapters.filter(chapter =>
            chapter.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [chapters, searchTerm]);

    const handleSaveChapter = useCallback(async () => {
        if (newChapterName.trim() === '' || !isAdmin) return;
        try {
            await addItem({ name: newChapterName.trim() });
            setNewChapterName('');
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to add chapter:', error);
        }
    }, [newChapterName, addItem, isAdmin]);

    const handleDelete = useCallback(async (chapterId) => {
        if (!isAdmin) return;
        if (window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
            try {
                await deleteItem(chapterId, false);
            } catch (error) {
                console.error('Failed to delete chapter:', error);
            }
        }
    }, [deleteItem, isAdmin]);

    const handleSaveRename = useCallback(async () => {
        if (renamingChapterName.trim() === '' || !isAdmin) return;
        try {
            await updateItem(renamingChapterId, { name: renamingChapterName.trim() });
            setRenamingChapterId(null);
            setRenamingChapterName('');
        } catch (error) {
            console.error('Failed to rename chapter:', error);
        }
    }, [renamingChapterName, renamingChapterId, updateItem, isAdmin]);

    const handleRenameClick = useCallback((chapter) => {
        if (!isAdmin) return;
        setRenamingChapterId(chapter.id);
        setRenamingChapterName(chapter.name);
    }, [isAdmin]);

    const handleKeyPress = useCallback((e, action) => {
        if (e.key === 'Enter') {
            action();
        } else if (e.key === 'Escape') {
            if (isAdding) {
                setIsAdding(false);
                setNewChapterName('');
            }
            if (renamingChapterId) {
                setRenamingChapterId(null);
                setRenamingChapterName('');
            }
        }
    }, [isAdding, renamingChapterId]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    const ChaptersSkeleton = () => (
        <div className="space-y-3">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="p-5 bg-white rounded-xl border border-gray-100 animate-pulse">
                    <div className="flex items-center space-x-4">
                        <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                        <div className="h-6 bg-gray-200 rounded flex-1 max-w-sm"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-20">
            <div className="relative">
                <HiOutlineCollection size={80} className="mx-auto text-gray-300" />
                {isAdmin && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full opacity-20 animate-ping"></div>
                )}
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mt-6">
                {searchTerm ? 'No Matching Chapters' : 'No Chapters Yet'}
            </h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {searchTerm 
                    ? `No chapters found matching "${searchTerm}". Try a different search term.`
                    : isAdmin 
                        ? "Start organizing your content by creating the first chapter."
                        : "Chapters will appear here."
                }
            </p>
            {searchTerm && (
                <button
                    onClick={clearSearch}
                    className="mt-4 px-4 py-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                    Clear Search
                </button>
            )}
        </div>
    );

    const AddChapterForm = () => (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Chapter</h3>
            <div className="flex gap-3">
                <div className="flex-1">
                    <input
                        type="text"
                        value={newChapterName}
                        onChange={(e) => setNewChapterName(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleSaveChapter)}
                        placeholder="Enter chapter name..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        autoFocus
                        disabled={!isAdmin}
                    />
                </div>
                <button
                    onClick={handleSaveChapter}
                    disabled={!newChapterName.trim() || !isAdmin}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    <MdCheck size={18} />
                    Save
                </button>
                <button
                    onClick={() => {
                        setIsAdding(false);
                        setNewChapterName('');
                    }}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                    <FaTimes size={14} />
                    Cancel
                </button>
            </div>
        </div>
    );

    // Guard clause to prevent rendering crashes
    if (!chapters) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
                <div className="max-w-4xl mx-auto p-4 sm:p-6">
                    <ChaptersSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center space-x-4">
                        <Link 
                            to="/notes" 
                            className="p-3 rounded-xl hover:bg-white/70 transition-all duration-200 hover:shadow-md"
                        >
                            <IoArrowBack size={20} className="text-gray-600" />
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
                                <IoBook size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    {subjectDoc?.name || 'Chapters'}
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
                                    {filteredChapters.length !== chapters.length && ` • ${filteredChapters.length} shown`}
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Only show Add button for admins */}
                    {isAdmin && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            disabled={!isOnline || isAdding} 
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                        >
                            <FaPlus className="mr-2" size={14} />
                            {!isOnline ? 'Offline' : isAdding ? 'Adding...' : 'Add Chapter'}
                        </button>
                    )}
                </div>

                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {/* Search Bar */}
                {chapters.length > 0 && (
                    <div className="relative mb-6">
                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search chapters..."
                            className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all shadow-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes size={14} />
                            </button>
                        )}
                    </div>
                )}

                {/* Add Chapter Form - Only for admins */}
                {isAdding && isAdmin && <AddChapterForm />}

                {/* Chapters List */}
                <div className="mt-6">
                    {loading && filteredChapters.length === 0 ? (
                        <ChaptersSkeleton />
                    ) : filteredChapters.length > 0 ? (
                        <div className="space-y-3">
                            {filteredChapters.map((chapter, index) => (
                                <ChapterItem
                                    key={chapter.id}
                                    chapter={chapter}
                                    index={index}
                                    subjectId={subjectId}
                                    isOnline={isOnline}
                                    isAdmin={isAdmin}
                                    onNavigate={navigate}
                                    onRename={handleRenameClick}
                                    onDelete={handleDelete}
                                    isRenaming={renamingChapterId === chapter.id}
                                    renamingValue={renamingChapterName}
                                    setRenamingValue={setRenamingChapterName}
                                    onSaveRename={handleSaveRename}
                                    onCancelRename={() => {
                                        setRenamingChapterId(null);
                                        setRenamingChapterName('');
                                    }}
                                    handleKeyPress={handleKeyPress}
                                    hoveredChapter={hoveredChapter}
                                    setHoveredChapter={setHoveredChapter}
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

const ChapterItem = ({ 
    chapter, 
    index, 
    subjectId, 
    isOnline, 
    isAdmin,
    onNavigate, 
    onRename, 
    onDelete, 
    isRenaming, 
    renamingValue, 
    setRenamingValue, 
    onSaveRename, 
    onCancelRename, 
    handleKeyPress,
    hoveredChapter,
    setHoveredChapter
}) => {
    const isPending = chapter._metadata?.hasPendingWrites;
    const isHovered = hoveredChapter === chapter.id;

    return (
        <div 
            className={`group relative bg-white/80 backdrop-blur-sm rounded-xl border transition-all duration-300 ${
                isPending 
                    ? 'opacity-60 border-yellow-200 shadow-yellow-100' 
                    : isHovered
                        ? 'border-purple-300 shadow-purple-100 shadow-lg transform translate-x-1'
                        : 'border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200'
            }`}
            onMouseEnter={() => setHoveredChapter(chapter.id)}
            onMouseLeave={() => setHoveredChapter(null)}
        >
            {/* Rename Form Overlay - Only for admins */}
            {isRenaming && isAdmin && (
                <div className="absolute inset-0 bg-white rounded-xl border-2 border-purple-500 shadow-lg z-10 p-4">
                    <div className="flex flex-col gap-3 h-full justify-center">
                        <label className="text-sm font-medium text-gray-700">Rename Chapter</label>
                        <input
                            type="text"
                            value={renamingValue}
                            onChange={(e) => setRenamingValue(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, onSaveRename)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            autoFocus
                            disabled={!isAdmin}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={onSaveRename}
                                disabled={!renamingValue.trim() || !isAdmin}
                                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                            >
                                <MdCheck size={16} />
                                Save
                            </button>
                            <button
                                onClick={onCancelRename}
                                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                            >
                                <FaTimes size={12} />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex justify-between items-center p-5">
                <div 
                    onClick={() => !isRenaming && onNavigate(`/notes/${subjectId}/${chapter.id}`)} 
                    className="cursor-pointer flex items-center space-x-4 flex-grow"
                >
                    {/* Chapter Number/Indicator */}
                    <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                            isHovered 
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 border-purple-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-600'
                        }`}>
                            {index + 1}
                        </div>
                        <FaBookOpen 
                            className={`transition-colors duration-200 ${
                                isHovered ? 'text-purple-500' : 'text-gray-400'
                            }`} 
                            size={16} 
                        />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-lg truncate transition-colors duration-200 ${
                            isHovered ? 'text-purple-600' : 'text-gray-800'
                        }`}>
                            {chapter.name}
                        </h3>
                        {isPending && (
                            <div className="flex items-center gap-1 mt-1">
                                <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-yellow-600">Syncing...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons - Only show for admins */}
                {isOnline && isAdmin && !isRenaming && (
                    <div className={`flex items-center space-x-2 transition-all duration-200 ${
                        isHovered ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95'
                    }`}>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onRename(chapter);
                            }} 
                            disabled={!isOnline || !isAdmin} 
                            className="p-2 text-gray-500 hover:text-purple-600 rounded-full hover:bg-purple-50 disabled:opacity-50 transition-all duration-200 transform hover:scale-110"
                        >
                            <MdEdit size={18} />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(chapter.id);
                            }} 
                            disabled={!isOnline || !isAdmin} 
                            className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 disabled:opacity-50 transition-all duration-200 transform hover:scale-110"
                        >
                            <MdDelete size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoteChapters;
