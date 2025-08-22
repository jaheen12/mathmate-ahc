import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton'; // Import the skeleton component

const NoteItems = () => {
    const { subjectId, chapterId } = useParams();
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const itemsCollection = collection(db, "official_notes", subjectId, "chapters", chapterId, "items");
                const querySnapshot = await getDocs(itemsCollection);
                const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setItems(itemsData);
            } catch (error) {
                console.error("Error fetching items: ", error);
                toast.error("Failed to fetch note items.");
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [subjectId, chapterId]);

    const handleSaveItem = async () => {
        if (newItemName.trim() === '') {
            toast.error('Item name cannot be empty');
            return;
        }
        try {
            const itemsCollection = collection(db, "official_notes", subjectId, "chapters", chapterId, "items");
            const docRef = await addDoc(itemsCollection, {
                name: newItemName,
                createdAt: new Date()
            });
            setItems([...items, { id: docRef.id, name: newItemName }]);
            setNewItemName('');
            setIsAdding(false);
            toast.success('Item added successfully!');
        } catch (error) {
            console.error("Error adding item: ", error);
            toast.error('Failed to add item.');
        }
    };

    const handleDelete = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                await deleteDoc(doc(db, "official_notes", subjectId, "chapters", chapterId, "items", itemId));
                setItems(items.filter(item => item.id !== itemId));
                toast.success('Item deleted successfully!');
            } catch (error) {
                console.error("Error deleting item: ", error);
                toast.error('Failed to delete item.');
            }
        }
    };

    // --- Loading Skeleton component for Items ---
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
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="New item name"
                        className="border p-2 w-full mb-2"
                    />
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
                                    <span
                                        onClick={() => navigate(`/notes/${subjectId}/${chapterId}/${item.id}`)}
                                        className="cursor-pointer font-semibold flex-grow hover:text-blue-600"
                                    >
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