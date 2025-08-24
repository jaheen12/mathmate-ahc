import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';

import { FaPlus, FaSearch, FaExternalLinkAlt, FaGlobe, FaYoutube, FaFileAlt, FaBook } from "react-icons/fa";
import { MdDelete, MdOpenInNew } from "react-icons/md";
import { IoArrowBack, IoLinkOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';

const ResourceItems = ({ setHeaderTitle }) => {
  const { categoryId, chapterId } = useParams();
  const { currentUser } = useAuth();

  // Fetch parent doc names for the header/breadcrumbs
  const { data: categoryDoc } = useFirestoreDocument(['resources', categoryId]);
  const { data: chapterDoc } = useFirestoreDocument(['resources', categoryId, 'chapters', chapterId]);

  useEffect(() => {
    setHeaderTitle(chapterDoc?.name || 'Items');
  }, [chapterDoc, setHeaderTitle]);

  // Fetch resource items for this chapter
  const { 
    data: items, 
    loading, 
    addItem, 
    deleteItem,
    isOnline,
    fromCache,
    hasPendingWrites
  } = useFirestoreCollection(['resources', categoryId, 'chapters', chapterId, 'items'], {
      enableRealtime: true,
      cacheFirst: true
  });
  
  // UI State
  const [newItemName, setNewItemName] = useState('');
  const [newItemLink, setNewItemLink] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.link.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // --- Handlers ---
  const handleSaveItem = async () => {
    if (newItemName.trim() === '' || newItemLink.trim() === '') return;
    await addItem({ name: newItemName.trim(), link: newItemLink.trim() });
    setNewItemName('');
    setNewItemLink('');
    setIsAdding(false);
  };

  const handleDelete = async (itemId) => {
    await deleteItem(itemId, false);
  };

  // --- Helpers & UI Components ---
  const getResourceIcon = (url) => {
    try {
      const domain = new URL(url).hostname;
      if (domain.includes('youtube.com') || domain.includes('youtu.be')) return <FaYoutube className="text-red-500 text-xl" />;
      if (domain.includes('docs.google.com') || url.endsWith('.pdf')) return <FaFileAlt className="text-blue-500 text-xl" />;
    } catch (e) { /* ignore invalid URLs */ }
    return <FaGlobe className="text-gray-500 text-xl" />;
  };

  const getDomain = (url) => {
    try { return new URL(url).hostname; } catch (e) { return url; }
  };

  const ItemsSkeleton = () => (
    <div className="space-y-3">
        {Array(5).fill().map((_, i) => (
            <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <Skeleton circle={true} height={48} width={48} />
                <div className="flex-grow">
                    <Skeleton height={24} width="70%" />
                    <Skeleton height={16} width="40%" />
                </div>
            </div>
        ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-20">
        <IoLinkOutline size={80} className="mx-auto text-gray-300" />
        <h3 className="text-2xl font-bold text-gray-700 mt-4">No Items Yet</h3>
        <p className="text-gray-500 mt-2">Add the first resource link to this chapter.</p>
    </div>
  );

  // --- CRITICAL: Guard clause to prevent rendering crashes ---
  if (!items) {
      return (
          <div className="max-w-6xl mx-auto p-6">
              <ItemsSkeleton />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <Link to={`/resources/${categoryId}`} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                <IoArrowBack size={24} />
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">{chapterDoc?.name || 'Items'}</h1>
            {currentUser && (
              <button onClick={() => setIsAdding(true)} disabled={!isOnline} className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50">
                <FaPlus className="mr-2" />
                {isOnline ? 'Add Item' : 'Offline'}
              </button>
            )}
          </div>
        </div>
        
        <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />

        {isAdding && (
          <div className="mb-6 bg-white rounded-xl shadow-lg p-6 border">
            <h3 className="font-semibold text-lg mb-4">Add New Resource</h3>
            <div className="space-y-4">
                <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Resource Name (e.g., 'React Hooks Tutorial')" className="w-full p-2 border border-gray-300 rounded-lg" />
                <input type="text" value={newItemLink} onChange={(e) => setNewItemLink(e.target.value)} placeholder="URL Link (e.g., 'https://youtube.com/...')" className="w-full p-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={handleSaveItem} disabled={!newItemName.trim() || !newItemLink.trim() || !isOnline} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                {isOnline ? 'Save' : 'Offline'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6">
            {loading && filteredItems.length === 0 ? (
                <ItemsSkeleton />
            ) : filteredItems.length > 0 ? (
                <div className="space-y-3">
                    {filteredItems.map((item) => (
                    <ResourceItem
                        key={item.id}
                        item={item}
                        currentUser={currentUser}
                        isOnline={isOnline}
                        onDeleteClick={handleDelete}
                        getResourceIcon={getResourceIcon}
                        getDomain={getDomain}
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

const ResourceItem = ({ item, currentUser, isOnline, onDeleteClick, getResourceIcon, getDomain }) => {
    const isPending = item._metadata?.hasPendingWrites;
    
    return (
        <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 ${isPending ? 'opacity-60' : ''}`}>
            <div className="p-6 flex items-center justify-between">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 flex-grow">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 group-hover:bg-indigo-100 transition-colors duration-300">
                        {getResourceIcon(item.link)}
                    </div>
                    <div className="flex-grow">
                        <h3 className="font-semibold text-xl text-gray-900 group-hover:text-indigo-600">
                            {item.name}
                            {isPending && <span className="text-sm font-normal text-gray-500"> (saving...)</span>}
                        </h3>
                        <p className="text-gray-500 text-sm flex items-center">
                            <span className="mr-2">🔗</span>{getDomain(item.link)}
                        </p>
                    </div>
                </a>
                
                <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <MdOpenInNew className="text-lg" />
                    </a>
                    {currentUser && (
                        <button onClick={() => onDeleteClick(item.id)} disabled={!isOnline} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                            <MdDelete className="text-lg" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceItems;