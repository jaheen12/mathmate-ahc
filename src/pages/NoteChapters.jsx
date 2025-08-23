import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { FaPlus, FaSearch, FaBookOpen } from "react-icons/fa";
import { MdDelete, MdEdit, MdOutlineMenuBook } from "react-icons/md";
import { IoArrowBack, IoClose, IoCheckmark, IoBook } from "react-icons/io5";
import { HiOutlineCollection } from "react-icons/hi";
import Skeleton from 'react-loading-skeleton';

const NoteChapters = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const { data: chapters, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(['official_notes', subjectId, 'chapters']);
    
    // UI state
    const [newChapterName, setNewChapterName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingChapterId, setRenamingChapterId] = useState(null);
    const [renamingChapterName, setRenamingChapterName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredChapters = chapters.filter(chapter =>
        chapter.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSaveChapter = async () => {
        if (newChapterName.trim() === '') return;
        await addItem({ name: newChapterName });
        setNewChapterName('');
        setIsAdding(false);
    };

    const handleDelete = async (chapterId) => {
        setIsDeleting(true);
        await deleteItem(chapterId);
        setDeleteConfirm(null);
        setIsDeleting(false);
    };

    const handleSaveRename = async () => {
        if (renamingChapterName.trim() === '') return;
        await updateItem(renamingChapterId, { name: renamingChapterName });
        setIsRenaming(false);
        setRenamingChapterId(null);
        setRenamingChapterName('');
    };

    const handleRenameClick = (chapter) => {
        setIsRenaming(true);
        setRenamingChapterId(chapter.id);
        setRenamingChapterName(chapter.name);
    };

    const handleKeyPress = (e, action) => {
        if (e.key === 'Enter') {
            if (action === 'add') handleSaveChapter();
            if (action === 'rename') handleSaveRename();
        } else if (e.key === 'Escape') {
            if (action === 'add') {
                setIsAdding(false);
                setNewChapterName('');
            }
            if (action === 'rename') {
                setIsRenaming(false);
                setRenamingChapterId(null);
                setRenamingChapterName('');
            }
        }
    };

    const ChaptersSkeleton = () => (
        <div className="space-y-3">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="flex justify-between items-center p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-4">
                        <Skeleton circle={true} height={12} width={12} />
                        <Skeleton width={220} height={24} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Skeleton circle={true} height={36} width={36} />
                        <Skeleton circle={true} height={36} width={36} />
                    </div>
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center mt-20 mb-8">
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full blur-3xl opacity-60 w-32 h-32 mx-auto"></div>
                <HiOutlineCollection size={80} className="mx-auto text-gray-400 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-2">No Chapters Yet</h3>
            <p className="text-gray-500 text-lg mb-6 max-w-md mx-auto">
                Start organizing your notes by creating your first chapter in this subject.
            </p>
            {currentUser && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                    <FaPlus className="mr-2" />
                    Create First Chapter
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center space-x-4">
                        <Link 
                            to="/notes" 
                            className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            <IoArrowBack size={20} />
                        </Link>
                        
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                                <IoBook size={20} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800">Chapters</h1>
                        </div>

                        {!showSearchBar && chapters.length > 3 && (
                            <button
                                onClick={() => setShowSearchBar(true)}
                                className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 hover:bg-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <FaSearch size={16} />
                            </button>
                        )}
                    </div>

                    {currentUser && !isAdding && !isRenaming && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                            <FaPlus className="mr-2" size={14} />
                            Add Chapter
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                {showSearchBar && (
                    <div className="mb-6 relative">
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search chapters..."
                                className="w-full pl-12 pr-12 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setShowSearchBar(false);
                                    setSearchQuery('');
                                }}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <IoClose size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Add Chapter Form */}
                {isAdding && (
                    <div className="mb-6 p-6 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Create New Chapter</h4>
                        <input 
                            type="text" 
                            value={newChapterName} 
                            onChange={(e) => setNewChapterName(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, 'add')}
                            placeholder="Enter chapter title..." 
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setIsAdding(false);
                                    setNewChapterName('');
                                }} 
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveChapter} 
                                disabled={!newChapterName.trim()}
                                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <IoCheckmark className="inline mr-1" />
                                Create
                            </button>
                        </div>
                    </div>
                )}

                {/* Rename Chapter Form */}
                {isRenaming && (
                    <div className="mb-6 p-6 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Rename Chapter</h4>
                        <input 
                            type="text" 
                            value={renamingChapterName} 
                            onChange={(e) => setRenamingChapterName(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, 'rename')}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setIsRenaming(false);
                                    setRenamingChapterId(null);
                                    setRenamingChapterName('');
                                }} 
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveRename} 
                                disabled={!renamingChapterName.trim()}
                                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <IoCheckmark className="inline mr-1" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <ChaptersSkeleton />
                ) : filteredChapters.length > 0 ? (
                    <div className="space-y-3">
                        {filteredChapters.map((chapter, index) => (
                            <div 
                                key={chapter.id} 
                                className="group flex justify-between items-center p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-purple-200"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div 
                                    onClick={() => navigate(`/notes/${subjectId}/${chapter.id}`)} 
                                    className="cursor-pointer flex items-center space-x-4 flex-grow"
                                >
                                    <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-200"></div>
                                    <div className="flex items-center space-x-3">
                                        <FaBookOpen className="text-gray-400 group-hover:text-purple-500 transition-colors duration-200" size={16} />
                                        <span className="font-medium text-gray-800 group-hover:text-purple-600 transition-colors duration-200 text-lg">
                                            {chapter.name}
                                        </span>
                                    </div>
                                </div>
                                
                                {currentUser && (
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {deleteConfirm === chapter.id ? (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-600">Delete?</span>
                                                <button
                                                    onClick={() => handleDelete(chapter.id)}
                                                    disabled={isDeleting}
                                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200 disabled:opacity-50"
                                                >
                                                    {isDeleting ? 'Deleting...' : 'Yes'}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors duration-200"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleRenameClick(chapter)}
                                                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                    title="Edit chapter"
                                                >
                                                    <MdEdit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(chapter.id)}
                                                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                    title="Delete chapter"
                                                >
                                                    <MdDelete size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : searchQuery ? (
                    <div className="text-center mt-16 mb-8">
                        <FaSearch size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No matching chapters</h3>
                        <p className="text-gray-500">
                            No chapters found for "{searchQuery}"
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setShowSearchBar(false);
                            }}
                            className="mt-4 px-4 py-2 text-purple-500 hover:text-purple-600 font-medium"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
};

export default NoteChapters;