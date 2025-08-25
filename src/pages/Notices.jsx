import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import NetworkStatus from '../components/NetworkStatus';
import { db } from '../firebaseConfig';
import { collection, query, orderBy } from 'firebase/firestore';

import { 
  Plus, 
  Search, 
  Filter, 
  Megaphone, 
  SortDesc, 
  SortAsc, 
  Grid3X3, 
  List,
  Bell,
  TrendingUp,
  Calendar,
  Users,
  X,
  ChevronDown
} from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import NoticeCard from '../components/NoticeCard';
import NoticeEditorModal from '../components/NoticeEditorModal';

const EMPTY_NOTICE = { title: '', content: '', priority: 'normal' };

// Memoized skeleton component
const NoticePageSkeleton = React.memo(() => (
  <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
    {Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="p-6 bg-white/90 rounded-2xl shadow-sm border border-gray-200/50 backdrop-blur-sm">
        <div className="flex items-start gap-3 mb-4">
          <Skeleton height={32} width={32} className="rounded-lg" />
          <div className="flex-1">
            <Skeleton height={24} width="70%" className="mb-2" />
            <Skeleton height={16} width="40%" />
          </div>
        </div>
        <Skeleton count={3} className="mb-4" />
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <Skeleton height={16} width="30%" />
          <div className="flex gap-2">
            <Skeleton height={36} width={36} className="rounded-xl" />
            <Skeleton height={36} width={36} className="rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
));

// Memoized stats card component
const StatsCard = React.memo(({ icon: Icon, label, value, color = 'blue' }) => (
  <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${
        color === 'blue' ? 'bg-gradient-to-br from-blue-100 to-blue-200' :
        color === 'green' ? 'bg-gradient-to-br from-green-100 to-green-200' :
        color === 'orange' ? 'bg-gradient-to-br from-orange-100 to-orange-200' :
        'bg-gradient-to-br from-red-100 to-red-200'
      }`}>
        <Icon className={`w-6 h-6 ${
          color === 'blue' ? 'text-blue-600' :
          color === 'green' ? 'text-green-600' :
          color === 'orange' ? 'text-orange-600' :
          'text-red-600'
        }`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  </div>
));

// Memoized empty state component
const EmptyState = React.memo(({ searchTerm, filterPriority, onClearFilters }) => (
  <div className="text-center py-20">
    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl mb-6">
      <Megaphone className="w-10 h-10 text-blue-600" />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-3">
      {searchTerm || filterPriority !== 'all' ? 'No Matching Notices' : 'No Notices Yet'}
    </h3>
    <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
      {searchTerm || filterPriority !== 'all'
        ? "Try adjusting your search terms or filters to find what you're looking for."
        : "There are no announcements right now. Be the first to create one!"
      }
    </p>
    {(searchTerm || filterPriority !== 'all') && (
      <button
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
      >
        <X className="w-4 h-4" />
        Clear Filters
      </button>
    )}
  </div>
));

const Notices = ({ setHeaderTitle }) => {
  const { currentUser } = useAuth();
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHeaderTitle('Notices');
    setMounted(true);
  }, [setHeaderTitle]);

  // Memoize query to prevent unnecessary re-creation
  const noticesQuery = useMemo(() => {
    return query(collection(db, "notices"), orderBy("createdAt", sortOrder));
  }, [sortOrder]);

  const {
    data: notices,
    loading,
    error,
    isOnline,
    fromCache,
    hasPendingWrites,
    addItem,
    updateItem,
    deleteItem
  } = useFirestoreCollection(noticesQuery);

  // Debounced search term to reduce filtering frequency
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Enhanced filtering with debounced search
  const filteredNotices = useMemo(() => {
    if (!notices) return [];
    
    let filtered = notices;
    
    // Search filter with debounced term
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(notice =>
        notice.title?.toLowerCase().includes(searchLower) ||
        notice.content?.toLowerCase().includes(searchLower)
      );
    }
    
    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(notice => notice.priority === filterPriority);
    }
    
    return filtered;
  }, [debouncedSearchTerm, notices, filterPriority]);

  // Memoized notice statistics with better date handling
  const noticeStats = useMemo(() => {
    if (!notices) return { total: 0, urgent: 0, high: 0, recent: 0 };
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    let urgent = 0, high = 0, recent = 0;
    
    for (const notice of notices) {
      if (notice.priority === 'urgent') urgent++;
      else if (notice.priority === 'high') high++;
      
      const createdAt = notice.createdAt?.toDate?.()?.getTime();
      if (createdAt && createdAt > oneDayAgo) recent++;
    }
    
    return {
      total: notices.length,
      urgent,
      high,
      recent
    };
  }, [notices]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleOpenAddModal = useCallback(() => {
    setEditingNotice(EMPTY_NOTICE);
    setEditorOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((notice) => {
    setEditingNotice(notice);
    setEditorOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditorOpen(false);
    setEditingNotice(null);
  }, []);

  const handleSaveNotice = useCallback(async (noticeData) => {
    const { id, title, content, priority } = noticeData;
    if (id) {
      await updateItem(id, { title, content, priority });
    } else {
      await addItem({ title, content, priority });
    }
  }, [updateItem, addItem]);

  const handleDeleteNotice = useCallback(async (id) => {
    await deleteItem(id, false);
  }, [deleteItem]);

  const handleSortToggle = useCallback(() => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  }, []);

  const clearSearch = useCallback(() => setSearchTerm(''), []);
  
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterPriority('all');
  }, []);

  const handleFilterPriorityChange = useCallback((value) => {
    setFilterPriority(value);
    setShowFilters(false);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // Filter options - memoized to prevent recreation
  const filterOptions = useMemo(() => [
    { value: 'all', label: 'All Priorities', color: 'gray' },
    { value: 'normal', label: 'Normal', color: 'slate' },
    { value: 'medium', label: 'Medium', color: 'amber' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ], []);

  if (notices === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <NoticePageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background effects - moved to CSS for better performance */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className={`relative max-w-7xl mx-auto px-4 py-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Notice Board
              </h1>
              <p className="text-lg text-gray-600">Stay updated with the latest announcements and updates</p>
            </div>
            
            {currentUser && (
              <button 
                onClick={handleOpenAddModal} 
                disabled={!isOnline}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Plus className="w-5 h-5" />
                {isOnline ? 'Create Notice' : 'Offline Mode'}
              </button>
            )}
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatsCard icon={Bell} label="Total Notices" value={noticeStats.total} color="blue" />
            <StatsCard icon={TrendingUp} label="Recent" value={noticeStats.recent} color="green" />
            <StatsCard icon={Users} label="High Priority" value={noticeStats.high} color="orange" />
            <StatsCard icon={Calendar} label="Urgent" value={noticeStats.urgent} color="red" />
          </div>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 shadow-lg mb-8">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notices by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 bg-white/50 backdrop-blur-sm transition-all duration-200 text-gray-700 placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                {/* Priority Filter */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200/50 text-gray-700 font-medium rounded-xl hover:bg-white transition-all duration-200 backdrop-blur-sm"
                  >
                    <Filter className="w-4 h-4" />
                    Priority
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showFilters && (
                    <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10 min-w-[160px]">
                      {filterOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleFilterPriorityChange(option.value)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2 ${
                            filterPriority === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${
                            option.color === 'gray' ? 'bg-gray-400' :
                            option.color === 'slate' ? 'bg-slate-400' :
                            option.color === 'amber' ? 'bg-amber-400' :
                            option.color === 'orange' ? 'bg-orange-400' :
                            'bg-red-400'
                          }`}></div>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Filters */}
                {filterPriority !== 'all' && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm">
                    <span>Priority: {filterPriority}</span>
                    <button onClick={() => setFilterPriority('all')}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-white/80 border border-gray-200/50 rounded-xl p-1 backdrop-blur-sm">
                  <button
                    onClick={() => handleViewModeChange('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Toggle */}
                <button
                  onClick={handleSortToggle}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200/50 text-gray-700 font-medium rounded-xl hover:bg-white transition-all duration-200 backdrop-blur-sm"
                >
                  {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                  {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="mb-6">
          <NetworkStatus 
            isOnline={isOnline}
            fromCache={fromCache}
            hasPendingWrites={hasPendingWrites}
          />
        </div>

        {/* Content Area */}
        {loading && filteredNotices.length === 0 ? (
          <NoticePageSkeleton />
        ) : filteredNotices.length > 0 ? (
          <div className={`transition-all duration-300 ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
              : 'space-y-6'
          }`}>
            {filteredNotices.map((notice, index) => (
              <div
                key={notice.id}
                className="animate-in fade-in-0 duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <NoticeCard 
                  notice={notice}
                  onDelete={handleDeleteNotice}
                  onEdit={handleOpenEditModal}
                  isOnline={isOnline}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            searchTerm={debouncedSearchTerm}
            filterPriority={filterPriority}
            onClearFilters={clearAllFilters}
          />
        )}
      </div>

      {/* Modal */}
      {isEditorOpen && editingNotice && (
        <NoticeEditorModal 
          isOpen={isEditorOpen}
          onClose={handleCloseModal}
          onSave={handleSaveNotice}
          notice={editingNotice}
          isOnline={isOnline}
        />
      )}
    </div>
  );
};

export default Notices;