import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus } from "react-icons/fa";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton'; // Import the skeleton component

const ResourceCategories = () => {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamingCategoryId, setRenamingCategoryId] = useState(null);
    const [renamingCategoryName, setRenamingCategoryName] = useState('');
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "resources"));
                const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCategories(categoriesData);
            } catch (error) {
                console.error("Error fetching categories: ", error);
                toast.error("Failed to fetch categories.");
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleSaveCategory = async () => {
        if (newCategoryName.trim() === '') {
            toast.error('Category name cannot be empty');
            return;
        }
        try {
            const docRef = await addDoc(collection(db, "resources"), {
                name: newCategoryName,
                createdAt: new Date()
            });
            setCategories([...categories, { id: docRef.id, name: newCategoryName }]);
            setNewCategoryName('');
            setIsAdding(false);
            toast.success('Category added successfully!');
        } catch (error) {
            console.error("Error adding category: ", error);
            toast.error('Failed to add category.');
        }
    };

    const handleDelete = async (categoryId) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await deleteDoc(doc(db, "resources", categoryId));
                setCategories(categories.filter(cat => cat.id !== categoryId));
                toast.success('Category deleted successfully!');
            } catch (error) {
                console.error("Error deleting category: ", error);
                toast.error('Failed to delete category.');
            }
        }
    };
    
    const handleRename = (category) => {
        setIsRenaming(true);
        setRenamingCategoryId(category.id);
        setRenamingCategoryName(category.name);
    };

    const handleSaveRename = async () => {
        if (renamingCategoryName.trim() === '') {
            toast.error('Category name cannot be empty');
            return;
        }
        try {
            const categoryDoc = doc(db, "resources", renamingCategoryId);
            await updateDoc(categoryDoc, { name: renamingCategoryName });
            setCategories(categories.map(c => c.id === renamingCategoryId ? { ...c, name: renamingCategoryName } : c));
            setIsRenaming(false);
            setRenamingCategoryId(null);
            toast.success('Category renamed successfully!');
        } catch (error) {
            console.error("Error renaming category: ", error);
            toast.error('Failed to rename category.');
        }
    };

    // --- Loading Skeleton component for Categories ---
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
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name"
                        className="border p-2 w-full mb-2"
                    />
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
                                    <span 
                                        onClick={() => navigate(`/resources/${category.id}`)} 
                                        className="cursor-pointer font-semibold flex-grow hover:text-blue-600"
                                    >
                                        {category.name}
                                    </span>
                                    {currentUser && (
                                        <div className="flex items-center">
                                            <button onClick={() => handleRename(category)} className="text-blue-500 hover:text-blue-700 mr-2"><MdEdit size={20} /></button>
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