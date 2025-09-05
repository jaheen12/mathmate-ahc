import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Check, CloudOff } from 'lucide-react'; // Added CloudOff for offline icon

const NoteEditor = ({ note, onSave, onBack, isOnline }) => { // --- CHANGE: Accept isOnline prop ---
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Set initial state when note changes
  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
    setHasChanges(false); // Reset changes when a new note is loaded
    setLastSaved(null); // Reset save timer
  }, [note]);

  // Track changes
  useEffect(() => {
    const originalTitle = note?.title || '';
    const originalContent = note?.content || '';
    setHasChanges(title !== originalTitle || content !== originalContent);
  }, [title, content, note]);

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (!hasChanges) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      if (title.trim() || content.trim()) {
        handleSave(true); // Auto-save
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, hasChanges, onSave, note?.id]); // handleSave dependency needs to be stable or included

  // Memoized handlers
  const handleTitleChange = useCallback((e) => setTitle(e.target.value), []);
  const handleContentChange = useCallback((e) => setContent(e.target.value), []);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!title.trim() && !content.trim()) return;
    
    setIsSaving(true);
    
    try {
      await onSave(note?.id, title, content);
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [note?.id, title, content, onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const formatLastSaved = () => {
    if (!lastSaved) return isOnline ? 'Saved' : 'Saved locally';
    const now = new Date();
    const diff = now - lastSaved;
    if (diff < 60000) return 'Saved just now';
    return `Saved ${Math.floor(diff / 60000)}m ago`;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <button className="p-2.5 rounded-xl hover:bg-slate-100 active:scale-95 transition-all duration-150 text-slate-600 hover:text-slate-800" onClick={onBack} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <input ref={titleRef} type="text" className="flex-1 px-4 py-2.5 bg-transparent text-xl font-semibold text-slate-800 placeholder-slate-400 border-none focus:outline-none" value={title} onChange={handleTitleChange} placeholder="Untitled Note" maxLength={100} />
        
        {/* --- CHANGE: Save Status now reflects offline state --- */}
        <div className="flex items-center gap-2 text-sm text-slate-500 min-w-[120px] justify-end">
          {isSaving && (
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span>Saving...</span></div>
          )}
          {!isSaving && !hasChanges && (
            <div className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
              {isOnline ? <Check size={14} /> : <CloudOff size={14} />}
              <span>{formatLastSaved()}</span>
            </div>
          )}
          {hasChanges && !isSaving && (
            <span className="text-amber-600">Unsaved changes</span>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 overflow-hidden">
        <textarea ref={contentRef} className="w-full h-full p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 transition-all duration-200" value={content} onChange={handleContentChange} placeholder="Start writing your thoughts..." style={{ lineHeight: '1.7', fontSize: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }} />
      </main>

      {/* --- CHANGE: Floating Action Button now works offline --- */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-20">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 font-medium disabled:opacity-70" onClick={() => handleSave()} disabled={isSaving} aria-label="Save note">
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isOnline ? (
              <Save size={18} />
            ) : (
              <CloudOff size={18} />
            )}
            <span>{isSaving ? 'Saving' : isOnline ? 'Save' : 'Save Offline'}</span>
          </button>
        </div>
      )}

      <div className="hidden sm:block fixed bottom-4 left-4 text-xs text-slate-400">
        <span className="bg-slate-100 px-2 py-1 rounded">Ctrl+S</span> to save
      </div>
    </div>
  );
};

export default NoteEditor;