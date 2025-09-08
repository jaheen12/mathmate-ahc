import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';

import { FaPlus, FaFolder, FaTimes } from "react-icons/fa";
import { MdDelete, MdEdit, MdCheck } from "react-icons/md";
import { IoLibraryOutline, IoCloudOfflineOutline } from "react-icons/io5";
import { HiPlus } from 'react-icons/hi2';

const ResourceCategories = ({ setHeaderTitle }) => {
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
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSaveCategory = useCallback(async (e) => {
    e.preventDefault();
    if (newCategoryName.trim() === '') return;
    try {
        await addItem({ name: newCategoryName.trim() });
        toast.success(isOnline ? "Category added!" : "Category saved locally!");
        setNewCategoryName('');
        setIsAdding(false);
    } catch (error) {
        toast.error("Failed to add category.");
    }
  }, [newCategoryName, addItem, isOnline]);

  const handleDelete = useCallback(async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
        await deleteItem(categoryId, true);
        toast.success(isOnline ? "Category deleted!" : "Deletion saved locally!");
    }
  }, [deleteItem, isOnline]);

  const handleSaveRename = useCallback(async (e) => {
    e.preventDefault();
    if (renamingCategoryName.trim() === '') return;
    await updateItem(renamingCategoryId, { name: renamingCategoryName.trim() });
    toast.success(isOnline ? "Category renamed!" : "Rename saved locally!");
    setRenamingCategoryId(null);
    setRenamingCategoryName('');
  }, [renamingCategoryName, renamingCategoryId, updateItem, isOnline]);

  const handleRenameClick = useCallback((category) => {
    setRenamingCategoryId(category.id);
    setRenamingCategoryName(category.name);
  }, []);
  
  const handleNavigate = useCallback((categoryId) => {
    if (!renamingCategoryId) {
        navigate(`/resources/${categoryId}`);
    }
  }, [navigate, renamingCategoryId]);

  const cancelAdd = () => { setIsAdding(false); setNewCategoryName(''); };
  const cancelRename = () => { setRenamingCategoryId(null); setRenamingCategoryName(''); };

  const CategoriesSkeleton = () => (
    <div className="space-y-2">{Array(4).fill(0).map((_, i) => (<div key={i} className="p-3 bg-white rounded-lg border border-gray-100 flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-lg"></div><div className="flex-1 h-4 bg-gray-200 rounded"></div></div>))}</div>
  );

  const EmptyState = () => (
    <div className="text-center py-12 px-4"><div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl mx-auto flex items-center justify-center mb-4"><IoLibraryOutline size={28} className="text-blue-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">No Resource Categories</h3><p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto leading-relaxed">{currentUser ? "Create your first category to start adding resources." : "Resources will appear here once added."}</p>{currentUser && (<button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all hover:shadow-md"><HiPlus className="mr-1.5" size={16} />Add Category</button>)}</div>
  );

  if (loading && !categories) {
      return <div className="min-h-screen bg-gray-50"><div className="px-3 pt-4 pb-6 max-w-2xl mx-auto"><CategoriesSkeleton /></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 pt-4 pb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
            <div className="flex-1 min-w-0"><h1 className="text-xl font-bold text-gray-900">Resources</h1><p className="text-sm text-gray-600">Shared documents & links</p></div>
            {currentUser && !isAdding && (<button onClick={() => setIsAdding(true)} className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all hover:shadow-md ml-3 flex-shrink-0"><HiPlus className="mr-1.5" size={14} /><span className="hidden sm:inline">Add Category</span><span className="sm:hidden">Add</span></button>)}
        </div>
        <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
        
        {currentUser && isAdding && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Category</h3><form onSubmit={handleSaveCategory} className="space-y-3"><input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelAdd} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" disabled={!newCategoryName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">{isOnline ? <MdCheck className="mr-1" size={14} /> : <IoCloudOfflineOutline className="mr-1" size={14} />}Save</button></div></form></div>
        )}
        
        <div className="space-y-2 mt-4">
            {categories && categories.length > 0 ? (
                categories.map(category => (
                    currentUser && renamingCategoryId === category.id ? (
                        <div key={category.id} className="p-3 bg-white rounded-lg border-2 border-blue-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Edit Category</h3><form onSubmit={handleSaveRename} className="space-y-3"><input type="text" value={renamingCategoryName} onChange={(e) => setRenamingCategoryName(e.target.value)} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" autoFocus /><div className="flex gap-2"><button type="button" onClick={cancelRename} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" disabled={!renamingCategoryName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">Save</button></div></form></div>
                    ) : (
                        <CategoryItem key={category.id} category={category} currentUser={currentUser} onNavigate={handleNavigate} onRenameClick={handleRenameClick} onDeleteClick={handleDelete} />
                    )
                ))
            ) : (<EmptyState />)}
        </div>
      </div>
    </div>
  );
};

const CategoryItem = ({ category, currentUser, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = category._metadata?.hasPendingWrites;
    return (
        <div className={`group bg-white rounded-lg border transition-all duration-200 cursor-pointer ${isPending ? 'opacity-75' : ''} border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm`} onClick={() => onNavigate(category.id)}>
            <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FaFolder className="text-blue-600" size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                    {/* --- IMPROVED TEXT WRAPPING --- */}
                    <h3 className="font-semibold text-base text-gray-900 mb-0.5 break-words leading-snug group-hover:text-blue-600">
                        {category.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                        Tap to view resources
                        {isPending && <span className="text-orange-600 font-medium ml-1">• Syncing...</span>}
                    </p>
                </div>
                {currentUser && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); onRenameClick(category); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit category"><MdEdit size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteClick(category.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete category"><MdDelete size={16} /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceCategories;