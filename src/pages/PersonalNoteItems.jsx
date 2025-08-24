import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import useLocalStorage from '../hooks/useLocalStorage';
import Skeleton from 'react-loading-skeleton';

import { FaPlus } from "react-icons/fa";
import { MdDelete, MdOutlineNoteAdd } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";

const PersonalNoteItems = ({ setHeaderTitle }) => {
    const { subjectId, chapterId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const { data: chapterDoc, loading: chapterLoading } = useFirestoreDocument(['personal_notes', subjectId, 'chapters', chapterId]);

    useEffect(() => {
        setHeaderTitle(chapterDoc?.name || 'Notes');
    }, [chapterDoc, setHeaderTitle]);

    const localStorageKey = useMemo(() => chapterId ? `personal_notes_items_${chapterId}` : null, [chapterId]);
    const { value: items, setValue: setItems } = useLocalStorage(localStorageKey, []);
    
    const [newItemName, setNewItemName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    const addItem = useCallback((newItem) => {
        const itemWithId = { ...newItem, id: `local_${Date.now()}`, createdAt: new Date().toISOString() };
        setItems(prev => [...prev, itemWithId]);
    }, [setItems]);

    const deleteItem = useCallback((itemId) => {
        if (window.confirm("Are you sure you want to permanently delete this note?")) {
            setItems(prev => prev.filter(item => item.id !== itemId));
        }
    }, [setItems]);

    const handleSaveItem = () => {
        if (newItemName.trim() === '') return;
        addItem({ name: newItemName.trim(), content: '' });
        setNewItemName('');
        setIsAdding(false);
    };

    const handleDelete = (itemId) => {
        deleteItem(itemId);
    };

    const ItemsSkeleton = () => (
        <ul className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
                <li key={i} className="p-4 bg-white rounded-lg shadow-md"><Skeleton height={20} width="70%" /></li>
            ))}
        </ul>
    );
    const EmptyState = () => (
        <div className="text-center py-20">
            <MdOutlineNoteAdd size={80} className="mx-auto text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-700 mt-4">No Notes Yet</h3>
            <p className="text-gray-500 mt-2">Create the first note in this chapter to get started.</p>
        </div>
    );
    
    if (chapterLoading) {
        return (
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                <ItemsSkeleton />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <Link to={`/personal-notes/${subjectId}`} className="flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200">
                        <IoArrowBack size={24} className="mr-2" />
                        <span className="font-semibold hidden sm:inline">Back to Chapters</span>
                    </Link>
                    {currentUser && (
                        <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                            <FaPlus className="mr-2" />
                            Add Item
                        </button>
                    )}
                </div>

                {isAdding && (
                    <div className="my-4 p-4 bg-white rounded-lg shadow-md border">
                        <input 
                            type="text" 
                            value={newItemName} 
                            onChange={(e) => setNewItemName(e.target.value)} 
                            placeholder="New note title" 
                            className="border p-2 w-full mb-2 rounded-md" 
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                            <button onClick={handleSaveItem} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">
                                Save
                            </button>
                        </div>
                    </div>
                )}
            
                <div className="mt-4">
                    {items && items.length > 0 ? (
                        <ul className="space-y-3">
                            {items.map(item => (
                                <NoteItem
                                    key={item.id}
                                    item={item}
                                    subjectId={subjectId}
                                    chapterId={chapterId}
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

const NoteItem = ({ item, subjectId, chapterId, onNavigate, onDelete }) => (
    <li className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
        <div onClick={() => onNavigate(`/personal-notes/${subjectId}/${chapterId}/${item.id}`)} className="cursor-pointer font-semibold text-lg text-gray-800 flex-grow">
            {item.name}
        </div>
        <button onClick={() => onDelete(item.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100">
            <MdDelete size={22} />
        </button>
    </li>
);

export default PersonalNoteItems;