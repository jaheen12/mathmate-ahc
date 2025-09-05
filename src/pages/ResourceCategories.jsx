import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';

import { FaPlus, FaSearch, FaFolder, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoLibraryOutline, IoCloudOfflineOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const ResourceCategories = ({ setHeaderTitle }) => {
  // --- CHANGE: Simplified data hook ---
  const { 
    data: categories, 
    loading, 
    addItem, 
    deleteItem, 
    updateItem,
    isOnline,
    fromCache,
    hasPendingWrites
  } = useFirestoreCollection('resources');
  
  useEffect(() => {
    setHeaderTitle?.('Resources');
  }, [setHeaderTitle]);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [renamingCategoryId, setRenamingCategoryId] = useState(null);
  const [renamingCategoryName, setRenamingCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isAdmin = !!currentUser;

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // --- Handlers with toast feedback and offline support ---
  const handleSaveCategory = useCallback(async (e) => {
    e.preventDefault();
    if (newCategoryName.trim() === '' || !isAdmin) return;
    try {
        await addItem({ name: newCategoryName.trim() });
        toast.success(isOnline ? "Category added!" : "Category saved locally!");
        setNewCategoryName('');
        setIsAdding(false);
    } catch (error) {
        toast.error("Failed to add category.");
        console.error(error);
    }
  }, [newCategoryName, addItem, isAdmin, isOnline]);

  const handleDelete = useCallback(async (categoryId) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this category and all resources inside it?')) {
        try {
            await deleteItem(categoryId, false);
            toast.success(isOnline ? "Category deleted!" : "Deletion saved locally!");
        } catch (error) {
            toast.error("Failed to delete category.");
            console.error(error);
        }
    }
  }, [deleteItem, isAdmin, isOnline]);

  const handleSaveRename = useCallback(async (e) => {
    e.preventDefault();
    if (renamingCategoryName.trim() === '' || !isAdmin) return;
    try {
        await updateItem(renamingCategoryId, { name: renamingCategoryName.trim() });
        toast.success(isOnline ? "Category renamed!" : "Rename saved locally!");
        setRenamingCategoryId(null);
        setRenamingCategoryName('');
    } catch (error) {
        toast.error("Failed to rename category.");
        console.error(error);
    }
  }, [renamingCategoryName, renamingCategoryId, updateItem, isAdmin, isOnline]);

  const handleRenameClick = useCallback((category) => {
    setRenamingCategoryId(category.id);
    setRenamingCategoryName(category.name);
  }, []);
  
  const handleNavigate = useCallback((categoryId) => {
    if (!renamingCategoryId) { // Prevent navigation while renaming
        navigate(`/resources/${categoryId}`);
    }
  }, [navigate, renamingCategoryId]);

  const cancelAdd = () => {
    setIsAdding(false);
    setNewCategoryName('');
  };

  const cancelRename = () => {
    setRenamingCategoryId(null);
    setRenamingCategoryName('');
  };

  // --- UI Components ---
  const CategoriesSkeleton = () => (
    <div className="space-y-3">
        {Array(4).fill().map((_, i) => (
            <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100"><Skeleton height={28} width="60%" /></div>
        ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20">
        <IoLibraryOutline size={80} className="mx-auto text-gray-300" />
        <h3 className="text-2xl font-bold text-gray-700 mt-4">No Resource Categories</h3>
        <p className="text-gray-500 mt-2">Create the first category to start adding resources.</p>
    </div>
  );

  if (loading && !categories) {
      return (
          <div className="max-w-6xl mx-auto p-6"><CategoriesSkeleton /></div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Resources</h1>
            {isAdmin && !isAdding && (
              <button onClick={() => setIsAdding(true)} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transform hover:scale-105 transition-all">
                <FaPlus className="mr-2" /> Add Category
              </button>
            )}
        </div>
        <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
        
        {/* --- CHANGE: Added full Add/Rename Forms --- */}
        {isAdding && (
            <form onSubmit={handleSaveCategory} className="my-6 p-4 bg-white rounded-xl shadow-md border animate-in fade-in-0 duration-300">
                <h4 className="font-semibold mb-2">Add New Category</h4>
                <div className="flex gap-2">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Enter category name..." className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" autoFocus />
                    <button type="button" onClick={cancelAdd} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"><FaTimes /></button>
                    <button type="submit" disabled={!newCategoryName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                        {isOnline ? <MdCheck /> : <IoCloudOfflineOutline />} Create
                    </button>
                </div>
            </form>
        )}
        
        <div className="mt-6">
            {loading && filteredCategories.length === 0 ? <CategoriesSkeleton /> : filteredCategories.length > 0 ? (
                <div className="space-y-3">
                    {filteredCategories.map(category => (
                        renamingCategoryId === category.id ? (
                            <form onSubmit={handleSaveRename} key={category.id} className="p-4 bg-white rounded-xl shadow-lg border-2 border-blue-500">
                                <div className="flex gap-2 items-center">
                                    <input type="text" value={renamingCategoryName} onChange={(e) => setRenamingCategoryName(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" autoFocus />
                                    <button type="button" onClick={cancelRename} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"><FaTimes /></button>
                                    <button type="submit" disabled={!renamingCategoryName.trim()} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1">
                                        <MdCheck /> Save
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <CategoryItem key={category.id} category={category} isAdmin={isAdmin} onNavigate={handleNavigate} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} />
                        )
                    ))}
                </div>
            ) : (<EmptyState />)}
        </div>
      </div>
    </div>
  );
};

const CategoryItem = ({ category, isAdmin, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = category._metadata?.hasPendingWrites;
    return (
        <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 ${isPending ? 'opacity-60' : ''}`}>
            <div className="p-6 flex items-center justify-between">
                <div onClick={() => onNavigate(category.id)} className="flex items-center space-x-4 cursor-pointer flex-grow min-w-0">
                    <div className="p-3 bg-blue-100 rounded-lg"><FaFolder className="text-blue-600" /></div>
                    <div>
                        <h3 className="font-semibold text-xl text-gray-900 group-hover:text-blue-600 truncate">
                            {category.name}
                            {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Click to view resources</p>
                    </div>
                </div>
                {/* --- CHANGE: Action buttons now work offline --- */}
                {isAdmin && (
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => onRenameClick(category)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><MdEdit className="text-lg" /></button>
                        <button onClick={() => onDeleteClick(category.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><MdDelete className="text-lg" /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceCategories;