import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection'; // Import our hook
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const ResourceCategories = () => {
    // --- Use the hook to manage the 'resources' collection ---
    const { data: categories, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(['resources']);
    
    // --- UI-specific state ---
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingCategoryId, setRenamingCategoryId] = useState(null);
    const [renamingCategoryName, setRenamingCategoryName] = useState('');
    
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // --- Simple handlers that call the hook's functions ---
    const handleSaveCategory = async () => {
        if (newCategoryName.trim() === '') return;
        await addItem({ name: newCategoryName });
        setNewCategoryName('');
        setIsAdding(false);
    };

    const handleDelete = async (categoryId) => {
        await deleteItem(categoryId);
    };

    const handleSaveRename = async () => {
        if (renamingCategoryName.trim() === '') return;
        await updateItem(renamingCategoryId, { name: renamingCategoryName });
        setIsRenaming(false);
        setRenamingCategoryId(null);
    };

    // --- UI action helpers ---
    const handleRenameClick = (category) => {
        setIsRenaming(true);
        setRenamingCategoryId(category.id);
        setRenamingCategoryName(category.name);
    };

    // --- Skeleton Component ---
    const CategoriesSkeleton = () => (
        <div className="space-y-2">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                    <Skeleton width={'60%'} height={24} />
                    <div className="flex items-center">
                        <Skeleton circle={true} height={32} width={32} style={{ marginRight: '10px' }} />
                        <Skeleton circle={true} height={32} width={32} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <Link to="/profile" className="text-blue-500 hover:underline"><IoArrowBack size={24} /></Link>
                <h1 className="text-2xl font-bold">Resource Categories</h1>
                {currentUser && (
                    <button onClick={() => setIsAdding(true)} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600">
                        <FaPlus />
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-4 p-4 border rounded shadow">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="border p-2 w-full mb-2" />
                    <button onClick={handleSaveCategory} className="bg-green-500 text-white p-2 rounded mr-2">Save</button>
                    <button onClick={() => setIsAdding(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                </div>
            )}
            {isRenaming && (
                 <div className="mb-4 p-4 border rounded shadow">
                    <input type="text" value={renamingCategoryName} onChange={(e) => setRenamingCategoryName(e.target.value)} className="border p-2 w-full mb-2" />
                    <button onClick={handleSaveRename} className="bg-green-500 text-white p-2 rounded mr-2">Save Rename</button>
                    <button onClick={() => setIsRenaming(false)} className="bg-gray-500 text-white p-2 rounded">Cancel</button>
                </div>
            )}
            
            {loading ? <CategoriesSkeleton /> : (
                <div>
                    {categories.length > 0 ? (
                        <ul className="space-y-2">
                            {categories.map(category => (
                                <li key={category.id} className="flex justify-between items-center p-3 bg-gray-100 rounded shadow-sm">
                                    <span onClick={() => navigate(`/resources/${category.id}`)} className="cursor-pointer font-semibold flex-grow hover:text-blue-600">
                                        {category.name}
                                    </span>
                                    {currentUser && (
                                        <div className="flex items-center">
                                            <button onClick={() => handleRenameClick(category)} className="text-blue-500 hover:text-blue-700 mr-2"><MdEdit size={20} /></button>
                                            <button onClick={() => handleDelete(category.id)} className="text-red-500 hover:text-red-700"><MdDelete size={20} /></button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No categories found. Add a new one to get started.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResourceCategories;