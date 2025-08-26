import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdSchool, MdCheck } from "react-icons/md";
import { IoBookOutline, IoLibrary } from "react-icons/io5";
import { HiOutlineAcademicCap } from "react-icons/hi";
import Skeleton from 'react-loading-skeleton';

// Memoized components to prevent unnecessary re-renders
const SubjectsSkeleton = React.memo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array(8).fill().map((_, index) => (
            <div key={index} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-4 mb-4">
                    <Skeleton circle height={48} width={48} />
                    <div className="flex-1">
                        <Skeleton height={20} width="70%" />
                        <Skeleton height={14} width="40%" className="mt-2" />
                    </div>
                </div>
            </div>
        ))}
    </div>
));

const EmptyState = React.memo(({ searchQuery, currentUser, onAddClick, clearSearch }) => (
    <div className="text-center py-20">
        <div className="relative">
            <HiOutlineAcademicCap size={80} className="mx-auto text-gray-300" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                <FaPlus size={12} className="text-white" />
            </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-700 mt-6">
            {searchQuery ? 'No Matching Subjects' : 'No Subjects Yet'}
        </h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {searchQuery ? 
                `No subjects match "${searchQuery}". Try a different search term.` :
                currentUser ? "Create your first subject to start organizing your notes." : "Official subjects will appear here."
            }
        </p>
        {searchQuery && (
            <button
                onClick={clearSearch}
                className="mt-4 px-4 py-2 text-green-600 hover:text-green-700 font-medium transition-colors"
            >
                Clear Search
            </button>
        )}
        {currentUser && !searchQuery && (
            <button 
                onClick={onAddClick}
                className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
                <FaPlus className="mr-2" size={14} />
                Add Your First Subject
            </button>
        )}
    </div>
));

// Separate form component to isolate input state
const AddSubjectForm = React.memo(({ onSave, onCancel, isOnline }) => {
    const [inputValue, setInputValue] = useState('');
    
    const handleInputChange = useCallback((e) => {
        setInputValue(e.target.value);
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (inputValue.trim() === '') return;
        try {
            await onSave(inputValue.trim());
            setInputValue('');
        } catch (error) {
            console.error('Failed to add subject:', error);
        }
    }, [inputValue, onSave]);

    return (
        <div className="mb-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Enter subject name..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        autoFocus
                        maxLength={50}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!inputValue.trim() || !isOnline}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                >
                    <MdCheck size={18} />
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <FaTimes size={16} />
                </button>
            </form>
        </div>
    );
});

const SearchBar = React.memo(({ searchQuery, onSearchChange, onClearSearch, isSearchFocused, setIsSearchFocused }) => (
    <div className="relative mb-6">
        <div className={`relative transition-all duration-200 ${isSearchFocused ? 'transform scale-105' : ''}`}>
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
                type="text"
                value={searchQuery}
                onChange={onSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search subjects..."
                className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
            {searchQuery && (
                <button
                    onClick={onClearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <FaTimes size={14} />
                </button>
            )}
        </div>
    </div>
));

const SubjectCard = React.memo(({ 
    subject, 
    index, 
    isOnline, 
    onDelete, 
    onRename, 
    onClick, 
    colorClass,
    isRenaming,
    renamingName,
    onRenamingNameChange,
    onSaveRename,
    onCancelRename
}) => {
    const isPending = subject._metadata?.hasPendingWrites;

    const handleClick = useCallback(() => {
        onClick(subject.id);
    }, [onClick, subject.id]);

    const handleRenameClick = useCallback((e) => {
        e.stopPropagation();
        onRename(subject);
    }, [onRename, subject]);

    const handleDeleteClick = useCallback((e) => {
        e.stopPropagation();
        onDelete(subject.id);
    }, [onDelete, subject.id]);

    const handleRenamingChange = useCallback((e) => {
        onRenamingNameChange(e.target.value);
    }, [onRenamingNameChange]);

    const handleRenamingSubmit = useCallback((e) => {
        e.preventDefault();
        onSaveRename(e);
    }, [onSaveRename]);

    if (isRenaming) {
        return (
            <div className="bg-white rounded-2xl border-2 border-green-500 shadow-lg p-6">
                <form onSubmit={handleRenamingSubmit} className="space-y-3">
                    <input
                        type="text"
                        value={renamingName}
                        onChange={handleRenamingChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        autoFocus
                        maxLength={50}
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={!renamingName.trim()}
                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                            <MdCheck size={16} className="mx-auto" />
                        </button>
                        <button
                            type="button"
                            onClick={onCancelRename}
                            className="flex-1 px-3 py-2 text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <FaTimes size={14} className="mx-auto" />
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div 
            className={`group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 ${isPending ? 'opacity-60' : ''}`}
            onClick={handleClick}
        >
            <div className="p-6">
                <div className="flex items-center space-x-4 mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${colorClass} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <MdSchool size={24} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors truncate">
                            {subject.name}
                        </h3>
                        {isPending && <span className="text-xs text-gray-500">Saving...</span>}
                    </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                    <IoBookOutline size={14} className="mr-1" />
                    <span>Tap to view notes</span>
                </div>
            </div>
            
            {/* Action buttons */}
            {isOnline && (
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleRenameClick}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Rename subject"
                    >
                        <MdEdit size={16} />
                    </button>
                    <button 
                        onClick={handleDeleteClick}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete subject"
                    >
                        <MdDelete size={16} />
                    </button>
                </div>
            )}

            {/* Visual indicator for pending writes */}
            {isPending && (
                <div className="absolute bottom-3 right-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                </div>
            )}
        </div>
    );
});

const NoteSubjects = ({ setHeaderTitle }) => {
    const { 
        data: subjects, 
        loading, 
        addItem, 
        deleteItem, 
        updateItem, 
        isOnline, 
        fromCache, 
        hasPendingWrites 
    } = useFirestoreCollection('official_notes', {
        enableRealtime: true,
        cacheFirst: true
    });
    
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    // UI state
    const [isAdding, setIsAdding] = useState(false);
    const [renamingSubjectId, setRenamingSubjectId] = useState(null);
    const [renamingSubjectName, setRenamingSubjectName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    
    useEffect(() => {
        setHeaderTitle('Official Notes');
    }, [setHeaderTitle]);

    // Memoized filtered subjects to prevent recalculation
    const filteredSubjects = useMemo(() => {
        if (!subjects) return [];
        if (!searchQuery.trim()) return subjects;
        return subjects.filter(subject =>
            subject.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [subjects, searchQuery]);

    // Color palette for subject cards
    const cardColors = useMemo(() => [
        'from-blue-400 to-blue-500',
        'from-green-400 to-green-500',
        'from-purple-400 to-purple-500',
        'from-pink-400 to-pink-500',
        'from-indigo-400 to-indigo-500',
        'from-orange-400 to-orange-500',
        'from-teal-400 to-teal-500',
        'from-red-400 to-red-500',
    ], []);

    // Memoized handlers to prevent re-renders
    const handleAddSubject = useCallback(async (name) => {
        try {
            await addItem({ name });
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to add subject:', error);
        }
    }, [addItem]);

    const handleDelete = useCallback(async (subjectId) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                await deleteItem(subjectId, false);
            } catch (error) {
                console.error('Failed to delete subject:', error);
            }
        }
    }, [deleteItem]);

    const handleSaveRename = useCallback(async (e) => {
        e?.preventDefault();
        if (renamingSubjectName.trim() === '') return;
        try {
            await updateItem(renamingSubjectId, { name: renamingSubjectName.trim() });
            setRenamingSubjectId(null);
            setRenamingSubjectName('');
        } catch (error) {
            console.error('Failed to rename subject:', error);
        }
    }, [renamingSubjectName, renamingSubjectId, updateItem]);

    const handleRenameClick = useCallback((subject) => {
        setRenamingSubjectId(subject.id);
        setRenamingSubjectName(subject.name);
    }, []);

    const handleSubjectClick = useCallback((subjectId) => {
        navigate(`/notes/${subjectId}`);
    }, [navigate]);

    const handleCancelAdd = useCallback(() => {
        setIsAdding(false);
    }, []);

    const handleCancelRename = useCallback(() => {
        setRenamingSubjectId(null);
        setRenamingSubjectName('');
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    const handleSearchChange = useCallback((e) => {
        setSearchQuery(e.target.value);
    }, []);

    const handleAddClick = useCallback(() => {
        setIsAdding(true);
    }, []);

    const handleRenamingValueChange = useCallback((value) => {
        setRenamingSubjectName(value);
    }, []);

    if (!subjects) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <SubjectsSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg">
                            <IoLibrary size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Official Notes</h1>
                            <p className="text-gray-500 text-sm">
                                {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}
                                {filteredSubjects.length !== subjects.length && ` • ${filteredSubjects.length} shown`}
                            </p>
                        </div>
                    </div>
                    {currentUser && !isAdding && (
                        <button 
                            onClick={handleAddClick}
                            disabled={!isOnline}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                        >
                            <FaPlus className="mr-2" size={14} />
                            {isOnline ? 'Add Subject' : 'Offline'}
                        </button>
                    )}
                </div>

                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {/* Add Subject Form */}
                {isAdding && (
                    <AddSubjectForm
                        onSave={handleAddSubject}
                        onCancel={handleCancelAdd}
                        isOnline={isOnline}
                    />
                )}

                {/* Search Bar */}
                {subjects.length > 0 && (
                    <SearchBar
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        onClearSearch={clearSearch}
                        isSearchFocused={isSearchFocused}
                        setIsSearchFocused={setIsSearchFocused}
                    />
                )}

                {/* Results count */}
                {searchQuery && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            {filteredSubjects.length} {filteredSubjects.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                        </p>
                    </div>
                )}

                {/* Content */}
                <div className="mt-6">
                    {loading && filteredSubjects.length === 0 ? (
                        <SubjectsSkeleton />
                    ) : filteredSubjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredSubjects.map((subject, index) => (
                                <SubjectCard
                                    key={subject.id}
                                    subject={subject}
                                    index={index}
                                    isOnline={isOnline}
                                    onDelete={handleDelete}
                                    onRename={handleRenameClick}
                                    onClick={handleSubjectClick}
                                    colorClass={cardColors[index % cardColors.length]}
                                    isRenaming={renamingSubjectId === subject.id}
                                    renamingName={renamingSubjectName}
                                    onRenamingNameChange={handleRenamingValueChange}
                                    onSaveRename={handleSaveRename}
                                    onCancelRename={handleCancelRename}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState 
                            searchQuery={searchQuery}
                            currentUser={currentUser}
                            onAddClick={handleAddClick}
                            clearSearch={clearSearch}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteSubjects;