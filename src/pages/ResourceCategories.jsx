import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus, FaSearch, FaFolder } from "react-icons/fa";
import { MdDelete, MdEdit, MdKeyboardArrowRight } from "react-icons/md";
import { IoLibraryOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

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
  } = useFirestoreCollection('resources', {
      enableRealtime: true,
      cacheFirst: true
  });
  
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

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // --- Handlers ---
  const handleSaveCategory = async () => {
    if (newCategoryName.trim() === '') return;
    await addItem({ name: newCategoryName.trim() });
    setNewCategoryName('');
    setIsAdding(false);
  };

  const handleDelete = async (categoryId) => {
    await deleteItem(categoryId, false);
  };

  const handleSaveRename = async () => {
    if (renamingCategoryName.trim() === '') return;
    await updateItem(renamingCategoryId, { name: renamingCategoryName.trim() });
    setRenamingCategoryId(null);
    setRenamingCategoryName('');
  };

  const handleRenameClick = (category) => {
    setRenamingCategoryId(category.id);
    setRenamingCategoryName(category.name);
  };
  
  const handleNavigate = (categoryId) => {
    navigate(`/resources/${categoryId}`);
  };

  // --- UI Components ---
  const CategoriesSkeleton = () => (
    <div className="space-y-3">
        {Array(4).fill().map((_, i) => (
            <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                <Skeleton height={28} width="60%" />
            </div>
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

  // --- CRITICAL: Guard clause to prevent rendering crashes ---
  if (!categories) {
      return (
          <div className="max-w-6xl mx-auto p-6">
              <CategoriesSkeleton />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Resources</h1>
            {currentUser && (
              <button onClick={() => setIsAdding(true)} disabled={!isOnline} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50">
                <FaPlus className="mr-2" />
                {isOnline ? 'Add Category' : 'Offline'}
              </button>
            )}
          </div>
        </div>

        <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
        
        {/* Add/Rename Forms */}
        {isAdding && (<div>Add form here...</div>)}
        {renamingCategoryId && (<div>Rename form here...</div>)}
        
        <div className="mt-6">
            {loading && filteredCategories.length === 0 ? (
            <CategoriesSkeleton />
            ) : filteredCategories.length > 0 ? (
            <div className="space-y-3">
                {filteredCategories.map(category => (
                <CategoryItem 
                    key={category.id}
                    category={category}
                    currentUser={currentUser}
                    isOnline={isOnline}
                    onNavigate={handleNavigate}
                    onRenameClick={handleRenameClick}
                    onDeleteClick={handleDelete}
                />
                ))}
            </div>
            ) : (
                <EmptyState />
            )}
        </div>
      </div>
    </div>
  );
};

const CategoryItem = ({ category, currentUser, isOnline, onNavigate, onRenameClick, onDeleteClick }) => {
    const isPending = category._metadata?.hasPendingWrites;

    return (
        <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 ${isPending ? 'opacity-60' : ''}`}>
            <div className="p-6 flex items-center justify-between">
                <div onClick={() => onNavigate(category.id)} className="flex items-center space-x-4 cursor-pointer flex-grow">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <FaFolder className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-xl text-gray-900 group-hover:text-blue-600">
                            {category.name}
                            {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Click to view resources</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {currentUser && (
                        <>
                            <button onClick={() => onRenameClick(category)} disabled={!isOnline} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50">
                                <MdEdit className="text-lg" />
                            </button>
                            <button onClick={() => onDeleteClick(category.id)} disabled={!isOnline} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                                <MdDelete className="text-lg" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceCategories;