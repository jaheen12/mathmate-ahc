import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import NetworkStatus from '../components/NetworkStatus';
import { toast } from 'react-toastify';

import { FaPlus, FaYoutube, FaFileAlt, FaGlobe } from "react-icons/fa";
import { MdDelete, MdOpenInNew, MdCheck, MdEdit } from "react-icons/md";
import { IoArrowBack, IoLinkOutline, IoCloudOfflineOutline } from "react-icons/io5";
import Skeleton from 'react-loading-skeleton';
import { HiPlus } from 'react-icons/hi2';

const ResourceItems = ({ setHeaderTitle }) => {
  const { categoryId, chapterId } = useParams();
  const { currentUser } = useAuth();

  const { data: chapterDoc } = useFirestoreDocument(['resources', categoryId, 'chapters', chapterId]);

  useEffect(() => {
    setHeaderTitle(chapterDoc?.name || 'Items');
  }, [chapterDoc, setHeaderTitle]);

  const { 
    data: items, 
    loading, 
    addItem,
    updateItem, // <-- Add updateItem
    deleteItem,
    isOnline,
    fromCache,
    hasPendingWrites
  } = useFirestoreCollection(['resources', categoryId, 'chapters', chapterId, 'items']);
  
  // --- NEW: State for editing/renaming ---
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemLink, setNewItemLink] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingItemLink, setEditingItemLink] = useState('');

  const handleSaveItem = useCallback(async (e) => {
    e.preventDefault();
    if (newItemName.trim() === '' || newItemLink.trim() === '') return;
    await addItem({ name: newItemName.trim(), link: newItemLink.trim() });
    toast.success(isOnline ? "Resource added!" : "Resource saved locally!");
    setIsAdding(false);
    setNewItemName('');
    setNewItemLink('');
  }, [newItemName, newItemLink, addItem, isOnline]);
  
  // --- NEW: Handler for saving an edit ---
  const handleSaveEdit = useCallback(async (e) => {
    e.preventDefault();
    if (editingItemName.trim() === '' || editingItemLink.trim() === '') return;
    await updateItem(editingItemId, { name: editingItemName.trim(), link: editingItemLink.trim() });
    toast.success(isOnline ? "Resource updated!" : "Update saved locally!");
    setEditingItemId(null);
    setEditingItemName('');
    setEditingItemLink('');
  }, [editingItemId, editingItemName, editingItemLink, updateItem, isOnline]);

  const handleDelete = useCallback(async (itemId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
        await deleteItem(itemId, false);
        toast.success(isOnline ? "Resource deleted!" : "Deletion saved locally!");
    }
  }, [deleteItem, isOnline]);
  
  // --- NEW: Handler to start editing ---
  const handleEditClick = useCallback((item) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
    setEditingItemLink(item.link);
    setIsAdding(false); // Close add form if open
  }, []);

  const cancelAdd = () => { setIsAdding(false); setNewItemName(''); setNewItemLink(''); };
  const cancelEdit = () => { setEditingItemId(null); setEditingItemName(''); setEditingItemLink(''); };

  const getResourceIcon = (url) => {
    try {
      const domain = new URL(url).hostname;
      if (domain.includes('youtube.com') || domain.includes('youtu.be')) return <FaYoutube className="text-red-500" size={18} />;
      if (domain.includes('docs.google.com') || url.endsWith('.pdf')) return <FaFileAlt className="text-blue-500" size={18} />;
    } catch (e) { /* ignore */ }
    return <FaGlobe className="text-gray-500" size={18} />;
  };

  const getDomain = (url) => {
    try { return new URL(url).hostname; } catch (e) { return "Invalid URL"; }
  };

  const ItemsSkeleton = () => (
    <div className="space-y-2">{Array(4).fill(0).map((_, i) => (<div key={i} className="p-3 bg-white rounded-lg border border-gray-100 flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-lg"></div><div className="flex-1 h-4 bg-gray-200 rounded"></div></div>))}</div>
  );

  const EmptyState = () => (
    <div className="text-center py-12 px-4"><div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl mx-auto flex items-center justify-center mb-4"><IoLinkOutline size={28} className="text-indigo-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">No Resources Yet</h3><p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto leading-relaxed">{currentUser ? "Add the first resource link to this chapter." : "Resources for this chapter will appear here."}</p>{currentUser && (<button onClick={() => setIsAdding(true)} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all hover:shadow-md"><HiPlus className="mr-1.5" size={16} />Add Resource</button>)}</div>
  );

  if (loading && !items) {
      return <div className="min-h-screen bg-gray-50"><div className="px-3 pt-4 pb-6 max-w-2xl mx-auto"><ItemsSkeleton /></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-3 pt-4 pb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center flex-1 min-w-0">
                <Link to={`/resources/${categoryId}`} className="flex items-center text-gray-600 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-200 transition-colors mr-2 flex-shrink-0"><IoArrowBack size={18} /></Link>
                <div className="min-w-0 flex-1"><h1 className="text-xl font-bold text-gray-900 truncate">{chapterDoc?.name || 'Items'}</h1><p className="text-xs text-gray-600">{items?.length || 0} items</p></div>
            </div>
            {currentUser && !isAdding && (<button onClick={() => { setIsAdding(true); setEditingItemId(null); }} className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all hover:shadow-md ml-3 flex-shrink-0"><HiPlus className="mr-1.5" size={14} /><span className="hidden sm:inline">Add Resource</span><span className="sm:hidden">Add</span></button>)}
        </div>
        <NetworkStatus isOnline={isOnline} fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
        
        {currentUser && isAdding && (
          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Resource</h3><form onSubmit={handleSaveItem} className="space-y-3"><input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Resource Name" className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required /><input type="url" value={newItemLink} onChange={(e) => setNewItemLink(e.target.value)} placeholder="URL Link (https://...)" className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required /><div className="flex gap-2"><button type="button" onClick={cancelAdd} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" disabled={!newItemName.trim() || !newItemLink.trim()} className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center">{isOnline ? <MdCheck className="mr-1" size={14} /> : <IoCloudOfflineOutline className="mr-1" size={14} />}Save</button></div></form></div>
        )}

        <div className="space-y-2 mt-4">
            {items && items.length > 0 ? (
                items.map((item) => (
                    currentUser && editingItemId === item.id ? (
                        <div key={item.id} className="p-3 bg-white rounded-lg border-2 border-indigo-200"><h3 className="text-sm font-semibold text-gray-900 mb-3">Edit Resource</h3><form onSubmit={handleSaveEdit} className="space-y-3"><input type="text" value={editingItemName} onChange={(e) => setEditingItemName(e.target.value)} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required /><input type="url" value={editingItemLink} onChange={(e) => setEditingItemLink(e.target.value)} className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required /><div className="flex gap-2"><button type="button" onClick={cancelEdit} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">Cancel</button><button type="submit" disabled={!editingItemName.trim() || !editingItemLink.trim()} className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button></div></form></div>
                    ) : (
                        <ResourceItem key={item.id} item={item} currentUser={currentUser} onEditClick={handleEditClick} onDeleteClick={handleDelete} getResourceIcon={getResourceIcon} getDomain={getDomain} />
                    )
                ))
            ) : (<EmptyState />)}
        </div>
      </div>
    </div>
  );
};

const ResourceItem = ({ item, currentUser, onEditClick, onDeleteClick, getResourceIcon, getDomain }) => {
    const isPending = item._metadata?.hasPendingWrites;
    return (
        <div className={`group bg-white rounded-lg border transition-all duration-200 ${isPending ? 'opacity-75' : ''} border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm`}>
            <div className="p-3 flex items-center gap-3">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                    {getResourceIcon(item.link)}
                </a>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 mb-0.5 break-words leading-snug group-hover:text-indigo-600">
                        {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                        {getDomain(item.link)}
                        {isPending && <span className="text-orange-600 font-medium ml-1">• Syncing...</span>}
                    </p>
                </a>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md" title="Open in new tab"><MdOpenInNew size={16} /></a>
                    {currentUser && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); onEditClick(item); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit item"><MdEdit size={16} /></button>
                           <button onClick={(e) => { e.stopPropagation(); onDeleteClick(item.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete item"><MdDelete size={16} /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceItems;