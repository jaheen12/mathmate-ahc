import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete, MdOutlineNoteAdd, MdEdit, MdCheck } from "react-icons/md";
import { IoArrowBack, IoDocumentText } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

// Memoized components to prevent unnecessary re-renders
const ItemsSkeleton = React.memo(() => (
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
));

const EmptyState = React.memo(({ searchTerm, clearSearch }) => (
    <div className="text-center py-20">
        <div className="relative">
            <MdOutlineNoteAdd size={80} className="mx-auto text-gray-300" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-700 mt-6">
            {searchTerm ? 'No Matching Notes' : 'No Notes Yet'}
        </h3>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {searchTerm 
                ? `No notes found matching "${searchTerm}". Try a different search term.`
                : "Start organizing your content by creating the first note."
            }
        </p>
        {searchTerm && (
            <button
                onClick={clearSearch}
                className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
                Clear Search
            </button>
        )}
    </div>
));

// Separate form component to isolate input state
const AddItemForm = React.memo(({ onSave, onCancel, isOnline }) => {
    const [inputValue, setInputValue] = useState('');
    
    const handleInputChange = useCallback((e) => {
        setInputValue(e.target.value);
    }, []);

    const handleSave = useCallback(async () => {
        if (inputValue.trim() === '') return;
        try {
            await onSave(inputValue.trim());
            setInputValue('');
        } catch (error) {
            console.error('Failed to add item:', error);
        }
    }, [inputValue, onSave]);

    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setInputValue('');
            onCancel();
        }
    }, [handleSave, onCancel]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Note</h3>
            <div className="flex gap-3">
                <div className="flex-1">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter note title..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        autoFocus
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={!inputValue.trim() || !isOnline}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    <MdCheck size={18} />
                    Save
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                    <FaTimes size={14} />
                    Cancel
                </button>
            </div>
        </div>
    );
});

const SearchBar = React.memo(({ searchTerm, onSearchChange, onClearSearch }) => (
    <div className="relative mb-6">
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search notes..."
            className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
        />
        {searchTerm && (
            <button
                onClick={onClearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <FaTimes size={14} />
            </button>
        )}
    </div>
));

const NoteItem = React.memo(({ 
    item, 
    index, 
    subjectId, 
    chapterId, 
    isOnline, 
    onNavigate, 
    onRename, 
    onDelete, 
    isRenaming, 
    renamingValue, 
    setRenamingValue, 
    onSaveRename, 
    onCancelRename, 
    handleKeyPress,
    hoveredItem,
    setHoveredItem
}) => {
    const isPending = item._metadata?.hasPendingWrites;
    const isHovered = hoveredItem === item.id;

    const handleMouseEnter = useCallback(() => setHoveredItem(item.id), [item.id, setHoveredItem]);
    const handleMouseLeave = useCallback(() => setHoveredItem(null), [setHoveredItem]);
    
    const handleNavigateClick = useCallback(() => {
        if (!isRenaming) onNavigate(`/notes/${subjectId}/${chapterId}/${item.id}`);
    }, [isRenaming, onNavigate, subjectId, chapterId, item.id]);
    
    const handleRenameClick = useCallback((e) => {
        e.stopPropagation();
        onRename(item);
    }, [onRename, item]);
    
    const handleDeleteClick = useCallback((e) => {
        e.stopPropagation();
        onDelete(item.id);
    }, [onDelete, item.id]);

    const handleRenamingChange = useCallback((e) => {
        setRenamingValue(e.target.value);
    }, [setRenamingValue]);

    const handleRenamingKeyPress = useCallback((e) => {
        handleKeyPress(e, onSaveRename);
    }, [handleKeyPress, onSaveRename]);

    return (
        <div 
            className={`group relative bg-white/80 backdrop-blur-sm rounded-xl border transition-all duration-300 ${
                isPending 
                    ? 'opacity-60 border-yellow-200 shadow-yellow-100' 
                    : isHovered
                        ? 'border-blue-300 shadow-blue-100 shadow-lg transform translate-x-1'
                        : 'border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200'
            }`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Rename Form Overlay */}
            {isRenaming && (
                <div className="absolute inset-0 bg-white rounded-xl border-2 border-blue-500 shadow-lg z-10 p-4">
                    <div className="flex flex-col gap-3 h-full justify-center">
                        <label className="text-sm font-medium text-gray-700">Rename Note</label>
                        <input
                            type="text"
                            value={renamingValue}
                            onChange={handleRenamingChange}
                            onKeyPress={handleRenamingKeyPress}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={onSaveRename}
                                disabled={!renamingValue.trim()}
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
                    onClick={handleNavigateClick}
                    className="cursor-pointer flex items-center space-x-4 flex-grow"
                >
                    {/* Note Number/Indicator */}
                    <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                            isHovered 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-600'
                        }`}>
                            {index + 1}
                        </div>
                        <IoDocumentText 
                            className={`transition-colors duration-200 ${
                                isHovered ? 'text-blue-500' : 'text-gray-400'
                            }`} 
                            size={16} 
                        />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-lg truncate transition-colors duration-200 ${
                            isHovered ? 'text-blue-600' : 'text-gray-800'
                        }`}>
                            {item.name}
                        </h3>
                        {isPending && (
                            <div className="flex items-center gap-1 mt-1">
                                <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-yellow-600">Syncing...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {isOnline && !isRenaming && (
                    <div className={`flex items-center space-x-2 transition-all duration-200 ${
                        isHovered ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95'
                    }`}>
                        <button 
                            onClick={handleRenameClick}
                            disabled={!isOnline} 
                            className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 disabled:opacity-50 transition-all duration-200 transform hover:scale-110"
                        >
                            <MdEdit size={18} />
                        </button>
                        <button 
                            onClick={handleDeleteClick}
                            disabled={!isOnline} 
                            className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 disabled:opacity-50 transition-all duration-200 transform hover:scale-110"
                        >
                            <MdDelete size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

const NoteItems = ({ setHeaderTitle }) => {
    const { subjectId, chapterId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Fetch parent chapter name for the header
    const { data: chapterDoc } = useFirestoreDocument(['official_notes', subjectId, 'chapters', chapterId]);

    useEffect(() => {
        setHeaderTitle(chapterDoc?.name || 'Notes');
    }, [chapterDoc, setHeaderTitle]);

    // Fetch note items for this chapter
    const { 
        data: items, 
        loading, 
        addItem, 
        deleteItem, 
        updateItem,
        isOnline, 
        fromCache, 
        hasPendingWrites 
    } = useFirestoreCollection(['official_notes', subjectId, 'chapters', chapterId, 'items'], {
        enableRealtime: true,
        cacheFirst: true
    });

    // UI state
    const [isAdding, setIsAdding] = useState(false);
    const [renamingItemId, setRenamingItemId] = useState(null);
    const [renamingItemName, setRenamingItemName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredItem, setHoveredItem] = useState(null);

    // Memoized filtered items to prevent recalculation
    const filteredItems = useMemo(() => {
        if (!items) return [];
        if (!searchTerm.trim()) return items;
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    // Memoized handlers to prevent re-renders
    const handleAddItem = useCallback(async (name) => {
        try {
            await addItem({ name, content: '' });
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to add item:', error);
        }
    }, [addItem]);

    const handleDelete = useCallback(async (itemId) => {
        if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            try {
                await deleteItem(itemId, false);
            } catch (error) {
                console.error('Failed to delete item:', error);
            }
        }
    }, [deleteItem]);

    const handleSaveRename = useCallback(async () => {
        if (renamingItemName.trim() === '') return;
        try {
            await updateItem(renamingItemId, { name: renamingItemName.trim() });
            setRenamingItemId(null);
            setRenamingItemName('');
        } catch (error) {
            console.error('Failed to rename item:', error);
        }
    }, [renamingItemName, renamingItemId, updateItem]);

    const handleRenameClick = useCallback((item) => {
        setRenamingItemId(item.id);
        setRenamingItemName(item.name);
    }, []);

    const handleKeyPress = useCallback((e, action) => {
        if (e.key === 'Enter') {
            action();
        } else if (e.key === 'Escape') {
            if (renamingItemId) {
                setRenamingItemId(null);
                setRenamingItemName('');
            }
        }
    }, [renamingItemId]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleCancelAdd = useCallback(() => {
        setIsAdding(false);
    }, []);

    const handleCancelRename = useCallback(() => {
        setRenamingItemId(null);
        setRenamingItemName('');
    }, []);

    const handleRenamingValueChange = useCallback((value) => {
        setRenamingItemName(value);
    }, []);

    // --- CRITICAL: Guard clause to prevent rendering crashes ---
    if (!items) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                <div className="max-w-4xl mx-auto p-4 sm:p-6">
                    <ItemsSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center space-x-4">
                        <Link 
                            to={`/notes/${subjectId}`} 
                            className="p-3 rounded-xl hover:bg-white/70 transition-all duration-200 hover:shadow-md"
                        >
                            <IoArrowBack size={20} className="text-gray-600" />
                        </Link>
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                                <IoDocumentText size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    {chapterDoc?.name || 'Notes'}
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {items.length} {items.length === 1 ? 'note' : 'notes'}
                                    {filteredItems.length !== items.length && ` • ${filteredItems.length} shown`}
                                </p>
                            </div>
                        </div>
                    </div>
                    {currentUser && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            disabled={!isOnline || isAdding} 
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                        >
                            <FaPlus className="mr-2" size={14} />
                            {!isOnline ? 'Offline' : isAdding ? 'Adding...' : 'Add Note'}
                        </button>
                    )}
                </div>

                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {/* Search Bar */}
                {items.length > 0 && (
                    <SearchBar
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        onClearSearch={clearSearch}
                    />
                )}

                {/* Add Item Form */}
                {isAdding && (
                    <AddItemForm
                        onSave={handleAddItem}
                        onCancel={handleCancelAdd}
                        isOnline={isOnline}
                    />
                )}

                {/* Content */}
                <div className="mt-6">
                    {loading && filteredItems.length === 0 ? (
                        <ItemsSkeleton />
                    ) : filteredItems.length > 0 ? (
                        <div className="space-y-3">
                            {filteredItems.map((item, index) => (
                                <NoteItem
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    subjectId={subjectId}
                                    chapterId={chapterId}
                                    isOnline={isOnline}
                                    onNavigate={navigate}
                                    onRename={handleRenameClick}
                                    onDelete={handleDelete}
                                    isRenaming={renamingItemId === item.id}
                                    renamingValue={renamingItemName}
                                    setRenamingValue={handleRenamingValueChange}
                                    onSaveRename={handleSaveRename}
                                    onCancelRename={handleCancelRename}
                                    handleKeyPress={handleKeyPress}
                                    hoveredItem={hoveredItem}
                                    setHoveredItem={setHoveredItem}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState searchTerm={searchTerm} clearSearch={clearSearch} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteItems;