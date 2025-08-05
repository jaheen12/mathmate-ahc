import React from 'react';
import { FileText, PlusCircle } from 'lucide-react';

// This component displays a list of notes and a button to create a new one
function NoteList({ notes, onSelectNote, onCreateNew }) {
  return (
    <div className="note-list-container">
      {notes.length > 0 ? (
        notes.map(note => (
          <div key={note.id} className="note-item" onClick={() => onSelectNote(note.id)}>
            <FileText size={20} className="note-item-icon" />
            <span className="note-item-title">{note.title || 'Untitled Note'}</span>
          </div>
        ))
      ) : (
        <p className="empty-notes-message">You have no personal notes yet.</p>
      )}
      <button className="fab-button" onClick={onCreateNew}>
        <PlusCircle size={24} />
         New Note
      </button>
    </div>
  );
}

export default NoteList;