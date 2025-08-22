import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'; // Import our hook
import { FaPlus } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const NoteItems = () => {
    const { subjectId, chapterId } = useParams();
    const navigate = useNavigate();

    // --- Use the hook with a nested dynamic path ---
    const { data: items, loading, addItem, deleteItem } = useFirestoreCollection(['official_notes', subjectId, 'chapters', chapterId, 'items']);
    
    // --- UI-specific state ---
    const [newItemName, setNewItemName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    const { currentUser } = useAuth();

    // --- Simple handlers that call the hook's functions ---
    const handleSaveItem = async () => {
        if (newItemName.trim() === '') return;
        await addItem({ name: newItemName });
        setNewItemName('');
        setIsAdding(false);
    };

    const handleDelete = async (itemId) => {
        await deleteItem(itemId);
    };

    // --- Skeleton Component ---
    const ItemsSkeleton = () => (
        <div className="space-y-2">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                    <Skeleton width={'70%'} height={24} />
                    <Skeleton circle={true} height={32} width={32} />
                </div>
            ))}
        </div>
    );
    
    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <Link to={`/notes/${subjectId}`} className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
                <h1 className="text-2xl font-bold">Note Items</h1>
                {currentUser && (
                    <button onClick={() => setIsAdding(true)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                        <FaPlus />
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-4 p-4 border rounded shadow">
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="New item name" className="border p-2 w-full mb-2"/>
                    <button onClick={handleSaveItem} className="bg-green-500 text-white p-2 rounded mr-2">Save</button>
                    <button onClick={() => setIsAdding(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                </div>
            )}

            {loading ? <ItemsSkeleton /> : (
                <div>
                    {items.length > 0 ? (
                        <ul className="space-y-2">
                            {items.map(item => (
                                <li key={item.id} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                                    <span onClick={() => navigate(`/notes/${subjectId}/${chapterId}/${item.id}`)} className="cursor-pointer font-semibold flex-grow hover:text-blue-600">
                                        {item.name}
                                    </span>
                                    {currentUser && (
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><MdDelete size={20} /></button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No items found. Add a new one to get started.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default NoteItems;