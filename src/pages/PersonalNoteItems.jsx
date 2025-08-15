import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// --- LOCAL DATABASE LOGIC ---
// All personal notes will be stored in one big object in localStorage
const PERSONAL_NOTES_DB_KEY = 'mathmate-personal-notes-db';

const getInitialDb = () => {
  const db = localStorage.getItem(PERSONAL_NOTES_DB_KEY);
  return db ? JSON.parse(db) : {};
};

const saveDb = (db) => {
  localStorage.setItem(PERSONAL_NOTES_DB_KEY, JSON.stringify(db));
};
// ----------------------------

function PersonalNoteItems() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load notes for this specific chapter when the page loads
  useEffect(() => {
    const db = getInitialDb();
    const chapterNotes = db[chapterId] || [];
    setNotes(chapterNotes);
  }, [chapterId]);

  // --- CRUD Functions for Local Notes ---
  const handleSaveNote = (noteData) => {
    const db = getInitialDb();
    let chapterNotes = db[chapterId] || [];
    
    if (noteData.id) { // Editing existing note
      chapterNotes = chapterNotes.map(n => n.id === noteData.id ? noteData : n);
    } else { // Adding new note
      chapterNotes.push({ ...noteData, id: uuidv4() });
    }
    
    db[chapterId] = chapterNotes;
    saveDb(db);
    setNotes(chapterNotes); // Update the UI
  };

  const handleDeleteNote = (noteId) => {
    MySwal.fire({
      title: 'Delete this note?', text: "This cannot be undone.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        const db = getInitialDb();
        let chapterNotes = db[chapterId] || [];
        const updatedNotes = chapterNotes.filter(n => n.id !== noteId);
        db[chapterId] = updatedNotes;
        saveDb(db);
        setNotes(updatedNotes); // Update the UI
        Swal.fire('Deleted!', 'Your personal note has been deleted.', 'success');
      }
    });
  };

  const handleOpenNoteForm = (note = null) => {
    const isEditing = !!note;
    MySwal.fire({
      title: isEditing ? 'Edit Personal Note' : 'Add Personal Note',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Note Title" value="${note ? note.title : ''}">
        <input id="swal-topic" class="swal2-input" placeholder="Topic" value="${note ? note.topic : ''}">
        <label for="swal-date" style="display: block; text-align: left; margin: 1em 0 0.5em;">Note Date</label>
        <input type="date" id="swal-date" class="swal2-input" value="${note ? note.noteDate : ''}">
        <textarea id="swal-content" class="swal2-textarea" placeholder="Note content...">${note ? note.content : ''}</textarea>
        <div style="margin-top: 1em;">
          <p>Attachments (coming soon)</p>
        </div>
      `,
      confirmButtonText: 'Save', showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('swal-title').value;
        if (!title) { Swal.showValidationMessage('Title is required'); }
        return {
          id: note ? note.id : null,
          title,
          topic: document.getElementById('swal-topic').value,
          noteDate: document.getElementById('swal-date').value,
          content: document.getElementById('swal-content').value,
          attachments: note ? note.attachments : [] // Prepare for multiple attachments
        };
      }
    }).then(result => {
      if (result.isConfirmed) {
        handleSaveNote(result.value);
        Swal.fire('Saved!', 'Your personal note has been saved on this device.', 'success');
      }
    });
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => 
      (note.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (note.topic?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [notes, searchTerm]);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <button onClick={() => navigate(-1)} className="back-button-page"><ArrowLeft /></button>
        <h1 className="page-title">My Notes</h1>
        <button className="page-action-button" onClick={() => handleOpenNoteForm()}><Plus size={24} /></button>
      </div>

      <div className="note-controls">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input type="text" placeholder="Search my notes..." className="search-bar"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="list-container">
        {filteredNotes.length > 0 ? filteredNotes.map((note) => (
          <div key={note.id} className="list-item-wrapper">
            <div className="list-item">
              <div>
                <p className="note-title">{note.title}</p>
                <p className="note-subtitle">Topic: {note.topic || 'N/A'} | Date: {note.noteDate || 'N/A'}</p>
              </div>
            </div>
            <div className="list-item-actions">
              <button className="action-button edit-button" onClick={() => handleOpenNoteForm(note)}><Pencil size={18} /></button>
              <button className="action-button delete-button" onClick={() => handleDeleteNote(note.id)}><Trash2 size={18} /></button>
            </div>
          </div>
        )) : <p className="empty-message">You have no notes for this chapter. Add one!</p>}
      </div>
    </div>
  );
}

export default PersonalNoteItems;