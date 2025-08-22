import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FaPlus } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoArrowBack, IoCreateOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const NoteItems = ({ setHeaderTitle }) => {
    const { subjectId, chapterId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChapterName = async () => {
            setHeaderTitle('Note Items'); // Default title
            if (subjectId && chapterId) {
                try {
                    const docRef = doc(db, 'official_notes', subjectId, 'chapters', chapterId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setHeaderTitle(docSnap.data().name);
                    }
                } catch (error) {
                    console.error("Error fetching chapter name:", error);
                }
            }
        };
        fetchChapterName();
    }, [subjectId, chapterId, setHeaderTitle]);

    const { data: items, loading, addItem, deleteItem } = useFirestoreCollection(['official_notes', subjectId, 'chapters', chapterId, 'items']);
    
    const [newItemName, setNewItemName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    const { currentUser } = useAuth();

    const handleSaveItem = async () => {
        if (newItemName.trim() === '') return;
        await addItem({ name: newItemName });
        setNewItemName('');
        setIsAdding(false);
    };

    const handleDelete = async (itemId) => {
        await deleteItem(itemId);
    };

    const ItemsSkeleton = () => (
        <div className="space-y-3">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md">
                    <Skeleton width={'70%'} height={24} />
                    <Skeleton circle={true} height={32} width={32} />
                </div>
            ))}
        </div>
    );
    
    return (
        <div className="p-2">
            <div className="flex justify-between items-center mb-4">
                <Link to={`/notes/${subjectId}`} className="text-gray-600 hover:text-gray-800 p-2">
                    <IoArrowBack size={24} />
                </Link>
                {currentUser && (
                    <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                        <FaPlus className="mr-2" />
                        Add Item
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="New item name" className="border p-2 w-full mb-2 rounded-md"/>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSaveItem} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">Save</button>
                    </div>
                </div>
            )}

            {loading ? <ItemsSkeleton /> : (
                items.length > 0 ? (
                    <ul className="space-y-3">
                        {items.map(item => (
                            <li key={item.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
                                <span onClick={() => navigate(`/notes/${subjectId}/${chapterId}/${item.id}`)} className="cursor-pointer font-semibold text-lg text-gray-800 flex-grow">
                                    {item.name}
                                </span>
                                {currentUser && (
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100">
                                        <MdDelete size={22} />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center mt-10">
                        <IoCreateOutline size={64} className="mx-auto text-gray-300" />
                        <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Items Yet</h2>
                        <p className="text-gray-500 mt-2">Click "Add Item" to create the first note in this chapter.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default NoteItems;