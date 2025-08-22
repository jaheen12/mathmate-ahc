import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoLibraryOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const ResourceCategories = ({ setHeaderTitle }) => {
    const { data: categories, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(['resources']);
    
    useEffect(() => {
        setHeaderTitle('Resources');
    }, [setHeaderTitle]);
    
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingCategoryId, setRenamingCategoryId] = useState(null);
    const [renamingCategoryName, setRenamingCategoryName] = useState('');
    
    const navigate = useNavigate();
    const { currentUser } = useAuth();

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
        setRenamingCategoryName('');
    };

    const handleRenameClick = (category) => {
        setIsRenaming(true);
        setRenamingCategoryId(category.id);
        setRenamingCategoryName(category.name);
    };

    const CategoriesSkeleton = () => (
        <div className="space-y-3">
            {Array(5).fill().map((_, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md">
                    <Skeleton width={'60%'} height={24} />
                    <div className="flex items-center gap-2">
                        <Skeleton circle={true} height={32} width={32} />
                        <Skeleton circle={true} height={32} width={32} />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-2">
            {currentUser && (
                <div className="flex justify-end mb-4">
                     <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600">
                        <FaPlus className="mr-2" />
                        Add Category
                    </button>
                </div>
            )}

            {isAdding && (
                <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="border p-2 w-full mb-2 rounded-md" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSaveCategory} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">Save</button>
                    </div>
                </div>
            )}
            {isRenaming && (
                 <div className="mb-4 p-4 bg-white rounded-lg shadow-md">
                    <input type="text" value={renamingCategoryName} onChange={(e) => setRenamingCategoryName(e.target.value)} placeholder="Rename category" className="border p-2 w-full mb-2 rounded-md" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsRenaming(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSaveRename} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600">Save</button>
                    </div>
                </div>
            )}
            
            {loading ? (
                <CategoriesSkeleton />
            ) : (
                categories.length > 0 ? (
                    <ul className="space-y-3">
                        {categories.map(category => (
                            <li key={category.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
                                <span onClick={() => navigate(`/resources/${category.id}`)} className="cursor-pointer font-semibold text-lg text-gray-800 flex-grow">
                                    {category.name}
                                </span>
                                {currentUser && (
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleRenameClick(category)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100">
                                            <MdEdit size={22} />
                                        </button>
                                        <button onClick={() => handleDelete(category.id)} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100">
                                            <MdDelete size={22} />
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center mt-10">
                        <IoLibraryOutline size={64} className="mx-auto text-gray-300" />
                        <h2 className="text-2xl font-semibold text-gray-700 mt-4">No Resource Categories</h2>
                        <p className="text-gray-500 mt-2">An admin needs to add categories to get started.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default ResourceCategories;