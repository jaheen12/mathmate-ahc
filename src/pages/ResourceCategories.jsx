import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { FaPlus, FaSearch, FaFolder } from "react-icons/fa";
import { MdDelete, MdEdit, MdKeyboardArrowRight } from "react-icons/md";
import { IoLibraryOutline } from "react-icons/io5";

const ResourceCategories = ({ setHeaderTitle }) => {
  const { data: categories, loading, addItem, deleteItem, updateItem } = useFirestoreCollection(['resources']);
  
  useEffect(() => {
    setHeaderTitle?.('Resources');
  }, [setHeaderTitle]);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingCategoryId, setRenamingCategoryId] = useState(null);
  const [renamingCategoryName, setRenamingCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveCategory = async () => {
    if (newCategoryName.trim() === '') return;
    setIsSaving(true);
    try {
      await addItem({ name: newCategoryName });
      setNewCategoryName('');
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    setIsDeleting(categoryId);
    try {
      await deleteItem(categoryId);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveRename = async () => {
    if (renamingCategoryName.trim() === '') return;
    setIsSaving(true);
    try {
      await updateItem(renamingCategoryId, { name: renamingCategoryName });
      setIsRenaming(false);
      setRenamingCategoryId(null);
      setRenamingCategoryName('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameClick = (category) => {
    setIsRenaming(true);
    setRenamingCategoryId(category.id);
    setRenamingCategoryName(category.name);
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setIsRenaming(false);
    }
  };

  const handleNavigate = (categoryId) => {
    navigate(`/resources/${categoryId}`);
  };

  const CategoriesSkeleton = () => (
    <div className="space-y-4">
      {Array(5).fill().map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <IoLibraryOutline className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Resource Categories</h1>
                <p className="text-gray-600 mt-1">Organize and manage your resource collections</p>
              </div>
            </div>
            
            {currentUser && (
              <button 
                onClick={() => setIsAdding(true)} 
                className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <FaPlus className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Add Category
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
          </div>
        </div>

        {/* Add Category Form */}
        {isAdding && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-top-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FaPlus className="text-green-600 text-sm" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Create New Category</h3>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleSaveCategory)}
                placeholder="Enter category name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveCategory}
                  disabled={!newCategoryName.trim() || isSaving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-all duration-200 font-medium min-w-[80px] flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Category Form */}
        {isRenaming && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-top-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MdEdit className="text-blue-600 text-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Rename Category</h3>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={renamingCategoryName}
                onChange={(e) => setRenamingCategoryName(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleSaveRename)}
                placeholder="Enter new category name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setIsRenaming(false)} 
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveRename}
                  disabled={!renamingCategoryName.trim() || isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 font-medium min-w-[80px] flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Update'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Categories List */}
        {loading ? (
          <CategoriesSkeleton />
        ) : filteredCategories.length > 0 ? (
          <div className="space-y-3">
            {filteredCategories.map(category => (
              <div 
                key={category.id} 
                className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden"
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => handleNavigate(category.id)}
                      className="flex items-center space-x-4 cursor-pointer flex-grow group-hover:text-blue-600 transition-colors duration-200"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        hoveredCategory === category.id 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FaFolder className="text-xl" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-xl text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {category.name}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Click to view resources</p>
                      </div>
                      <MdKeyboardArrowRight className={`text-2xl text-gray-400 transition-all duration-300 ${
                        hoveredCategory === category.id ? 'text-blue-600 transform translate-x-1' : ''
                      }`} />
                    </div>
                    
                    {currentUser && (
                      <div className={`flex items-center space-x-2 ml-4 transition-all duration-300 ${
                        hoveredCategory === category.id ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <button 
                          onClick={() => handleRenameClick(category)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Rename category"
                        >
                          <MdEdit className="text-lg" />
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)}
                          disabled={isDeleting === category.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          title="Delete category"
                        >
                          {isDeleting === category.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MdDelete className="text-lg" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaSearch className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No results found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any categories matching "{searchTerm}". Try adjusting your search terms.
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <IoLibraryOutline className="text-white text-4xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Resource Categories</h3>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
              Get started by creating your first category to organize your resources efficiently. Categories help you keep everything organized and easy to find.
            </p>
            {currentUser && (
              <button 
                onClick={() => setIsAdding(true)} 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <FaPlus className="mr-3" />
                Create Your First Category
              </button>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {filteredCategories.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                <IoLibraryOutline className="text-blue-600" />
                <span>
                  {searchTerm ? `${filteredCategories.length} of ${categories.length}` : categories.length} 
                  {" "}
                  {categories.length === 1 ? 'category' : 'categories'} total
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceCategories;