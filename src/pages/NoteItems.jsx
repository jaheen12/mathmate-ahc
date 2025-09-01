import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus, FaSearch } from "react-icons/fa";
import { MdDelete, MdOutlineNoteAdd } from "react-icons/md";
import { IoArrowBack, IoCreateOutline, IoClose, IoCheckmark } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const NoteItems = ({ setHeaderTitle }) => {
    const { subjectId, chapterId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Since only admin account exists, currentUser = admin
    const isAdmin = !!currentUser;

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
        isOnline, 
        fromCache, 
        hasPendingWrites 
    } = useFirestoreCollection(['official_notes', subjectId, 'chapters', chapterId, 'items'], {
        enableRealtime: true,
        cacheFirst: true
    });

    // UI state
    const [newItemName, setNewItemName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [items, searchQuery]);

    // --- Handlers ---
    const handleSaveItem = async () => {
        if (newItemName.trim() === '' || !isAdmin) return;
        await addItem({ name: newItemName.trim(), content: '' }); // Add with empty content
        setNewItemName('');
        setIsAdding(false);
    };

    const handleDelete = async (itemId) => {
        if (!isAdmin) return;
        await deleteItem(itemId, false);
    };

    // --- UI Components ---
    const ItemsSkeleton = () => (
        <div className="space-y-3">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="p-4 bg-white rounded-xl border border-gray-100">
                    <Skeleton height={20} width="70%" />
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-20">
            <MdOutlineNoteAdd size={80} className="mx-auto text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-700 mt-4">No Notes Yet</h3>
            <p className="text-gray-500 mt-2">
                {isAdmin 
                    ? "Create the first note in this chapter to get started."
                    : "Notes will appear here."
                }
            </p>
        </div>
    );

    // --- CRITICAL: Guard clause to prevent rendering crashes ---
    if (!items) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <ItemsSkeleton />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <Link to={`/notes/${subjectId}`} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <IoArrowBack size={24} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {chapterDoc?.name || 'Notes'}
                    </h1>
                    {/* Only show Add button for admins */}
                    {isAdmin && (
                        <button 
                            onClick={() => setIsAdding(true)} 
                            disabled={!isOnline} 
                            className="inline-flex items-center px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            <FaPlus className="mr-2" />
                            {isOnline ? 'Add Note' : 'Offline'}
                        </button>
                    )}
                </div>

                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

                {/* Add Item Form - Only for admins */}
                {isAdding && isAdmin && (
                    <div className="mb-6 p-4 bg-white rounded-xl shadow-md border">
                        <h4 className="font-semibold mb-2">Create New Note</h4>
                        <input 
                            type="text" 
                            value={newItemName} 
                            onChange={(e) => setNewItemName(e.target.value)} 
                            placeholder="Enter note title..." 
                            className="w-full p-2 border border-gray-300 rounded-lg mb-2"
                            disabled={!isAdmin}
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => setIsAdding(false)} 
                                className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveItem} 
                                disabled={!newItemName.trim() || !isOnline || !isAdmin} 
                                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                                {isOnline ? 'Create' : 'Offline'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="mt-6">
                    {loading && filteredItems.length === 0 ? (
                        <ItemsSkeleton />
                    ) : filteredItems.length > 0 ? (
                        <ul className="space-y-3">
                            {filteredItems.map(item => (
                                <NoteItem
                                    key={item.id}
                                    item={item}
                                    subjectId={subjectId}
                                    chapterId={chapterId}
                                    isOnline={isOnline}
                                    isAdmin={isAdmin}
                                    onNavigate={navigate}
                                    onDelete={handleDelete}
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

const NoteItem = ({ item, subjectId, chapterId, isOnline, isAdmin, onNavigate, onDelete }) => {
    const isPending = item._metadata?.hasPendingWrites;

    return (
        <li className={`group flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ${isPending ? 'opacity-60' : ''}`}>
            <div onClick={() => onNavigate(`/notes/${subjectId}/${chapterId}/${item.id}`)} className="cursor-pointer flex items-center space-x-3 flex-grow">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                <span className="font-medium text-gray-800 group-hover:text-blue-600">
                    {item.name}
                    {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                </span>
            </div>
            {/* Only show delete button for admins */}
            {isAdmin && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onDelete(item.id)} 
                        disabled={!isOnline} 
                        className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 disabled:opacity-50"
                        title="Delete note (Admin only)"
                    >
                        <MdDelete size={20} />
                    </button>
                </div>
            )}
        </li>
    );
};

export default NoteItems;
