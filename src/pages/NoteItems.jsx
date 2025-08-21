import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Search, ArrowDownUp, Check } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

function NoteItems() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const ITEMS_CACHE_KEY = `mathmate-cache-note-items-${subjectId}-${chapterId}`;

  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem(ITEMS_CACHE_KEY)) || []);
  const [isLoading, setIsLoading] = useState(notes.length === 0);
  const { currentUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const fetchNotes = async () => {
    if (!subjectId || !chapterId) return;
    try {
      const notesRef = collection(db, `official_notes/${subjectId}/chapters/${chapterId}/notes`);
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const noteItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (JSON.stringify(noteItems) !== JSON.stringify(notes)) {
        setNotes(noteItems);
        localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(noteItems));
      }
    } catch (error) { 
      console.error("Error fetching notes (might be offline): ", error);
    } finally { 
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(notes.length === 0);
    if (navigator.onLine) {
      fetchNotes();
    } else {
      setIsLoading(false);
    }
  }, [subjectId, chapterId]);

  const filteredAndSortedNotes = useMemo(() => {
    return notes
      .filter(note => 
        (note.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (note.topic?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let valA, valB;
        if (sortBy === 'createdAt') {
          valA = a.createdAt?.seconds || 0;
          valB = b.createdAt?.seconds || 0;
        } else if (sortBy === 'noteDate') {
          valA = new Date(a.noteDate).getTime() || 0;
          valB = new Date(b.noteDate).getTime() || 0;
        } else {
          valA = (a.topic || '').toLowerCase();
          valB = (b.topic || '').toLowerCase();
        }
        if (sortOrder === 'asc') {
          return valA < valB ? -1 : (valA > valB ? 1 : 0);
        } else {
          return valA > valB ? -1 : (valA < valB ? 1 : 0);
        }
      });
  }, [notes, searchTerm, sortBy, sortOrder]);

  const handleOpenNoteForm = (note = null) => {
    const isEditing = !!note;
    MySwal.fire({
      title: isEditing ? 'Edit Note' : 'Add New Note',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Note Title" value="${note && note.title ? note.title : ''}">
        <input id="swal-topic" class="swal2-input" placeholder="Topic (e.g., Integration)" value="${note && note.topic ? note.topic : ''}">
        <label for="swal-date" style="display: block; text-align: left; margin: 1em 0 0.5em;">Note Date</label>
        <input type="date" id="swal-date" class="swal2-input" value="${note && note.noteDate ? note.noteDate : ''}">
        <textarea id="swal-content" class="swal2-textarea" placeholder="Note content...">${note && note.content ? note.content : ''}</textarea>
      `,
      confirmButtonText: 'Save', showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('swal-title').value;
        if (!title) { Swal.showValidationMessage('Title is required'); }
        return {
          title,
          topic: document.getElementById('swal-topic').value,
          noteDate: document.getElementById('swal-date').value,
          content: document.getElementById('swal-content').value,
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (isEditing) {
            const noteRef = doc(db, `official_notes/${subjectId}/chapters/${chapterId}/notes`, note.id);
            await updateDoc(noteRef, result.value);
          } else {
            const notesRef = collection(db, `official_notes/${subjectId}/chapters/${chapterId}/notes`);
            await addDoc(notesRef, { ...result.value, createdAt: serverTimestamp() });
          }
          fetchNotes();
          Swal.fire('Saved!', 'The note has been saved.', 'success');
        } catch(error) {
          Swal.fire('Error!', 'Could not save the note: ' + error.message, 'error');
        }
      }
    });
  };

  const handleDeleteNote = (note) => {
    MySwal.fire({ title: 'Delete Note?', text: `Delete "${note.title}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const noteRef = doc(db, `official_notes/${subjectId}/chapters/${chapterId}/notes`, note.id);
        await deleteDoc(noteRef);
        fetchNotes();
        Swal.fire('Deleted!', 'The note has been deleted.', 'success');
      }
    });
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
        setSortOrder(currentOrder => currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
        setSortBy(newSortBy);
        setSortOrder('desc');
    }
    setIsSortMenuOpen(false);
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <button onClick={() => navigate(-1)} className="back-button-page"><ArrowLeft /></button>
        <h1 className="page-title">Notes</h1>
        {currentUser && (
            <button className="page-action-button" onClick={() => handleOpenNoteForm()}><Plus size={24} /></button>
        )}
      </div>

      <div className="note-controls">
        <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input type="text" placeholder="Search notes..." className="search-bar"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="sort-menu-container">
          <button className="sort-button" onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}>
            <ArrowDownUp size={16} />
            <span>Sort By</span>
          </button>
          <div className={`sort-menu ${isSortMenuOpen ? 'open' : ''}`}>
            <div className="sort-option" onClick={() => handleSortChange('createdAt')}>
              <span>Date Added</span>
              {sortBy === 'createdAt' && <Check size={16} className="check-icon" />}
            </div>
            <div className="sort-option" onClick={() => handleSortChange('noteDate')}>
              <span>Note Date</span>
              {sortBy === 'noteDate' && <Check size={16} className="check-icon" />}
            </div>
            <div className="sort-option" onClick={() => handleSortChange('topic')}>
              <span>Topic</span>
              {sortBy === 'topic' && <Check size={16} className="check-icon" />}
            </div>
            <hr className="sort-divider" />
            <div className="sort-option" onClick={() => { setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); setIsSortMenuOpen(false); }}>
              <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {isLoading ? <p>Loading notes...</p> : (
        <div className="list-container">
          {filteredAndSortedNotes.length > 0 ? filteredAndSortedNotes.map((note) => (
            <Link to={`/notes/${subjectId}/${chapterId}/${note.id}`} key={note.id} className="list-item-wrapper link-wrapper">
                <div className="list-item">
                    <div>
                        <p className="note-title">{note.title}</p>
                        <p className="note-subtitle">Topic: {note.topic || 'N/A'} | Date: {note.noteDate || 'N/A'}</p>
                    </div>
                </div>
                {currentUser && (
                    <div className="list-item-actions">
                        <button className="action-button edit-button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenNoteForm(note); }}><Pencil size={18} /></button>
                        <button className="action-button delete-button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteNote(note); }}><Trash2 size={18} /></button>
                    </div>
                )}
            </Link>
          )) : <p className="empty-message">No notes found. Try changing your search or add a new note!</p>}
        </div>
      )}
    </div>
  );
}

export default NoteItems;
