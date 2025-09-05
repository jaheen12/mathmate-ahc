import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';

import { FaPlus, FaSearch } from "react-icons/fa";
import { MdDelete, MdOutlineNoteAdd } from "react-icons/md";
import { IoArrowBack, IoCreateOutline, IoClose, IoCheckmark, IoCloudOfflineOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const NoteItems = ({ setHeaderTitle }) => {
    const { subjectId, chapterId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const isAdmin = !!currentUser;

    // --- CHANGE: Simplified data hook ---
    const { data: chapterDoc } = useFirestoreDocument(['official_notes', subjectId, 'chapters', chapterId]);

    useEffect(() => {
        setHeaderTitle(chapterDoc?.name || 'Notes');
    }, [chapterDoc, setHeaderTitle]);

    // --- CHANGE: Simplified data hook ---
    const { 
        data: items, 
        loading, 
        addItem, 
        deleteItem, 
        isOnline, 
        fromCache, 
        hasPendingWrites 
    } = useFirestoreCollection(['official_notes', subjectId, 'chapters', chapterId, 'items']);

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

    // --- Handlers with toast feedback ---
    const handleSaveItem = useCallback(async () => {
        if (newItemName.trim() === '' || !isAdmin) return;
        try {
            await addItem({ name: newItemName.trim(), content: '' }); // Add with empty content
            toast.success(isOnline ? "Note created!" : "Note saved locally!");
            setNewItemName('');
            setIsAdding(false);
        } catch (error) {
            toast.error("Failed to create note.");
            console.error("Save item error:", error);
        }
    }, [newItemName, addItem, isAdmin, isOnline]);

    const handleDelete = useCallback(async (itemId) => {
        if (!isAdmin) return;
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteItem(itemId, false);
                toast.success(isOnline ? "Note deleted!" : "Deletion saved locally!");
            } catch (error) {
                toast.error("Failed to delete note.");
                console.error("Delete item error:", error);
            }
        }
    }, [deleteItem, isAdmin, isOnline]);

    const handleCancelAdd = useCallback(() => {
        setIsAdding(false);
        setNewItemName('');
    }, []);

    // --- UI Components ---
    const ItemsSkeleton = () => (
        <div className="space-y-3">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="p-4 bg-white rounded-xl border border-gray-100"><Skeleton height={20} width="70%" /></div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-20">
            <MdOutlineNoteAdd size={80} className="mx-auto text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-700 mt-4">No Notes Yet</h3>
            <p className="text-gray-500 mt-2">{isAdmin ? "Create the first note in this chapter to get started." : "Notes will appear here."}</p>
        </div>
    );

    // Guard clause
    if (loading && !items) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6"><ItemsSkeleton /></div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                    <Link to={`/notes/${subjectId}`} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><IoArrowBack size={24} /></Link>
                    <h1 className="text-2xl font-bold text-gray-800 text-center flex-1 mx-4 truncate">{chapterDoc?.name || 'Notes'}</h1>
                    {/* --- CHANGE: Add button works offline --- */}
                    {isAdmin && (
                        <button onClick={() => setIsAdding(true)} disabled={isAdding} className="inline-flex items-center px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-600 disabled:opacity-50 transition-transform transform hover:scale-105 active:scale-100">
                            <FaPlus className="mr-2" />
                            Add Note
                        </button>
                    )}
                </div>
                <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
                {isAdding && isAdmin && (
                    <div className="my-6 p-4 bg-white rounded-xl shadow-md border animate-in fade-in-0 duration-300">
                        <h4 className="font-semibold mb-2">Create New Note</h4>
                        <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Enter note title..." className="w-full p-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500" disabled={!isAdmin} />
                        <div className="flex justify-end gap-2">
                            <button onClick={handleCancelAdd} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"><IoClose className="mr-1" />Cancel</button>
                            {/* --- CHANGE: Create button works offline --- */}
                            <button onClick={handleSaveItem} disabled={!newItemName.trim() || !isAdmin} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                                {isOnline ? <IoCheckmark /> : <IoCloudOfflineOutline />}
                                Create
                            </button>
                        </div>
                    </div>
                )}
                <div className="mt-6">
                    {loading && filteredItems.length === 0 ? (<ItemsSkeleton />) : filteredItems.length > 0 ? (
                        <ul className="space-y-3">
                            {filteredItems.map(item => (
                                <NoteItem key={item.id} item={item} subjectId={subjectId} chapterId={chapterId} isAdmin={isAdmin} onNavigate={navigate} onDelete={handleDelete} />
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

const NoteItem = ({ item, subjectId, chapterId, isAdmin, onNavigate, onDelete }) => {
    const isPending = item._metadata?.hasPendingWrites;
    return (
        <li className={`group flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 ${isPending ? 'opacity-60' : ''}`}>
            <div onClick={() => onNavigate(`/notes/${subjectId}/${chapterId}/${item.id}`)} className="cursor-pointer flex items-center space-x-3 flex-grow min-w-0">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                <span className="font-medium text-gray-800 group-hover:text-blue-600 truncate">
                    {item.name}
                    {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                </span>
            </div>
            {/* --- CHANGE: Delete button works offline --- */}
            {isAdmin && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => onDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50" title="Delete note (Admin only)">
                        <MdDelete size={20} />
                    </button>
                </div>
            )}
        </li>
    );
};

export default NoteItems;