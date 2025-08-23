import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { FaPlus, FaSearch, FaExternalLinkAlt, FaGlobe, FaYoutube, FaFileAlt, FaBook } from "react-icons/fa";
import { MdDelete, MdOpenInNew } from "react-icons/md";
import { IoArrowBack, IoLinkOutline } from "react-icons/io5";

const ResourceItems = ({ setHeaderTitle }) => {
  const { categoryId, chapterId } = useParams();
  const { currentUser } = useAuth();

  const [chapterName, setChapterName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const fetchNames = async () => {
      setHeaderTitle('Resource Items'); // Default title
      if (categoryId && chapterId) {
        try {
          // Fetch chapter name
          const chapterDocRef = doc(db, 'resources', categoryId, 'chapters', chapterId);
          const chapterDocSnap = await getDoc(chapterDocRef);
          if (chapterDocSnap.exists()) {
            const chapterNameData = chapterDocSnap.data().name;
            setChapterName(chapterNameData);
            setHeaderTitle(chapterNameData);
          }

          // Fetch category name for breadcrumb
          const categoryDocRef = doc(db, 'resources', categoryId);
          const categoryDocSnap = await getDoc(categoryDocRef);
          if (categoryDocSnap.exists()) {
            setCategoryName(categoryDocSnap.data().name);
          }
        } catch (error) {
          console.error("Error fetching names:", error);
        }
      }
    };
    fetchNames();
  }, [categoryId, chapterId, setHeaderTitle]);

  const { data: items, loading, addItem, deleteItem } = useFirestoreCollection(['resources', categoryId, 'chapters', chapterId, 'items']);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemLink, setNewItemLink] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.link.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveItem = async () => {
    if (newItemName.trim() === '' || newItemLink.trim() === '') return;
    setIsSaving(true);
    try {
      await addItem({ name: newItemName, link: newItemLink });
      setNewItemName('');
      setNewItemLink('');
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    setIsDeleting(itemId);
    try {
      await deleteItem(itemId);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
    }
  };

  // Get appropriate icon based on URL
  const getResourceIcon = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return <FaYoutube className="text-red-500" />;
    } else if (url.includes('.pdf')) {
      return <FaFileAlt className="text-red-600" />;
    } else if (url.includes('github.com')) {
      return <FaBook className="text-gray-800" />;
    } else {
      return <FaGlobe className="text-blue-500" />;
    }
  };

  // Extract domain from URL for display
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Invalid URL';
    }
  };

  const ItemsSkeleton = () => (
    <div className="space-y-4">
      {Array(5).fill().map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-grow">
              <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
              <div className="space-y-2 flex-grow">
                <div className="h-5 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Link 
                to={`/resources/${categoryId}`}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:shadow-md"
                title="Back to chapters"
              >
                <IoArrowBack className="text-2xl" />
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <IoLinkOutline className="text-white text-2xl" />
                </div>
                <div>
                  <nav className="text-sm text-gray-500 mb-1">
                    <Link to="/resources" className="hover:text-gray-700 transition-colors">Resources</Link>
                    <span className="mx-2">/</span>
                    <Link to={`/resources/${categoryId}`} className="hover:text-gray-700 transition-colors">
                      {categoryName || 'Category'}
                    </Link>
                    <span className="mx-2">/</span>
                    <span>{chapterName || 'Chapter'}</span>
                  </nav>
                  <h1 className="text-3xl font-bold text-gray-900">Resource Items</h1>
                  <p className="text-gray-600 mt-1">Links and resources for this chapter</p>
                </div>
              </div>
            </div>
            
            {currentUser && (
              <button 
                onClick={() => setIsAdding(true)} 
                className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <FaPlus className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Add Item
              </button>
            )}
          </div>

          {/* Search Bar */}
          {items.length > 0 && (
            <div className="relative max-w-md">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Add Item Form */}
        {isAdding && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-top-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FaPlus className="text-green-600 text-sm" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Add New Resource</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && newItemLink.trim() && handleSaveItem()}
                  placeholder="Enter resource name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource URL</label>
                <div className="relative">
                  <FaExternalLinkAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={newItemLink}
                    onChange={(e) => setNewItemLink(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, handleSaveItem)}
                    placeholder="https://example.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveItem}
                  disabled={!newItemName.trim() || !newItemLink.trim() || isSaving}
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

        {/* Items List */}
        {loading ? (
          <ItemsSkeleton />
        ) : filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 overflow-hidden"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-grow">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        hoveredItem === item.id 
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {hoveredItem === item.id ? (
                          <MdOpenInNew className="text-xl" />
                        ) : (
                          getResourceIcon(item.link)
                        )}
                      </div>
                      <div className="flex-grow">
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block group-hover:text-indigo-600 transition-colors duration-200"
                        >
                          <h3 className="font-semibold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-gray-500 text-sm flex items-center">
                            <span className="mr-2">🔗</span>
                            {getDomain(item.link)}
                          </p>
                        </a>
                      </div>
                      <div className={`transition-all duration-300 ${
                        hoveredItem === item.id ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-2'
                      }`}>
                        <FaExternalLinkAlt className="text-indigo-600 text-lg" />
                      </div>
                    </div>
                    
                    {currentUser && (
                      <div className={`ml-4 transition-all duration-300 ${
                        hoveredItem === item.id ? 'opacity-100' : 'opacity-0'
                      }`}>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting === item.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          title="Delete resource"
                        >
                          {isDeleting === item.id ? (
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
              We couldn't find any resources matching "{searchTerm}". Try adjusting your search terms.
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
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <IoLinkOutline className="text-white text-4xl" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Resources Yet</h3>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">
              Get started by adding your first resource to this chapter. You can add links to articles, videos, documents, and more.
            </p>
            {currentUser && (
              <button 
                onClick={() => setIsAdding(true)} 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <FaPlus className="mr-3" />
                Add Your First Resource
              </button>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {filteredItems.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                <IoLinkOutline className="text-indigo-600" />
                <span>
                  {searchTerm ? `${filteredItems.length} of ${items.length}` : items.length} 
                  {" "}
                  {items.length === 1 ? 'resource' : 'resources'} in {chapterName || 'this chapter'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceItems;