import React from 'react';
import { FileText, PlusCircle, Trash2, Pencil } from 'lucide-react';

// THE FIX: We now accept onEdit and onDelete functions
function NoteList({ notes, onSelectNote, onCreateNew, onEdit, onDelete, emptyMessage, showCreateButton }) {
  
  // This function stops the row click from happening when a button is clicked
  const handleButtonClick = (e, callback) => {
    e.stopPropagation();
    callback();
  };

  return (
    <div className="note-list-container">
      {notes.length > 0 ? (
        notes.map(note => (
          <div key={note.id} className="note-item" onClick={() => onSelectNote(note.id)}>
            <FileText size={20} className="note-item-icon" />
            <span className="note-item-title">{note.title || 'Untitled Note'}</span>
            
            {/* THE FIX: Management buttons are added here */}
            <div className="note-item-actions">
              <button 
                className="action-button edit-button" 
                onClick={(e) => handleButtonClick(e, () => onEdit(note.id))}
              >
                <Pencil size={18} />
              </button>
              <button 
                className="action-button delete-button" 
                onClick={(e) => handleButtonClick(e, () => onDelete(note.id))}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="empty-notes-message">{emptyMessage}</p>
      )}

      {showCreateButton && (
        <button className="fab-button" onClick={onCreateNew}>
          <PlusCircle size={24} />
           New Note
        </button>
      )}
    </div>
  );
}

export default NoteList;