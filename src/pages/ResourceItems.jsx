import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";

const ResourceItems = () => {
    const { categoryId, chapterId } = useParams();
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemLink, setNewItemLink] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const itemsCollection = collection(db, "resources", categoryId, "chapters", chapterId, "items");
                const querySnapshot = await getDocs(itemsCollection);
                const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setItems(itemsData);
            } catch (error) {
                console.error("Error fetching items: ", error);
                toast.error("Failed to fetch resource items.");
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [categoryId, chapterId]);

    const handleSaveItem = async () => {
        if (newItemName.trim() === '' || newItemLink.trim() === '') {
            toast.error('Item name and link cannot be empty');
            return;
        }
        try {
            const itemsCollection = collection(db, "resources", categoryId, "chapters", chapterId, "items");
            const docRef = await addDoc(itemsCollection, {
                name: newItemName,
                link: newItemLink,
                createdAt: new Date()
            });
            setItems([...items, { id: docRef.id, name: newItemName, link: newItemLink }]);
            setNewItemName('');
            setNewItemLink('');
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
                await deleteDoc(doc(db, "resources", categoryId, "chapters", chapterId, "items", itemId));
                setItems(items.filter(item => item.id !== itemId));
                toast.success('Item deleted successfully!');
            } catch (error) {
                console.error("Error deleting item: ", error);
                toast.error('Failed to delete item.');
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <Link to={`/resources/${categoryId}`} className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
                <h1 className="text-2xl font-bold">Resource Items</h1>
                {currentUser && (
                    <button onClick={() => setIsAdding(true)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                        <FaPlus />
                    </button>
                )}
            </div>

            {loading ? <p>Loading items...</p> : (
                <div>
                    {isAdding && (
                        <div className="mb-4 p-4 border rounded shadow">
                            <input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="Item name"
                                className="border p-2 w-full mb-2"
                            />
                            <input
                                type="url"
                                value={newItemLink}
                                onChange={(e) => setNewItemLink(e.target.value)}
                                placeholder="Item link (URL)"
                                className="border p-2 w-full mb-2"
                            />
                            <button onClick={handleSaveItem} className="bg-green-500 text-white p-2 rounded mr-2">Save</button>
                            <button onClick={() => setIsAdding(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                        </div>
                    )}
                    {items.length > 0 ? (
                        <ul className="space-y-2">
                            {items.map(item => (
                                <li key={item.id} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                                    <a 
                                        href={item.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="cursor-pointer font-semibold flex-grow hover:text-blue-600"
                                    >
                                        {item.name}
                                    </a>
                                    {currentUser && (
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 ml-4"><MdDelete size={20} /></button>
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

export default ResourceItems;